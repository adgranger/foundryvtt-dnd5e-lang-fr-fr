const slugify = value => value?.slugify().replaceAll("-", "").replaceAll("(", "").replaceAll(")", "");

/**
 * Set up custom text enrichers.
 */
export function registerCustomEnrichersFr() {
    const stringNames = [
        "award", "item"
    ];
    const stringNamesFr = [
        "attack", "check", "concentration", "damage", "heal", "healing", "save", "skill", "tool"
    ];

    CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.filter(e => e.id !== "dnd5e-enricher");

    CONFIG.TextEditor.enrichers.push({
        id: "dnd5e-enricher",
        pattern: new RegExp(`\\[\\[/(?<type>${stringNames.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi"),
        enricher: globalThis.dnd5e.enrichers.enrichString,
        onRender: onRenderEnricher
    });

    CONFIG.TextEditor.enrichers.push({
        id: "dnd5e-enricher-fr",
        pattern: new RegExp(`\\[\\[/(?<type>${stringNamesFr.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi"),
        enricher: enrichStringFr,
        onRender: onRenderEnricher
    });
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
  config = globalThis.dnd5e.enrichers.parseConfig(config, { multiple: ["damage", "heal", "healing"].includes(type) });
  config._input = match[0];
  config._rules = globalThis.dnd5e.enrichers.getRulesVersion(config, options);
  delete config.rules;
  switch ( type.toLowerCase() ) {
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
/*  Attack Enricher                             */
/* -------------------------------------------- */

/**
 * Enrich an attack link using a pre-set to hit value.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the attack could be built, otherwise null.
 *
 * @example Create an attack link using a fixed to hit:
 * ```[[/attack +5]]``` or ```[[/attack formula=5]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="attack" data-formula="+5">
 *   <i class="fa-solid fa-dice-d20" inert></i> +5
 * </a>
 * ```
 *
 * @example Create an attack link using a specific attack mode:
 * ```[[/attack +5]]``` or ```[[/attack formula=5 attackMode=thrown]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="attack" data-formula="+5" data-attack-mode="thrown">
 *   <i class="fa-solid fa-dice-d20" inert></i> +5
 * </a>
 * ```
 *
 * @example Link an enricher to an attack activity, either explicitly or automatically:
 * ```[[/attack activity=RLQlsLo5InKHZadn]]``` or ```[[/attack]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="attack" data-formula="+8" data-activity-uuid="...uuid...">
 *   <i class="fa-solid fa-dice-d20" inert"></i> +8
 * </a>
 * ```
 *
 * @example Display the full attack section:
 * ```[[/attack format=extended]]``` or ```[[/attack extended]]```
 * becomes
 * ```html
 * <span class="attack-extended">
 *   <em>Melee Attack Roll</em>:
 *   <span class="roll-link-group" data-type="attack" data-formula="+16" data-activity-uuid="...uuid...">
 *     <a class="roll-link"><i class="fa-solid fa-dice-d20" inert"></i> +16</a>
 *   </span>, reach 15 ft
 * </span>
 * ```
 */
export async function enrichAttack(config, label, options) {
  if ( config.activity && config.formula ) {
    console.warn(`Activity ID and formula found while enriching ${config._input}, only one is supported.`);
    return null;
  }

  const formulaParts = [];
  if ( config.formula ) formulaParts.push(config.formula);
  for ( const value of config.values ) {
    if ( value in CONFIG.DND5E.attackModes ) config.attackMode = value;
    else if ( value === "extended" ) config.format = "extended";
    else formulaParts.push(value);
  }
  config.formula = Roll.defaultImplementation.replaceFormulaData(
    formulaParts.join(" "),
    options.rollData ?? options.relativeTo?.getRollData?.() ?? {}
  );

  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !config.formula ? options.relativeTo?.system?.activities?.getByType("attack")[0] : null;

  if ( activity ) {
    if ( activity.type !== "attack" ) {
      console.warn(`Attack enricher linked to non-attack activity when enriching ${config._input}`);
      return null;
    }

    config.activityUuid = activity.uuid;
    const attackConfig = activity.getAttackData({ attackMode: config.attackMode });
    config.formula = globalThis.dnd5e.dice.simplifyRollFormula(
      Roll.defaultImplementation.replaceFormulaData(attackConfig.parts.join(" + "), attackConfig.data)
    );
    if ( attackConfig.data.scaling ) config.scaling ??= String(attackConfig.data.scaling.increase);
    delete config.activity;
  }

  if ( !config.activityUuid && !config.formula ) {
    console.warn(`No formula or linked activity found while enriching ${config._input}.`);
    return null;
  }

  config.type = "attack";
  if ( label ) return createRollLink(label, config, { classes: "roll-link-group roll-link" });

  let displayFormula = globalThis.dnd5e.dice.simplifyRollFormula(config.formula)?.trim() || "+0";
  if ( !displayFormula.startsWith("+") && !displayFormula.startsWith("-") ) displayFormula = `+${displayFormula}`;

  const span = document.createElement("span");
  span.className = "roll-link-group";
  _addDataset(span, config);
  span.innerHTML = game.i18n.format(`EDITOR.DND5E.Inline.Attack${config._rules === "2014" ? "Long" : "Short"}`, {
    formula: createRollLink(displayFormula).outerHTML
  });

  if ( config.format === "extended" ) {
    const attackTypes = Array.from(activity?.validAttackTypes ?? []).map((t, i) => {
      const label = CONFIG.DND5E.attackTypes[t]?.label;
      const shouldLowercase = config._rules === "2014" || i === 1;
      if (config._rules === "2014" && t === "melee") return `au ${label.toLowerCase()}`;
      return shouldLowercase ? label.toLowerCase() : label;
    }).filter(Boolean);

    const activityClassif = activity?.attack.type.classification;

    let pre = "";
    switch (activityClassif) {
      case "weapon":
        pre = "d'";
        break;
      case "spell":
        pre = `${game.i18n.localize("DND5E.of")} `;
        break;
      case "unarmed":
        pre = "à ";
        break;
      default:
        pre = "";
        break;
    }

    const classification = CONFIG.DND5E.attackClassifications[activityClassif]?.label ?? "";
    const type = game.i18n.format(`DND5E.ATTACK.Formatted.${config._rules}`, {
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(attackTypes),
      classification: classification ? `${pre}${classification.toLowerCase()}` : ""
    }).trim();
    const parts = [span.outerHTML, activity?.getRangeLabel(config.attackMode)];
    if ( config._rules === "2014" ) parts.push(activity?.target?.affects.labels?.statblock);

    const full = document.createElement("span");
    full.className = "attack-extended";
    const cleanParts = parts.filter(p => p).join(", ");
    const template = type ? "EDITOR.DND5E.Inline.AttackExtended" : "{parts}";
    const data = type ? { type, parts: cleanParts } : { parts: cleanParts };
    full.innerHTML = game.i18n.format(template, data);
    return full;
  }

  return span;
}

/* -------------------------------------------- */

/**
 * Perform an attack roll.
 * @param {object} config  Configuration data for the roll.
 * @param {Event} [event]  The click event triggering the action.
 * @returns {Promise|void}
 */
async function rollAttack(config, event) {
  const { activityUuid, attackMode, formula, scaling } = config;

  if ( activityUuid ) {
    const activity = await _fetchActivity(activityUuid, Number(scaling ?? 0));
    if ( activity ) return activity.rollAttack({ attackMode, event });
  }

  const targets = globalThis.dnd5e.utils.getTargetDescriptors();
  const rollConfig = {
    attackMode, event,
    hookNames: ["attack", "d20Test"],
    rolls: [{
      parts: [formula.replace(/^\s*\+\s*/, "")],
      options: {
        target: targets.length === 1 ? targets[0].ac : undefined
      }
    }]
  };

  const dialogConfig = { applicationClass: globalThis.dnd5e.dice.AttackRollConfigurationDialog };

  const messageConfig = {
    data: {
      flags: {
        dnd5e: {
          messageType: "roll",
          roll: { type: "attack" }
        }
      },
      flavor: game.i18n.localize("DND5E.AttackRoll"),
      speaker: ChatMessage.implementation.getSpeaker()
    }
  };

  const rolls = await CONFIG.Dice.D20Roll.build(rollConfig, dialogConfig, messageConfig);
  if ( rolls?.length ) {
    Hooks.callAll("dnd5e.rollAttack", rolls, { subject: null, ammoUpdate: null });
    Hooks.callAll("dnd5e.rollAttackV2", rolls, { subject: null, ammoUpdate: null });
    Hooks.callAll("dnd5e.postRollAttack", rolls, { subject: null });
  }
}

/* -------------------------------------------- */
/*  Check & Save Enrichers                      */
/* -------------------------------------------- */

/**
 * Enrich an ability check link to perform a specific ability or skill check. If an ability is provided
 * along with a skill, then the skill check will always use the provided ability. Otherwise it will use
 * the character's default ability for that skill.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the check could be built, otherwise null.
 *
 * @example Create a dexterity check:
 * ```[[/check ability=dex]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-ability="dex">
 *   <i class="fa-solid fa-dice-d20" inert></i> Dexterity
 * </a>
 * ```
 *
 * @example Create an acrobatics check with a DC and default ability:
 * ```[[/check skill=acr dc=20]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-skill="acr" data-dc="20">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 20 Dexterity (Acrobatics)
 * </a>
 * ```
 *
 * @example Create an acrobatics check using strength:
 * ```[[/check ability=str skill=acr]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-ability="str" data-skill="acr">
 *   <i class="fa-solid fa-dice-d20" inert></i> Strength (Acrobatics)
 * </a>
 * ```
 *
 * @example Create a tool check:
 * ```[[/check tool=thief ability=int]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-ability="int" data-tool="thief">
 *   <i class="fa-solid fa-dice-d20" inert></i> Intelligence (Thieves' Tools)
 * </a>
 * ```
 *
 * @example Create a skill check with a tool (when using the Modern rules):
 * ```[[/check slt thief]]```
 * ```[[/check skill=slt tool=thief]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-skill="slt" data-using-tool="thief">
 *   <i class="fa-solid fa-dice-d20" inert></i> Dexterity (Sleight of Hand)
 * </a> check using Thieves' Tools
 * ```
 *
 * @example Formulas used for DCs will be resolved using data provided to the description (not the roller):
 * ```[[/check ability=cha dc=@abilities.int.dc]]```
 * becomes
 * ```html
 * <a class="roll-action" data-type="check" data-ability="cha" data-dc="15">
 *   <i class="fa-solid fa-dice-d20" inert></i> DC 15 Charisma
 * </a>
 * ```
 *
 * @example Use multiple skills in a check using default abilities:
 * ```[[/check skill=acr/ath dc=15]]```
 * ```[[/check acrobatics athletics 15]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="check" data-skill="acr|ath" data-dc="15">
 *   DC 15
 *   <a class="roll-action" data-ability="dex" data-skill="acr">
 *     <i class="fa-solid fa-dice-d20" inert></i> Dexterity (Acrobatics)
 *   </a> or
 *   <a class="roll-action" data-ability="dex">
 *     <i class="fa-solid fa-dice-d20" inert></i> Strength (Athletics)
 *   </a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Use multiple skills with a fixed ability:
 * ```[[/check ability=str skill=dec/per dc=15]]```
 * ```[[/check strength deception persuasion 15]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="check" data-ability="str" data-skill="dec|per" data-dc="15">
 *   DC 15 Strength
 *   (<a class="roll-action" data-skill="dec"><i class="fa-solid fa-dice-d20" inert></i> Deception</a> or
 *   <a class="roll-action" data-ability="per"><i class="fa-solid fa-dice-d20" inert></i> Persuasion</a>)
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Link an enricher to an check activity, either explicitly or automatically
 * ```[[/check activity=RLQlsLo5InKHZadn]]``` or ```[[/check]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="check" data-ability="dex" data-dc="20" data-activity-uuid="...">
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> DC 20 Dexterity</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 */
export async function enrichCheck(config, label, options) {
  config.skill = config.skill?.replaceAll("/", "|").split("|") ?? [];
  config.tool = config.tool?.replaceAll("/", "|").split("|") ?? [];
  for ( let value of config.values ) {
    const slug = foundry.utils.getType(value) === "string" ? slugify(value) : value;
    if ( slug in CONFIG.DND5E.enrichmentLookup.abilities ) config.ability = slug;
    else if ( slug in CONFIG.DND5E.enrichmentLookup.skills ) config.skill.push(slug);
    else if ( slug in CONFIG.DND5E.enrichmentLookup.tools ) config.tool.push(slug);
    else if ( Number.isNumeric(value) ) config.dc = Number(value);
    else config[value] = true;
  }
  delete config.values;

  const groups = new Map();
  let invalid = false;

  const anything = config.ability || config.skill.length || config.tool.length;
  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !anything ? options.relativeTo?.system?.activities?.getByType("check")[0] : null;

  if ( activity ) {
    if ( activity.type !== "check" ) {
      console.warn(`Check enricher linked to non-check activity when enriching ${config._input}.`);
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

  // TODO: Support "spellcasting" ability
  let abilityConfig = CONFIG.DND5E.enrichmentLookup.abilities[slugify(config.ability)];
  if ( config.ability && !abilityConfig ) {
    console.warn(`Ability "${config.ability}" not found while enriching ${config._input}.`);
    invalid = true;
  } else if ( abilityConfig?.key ) config.ability = abilityConfig.key;

  for ( let [index, skill] of config.skill.entries() ) {
    const skillConfig = CONFIG.DND5E.enrichmentLookup.skills[slugify(skill)];
    if ( skillConfig ) {
      if ( skillConfig.key ) skill = config.skill[index] = skillConfig.key;
      const ability = config.ability || skillConfig.ability;
      if ( !groups.has(ability) ) groups.set(ability, []);
      groups.get(ability).push({ key: skill, type: "skill", label: skillConfig.label });
    } else {
      console.warn(`Skill "${skill}" not found while enriching ${config._input}.`);
      invalid = true;
    }
  }

  let usingTool;
  for ( const tool of config.tool ) {
    const toolConfig = CONFIG.DND5E.tools[slugify(tool)];
    const toolUUID = CONFIG.DND5E.enrichmentLookup.tools[slugify(tool)];
    const toolIndex = toolUUID?.id ? globalThis.dnd5e.documents.Trait.getBaseItem(toolUUID.id, { indexOnly: true }) : null;
    const toolLabel = toolIndex?.name ?? toolUUID?.label;
    if ( toolLabel ) {
      const ability = config.ability || toolConfig?.ability;
      if ( config.skill.length && (config.tool.length === 1) && (config._rules === "2024") ) {
        usingTool = { key: tool, label: toolLabel };
      } else if ( ability ) {
        if ( !groups.has(ability) ) groups.set(ability, []);
        groups.get(ability).push({ key: tool, type: "tool", label: toolLabel });
      } else {
        console.warn(`Tool "${tool}" found without specified or default ability while enriching ${config._input}.`);
        invalid = true;
      }
    } else {
      console.warn(`Tool "${tool}" not found while enriching ${config._input}.`);
      invalid = true;
    }
  }

  if ( !abilityConfig && !groups.size ) {
    console.warn(`No ability, skill, tool, or linked activity provided while enriching ${config._input}.`);
    invalid = true;
  }

  const complex = (config.skill.length + config.tool.length) > 1;
  if ( config.passive && complex ) {
    console.warn(`Multiple skills or tools and passive flag found while enriching ${config._input}, which aren't supported together.`);
    invalid = true;
  }
  if ( label && complex ) {
    console.warn(`Multiple skills or tools and a custom label found while enriching ${config._input}, which aren't supported together.`);
    invalid = true;
  }

  if ( config.dc && !Number.isNumeric(config.dc) ) {
    config.dc = globalThis.dnd5e.utils.simplifyBonus(config.dc, options.rollData ?? options.relativeTo?.getRollData?.() ?? {});
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
        if (config.format === "long") abilityLabel = ability === "int" ? `d'${abilityLabel}` : `${game.i18n.localize("DND5E.of")} ${abilityLabel}`;
        parts.push(game.i18n.format("EDITOR.DND5E.Inline.SpecificCheck", {
            ability: abilityLabel,
            type: formatter.format(associated.map(a => createRollLink(a.label, makeConfig(a)).outerHTML ))
        }));
      }

      // Only single associated proficiency, wrap whole thing in roll link
      else {
        singleAbility = ability;
        const associatedConfig = makeConfig(associated[0]);
        let rollLink = createRollLink(createRollLabel({ ...associatedConfig, ability }), associatedConfig).outerHTML;
        if (config.format === "long") rollLink = ability === "int" ? `d'${rollLink}` : `${game.i18n.localize("DND5E.of")} ${rollLink}`;
        parts.push(rollLink);
      }
    }

    if ( usingTool ) {
      config.format = "long";
      config.usingTool = usingTool.key;
    }
    label = formatter.format(parts);
    if ( config.dc && !config.hideDC ) {
      label = game.i18n.format("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
    }
    if ( usingTool ) label = singleAbility === "int" ? `d'${label}` : `${game.i18n.localize("DND5E.of")} ${label}`;
    label = game.i18n.format(`EDITOR.DND5E.Inline.Check${config.format === "long" ? "Long" : "Short"}`, { check: label });
    if ( usingTool ) label = game.i18n.format("EDITOR.DND5E.Inline.CheckUsing", {
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
 * Create the buttons for a check requested in chat.
 * @param {object} dataset
 * @returns {object[]}
 */
function createCheckRequestButtons(dataset) {
  const skills = dataset.skill?.split("|") ?? [];
  const tools = dataset.tool?.split("|") ?? [];
  if ( (skills.length + tools.length) <= 1 ) return [createRequestButton(dataset)];
  const baseDataset = { ...dataset };
  delete baseDataset.skill;
  delete baseDataset.tool;
  return [
    ...skills.map(skill => createRequestButton({
      ability: CONFIG.DND5E.skills[skill].ability, ...baseDataset, format: "short", skill, type: "skill"
    })),
    ...dataset.usingTool ? [] : tools.map(tool => createRequestButton({
      ability: CONFIG.DND5E.tools[tool]?.ability, ...baseDataset, format: "short", tool, type: "tool"
    }))
  ];
}

/* -------------------------------------------- */

/**
 * Enrich a saving throw link.
 * @param {object} config              Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the save could be built, otherwise null.
 *
 * @example Create a dexterity saving throw:
 * ```[[/save ability=dex]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="save" data-ability="dex">
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> Dexterity</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Add a DC to the save:
 * ```[[/save ability=dex dc=20]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="save" data-ability="dex" data-dc="20">
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> DC 20 Dexterity</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Specify multiple abilities:
 * ```[[/save ability=str/dex dc=20]]```
 * ```[[/save strength dexterity 20]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="save" data-ability="str|dex" data-dc="20">
 *   DC 20
 *   <a class="roll-action" data-ability="str"><i class="fa-solid fa-dice-d20" inert></i> Strength</a> or
 *   <a class="roll-action" data-ability="dex"><i class="fa-solid fa-dice-d20" inert></i> Dexterity</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Create a concentration saving throw:
 * ```[[/concentration 10]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="concentration" data-dc=10>
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> DC 10 concentration</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 *
 * @example Link an enricher to an save activity, either explicitly or automatically
 * ```[[/save activity=RLQlsLo5InKHZadn]]``` or ```[[/save]]```
 * becomes
 * ```html
 * <span class="roll-link-group" data-type="save" data-ability="dex" data-dc="20" data-activity-uuid="...">
 *   <a class="roll-action"><i class="fa-solid fa-dice-d20" inert></i> DC 20 Dexterity</a>
 *   <a class="enricher-action" data-action="postRequest" ...><!-- request link --></a>
 * </span>
 * ```
 */
export async function enrichSave(config, label, options) {
  config.ability = config.ability?.replace("/", "|").split("|") ?? [];
  for ( let value of config.values ) {
    const slug = foundry.utils.getType(value) === "string" ? slugify(value) : value;
    if ( slug in CONFIG.DND5E.enrichmentLookup.abilities ) config.ability.push(slug);
    else if ( Number.isNumeric(value) ) config.dc = Number(value);
    else config[value] = true;
  }
  config.ability = config.ability
    .filter(a => a in CONFIG.DND5E.enrichmentLookup.abilities)
    .map(a => CONFIG.DND5E.enrichmentLookup.abilities[a].key ?? a);

  const activity = config.activity ? options.relativeTo?.system?.activities?.get(config.activity)
    : !config.ability.length ? options.relativeTo?.system?.activities?.getByType("save")[0] : null;

  if ( activity ) {
    if ( activity.type !== "save" ) {
      console.warn(`Save enricher linked to non-save activity when enriching ${config._input}`);
      return null;
    }

    config.ability = Array.from(activity.save.ability);
    config.activityUuid = activity.uuid;
    config.dc = activity.save.dc.value;
    delete config.activity;
  }

  if ( !config.ability.length && !config._isConcentration ) {
    console.warn(`No ability or linked activity found while enriching ${config._input}.`);
    return null;
  }

  if ( config.dc && !Number.isNumeric(config.dc) ) {
    config.dc = globalThis.dnd5e.utils.simplifyBonus(config.dc, options.rollData ?? options.relativeTo?.getRollData?.() ?? {});
  }

  if ( config.ability.length > 1 && label ) {
    console.warn(`Multiple abilities and custom label found while enriching ${config._input}, which aren't supported together.`);
    return null;
  }

  config = { type: config._isConcentration ? "concentration" : "save", ...config };
  if ( label ) label = createRollLink(label);
  else if ( config.ability.length <= 1 ) label = createRollLink(createRollLabel(config));
  else {
    label = game.i18n.getListFormatter({ type: "disjunction" }).format(config.ability.map(ability => {
      let rollLink = createRollLink(createRollLabel({ type: "save", ability }), { ability }).outerHTML;
      if (config.format === "long") rollLink = ability === "int" ? `d'${rollLink}` : `${game.i18n.localize("DND5E.of")} ${rollLink}`;
      return rollLink;
    }));
    if ( config.dc && !config.hideDC ) {
      label = game.i18n.format("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
    }
    label = game.i18n.format(`EDITOR.DND5E.Inline.Save${config.format === "long" ? "Long" : "Short"}`, { save: label });
    const template = document.createElement("template");
    template.innerHTML = label;
    label = template;
  }
  return createRequestLink(label, { ...config, ability: config.ability.join("|") });
}

/* -------------------------------------------- */

/**
 * Create the buttons for a save requested in chat.
 * @param {object} dataset
 * @returns {object[]}
 */
function createSaveRequestButtons(dataset) {
  return (dataset.ability?.split("|") ?? [])
    .map(ability => createRequestButton({ ...dataset, format: "long", ability }));
}

/* -------------------------------------------- */

/**
 * Perform a check or save.
 * @param {object} config  Configuration data for the roll.
 * @param {Event} [event]  The click event triggering the action.
 * @returns {Promise<void>}
 */
async function rollCheckSave(config, event) {
  const { type, ability, skill, tool, dc } = config;
  const options = { event };
  if ( ability in CONFIG.DND5E.abilities ) options.ability = ability;
  if ( dc ) options.target = Number(dc);

  const actors = globalThis.dnd5e.utils.getSceneTargets().map(t => t.actor);
  if ( !actors.length && game.user.character ) actors.push(game.user.character);
  if ( !actors.length ) {
    ui.notifications.warn("EDITOR.DND5E.Inline.Warning.NoActor", { localize: true });
    return;
  }

  for ( const actor of actors ) {
    switch ( type ) {
      case "check":
        await actor.rollAbilityCheck(options);
        break;
      case "concentration":
        await actor.rollConcentration(options);
        break;
      case "save":
        await actor.rollSavingThrow(options);
        break;
      case "skill":
        await actor.rollSkill({ skill, tool: config.usingTool, ...options });
        break;
      case "tool":
        await actor.rollToolCheck({ tool, ...options });
        break;
    }
  }
}

/* -------------------------------------------- */
/*  Damage Enricher                             */
/* -------------------------------------------- */

/**
 * Enrich a damage link.
 * @param {object[]} configs           Configuration data.
 * @param {string} [label]             Optional label to replace default text.
 * @param {EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}         An HTML link if the save could be built, otherwise null.
 *
 * @example Create a damage link:
 * ```[[/damage 2d6 type=bludgeoning]]``
 * becomes
 * ```html
 * <a class="roll-link-group" data-type="damage" data-formulas="2d6" data-damage-types="bludgeoning">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 2d6</span> bludgeoning
 * </a>
 * ````
 *
 * @example Display the average:
 * ```[[/damage 2d6 type=bludgeoning average=true]]``
 * becomes
 * ```html
 * 7 (<a class="roll-link-group" data-type="damage" data-formulas="2d6" data-damage-types="bludgeoning">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 2d6</span>
 * </a>) bludgeoning
 * ````
 *
 * @example Manually set the average & don't prefix the type:
 * ```[[/damage 8d4dl force average=666]]``
 * becomes
 * ```html
 * 666 (<a class="roll-link-group" data-type="damage" data-formulas="8d4dl" data-damage-types="force">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 8d4dl</span>
 * </a> force
 * ````
 *
 * @example Create a healing link:
 * ```[[/heal 2d6]]``` or ```[[/damage 2d6 healing]]```
 * becomes
 * ```html
 * <a class="roll-link-group" data-type="damage" data-formulas="2d6" data-damage-types="healing">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 2d6</span>
 * </a> healing
 * ```
 *
 * @example Specify variable damage types:
 * ```[[/damage 2d6 type=fire|cold]]``` or ```[[/damage 2d6 type=fire/cold]]```
 * becomes
 * ```html
 * <a class="roll-link-group" data-type="damage" data-formulas="2d6" data-damage-types="fire|cold">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 2d6</span>
 * </a> fire or cold
 * ```
 *
 * @example Add multiple damage parts
 * ```[[/damage 1d6 fire & 1d6 cold]]```
 * becomes
 * ```html
 * <a class="roll-link-group" data-type="damage" data-formulas="1d6&1d6" data-damage-types="fire&cold">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 1d6</span> fire and
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 1d6</span> cold
 * </a>
 * ```
 *
 * @example Link an enricher to an damage activity, either explicitly or automatically
 * ```[[/damage activity=RLQlsLo5InKHZadn]]``` or ```[[/damage]]```
 * becomes
 * ```html
 * <a class="roll-link-group" data-type="damage" data-formulas="1d6&1d6" data-damage-types="fire&cold"
 *    data-activity-uuid="...">
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 1d6</span> fire and
 *   <span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 1d6</span> cold
 * </a>
 * ```
 *
 * @example Displaying the full hit section:
 * ```[[/damage extended]]``
 * becomes
 * ```html
 * <span class="damage-extended">
 *   <em>Hit:</em>
 *   <a class="roll-link-group" data-type="damage" data-formulas="2d6" data-damage-types="bludgeoning"
 *      data-activity-uuid="...">
 *     7 (<span class="roll-link"><i class="fa-solid fa-dice-d20"></i> 2d6</span></a>) Bludgeoning damage
 *   </a>
 * </span>
 * ````
 */
export async function enrichDamage(configs, label, options) {
  const config = { type: "damage", formulas: [], damageTypes: [], rollType: configs._isHealing ? "healing" : "damage" };
  for ( const c of configs ) {
    const formulaParts = [];
    if ( c.activity ) config.activity = c.activity;
    if ( c.attackMode ) config.attackMode = c.attackMode;
    if ( c.average ) config.average = c.average;
    if ( c.format ) config.format = c.format;
    if ( c.formula ) formulaParts.push(c.formula);
    c.type = c.type?.replaceAll("/", "|").split("|") ?? [];
    for ( const value of c.values ) {
      if ( value in CONFIG.DND5E.damageTypes ) c.type.push(value);
      else if ( value in CONFIG.DND5E.healingTypes ) c.type.push(value);
      else if ( value in CONFIG.DND5E.attackModes ) config.attackMode = value;
      else if ( value === "average" ) config.average = true;
      else if ( value === "extended" ) config.format = "extended";
      else if ( value === "temp" ) c.type.push("temphp");
      else formulaParts.push(value);
    }
    c.formula = Roll.defaultImplementation.replaceFormulaData(
      formulaParts.join(" "),
      options.rollData ?? options.relativeTo?.getRollData?.() ?? {}
    );
    if ( configs._isHealing && !c.type.length ) c.type.push("healing");
    if ( c.formula ) {
      config.formulas.push(c.formula);
      config.damageTypes.push(c.type.join("|"));
    }
  }
  config.damageTypes = config.damageTypes.map(t => t?.replace("/", "|"));
  if ( config.format === "extended" ) config.average ??= true;

  if ( config.activity && config.formulas.length ) {
    console.warn(`Activity ID and formulas found while enriching ${config._input}, only one is supported.`);
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
      config.formulas.push(globalThis.dnd5e.dice.simplifyRollFormula(
        Roll.defaultImplementation.replaceFormulaData(roll.parts.join(" + "), roll.data)
      ));
      if ( roll.data.scaling ) config.scaling ??= String(roll.data.scaling.increase);
      config.damageTypes.push(roll.options.types?.join("|") ?? roll.options.type);
    }
    delete config.activity;
  }

  if ( !config.activityUuid && !config.formulas.length ) {
    console.warn(`No formula or linked activity found while enriching ${config._input}.`);
    return null;
  }

  const formulas = config.formulas.join("&");
  const damageTypes = config.damageTypes.join("&");

  if ( !config.formulas.length ) return null;
  if ( label ) {
    return createRollLink(label, { ...config, formulas, damageTypes }, { classes: "roll-link-group roll-link" });
  }

  const parts = [];
  for ( const [idx, formula] of config.formulas.entries() ) {
    const of = game.i18n.localize("DND5E.of")
    const prepositions = { acid: "d'", cold: `${of} `, fire: `${of} `, force: `${of} `, lightning: `${of} `, poison: `${of} `, thunder: `${of} ` };
    const type = config.damageTypes[idx];
    const types = type?.split("|")
      .map((t, i) => {
        const damage = CONFIG.DND5E.damageTypes[t];
        const label = damage?.label ?? CONFIG.DND5E.healingTypes[t]?.label
        const formattedLabel = prepositions[t] ? `${prepositions[t]}${label}` : label;
        const formattedDamage = damage && i === 0 ? `${game.i18n.localize("DND5E.Damage").toLowerCase()} ${formattedLabel}` : formattedLabel;
        return damage ? formattedDamage : formattedLabel;
    }).filter(_ => _);
    const localizationData = {
      formula: createRollLink(formula, {}, { tag: "span" }).outerHTML,
      type: game.i18n.getListFormatter({ type: "disjunction" }).format(types).toLowerCase()
    };

    let localizationType = "Short";
    if ( config.average ) {
      localizationType = "Long";
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

    parts.push(game.i18n.format(`EDITOR.DND5E.Inline.Damage${localizationType}`, localizationData));
  }

  const link = document.createElement("a");
  link.className = "roll-link-group";
  link.dataset.action = "roll";
  _addDataset(link, { ...config, formulas, damageTypes });
  if ( config.average && (parts.length === 2) ) {
    link.innerHTML = game.i18n.format("EDITOR.DND5E.Inline.DamageDouble", { first: parts[0], second: parts[1] });
  } else {
    link.innerHTML = game.i18n.getListFormatter().format(parts);
  }

  if ( config.format === "extended" ) {
    const span = document.createElement("span");
    span.className = "damage-extended";
    span.innerHTML = game.i18n.format("EDITOR.DND5E.Inline.DamageExtended", { damage: link.outerHTML });
    return span;
  }

  return link;
}

/* -------------------------------------------- */

/**
 * Perform a damage roll.
 * @param {object} config  Configuration data for the roll.
 * @param {Event} [event]  The click event triggering the action.
 * @returns {Promise<void>}
 */
async function rollDamage(config, event) {
  let { activityUuid, attackMode, formulas, damageTypes, rollType, scaling } = config;

  if ( activityUuid ) {
    const activity = await _fetchActivity(activityUuid, Number(scaling ?? 0));
    if ( activity ) return activity.rollDamage({ attackMode, event });
  }

  formulas = formulas?.split("&") ?? [];
  damageTypes = damageTypes?.split("&") ?? [];

  const rollConfig = {
    attackMode, event,
    hookNames: ["damage"],
    rolls: formulas.map((formula, idx) => {
      const types = damageTypes[idx]?.split("|") ?? [];
      return {
        parts: [formula],
        options: { type: types[0], types }
      };
    })
  };

  const messageConfig = {
    create: true,
    data: {
      flags: {
        dnd5e: {
          messageType: "roll",
          roll: { type: rollType },
          targets: globalThis.dnd5e.utils.getTargetDescriptors()
        }
      },
      flavor: game.i18n.localize(`DND5E.${rollType === "healing" ? "Healing" : "Damage"}Roll`),
      speaker: ChatMessage.implementation.getSpeaker()
    }
  };

  const rolls = await CONFIG.Dice.DamageRoll.build(rollConfig, {}, messageConfig);
  if ( !rolls?.length ) return;
  Hooks.callAll("dnd5e.rollDamage", rolls);
  Hooks.callAll("dnd5e.rollDamageV2", rolls);
}

/* -------------------------------------------- */
/*  Use Item Enricher                           */
/* -------------------------------------------- */

/**
 * Use an Item from an Item enricher.
 * @param {object} config
 * @param {string} [config.rollActivityUuid]  Lookup the Activity by UUID.
 * @param {string} [config.rollActivityName]  Lookup the Activity by name.
 * @param {string} [config.rollItemUuid]      Lookup the Item by UUID.
 * @param {string} [config.rollItemName]      Lookup the Item by name.
 * @param {string} [config.rollItemActor]     The UUID of a specific Actor that should use the Item.
 * @param {Event} event                       The click event triggering the action.
 * @returns {Promise}
 */
async function useItem({ rollActivityUuid, rollActivityName, rollItemUuid, rollItemName, rollItemActor }, event) {
  // If UUID is provided, always roll that item directly
  if ( rollActivityUuid ) return (await fromUuid(rollActivityUuid))?.use({ event });
  if ( rollItemUuid ) return (await fromUuid(rollItemUuid))?.use({ event });

  if ( !rollItemName ) return;
  const actor = rollItemActor ? await fromUuid(rollItemActor) : null;

  // If no actor is specified or player isn't owner, fall back to the macro rolling logic
  if ( !actor?.isOwner ) return globalThis.dnd5e.documents.macro.rollItem(rollItemName, { activityName: rollActivityName });
  const token = canvas.tokens.controlled[0];

  // If a token is controlled, and it has an item with the correct name, activate it
  let item = token?.actor.items.getName(rollItemName);

  // Otherwise check the specified actor for the item
  if ( !item ) {
    item = actor.items.getName(rollItemName);

    // Display a warning to indicate the item wasn't rolled from the controlled actor
    if ( item && canvas.tokens.controlled.length ) ui.notifications.warn(
      game.i18n.format("MACRO.5eMissingTargetWarn", {
        actor: token.name, name: rollItemName, type: game.i18n.localize("DOCUMENT.Item")
      })
    );
  }

  if ( item ) {
    if ( rollActivityName ) {
      const activity = item.system.activities?.getName(rollActivityName);
      if ( activity ) return activity.use({ event });

      // If no activity could be found at all, display a warning
      else ui.notifications.warn(game.i18n.format("EDITOR.DND5E.Inline.Warning.NoActivityOnItem", {
        activity: rollActivityName, actor: actor.name, item: rollItemName
      }));
    }

    else return item.use({ event });
  }

  // If no item could be found at all, display a warning
  else ui.notifications.warn(game.i18n.format("EDITOR.DND5E.Inline.Warning.NoItemOnActor", {
    actor: actor.name, item: rollItemName
  }));
}

/* -------------------------------------------- */
/*  Labels & Links                              */
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
  _addDataset(span, {
    ...dataset,
    tooltip: `
      <section class="loading" data-passive><i class="fas fa-spinner fa-spin-pulse"></i></section>
    `
  });
  span.innerText = label;
  return span;
}

/* -------------------------------------------- */

/**
 * Create a label for a roll message.
 * @param {object} config  Configuration data.
 * @returns {string}
 */
export function createRollLabel(config) {
  const { label: ability, abbreviation } = CONFIG.DND5E.abilities[config.ability] ?? {};
  const skill = CONFIG.DND5E.skills[config.skill]?.label;
  const toolUUID = CONFIG.DND5E.enrichmentLookup.tools[config.tool];
  const tool = toolUUID?.id ? globalThis.dnd5e.documents.Trait.getBaseItem(toolUUID.id, { indexOnly: true })?.name : toolUUID?.label ?? null;
  const longSuffix = config.format === "long" ? "Long" : "Short";
  const showDC = config.dc && !config.hideDC;

  let label;
  switch ( config.type ) {
    case "check":
    case "skill":
    case "tool":
      if ( ability && (skill || tool) ) {
        label = game.i18n.format("EDITOR.DND5E.Inline.SpecificCheck", { ability, type: skill ?? tool });
      } else {
        label = ability;
      }
      if (config.format === "long") label = config.ability === "int" ? `d'${label}` : `${game.i18n.localize("DND5E.of")} ${label}`;
      if ( config.passive ) {
        label = game.i18n.format(
          `EDITOR.DND5E.Inline.${showDC ? "DC" : ""}Passive${longSuffix}`, { dc: config.dc, check: label }
        );
      } else {
        if ( showDC ) label = game.i18n.format("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
        label = game.i18n.format(`EDITOR.DND5E.Inline.Check${longSuffix}`, { check: label });
      }
      break;
    case "concentration":
    case "save":
      if ( config.type === "save" ) {
        label = ability;
        if (config.format === "long") label = (config.ability[0] === "int" || config.ability === "int") ? `d'${label}` : `${game.i18n.localize("DND5E.of")} ${label}`;
      }
      else label = `${game.i18n.localize("DND5E.Concentration")} ${ability ? `(${abbreviation})` : ""}`;
      if ( showDC ) label = game.i18n.format("EDITOR.DND5E.Inline.DC", { dc: config.dc, check: label });
      label = game.i18n.format(`EDITOR.DND5E.Inline.Save${longSuffix}`, { save: label });
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
    }
  }

  return label;
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
    gmLink.setAttribute("aria-label", game.i18n.localize(gmLink.dataset.tooltip));
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
/*  Actions                                     */
/* -------------------------------------------- */

/**
 * Attach actions to enrichers when they are rendered.
 * @param {HTMLEnrichedContentElement} element
 */
function onRenderEnricher(element) {
  _addListeners(element.querySelectorAll('[data-action="applyStatus"]'), handleApplyStatus);
  _addListeners(element.querySelectorAll('[data-action="awardRequest"]'), handleAward);
  _addListeners(element.querySelectorAll('[data-action="postRequest"]'), handlePostRequest);
  _addListeners(element.querySelectorAll('[data-action="roll"]'), handleRoll);
}

/* -------------------------------------------- */

/**
 * Create the combined dataset for the target button and any parent groups.
 * @param {HTMLElement} target  Button that was clicked.
 * @returns {object}
 */
function getRollActionDataset(target) {
  return {
    ...((target.closest(".roll-link-group") ?? target)?.dataset ?? {}),
    ...(target.closest(".roll-link")?.dataset ?? {})
  };
}

/* -------------------------------------------- */

/**
 * Toggle status effects on selected tokens.
 * @param {Event} event         Triggering click event.
 * @param {HTMLElement} target  Button that was clicked.
 */
async function handleApplyStatus(event, target) {
  const status = target.dataset.status;
  if ( !status ) return;
  window.getSelection().empty();
  const actors = new Set();
  for ( const { actor } of canvas.tokens.controlled ) {
    if ( !actor || actors.has(actor) ) continue;
    await actor.toggleStatusEffect(status);
    actors.add(actor);
  }
}

/* -------------------------------------------- */

/**
 * Forward clicks on award requests to the Award application.
 * @param {Event} event         Triggering click event.
 * @param {HTMLElement} target  Button that was clicked.
 */
async function handleAward(event, target) {
  const command = target?.closest("[data-award-command]")?.dataset.awardCommand;
  if ( !command ) return;
  window.getSelection().empty();
  globalThis.dnd5e.applications.Award.handleAward(command);
}

/* -------------------------------------------- */

/**
 * Handle creating a roll request chat message.
 * @param {Event} event         Triggering click event.
 * @param {HTMLElement} target  Button that was clicked.
 */
async function handlePostRequest(event, target) {
  window.getSelection().empty();
  const dataset = getRollActionDataset(target);

  let buttons;
  if ( dataset.type === "check" ) buttons = createCheckRequestButtons(dataset);
  else if ( dataset.type === "save" ) buttons = createSaveRequestButtons(dataset);
  else buttons = [createRequestButton({ ...dataset, format: "short" })];

  const MessageClass = getDocumentClass("ChatMessage");
  const chatData = {
    user: game.user.id,
    content: await foundry.applications.handlebars.renderTemplate(
      "systems/dnd5e/templates/chat/roll-request-card.hbs", { buttons }
    ),
    flavor: game.i18n.localize("EDITOR.DND5E.Inline.RollRequest"),
    speaker: MessageClass.getSpeaker({ user: game.user })
  };
  MessageClass.create(chatData);
}

/* -------------------------------------------- */

/**
 * Create a button for a chat request.
 * @param {object} dataset
 * @returns {object}
 */
function createRequestButton(dataset) {
  return {
    buttonLabel: createRollLabel({ ...dataset, icon: true }),
    hiddenLabel: createRollLabel({ ...dataset, icon: true, hideDC: true }),
    dataset: { ...dataset, action: "rollRequest", visibility: "all" }
  };
}

/* -------------------------------------------- */

/**
 * Handle performing a roll.
 * @param {Event} event         Triggering click event.
 * @param {HTMLElement} target  Button that was clicked.
 * @returns {Promise}
 */
async function handleRoll(event, target) {
  const dataset = getRollActionDataset(target);
  const link = target.closest("a") ?? target;
  link.disabled = true;
  window.getSelection().empty();
  try {
    switch ( dataset.type ) {
      case "attack": return await rollAttack(dataset, event);
      case "damage": return await rollDamage(dataset, event);
      case "item": return await useItem(dataset, event);
      default: return await rollCheckSave(dataset, event);
    }
  } finally {
    link.disabled = false;
  }
}

/* -------------------------------------------- */
/*  Helpers                                     */
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

/* -------------------------------------------- */

const LISTENER = Symbol("enricherListener");

/**
 * Add click listeners for each of the provided buttons, passing the event and target to the handler.
 * @param {HTMLButtonElement[]} buttons  Buttons to attach the listeners to.
 * @param {Function} handler             Click handler to call.
 * @private
 */
function _addListeners(buttons, handler) {
  buttons.forEach(button => {
    // TODO: Remove this fix in DnD5e 6.0 when https://github.com/foundryvtt/foundryvtt/issues/13558 is fixed
    button.removeEventListener("click", button[LISTENER]);
    button[LISTENER] = event => handler(event, event.currentTarget);
    button.addEventListener("click", button[LISTENER]);
  });
}

/* -------------------------------------------- */

/**
 * Fetch an activity with scaling applied.
 * @param {string} uuid     Activity UUID.
 * @param {number} scaling  Scaling increase to apply.
 * @returns {Activity|void}
 */
async function _fetchActivity(uuid, scaling) {
  const activity = await fromUuid(uuid);
  if ( !activity || !scaling ) return activity;
  const item = activity.item.clone({ "flags.dnd5e.scaling": scaling }, { keepId: true });
  return item.system.activities.get(activity.id);
}
