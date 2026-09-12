export default class NPCDataFr extends globalThis.dnd5e.dataModels.actor.NPCData {
  /** @inheritDoc */
  async _prepareEmbedContext(rulesVersion) {
    // FR: stat block lists are comma-separated ("9 m, vol 18 m"), never "9 m et vol 18 m", so the
    // "unit" list formatter the system builds its lists with is neutralised for the duration of the call.
    const restoreFormatter = _useCommaUnitLists();
    let context;
    try {
      context = await super._prepareEmbedContext(rulesVersion);
    } finally {
      restoreFormatter();
    }

    const o = this.parent.flags.dnd5e?.statBlockOverride ?? {};
    const summary = context.summary;
    // `context.definitions` holds copies of the summary strings, so the value each field started with
    // is kept to swap them out afterwards rather than rebuilding the definition lists. Only the first
    // value is kept: a field rewritten twice must still map from its original string.
    const originals = {};
    const set = (key, value) => {
      if ( value === summary[key] ) return;
      originals[key] ??= summary[key];
      summary[key] = value;
    };

    // FR: "3 épées longues", not "3 Épées longues".
    if ( !o.gear ) set("gear", this.parent.items
      .filter(item => item.system.quantity && item.system.properties?.has("gear"))
      .map(item => {
        const { nameHTML } = item.system.gearPresentationData();
        const name = nameHTML.toLowerCase();
        return item.system.quantity > 1
          ? `${name}s (${globalThis.dnd5e.utils.formatNumber(item.system.quantity)})` : name;
      })
      .sort((lhs, rhs) => lhs.localeCompare(rhs, game.i18n.lang))
      .join(", ")
    );

    // FR: languages are lowercase, and "toutes les langues…" is shortened to "toutes".
    if ( !o.languages ) set("languages", [
      this.traits.languages.labels.languages
        .map(l => l.toLowerCase().includes("toutes") ? "toutes" : l.toLowerCase()).sort().join(", "),
      this.traits.languages.labels.ranged.map(r => r.toLowerCase()).join(", ")
    ].filterJoin(" ; ") || (rulesVersion === "2024" ? `${game.i18n.localize("None").toLowerCase()}e` : "—"));

    // FR: movement labels are lowercase, in both rules versions.
    if ( !o.speed ) set("speed", summary.speed.toLowerCase());

    // FR: damage types are lowercase; condition names keep their capital, so the labels are lowered
    // one by one instead of the whole list (the 2014 layout lowercases its definitions on its own).
    if ( rulesVersion === "2024" ) {
      for ( const type of ["vulnerabilities", "resistances", "immunities"] ) {
        if ( (type in o) || !summary[type] ) continue;
        const trait = `d${type[0]}`;
        let value = summary[type];
        for ( const key of this.traits[trait].value ) {
          const label = globalThis.dnd5e.documents.Trait.keyLabel(key, { trait });
          if ( label ) value = value.replaceAll(label, label.toLowerCase());
        }
        set(type, value);
      }
    }

    // FR: the creature tag reads "Dragon de taille TG, loyal mauvais" — the size is abbreviated.
    if ( !o.tag ) {
      let tag = game.i18n.format("DND5E.CreatureTag", {
        size: o.size ?? CONFIG.DND5E.actorSizes[this.traits.size]?.abbreviation ?? "",
        type: o.type ?? globalThis.dnd5e.documents.Actor5e.formatCreatureType(this.details.type) ?? "",
        alignment: o.alignment ?? this.details.alignment
      }).replace(/, $/, "");
      if ( rulesVersion === "2014" ) tag = tag.toLowerCase().capitalize();
      summary.tag = tag;
    }

    // FR: a semicolon takes a space before it.
    for ( const key of [
      "cr", "senses", "languages", "conditionImmunities", "vulnerabilities", "resistances", "immunities"
    ] ) {
      if ( summary[key] ) set(key, summary[key].replace(/\s*;\s*/g, " ; "));
    }

    // FR: "(3/jour)" rather than "(3/Jour)" after an action's name.
    for ( const section of Object.values(context.actionSections) ) {
      for ( const action of section.actions ) {
        const item = this.parent.items.get(action.dataset.id);
        const uses = item?.system.uses.label
          || (item?.system.activities?.size === 1 ? item.system.activities.contents[0]?.uses.label : undefined);
        if ( uses ) action.name = `${item.name} (${uses.toLowerCase()})`;
      }
    }

    const replacements = new Map(
      Object.entries(originals).filter(([, orig]) => orig).map(([key, orig]) => [orig, summary[key]])
    );
    for ( const definition of [...context.definitions.upper, ...context.definitions.lower] ) {
      definition.definitions = definition.definitions.map(d => replacements.get(d) ?? d);
    }

    return context;
  }
}

/* -------------------------------------------- */

/**
 * Temporarily make `game.i18n.getListFormatter({ type: "unit" })` join with commas only. Every other
 * formatter type (the conjunctions & disjunctions used for damage bypasses) is left untouched.
 * @returns {Function}  Call to restore the original method.
 */
function _useCommaUnitLists() {
  const original = game.i18n.getListFormatter;
  game.i18n.getListFormatter = function(options={}) {
    if ( options.type === "unit" ) return { format: values => Array.from(values).filter(_ => _).join(", ") };
    return original.call(this, options);
  };
  return () => game.i18n.getListFormatter = original;
}
