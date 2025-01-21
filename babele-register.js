import { FieldMapping } from "./FieldMapping.js";

Hooks.once('init', () => {

	if (typeof Babele !== 'undefined') {

		game.settings.register("dnd5e_fr-FR", "convert", {
			name: "Conversions automatiques",
			hint: "Applique le système métrique à toutes les mesures, distances",
			scope: "world",
			type: Boolean,
			default: true,
			config: true,
			onChange: convert => {
				setEncumbranceData();
				fixExhaustion();
			}
		});

		game.babele.register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium_fr'
		});

		game.babele.registerConverters({
			"items": Converters.items(),
			"itemsMonster": Converters.itemsMonster(),
			"range": Converters.imperialToMetric("range"),
			"weight": Converters.imperialToMetric("weight"),
			"target": Converters.imperialToMetric("target"),
			"senses": Converters.imperialToMetric("senses"),
			"movement": Converters.imperialToMetric("movement"),
			"sightRange": Converters.imperialToMetric("sightRange"),
			"rangeActivities": Converters.imperialToMetric("rangeActivities"),
			"distanceAdvancement": Converters.imperialToMetric("distanceAdvancement"),
			"pages": Converters.pages(),
			"source": Converters.source(),
			"effects": Converters.effects(),
			"activities": Converters.activities(),
			"advancement": Converters.advancement()
		});
	}
});

Hooks.once('ready', () => {
	setEncumbranceData();
	fixExhaustion();
});

Hooks.on('createScene', (scene) => {
	if (convertEnabled()) {
		scene.update({ "grid.units": "m", "grid.distance": 1.5 });
	}
});

function convertEnabled() {
	return game.settings.get("dnd5e_fr-FR", "convert");
}

function setEncumbranceData() {
	let convert = convertEnabled();
	game.settings.set("dnd5e", "metricWeightUnits", convert);

	if (convert) {
		CONFIG.DND5E.movementUnits = {
			m: CONFIG.DND5E.movementUnits.m,
			km: CONFIG.DND5E.movementUnits.km,
			ft: CONFIG.DND5E.movementUnits.ft,
			mi: CONFIG.DND5E.movementUnits.mi
		};
	}
}

function fixExhaustion() {
	// Fix system bug (2024 rules)
	if (convertEnabled()) {
		CONFIG.DND5E.conditionTypes.exhaustion.reduction = foundry.utils.mergeObject(
			CONFIG.DND5E.conditionTypes.exhaustion.reduction, { speed: 1.5 }
		);
	}
}

/**
 * Utility class with all predefined converters
 */

export class Converters {

	static imperialToMetric(type) {
		return (value) => {
			if (!convertEnabled()) return value;

			switch (type) {
				case "range": return Converters.range(value);
				case "weight": return Converters.weight(value);
				case "target": return Converters.target(value);
				case "senses": return Converters.senses(value);
				case "movement": return Converters.movement(value);
				case "sightRange": return Converters.footsToMeters(value);
				case "rangeActivities": return Converters.rangeActivities(value);
				case "distanceAdvancement": return Converters.distanceAdvancement(value);
				default:
					console.warn(`Type: '${type}' not implemented !`);
					break;
			}
		};
	}

	static conversionInfo = {
		"ft": {
			converter: Converters.footsToMeters,
			units: "m"
		},
		"mi": {
			converter: Converters.milesToMeters,
			units: "km"
		}
	};

	static range(range) {
		const conversion = Converters.conversionInfo[range.units];
		if (conversion) {
			return foundry.utils.mergeObject(range, {
				"value": conversion.converter(range.value),
				"long": conversion.converter(range.long),
				"reach": conversion.converter(range.reach),
				"units": conversion.units
			});
		}

		return range;
	}

	static weight(weight) {
		if (weight.units === "kg") return weight;

		return foundry.utils.mergeObject(weight, {
			"value": Converters.lbToKg(weight.value),
			"units": "kg"
		});
	}

	static target(target) {
		const conversion = Converters.conversionInfo[target.template.units];
		if (conversion) {
			return foundry.utils.mergeObject(target, {
				template: {
					"size": conversion.converter(target.template.size),
					"height": conversion.converter(target.template.height),
					"width": conversion.converter(target.template.width),
					"units": conversion.units
				},
				affects: {
					"count": conversion.converter(target.affects.count)
				}
			});
		}

		return target;
	}

	static senses(senses) {
		const conversion = Converters.conversionInfo[senses.units ?? "ft"];
		return foundry.utils.mergeObject(senses, {
			"darkvision": conversion.converter(senses.darkvision),
			"blindsight": conversion.converter(senses.blindsight),
			"tremorsense": conversion.converter(senses.tremorsense),
			"truesight": conversion.converter(senses.truesight),
			"units": conversion.units
		});
	}

	static movement(movement) {
		const conversion = Converters.conversionInfo[movement.units ?? "ft"];
		return foundry.utils.mergeObject(movement, {
			"burrow": conversion.converter(movement.burrow),
			"climb": conversion.converter(movement.climb),
			"swim": conversion.converter(movement.swim),
			"walk": conversion.converter(movement.walk),
			"fly": conversion.converter(movement.fly),
			"units": conversion.units
		});
	}

	static rangeActivities(activities) {
		Object.keys(activities).forEach(key => {
			Converters.range(activities[key].range);

			const conversion = Converters.conversionInfo[activities[key].target?.template?.units];
			if (conversion) {
				foundry.utils.mergeObject(activities[key].target.template, {
					"size": conversion.converter(activities[key].target.template.size),
					"units": conversion.units
				});
			}
		});

		return activities;
	}

	static distanceAdvancement(advancements) {
		advancements.forEach(adv => {
			if (adv.type === "ScaleValue" && adv.configuration.type === "distance") {
				const conversion = Converters.conversionInfo[adv.configuration.distance.units];
				if (conversion) {
					foundry.utils.mergeObject(adv.configuration.distance, { "units": conversion.units });

					Object.keys(adv.configuration.scale).forEach(key => {
						foundry.utils.mergeObject(adv.configuration.scale[key], {
							"value": conversion.converter(adv.configuration.scale[key].value)
						});
					});
				}
			}
		});
	}

	static footsToMeters(ft) {
		if (!ft) return ft;

		return Converters.round(parseInt(ft) * 0.3);
	}

	static milesToMeters(mi) {
		if (!mi) return mi;

		return Converters.round(parseInt(mi) * 1.5);
	}

	static round(num) {
		return Math.round((num + Number.EPSILON) * 100) / 100;
	}

	static lbToKg(lb) {
		if (!lb) return lb;

		return parseInt(lb) / 2;
	}

	// Override babele pages converters
	static pages() {
		return (pages, translations) => Converters._pages(pages, translations);
	}

	static _pages(pages, translations) {
		return pages.map(data => {
			if (!translations) {
				return data;
			}

			const translation = translations[data._id] || translations[data.name];
			if (!translation) {
				console.warn(`Missing translation : ${data._id} ${data.name}`);
				return data;
			}

			return foundry.utils.mergeObject(data, {
				name: translation.name ?? data.name,
				image: { caption: translation.caption ?? data.image.caption },
				src: translation.src ?? data.src,
				text: { content: translation.text ?? data.text.content },
				video: {
					width: translation.width ?? data.video.width,
					height: translation.height ?? data.video.height,
				},
				system: {
					tooltip: translation.tooltip ?? data.system.tooltip,
					subclassHeader: translation.subclassHeader ?? data.system.subclassHeader,
					unlinkedSpells: data.system.unlinkedSpells ? Converters.unlinkedSpells(data.system.unlinkedSpells, translation.unlinkedSpells) : data.system.unlinkedSpells,
					description: {
						value: translation.description ?? data.system.description?.value,
						additionalEquipment: translation.additionalEquipment ?? data.system.description?.additionalEquipment,
						additionalHitPoints: translation.additionalHitPoints ?? data.system.description?.additionalHitPoints,
						additionalTraits: translation.additionalTraits ?? data.system.description?.additionalTraits,
						subclass: translation.subclass ?? data.system.description?.subclass
					}
				},
				flags: { dnd5e: { title: translation.flagsTitle ?? data.flags.dnd5e?.title } },
				translated: true,
			});
		});
	}

	static unlinkedSpells(unlinkedSpells, translations) {
		if (!translations) return unlinkedSpells;

		if (Array.isArray(unlinkedSpells)) {
			return unlinkedSpells.map(spell => {
				const translation = translations[spell.name];
				if (translation) {
					return foundry.utils.mergeObject(spell, { name: translation.name ?? spell.name });
				}
				return profile;
			});
		}

		return unlinkedSpells;
	}

	static source() {
		return (source) => Converters._source(source);
	}

	static _source(source) {
		return foundry.utils.mergeObject(source, {
			book: sources[source.book],
			custom: sources[source.custom]
		});
	}

	static items() {
		return (data, translations) => Converters._items(data, translations);
	}

	static itemsMonster() {
		return (data, translations) => Converters._items(data, translations, true);
	}

	static _items(data, translations, fromMonster = false) {
		if (!translations) {
            return data;
        }

		if (!Array.isArray(data)) {
			return data;
		}
		data.forEach(item => {
			switch(item.type){
				case "loot":
					Converters.translateFromConverters(item, translations, "dnd5e.tradegoods");
					break;
				case "consumable":
				case "container":
				case "weapon":
				case "equipment":
					Converters.translateFromConverters(item, translations, "dnd5e.items");
					break;
				case "spell":
					Converters.translateFromConverters(item, translations, "dnd5e.spells");
					break;
				case "feat":
					fromMonster ? Converters.translateFromConverters(item, translations, "dnd5e.monsterfeatures") : Converters.translateFromConverters(item, translations, "dnd5e.classfeatures");
					break;
				case "race":
					Converters.translateFromConverters(item, translations, "dnd5e.races");
					break;
				case "class":
					Converters.translateFromConverters(item, translations, "dnd5e.classes");
					break;
				case "subclass":
					Converters.translateFromConverters(item, translations, "dnd5e.subclasses");
					break;
				case "background":
					Converters.translateFromConverters(item, translations, "dnd5e.backgrounds");
					break;
				default:
					console.warn(`Can't find translation for ${item.type}`);
					console.log(`${item.type}`);
					break;
			}

			const translation = translations[item._id] || translations[item.name];
			if (!translation) {
				console.warn(`Missing translation : ${item._id} ${item.name}`);
				return item;
			}

			return foundry.utils.mergeObject(item, {
				name: translation.name ?? item.name,
				system: {
				    description: { 
						value: translation.description ?? item.system.description.value,
						chat: translation.chat ?? item.system.description.chat
					},
					materials: { value: translation.materials ?? item.system.materials?.value },
					activities: item.system.activities ? Converters._activities(item.system.activities, translation.activities) : item.system.activities
				},
				effects: item.effects.length > 0 ? Converters._effects(item.effects, translation.effects) : item.effects,
				translated: true
			});
		});

		return data;
	}

	static translateFromConverters(item, translations, packName) {
		const itemsConverter = game.babele.translations.find((item) => item.collection === packName)?.mapping;		
		if (!itemsConverter) {
			return;
		}
		
		const fields = Object.keys(itemsConverter).map(key => new FieldMapping(key, itemsConverter[key], item));
		if (!fields){
			return;
		}

		fields.forEach(field => {
			field.translate(item, translations);
		});
	}

	static effects() {
		return (data, translations) => Converters._effects(data, translations);
	}

	static _effects(data, translations) {
		if (!translations) {
			return data;
		}
		if (typeof data !== 'object') {
			return translations;
		}

		if (Array.isArray(data)) {
			return data.map(effect => {
				const translation = translations[effect._id] || translations[effect.name];
				if (translation) {
					return foundry.utils.mergeObject(effect, {
						name: translation.name ?? effect.name,
						description: translation.description ?? effect.description,
						changes: effect.changes ? Converters.effectsChanges(effect.changes, translation.changes) : effect.changes
					});
				}
				return effect;
			});
		}

		return data;
	}

	static effectsChanges(changes, translations) {
		const movementSensesType = [
			"system.attributes.movement.burrow",
			"system.attributes.movement.climb",
			"system.attributes.movement.fly",
			"system.attributes.movement.swim",
			"system.attributes.movement.walk",
			"system.attributes.senses.blindsight",
			"system.attributes.senses.darkvision",
			"system.attributes.senses.tremorsense",
			"system.attributes.senses.truesight"
		];

		changes.forEach(change => {
			if (change.mode != 1 && movementSensesType.includes(change.key)) {
				change.value = Converters.footsToMeters(change.value);
			}
			return change;
		});

		if (!translations) return changes;

		if (Array.isArray(changes)) {
			return changes.map(change => {
				const translation = translations[change.key];
				if (translation) {
					return foundry.utils.mergeObject(change, { value: translation ?? change.value });
				}
				return change;
			});
		}

		return changes;
	}

	static activities() {
		return (activities, translations) => Converters._activities(activities, translations);
	}

	static _activities(activities, translations) {
		if (!translations) return activities;

		Object.keys(activities).forEach(key => {
			const activity = activities[key];
			const translationKey = activity.name?.length ? activity.name : activity.type;
			const translation = translations[activity._id] || translations[translationKey];
			if (translation) {
				foundry.utils.mergeObject(activity, {
					name: translation.name ?? activity.name,
					activation: { condition: translation.condition ?? activity.activation?.condition },
					description: { chatFlavor: translation.chatFlavor ?? activity.description?.chatFlavor },
					profiles: activity.profiles ? Converters.summonProfiles(activity.profiles, translation.profiles) : activity.profiles
				});
			}
		});

		return activities;
	}

	static summonProfiles(profiles, translations) {
		if (!translations) return profiles;

		if (Array.isArray(profiles)) {
			return profiles.map(profile => {
				const translation = translations[profile.name];
				if (translation) {
					return foundry.utils.mergeObject(profile, { name: translation.name ?? profile.name });
				}
				return profile;
			});
		}

		return profiles;
	}

	static advancement() {
		return (advancements, translations) => Converters._advancement(advancements, translations);
	}

	static _advancement(advancements, translations) {
		if (!translations) return advancements;

		return advancements.map(adv => {
			const translation = translations[adv._id] || translations[adv.title];
			if (translation) {
				return foundry.utils.mergeObject(adv, {
					title: translation.title ?? adv.title,
					hint: translation.hint ?? adv.hint
				});
			}
			return adv;
		});
	}
}

export var sources = {
	"SRD 5.1": "DRS 5.1"
};