export default class NPCDataFr extends globalThis.dnd5e.dataModels.actor.NPCData {
  /** @override */
  async toEmbed(config, options={}) {
    for ( const value of config.values ) {
      if ( value === "statblock" ) config.statblock = true;
    }
    if ( !config.statblock ) return super.toEmbed(config, options);

    const rulesVersion = globalThis.dnd5e.enrichers.getRulesVersion(config, { ...options, relativeTo: this.parent });
    const context = await this._prepareEmbedContext(rulesVersion);
    context.name = config.label || this.parent.name;
    if ( config.cite && !config.inline ) {
      config.cite = false;
      context.anchor = this.parent.toAnchor({ name: context.name }).outerHTML;
    }
    const template = document.createElement("template");
    template.innerHTML = await foundry.applications.handlebars.renderTemplate(
      "systems/dnd5e/templates/actors/embeds/npc-embed.hbs", context
    );

    return template.content;
  }

  /* -------------------------------------------- */

  /**
   * Prepare the context information for the embed template rendering.
   * @param {"2014"|"2024"} rulesVersion  Version of the stat block styling to use.
   * @returns {object}
   */
  async _prepareEmbedContext(rulesVersion) {
    const prepareMeasured = (value, units, label) => label
      ? `${label} ${globalThis.dnd5e.utils.formatLength(value, units)}`
      : globalThis.dnd5e.utils.formatLength(value, units);
    const prepareTrait = ({ value, custom }, trait) => [
      ...Array.from(value).map(t => globalThis.dnd5e.documents.Trait.keyLabel(t, { trait })).filter(_ => _),
      ...globalThis.dnd5e.utils.splitSemicolons(custom ?? "")
    ].sort((lhs, rhs) => lhs.localeCompare(rhs, game.i18n.lang)).join(", ");
    const o = this.parent.flags.dnd5e?.statBlockOverride ?? {};

    const prepareSpeed = () => {
      const standard = [
        prepareMeasured(this.attributes.movement.walk, this.attributes.movement.units),
        ...Object.entries(CONFIG.DND5E.movementTypes)
          .filter(([k]) => this.attributes.movement[k] && (k !== "walk"))
          .map(([k, { label }]) => {
            let prepared = prepareMeasured(this.attributes.movement[k], this.attributes.movement.units, label.toLowerCase());
            if ( (k === "fly") && this.attributes.movement.hover ) {
              prepared = `${prepared} (${game.i18n.localize("DND5E.MOVEMENT.Hover").toLowerCase()})`;
            }
            return prepared;
          })
      ].join(", ");
      const custom = globalThis.dnd5e.utils.splitSemicolons(this.attributes.movement.special).join(", ");
      return custom ? `${standard} (${custom})` : standard;
    };

    const xp = rulesVersion === "2024"
      ? `${o.xp ?? game.i18n.format(`DND5E.ExperiencePoints.StatBlock.${
        (this.resources.lair.value) && (this.details.cr !== null) ? "Lair" : "Standard"}`, {
        value: globalThis.dnd5e.utils.formatNumber(this.parent.getCRExp(this.details.cr)),
        lair: globalThis.dnd5e.utils.formatNumber(this.parent.getCRExp(this.details.cr + 1))
      })} ; ${o.pb ?? `${game.i18n.localize("DND5E.ProficiencyBonusAbbr")} ${
        globalThis.dnd5e.utils.formatNumber(this.attributes.prof, { signDisplay: "always" })}`}`
      : o.xp ?? game.i18n.format("DND5E.ExperiencePoints.Format", {
        value: globalThis.dnd5e.utils.formatNumber(this.parent.getCRExp(this.details.cr))
      });

    const context = {
      abilityTables: rulesVersion === "2024" ? Array.fromRange(3).map(_ => ({ abilities: [] })) : null,
      actionSections: {
        trait: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.Traits"),
          hideLabel: rulesVersion === "2014",
          actions: []
        },
        action: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.Actions"),
          actions: []
        },
        bonus: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.BonusActions"),
          actions: []
        },
        reaction: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.Reactions"),
          actions: []
        },
        legendary: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.LegendaryActions"),
          description: "",
          actions: []
        },
        mythic: {
          label: game.i18n.localize("DND5E.NPC.SECTIONS.MythicActions"),
          description: "",
          actions: []
        }
      },
      CONFIG: CONFIG.DND5E,
      definitions: {
        lower: [],
        upper: []
      },
      document: this.parent,
      rulesVersion,
      summary: {
        // Condition Immunities
        conditionImmunities: o.conditionImmunities ?? prepareTrait(this.traits.ci, "ci"),

        // Challenge Rating (e.g. `23 (XP 50,000; PB +7`))
        cr: `${o.cr ?? globalThis.dnd5e.utils.formatCR(this.details.cr, { narrow: false })} (${xp})`,

        // Gear
        gear: o.gear ?? this.getGear().map(i => i.system.quantity > 1 ? `${i.name.toLowerCase()}s (${globalThis.dnd5e.utils.formatNumber(i.system.quantity)})` : i.name.toLowerCase()).sort().join(", "),

        // Initiative (e.g. `+0 (10)`)
        initiative: o.initiative ?? `${globalThis.dnd5e.utils.formatNumber(this.attributes.init.total, { signDisplay: "always" })} (${
          globalThis.dnd5e.utils.formatNumber(this.attributes.init.score)})`,

        // Languages (e.g. `Common, Draconic`)
        languages: o.languages ?? ([
          this.traits.languages.labels.languages.map(l => l.toLowerCase().includes("toutes") ? "toutes" : l.toLowerCase()).sort().join(", "),
          this.traits.languages.labels.ranged.map(r => r.toLowerCase()).join(", ")
        ].filterJoin(" ; ") || (rulesVersion === "2024" ? `${game.i18n.localize("None").toLowerCase()}e` : "—")),

        // Saves (e.g. `Dex +7, Con +15, Wis +10, Cha +12`)
        saves: Object.entries(CONFIG.DND5E.abilities)
            .filter(([k]) => this.abilities[k].saveProf.multiplier !== 0)
            .map(([k, { abbreviation }]) => `${abbreviation.capitalize()} ${globalThis.dnd5e.utils.formatNumber(this.abilities[k].save.value, { signDisplay: "always" })}`).join(", "),

        // Senses (e.g. `Blindsight 60 ft., Darkvision 120 ft.; Passive Perception 27`)
        senses: o.senses ?? [
          [
            ...Object.entries(CONFIG.DND5E.senses)
              .filter(([k]) => this.attributes.senses[k])
              .map(([k, label]) => prepareMeasured(this.attributes.senses[k], this.attributes.senses.units, rulesVersion === "2024" ? label : label.toLowerCase())),
            ...globalThis.dnd5e.utils.splitSemicolons(this.attributes.senses.special)
          ].sort((lhs, rhs) => lhs.localeCompare(rhs, game.i18n.lang)).join(", "),
          `${game.i18n.localize("DND5E.PassivePerception")} ${globalThis.dnd5e.utils.formatNumber(this.skills.prc.passive)}`
        ].filterJoin(" ; "),

        // Skills (e.g. `Perception +17, Stealth +7`)
        skills: o.skills ?? Object.entries(CONFIG.DND5E.skills)
            .filter(([k]) => this.skills[k].value > 0)
            .map(([k, { label }]) => `${label} ${globalThis.dnd5e.utils.formatNumber(this.skills[k].total, { signDisplay: "always" })}`).join(", "),

        // Speed (e.g. `40 ft., Burrow 40 ft., Fly 80 ft.`)
        speed: o.speed ?? prepareSpeed(),

        // Tag (e.g. `Gargantuan Dragon, Lawful Evil`)
        tag: o.tag ?? game.i18n.format("DND5E.CreatureTag", {
          size: o.size ?? CONFIG.DND5E.actorSizes[this.traits.size]?.abbreviation ?? "",
          type: o.type ?? globalThis.dnd5e.documents.Actor5e.formatCreatureType(this.details.type) ?? "",
          alignment: o.alignment ?? this.details.alignment
        }).replace(/, $/, "")
      },
      system: this
    };

    for ( const type of ["vulnerabilities", "resistances", "immunities"] ) {
      if ( type in o ) {
        context.summary[type] = o[type];
        continue;
      }
      const entries = [];
      for ( const category of rulesVersion === "2024" ? ["damage", "condition"] : ["damage"] ) {
        if ( (category === "condition") && (type !== "immunities") ) continue;
        const trait = `${category[0]}${type[0]}`;
        const data = this.traits[trait];
        const { value, physical } = data.value.reduce((acc, t) => {
          if ( data.bypasses?.size && CONFIG.DND5E.damageTypes[t]?.isPhysical ) acc.physical.push(t);
          else acc.value.push(t);
          return acc;
        }, { value: [], physical: [] });
        let list = prepareTrait({ value, custom: data.custom }, trait);
        if ( list ) entries.push(category !== "condition" ? list.toLowerCase() : list);
        if ( physical.length ) entries.push(game.i18n.format("DND5E.DamagePhysicalBypasses", {
          damageTypes: game.i18n.getListFormatter({ style: "long", type: "conjunction" }).format(
            physical.map(t => CONFIG.DND5E.damageTypes[t].label)
          ),
          bypassTypes: game.i18n.getListFormatter({ style: "long", type: "disjunction" }).format(
            Array.from(data.bypasses).map(t => CONFIG.DND5E.itemProperties[t]?.label).filter(_ => _)
          )
        }));
      }
      if ( entries.length ) context.summary[type] = entries.join(" ; ");
    }

    const { summary, system } = context;
    if ( rulesVersion === "2024" ) {
      for ( const [index, [key, { abbreviation }]] of Object.entries(CONFIG.DND5E.abilities).entries() ) {
        context.abilityTables[index % 3].abilities.push({ ...this.abilities[key], label: abbreviation.capitalize() });
      }

      context.definitions.upper = [
        { label: "DND5E.AC", classes: "half-width", definitions: [o.ac ?? system.attributes.ac.value] },
        { label: "DND5E.Initiative", classes: "half-width", definitions: [summary.initiative] },
        { label: "DND5E.HP", definitions: o.hp ? [o.hp] : system.attributes.hp.formula ? [
          system.attributes.hp.max, `(${system.attributes.hp.formula})`
        ] : [system.attributes.hp.max] },
        { label: "DND5E.Speed", definitions: [summary.speed] }
      ];
      context.definitions.lower = [
        summary.skills ? { label: "DND5E.Skills", definitions: [summary.skills] } : null,
        summary.vulnerabilities ? { label: "DND5E.Vulnerabilities", definitions: [summary.vulnerabilities] } : null,
        summary.resistances ? { label: "DND5E.Resistances", definitions: [summary.resistances] } : null,
        summary.immunities ? { label: "DND5E.Immunities", definitions: [summary.immunities] } : null,
        summary.gear ? { label: "DND5E.Gear", definitions: [summary.gear] } : null,
        { label: "DND5E.Senses", definitions: [summary.senses] },
        { label: "DND5E.Languages", definitions: [summary.languages] },
        { label: "DND5E.AbbreviationCR", definitions: [summary.cr] }
      ].filter(_ => _);
    }

    else {
      const lowerCase = def => {
        def.definitions = def.definitions.map(d => String(d).toLowerCase());
        return def;
      };
      context.definitions.upper = [
        { label: "DND5E.ArmorClass", definitions: o.ac ? [o.ac] : system.attributes.ac.label ? [
          system.attributes.ac.value, `(${system.attributes.ac.label})`
        ] : [system.attributes.ac.value] },
        { label: "DND5E.HitPoints", definitions: o.hp ? [o.hp] : system.attributes.hp.formula ? [
          system.attributes.hp.max, `(${system.attributes.hp.formula})`
        ] : [system.attributes.hp.max] },
        { label: "DND5E.Speed", definitions: [summary.speed] }
      ].map(d => lowerCase(d));
      context.definitions.lower = [
        summary.saves ? { label: "DND5E.ClassSaves", definitions: [summary.saves] } : null,
        summary.skills ? { label: "DND5E.Skills", definitions: [summary.skills] } : null,
        summary.vulnerabilities ? lowerCase({ label: "DND5E.DamVuln", definitions: [summary.vulnerabilities] }) : null,
        summary.resistances ? lowerCase({ label: "DND5E.DamRes", definitions: [summary.resistances] }) : null,
        summary.immunities ? lowerCase({ label: "DND5E.DamImm", definitions: [summary.immunities] }) : null,
        summary.conditionImmunities
          ? lowerCase({ label: "DND5E.TraitCIPlural.other", definitions: [summary.conditionImmunities] }) : null,
        { label: "DND5E.Senses", definitions: [summary.senses] },
        { label: "DND5E.Languages", definitions: [summary.languages] },
        { label: "DND5E.Challenge", classes: "half-width", definitions: [summary.cr] },
        { label: "DND5E.ProficiencyBonus", classes: "half-width", definitions: [
          o.pb ?? formatNumber(this.attributes.prof, { signDisplay: "always" })
        ] }
      ].filter(_ => _);
      context.summary.tag = context.summary.tag.toLowerCase().capitalize();
    }

    for ( const item of this.parent.items ) {
      if ( !["feat", "weapon"].includes(item.type) ) continue;
      const category = item.system.properties.has("trait") ? "trait"
        : (item.system.activities?.contents[0]?.activation?.type ?? "trait");
      if ( category in context.actionSections ) {
        let description = (await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description.value, {
          secrets: false, rollData: item.getRollData(), relativeTo: item
        }));
        if ( item.identifier === "legendary-actions" ) {
          context.actionSections.legendary.description = description;
        } else if ( item.identifier === "mythic-actions" ) {
          context.actionSections.mythic.description = description;
        } else {
          const openingTag = description.match(/^\s*(<p(?:\s[^>]+)?>)/gi)?.[0];
          if ( openingTag ) description = description.replace(openingTag, "");
          // let uses = item.system.uses.label || item.system.activities?.contents[0]?.uses.label;
          // const recoveryPeriod = item.system.uses.recovery[0]?.period || item.system.activities?.contents[0]?.uses.recovery[0]?.period;
          // const usesMax = item.system.uses.max || item.system.activities?.contents[0]?.uses.max;
          // if (!(["lr", "sr"].includes(recoveryPeriod) && (usesMax === 1))) {
          //   uses = uses?.toLowerCase();
          // }
          const uses = item.system.uses.label
            || (item.system.activities?.size === 1 ? item.system.activities?.contents[0]?.uses.label : undefined);
          context.actionSections[category].actions.push({
            description, openingTag,
            dataset: { id: item.id, identifier: item.identifier },
            name: uses ? `${item.name} (${uses.toLowerCase()})` : item.name,
            sort: item.sort
          });
        }
      }
    }
    for ( const [key, section] of Object.entries(context.actionSections) ) {
      if ( section.actions.length ) {
        section.actions.sort((lhs, rhs) => lhs.sort - rhs.sort);
        if ( (key === "legendary") && !section.description ) {
          section.description = `<p>${this.getLegendaryActionsDescription()}</p>`;
        }
      } else delete context.actionSections[key];
    }

    return context;
  }
}