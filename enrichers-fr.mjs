const slugify = value => value?.slugify().replaceAll("-", "").replaceAll("(", "").replaceAll(")", "");
const logWarning = (msg, options) =>
  dnd5e.utils.log(options.relativeTo ? `${msg} [${options.relativeTo.uuid}]` : msg, { level: "warn" });

const FRENCH_TYPES = ["attack", "check", "concentration", "damage", "heal", "healing", "save", "skill", "tool"];

/* -------------------------------------------- */

/**
 * Replace the system enricher's parsing function, keeping its pattern & `onRender` handlers.
 */
export function registerCustomEnrichersFr() {
  const entry = CONFIG.TextEditor.enrichers.find(e => e.id === "dnd5e-enricher");
  if ( !entry ) {
    dnd5e.utils.log("dnd5e-enricher not found, French enrichers not registered.", { level: "warn" });
    return;
  }
  entry.enricher = enrichStringFr;
}

/* -------------------------------------------- */

/**
 * Parse the enriched string and provide the appropriate content.
 * @param {RegExpMatchArray} match       The regular expression match result.
 * @param {EnrichmentOptions} options    Options provided to customize text enrichment.
 * @returns {Promise<HTMLElement|null>}  An HTML element to insert in place of the matched text or null to
 *                                       indicate that no replacement should be made.
 */
export async function enrichStringFr(match, options) {
  let { type, config, label } = match.groups;
  type = type.toLowerCase();
  if ( !FRENCH_TYPES.includes(type) ) return dnd5e.enrichers.enrichString(match, options);

  config = dnd5e.enrichers.parseConfig(config, { multiple: ["damage", "heal", "healing"].includes(type) });
  config._input = match[0];
  config._rules = dnd5e.enrichers.getRulesVersion(config, options);
  delete config.rules;
  switch ( type ) {
    case "attack": return enrichAttack(config, label, options);
    case "heal":
    case "healing": config._isHealing = true;
    case "damage": return enrichDamage(config, label, options);
    case "check":
    case "skill":
    case "tool": return enrichCheck(config, label, options);
    case "concentration": config._isConcentration = true;
    case "save": return enrichSave(config, label, options);
  }
  return null;
}

/* -------------------------------------------- */
/*  French Helpers                              */
/* -------------------------------------------- */

/**
 * Prefix a label with the "de"/"d'" preposition, elided before a vowel.
 * @param {string} label    Label to prefix.
 * @param {string} ability  Key of the ability the label was built from.
 * @returns {string}
 */
function _withOf(label, ability) {
  return ability === "int" ? `d'${label}` : `${_loc("DND5E.of")} ${label}`;
}

/* -------------------------------------------- */
/*  Attack Enricher                             */
/* -------------------------------------------- */

/**
 * Enrich an attack link using a pre-set to hit value.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the attack could be built, otherwise null.
 */
export async function enrichAttack(config, label, options) {
  if ( config.activity && config.formula ) {
    logWarning(`Activity ID and formula found while enriching ${config._input}, only one is supported.`, options);
    return null;
  }

  config = dnd5e.enrichers.parseAttackConfig(config, options);

  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !config.formula ? options.relativeTo?.system?.activities?.getByType("attack")[0] : null;

  if ( activity ) {
    if ( activity.type !== "attack" ) {
      logWarning(`Attack enricher linked to non-attack activity when enriching ${config._input}`, options);
      return null;
    }

    config.activityUuid = activity.uuid;
    const attackConfig = activity.getAttackData({ attackMode: config.attackMode });
    config.formula = dnd5e.dice.simplifyRollFormula(
      Roll.defaultImplementation.replaceFormulaData(attackConfig.parts.join(" + "), attackConfig.data)
    );
    if ( attackConfig.data.scaling ) config.scaling ??= String(attackConfig.data.scaling.increase);
    delete config.activity;
  }

  if ( !config.activityUuid && !config.formula ) {
    logWarning(`No formula or linked activity found while enriching ${config._input}.`, options);
    return null;
  }

  config.type = "attack";
  if ( label ) return createRollLink(label, config, { classes: "roll-link-group roll-link" });

  let displayFormula = dnd5e.dice.simplifyRollFormula(config.formula)?.trim() || "+0";
  if ( !displayFormula.startsWith("+") && !displayFormula.startsWith("-") ) displayFormula = `+${displayFormula}`;

  const span = document.createElement("span");
  span.className = "roll-link-group";
  _addDataset(span, config);
  span.innerHTML = _loc(`EDITOR.DND5E.Inline.Attack${config._rules === "2014" ? "Long" : "Short"}`, {
    formula: createRollLink(displayFormula).outerHTML
  });

  if ( config.format === "extended" ) {
    // FR: attack types are lowercase in the 2014 phrasing, and only from the second item onwards in 2024.
    const attackTypes = Array.from(activity?.validAttackTypes ?? []).map((t, i) => {
      const typeLabel = CONFIG.DND5E.attackTypes[t]?.label;
      if ( !typeLabel ) return null;
      if ( (config._rules === "2014") && (t === "melee") ) return `au ${typeLabel.toLowerCase()}`;
      return ((config._rules === "2014") || (i === 1)) ? typeLabel.toLowerCase() : typeLabel;
    }).filter(_ => _);

    // FR: the classification takes a preposition that depends on the word following it.
    const classificationKey = activity?.attack.type.classification;
    const prepositions = { weapon: "d'", spell: `${_loc("DND5E.of")} `, unarmed: "à " };
    const classification = CONFIG.DND5E.attackClassifications[classificationKey]?.label ?? "";

    const type = _loc(`DND5E.ATTACK.Formatted.${config._rules}`, {
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(attackTypes),
      classification: classification
        ? `${prepositions[classificationKey] ?? ""}${classification.toLowerCase()}` : ""
    }).trim();

    const parts = [span.outerHTML, activity?.getRangeLabel(config.attackMode)];
    if ( config._rules === "2014" ) parts.push(activity?.target?.affects.labels?.statblock);

    const full = document.createElement("span");
    full.className = "attack-extended";
    // FR: parts are joined with a plain comma, and the "<em>{type} :</em>" prefix is dropped when unknown.
    const joined = parts.filter(_ => _).join(", ");
    full.innerHTML = type ? _loc("EDITOR.DND5E.Inline.AttackExtended", { type, parts: joined }) : joined;
    return full;
  }

  return span;
}

/* -------------------------------------------- */
/*  Check & Save Enrichers                      */
/* -------------------------------------------- */

/**
 * Enrich an ability check link to perform a specific ability or skill check.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the check could be built, otherwise null.
 */
export async function enrichCheck(config, label, options) {
  config = dnd5e.enrichers.parseCheckConfig(config, options);

  const groups = new Map();
  let invalid = false;

  const anything = config.ability || config.skill.length || config.tool.length;
  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !anything ? options.relativeTo?.system?.activities?.getByType("check")[0] : null;

  if ( activity ) {
    if ( activity.type !== "check" ) {
      logWarning(`Check enricher linked to non-check activity when enriching ${config._input}.`, options);
      return null;
    }

    if ( activity.check.ability ) config.ability = activity.check.ability;
    config.activityUuid = activity.uuid;
    config.dc = activity.check.dc.value;
    config.skill = [];
    config.tool = [];
    for ( const associated of activity.check.associated ) {
      if ( associated in CONFIG.DND5E.skills ) config.skill.push(associated);
      else if ( associated in CONFIG.DND5E.tools ) config.tool.push(associated);
    }
    delete config.activity;
  }

  let abilityConfig = CONFIG.DND5E.enrichmentLookup.abilities[config.ability];
  if ( config.ability && !abilityConfig ) {
    logWarning(`Ability "${config.ability}" not found while enriching ${config._input}.`, options);
    invalid = true;
  } else if ( abilityConfig?.key ) config.ability = abilityConfig.key;

  for ( let [index, skill] of config.skill.entries() ) {
    const skillConfig = CONFIG.DND5E.skills[skill];
    if ( skillConfig ) {
      if ( skillConfig.key ) skill = config.skill[index] = skillConfig.key;
      const ability = config.ability || skillConfig.ability;
      if ( !groups.has(ability) ) groups.set(ability, []);
      groups.get(ability).push({ key: skill, type: "skill", label: skillConfig.label });
    } else {
      logWarning(`Skill "${skill}" not found while enriching ${config._input}.`, options);
      invalid = true;
    }
  }

  let usingTool;
  for ( const tool of config.tool ) {
    const toolConfig = CONFIG.DND5E.enrichmentLookup.tools[slugify(tool)];
    const toolIndex = dnd5e.documents.Trait.getBaseItem(toolConfig?.id ?? "", { indexOnly: true });
    const toolLabel = toolIndex?.name ?? toolConfig?.label;
    if ( toolLabel ) {
      const ability = config.ability || toolConfig?.ability;
      if ( config.skill.length && (config.tool.length === 1) && (config._rules === "2024") ) {
        usingTool = { key: tool, label: toolLabel };
      } else if ( ability ) {
        if ( !groups.has(ability) ) groups.set(ability, []);
        groups.get(ability).push({ key: tool, type: "tool", label: toolLabel });
      } else {
        logWarning(
          `Tool "${tool}" found without specified or default ability while enriching ${config._input}.`, options
        );
        invalid = true;
      }
    } else {
      logWarning(`Tool "${tool}" not found while enriching ${config._input}.`, options);
      invalid = true;
    }
  }

  if ( !abilityConfig && !groups.size ) {
    logWarning(`No ability, skill, tool, or linked activity provided while enriching ${config._input}.`, options);
    invalid = true;
  }

  const complex = (config.skill.length + config.tool.length) > 1;
  if ( config.passive && complex ) {
    logWarning(
      `Multiple skills or tools and passive flag found while enriching ${config._input}, which aren't supported together.`,
      options
    );
    invalid = true;
  }
  if ( label && complex ) {
    logWarning(
      `Multiple skills or tools and a custom label found while enriching ${config._input}, which aren't supported together.`,
      options
    );
    invalid = true;
  }

  if ( config.dc && !Number.isNumeric(config.dc) ) {
    config.dc = dnd5e.utils.simplifyBonus(config.dc, options.rollData ?? options.relativeTo?.getRollData?.() ?? {});
  }

  if ( invalid ) return null;

  if ( complex ) {
    const formatter = game.i18n.getListFormatter({ type: "disjunction" });
    const parts = [];
    let singleAbility;
    for ( const [ability, associated] of groups.entries() ) {
      const makeConfig = ({ key, type }) => ({ type, [type]: key, ability: groups.size > 1 ? ability : undefined });

      // Multiple associated proficiencies, link each individually
      if ( associated.length > 1 ) {
        let abilityLabel = CONFIG.DND5E.enrichmentLookup.abilities[ability].label;
        // FR: "test de Dextérité (…)", "test d'Intelligence (…)"
        if ( config.format === "long" ) abilityLabel = _withOf(abilityLabel, ability);
        parts.push(_loc("EDITOR.DND5E.Inline.SpecificCheck", {
          ability: abilityLabel,
          type: formatter.format(associated.map(a => createRollLink(a.label, makeConfig(a)).outerHTML ))
        }));
      }

      // Only single associated proficiency, wrap whole thing in roll link
      else {
        singleAbility = ability;
        const associatedConfig = makeConfig(associated[0]);
        let rollLink = createRollLink(createRollLabel({ ...associatedConfig, ability }), associatedConfig).outerHTML;
        if ( config.format === "long" ) rollLink = _withOf(rollLink, ability);
        parts.push(rollLink);
      }
    }

    if ( usingTool ) {
      config.format = "long";
      config.usingTool = usingTool.key;
    }
    label = formatter.format(parts);
    if ( config.dc && !config.hideDC ) {
      label = _loc("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
    }
    if ( usingTool ) label = _withOf(label, singleAbility);
    label = _loc(`EDITOR.DND5E.Inline.Check${config.format === "long" ? "Long" : "Short"}`, { check: label });
    if ( usingTool ) label = _loc("EDITOR.DND5E.Inline.CheckUsing", {
      check: label, tool: usingTool.label
    });

    const template = document.createElement("template");
    template.innerHTML = label;
    return createRequestLink(template, {
      type: "check", ...config, skill: config.skill.join("|"), tool: config.tool.join("|")
    });
  }

  const type = config.skill.length ? "skill" : config.tool.length ? "tool" : "check";
  config = { type, ability: Array.from(groups.keys())[0], ...config, skill: config.skill[0], tool: config.tool[0] };
  if ( !label ) label = createRollLabel(config);
  return config.passive ? createPassiveTag(label, config) : createRequestLink(createRollLink(label), config);
}

/* -------------------------------------------- */

/**
 * Enrich a saving throw link.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the save could be built, otherwise null.
 */
export async function enrichSave(config, label, options) {
  config = dnd5e.enrichers.parseSaveConfig(config, options);

  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !config.ability.length ? options.relativeTo?.system?.activities?.getByType("save")[0] : null;

  if ( activity ) {
    if ( activity.type !== "save" ) {
      logWarning(`Save enricher linked to non-save activity when enriching ${config._input}`, options);
      return null;
    }

    config.ability = Array.from(activity.save.ability);
    config.activityUuid = activity.uuid;
    config.dc = activity.save.dc.value;
    delete config.activity;
  }

  if ( !config.ability.length && !config._isConcentration ) {
    logWarning(`No ability or linked activity found while enriching ${config._input}.`, options);
    return null;
  }

  if ( config.dc && !Number.isNumeric(config.dc) ) {
    config.dc = dnd5e.utils.simplifyBonus(config.dc, options.rollData ?? options.relativeTo?.getRollData?.() ?? {});
  }

  if ( config.ability.length > 1 && label ) {
    logWarning(
      `Multiple abilities and custom label found while enriching ${config._input}, which aren't supported together.`,
      options
    );
    return null;
  }

  config = { type: config._isConcentration ? "concentration" : "save", ...config };
  if ( label ) label = createRollLink(label);
  else if ( config.ability.length <= 1 ) label = createRollLink(createRollLabel(config));
  else {
    label = game.i18n.getListFormatter({ type: "disjunction" }).format(config.ability.map(ability => {
      const rollLink = createRollLink(createRollLabel({ type: "save", ability }), { ability }).outerHTML;
      // FR: "jet de sauvegarde de Force ou de Dextérité"
      return config.format === "long" ? _withOf(rollLink, ability) : rollLink;
    }));
    if ( config.dc && !config.hideDC ) {
      label = _loc("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
    }
    label = _loc(`EDITOR.DND5E.Inline.Save${config.format === "long" ? "Long" : "Short"}`, { save: label });
    const template = document.createElement("template");
    template.innerHTML = label;
    label = template;
  }
  return createRequestLink(label, { ...config, ability: config.ability.join("|") });
}

/* -------------------------------------------- */
/*  Damage Enricher                             */
/* -------------------------------------------- */

/**
 * Enrich a damage link.
 * @param {object[]} configs           Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the damage could be built, otherwise null.
 */
export async function enrichDamage(configs, label, options) {
  const config = dnd5e.enrichers.parseDamageConfig(configs, options);

  if ( config.activity && config.formulas.length ) {
    logWarning(`Activity ID and formulas found while enriching ${config._input}, only one is supported.`, options);
    return null;
  }

  let activity = options.relativeTo?.system?.activities?.get(config.activity);
  if ( !activity && !config.formulas.length ) {
    const types = configs._isHealing ? ["heal"] : ["attack", "damage", "save"];
    for ( const a of options.relativeTo?.system?.activities?.getByTypes(...types) ?? [] ) {
      if ( a.damage?.parts.length || a.healing?.formula ) {
        activity = a;
        break;
      }
    }
  }

  if ( activity ) {
    config.activityUuid = activity.uuid;
    const damageConfig = activity.getDamageConfig({ attackMode: config.attackMode });
    for ( const roll of damageConfig.rolls ) {
      config.formulas.push(dnd5e.dice.simplifyRollFormula(
        Roll.defaultImplementation.replaceFormulaData(roll.parts.join(" + "), roll.data)
      ));
      if ( roll.data.scaling ) config.scaling ??= String(roll.data.scaling.increase);
      config.damageTypes.push(roll.options.types?.join("|") ?? roll.options.type);
    }
    delete config.activity;
  }

  if ( !config.activityUuid && !config.formulas.length ) {
    logWarning(`No formula or linked activity found while enriching ${config._input}.`, options);
    return null;
  }

  const formulas = config.formulas.join("&");
  const damageTypes = config.damageTypes.join("&");

  if ( !config.formulas.length ) return null;
  if ( label ) {
    return createRollLink(label, { ...config, formulas, damageTypes }, { classes: "roll-link-group roll-link" });
  }

  // FR: damage types read "dégâts de feu" / "dégâts d'acide" — the noun comes first and takes a preposition.
  const of = _loc("DND5E.of");
  const prepositions = {
    acid: "d'", cold: `${of} `, fire: `${of} `, force: `${of} `, lightning: `${of} `, poison: `${of} `,
    thunder: `${of} `
  };

  const parts = [];
  for ( const [idx, formula] of config.formulas.entries() ) {
    const type = config.damageTypes[idx];
    const types = type?.split("|").map((t, i) => {
      const damage = CONFIG.DND5E.damageTypes[t];
      const typeLabel = damage?.label ?? CONFIG.DND5E.healingTypes[t]?.label;
      if ( !typeLabel ) return null;
      const prefixed = `${prepositions[t] ?? ""}${typeLabel}`;
      // Only the first type carries the "dégâts" noun: "dégâts de feu ou de froid".
      return (damage && (i === 0)) ? `${_loc("DND5E.Damage").toLowerCase()} ${prefixed}` : prefixed;
    }).filter(_ => _);
    const localizationData = {
      formula: createRollLink(formula, {}, { tag: "span" }).outerHTML,
      // FR: damage types are always lowercase, whichever rules version is in use.
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(types).toLowerCase()
    };

    let localizationType = "Short";
    if ( config.average ) {
      localizationType = "Average";
      if ( config.average === true ) {
        const minRoll = Roll.create(formula).evaluate({ minimize: true });
        const maxRoll = Roll.create(formula).evaluate({ maximize: true });
        localizationData.average = Math.floor(((await minRoll).total + (await maxRoll).total) / 2);
      } else if ( Number.isNumeric(config.average) ) {
        localizationData.average = config.average;
      } else {
        localizationType = "Short";
      }
      if ( String(localizationData.average) === formula ) localizationType = "Short";
    }

    parts.push(_loc(`EDITOR.DND5E.Inline.Damage${localizationType}`, localizationData));
  }

  const link = document.createElement("a");
  link.className = "roll-link-group";
  link.dataset.action = "roll";
  _addDataset(link, { ...config, formulas, damageTypes });
  if ( config.average && (parts.length === 2) ) {
    link.innerHTML = _loc("EDITOR.DND5E.Inline.DamageDouble", { first: parts[0], second: parts[1] });
  } else {
    link.innerHTML = game.i18n.getListFormatter().format(parts);
  }

  if ( (config.format === "long") || (config.format === "extended") ) {
    const span = document.createElement("span");
    span.className = `damage-${config.format}`;
    let damage = _loc("EDITOR.DND5E.Inline.DamageLong", { damage: link.outerHTML });
    if ( config.format === "extended" ) damage = _loc("EDITOR.DND5E.Inline.DamageExtended", { damage });
    span.innerHTML = damage;
    return span;
  }

  return link;
}

/* -------------------------------------------- */
/*  Labels & Links                              */
/* -------------------------------------------- */

/**
 * Create a label for a roll message.
 * @param {object} config  Configuration data.
 * @returns {string}
 */
export function createRollLabel(config) {
  const { label: ability, abbreviation } = CONFIG.DND5E.enrichmentLookup.abilities[config.ability] ?? {};
  const skill = CONFIG.DND5E.enrichmentLookup.skills[config.skill]?.label;
  const toolUUID = CONFIG.DND5E.enrichmentLookup.tools[config.tool];
  const tool = toolUUID?.id
    ? dnd5e.documents.Trait.getBaseItem(toolUUID.id, { indexOnly: true })?.name : toolUUID?.label ?? null;
  const longSuffix = config.format === "long" ? "Long" : "Short";
  const showDC = config.dc && !config.hideDC;
  // `config.ability` may still be an array when coming from a save enricher.
  const abilityKey = Array.isArray(config.ability) ? config.ability[0] : config.ability;

  let label;
  switch ( config.type ) {
    case "check":
    case "skill":
    case "tool":
      if ( ability && (skill || tool) ) {
        label = _loc("EDITOR.DND5E.Inline.SpecificCheck", { ability, type: skill ?? tool });
      } else {
        label = ability;
      }
      // FR: "test de Dextérité (Acrobaties)", "test d'Intelligence"
      if ( config.format === "long" ) label = _withOf(label, abilityKey);
      if ( config.passive ) {
        label = _loc(
          `EDITOR.DND5E.Inline.${showDC ? "DC" : ""}Passive${longSuffix}`, { dc: config.dc, check: label }
        );
      } else {
        if ( showDC ) label = _loc("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
        label = _loc(`EDITOR.DND5E.Inline.Check${longSuffix}`, { check: label });
      }
      break;
    case "concentration":
    case "save":
      if ( config.type === "save" ) {
        label = ability;
        // FR: "jet de sauvegarde de Force", "jet de sauvegarde d'Intelligence"
        if ( config.format === "long" ) label = _withOf(label, abilityKey);
      }
      else label = `${_loc("DND5E.Concentration")} ${ability ? `(${abbreviation})` : ""}`;
      if ( showDC ) label = _loc("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
      label = _loc(`EDITOR.DND5E.Inline.Save${longSuffix}`, { save: label });
      break;
    case "endConcentration":
      label = _loc("DND5E.CONCENTRATION.Action.Break");
      break;
    default:
      return "";
  }

  if ( config.icon ) {
    switch ( config.type ) {
      case "check":
      case "skill":
        label = `<i class="dnd5e-icon" data-src="systems/dnd5e/icons/svg/ability-score-improvement.svg"></i>${label}`;
        break;
      case "tool":
        label = `<i class="fas fa-hammer"></i>${label}`;
        break;
      case "concentration":
      case "save":
        label = `<i class="fas fa-shield-heart"></i>${label}`;
        break;
      case "endConcentration":
        label = `<i class="fa-solid fa-ban" inert></i>${label}`;
        break;
    }
  }

  return label;
}

/* -------------------------------------------- */

/**
 * Create a passive skill tag.
 * @param {string} label    Label to display.
 * @param {object} dataset  Data that will be added to the tag.
 * @returns {HTMLElement}
 */
function createPassiveTag(label, dataset) {
  const span = document.createElement("span");
  span.classList.add("passive-check");
  _addDataset(span, { ...dataset, tooltipHtml: dnd5e.utils.loadingTooltip({ passive: true }) });
  span.innerText = label;
  return span;
}

/* -------------------------------------------- */

/**
 * Create a rollable link with a request section for GMs.
 * @param {HTMLElement|string} label  Label to display
 * @param {object} dataset            Data that will be added to the link for the rolling method.
 * @returns {HTMLElement}
 */
function createRequestLink(label, dataset) {
  const span = document.createElement("span");
  span.classList.add("roll-link-group");
  _addDataset(span, dataset);
  if ( label instanceof HTMLTemplateElement ) span.append(label.content);
  else span.append(label);

  // Add chat request link for GMs
  if ( game.user.isGM ) {
    const gmLink = document.createElement("a");
    gmLink.classList.add("enricher-action");
    gmLink.dataset.action = "postRequest";
    gmLink.dataset.tooltip = "EDITOR.DND5E.Inline.RequestRoll";
    gmLink.setAttribute("aria-label", _loc(gmLink.dataset.tooltip));
    gmLink.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-comment-dots"></i>');
    span.insertAdjacentElement("beforeend", gmLink);
  }

  return span;
}

/* -------------------------------------------- */

/**
 * Create a rollable link.
 * @param {string} label                           Label to display.
 * @param {object} [dataset={}]                    Data that will be added to the link for the rolling method.
 * @param {object} [options={}]
 * @param {boolean} [options.classes="roll-link"]  Class to add to the link.
 * @param {string} [options.tag="a"]               Tag to use for the main link.
 * @returns {HTMLElement}
 */
function createRollLink(label, dataset={}, { classes="roll-link", tag="a" }={}) {
  const link = document.createElement(tag);
  link.className = classes;
  link.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-dice-d20" inert></i>');
  link.append(label);
  _addDataset(link, dataset);
  if ( tag === "a" ) link.dataset.action = "roll";
  return link;
}

/* -------------------------------------------- */

/**
 * Add a dataset object to the provided element.
 * @param {HTMLElement} element  Element to modify.
 * @param {object} dataset       Data properties to add.
 * @private
 */
function _addDataset(element, dataset) {
  for ( const [key, value] of Object.entries(dataset) ) {
    if ( !key.startsWith("_") && (key !== "values") && value ) element.dataset[key] = value;
  }
}
