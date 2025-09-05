import { Converters as babeleConverters } from "../babele/script/converters.js";

Hooks.once('init', () => {

	if (typeof Babele !== 'undefined') {

		game.babele.register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium_fr'
		});

		game.babele.registerConverters({
			"items": babeleConverters.fromDefaultMapping("Item", "items"),
			"range": Converters.imperialToMetric("range"),
			"weight": Converters.imperialToMetric("weight"),
			"target": Converters.imperialToMetric("target"),
			"senses": Converters.imperialToMetric("senses"),
			"volume": Converters.imperialToMetric("volume"),
			"movement": Converters.imperialToMetric("movement"),
			"sightRange": Converters.imperialToMetric("sightRange"),
			"communication": Converters.imperialToMetric("communication"),
			"rangeActivities": Converters.imperialToMetric("rangeActivities"),
			"distanceAdvancement": Converters.imperialToMetric("distanceAdvancement"),
			"pages": Converters.pages(),
			"effects": Converters.effects(),
			"activities": Converters.activities(),
			"advancement": Converters.advancement()
		});
	}
});

Hooks.once('ready', () => {
	fixExhaustion();
});

function fixExhaustion() {
	// Fix system bug (2024 rules)
	if (convertMetricLength()) {
		CONFIG.DND5E.conditionTypes.exhaustion.reduction = foundry.utils.mergeObject(
			CONFIG.DND5E.conditionTypes.exhaustion.reduction, { speed: 1.5 }
		);
	}
}

function convertMetricLength() {
	return game.settings.get("dnd5e", "metricLengthUnits");
}

function convertMetricWeight() {
	return game.settings.get("dnd5e", "metricWeightUnits");
}

function convertMetricVolume() {
	return game.settings.get("dnd5e", "metricVolumeUnits");
}

/**
 * Utility class with all predefined converters
 */

export class Converters {

	static imperialToMetric(type) {
		return (value) => {
			switch (type) {
				case "range": return Converters.range(value);
				case "weight": return Converters.weight(value);
				case "target": return Converters.target(value);
				case "senses": return Converters.senses(value);
				case "volume": return Converters.volume(value);
				case "movement": return Converters.movement(value);
				case "sightRange": return Converters.footsToMeters(value);
				case "communication": return Converters.communication(value);
				case "rangeActivities": return Converters.rangeActivities(value);
				case "distanceAdvancement": return Converters.distanceAdvancement(value);
				default:
					console.warn(`Type: '${type}' not implemented !`);
					break;
			}
		};
	}

	static get conversionInfo() {
		return {
			"ft": {
				converter: Converters.footsToMeters,
				units: convertMetricLength() ? "m" : "ft"
			},
			"mi": {
				converter: Converters.milesToMeters,
				units: convertMetricLength() ? "km" : "mi"
			}
		};
	}

	static range(range) {
		const conversion = Converters.conversionInfo[range.units];
		if (!conversion) return range;
		return foundry.utils.mergeObject(range, {
			"value": conversion.converter(range.value),
			"long": conversion.converter(range.long),
			"reach": conversion.converter(range.reach),
			"units": conversion.units
		});
	}

	static weight(weight) {
		return foundry.utils.mergeObject(weight, {
			"value": Converters.lbToKg(weight.value),
			"units": convertMetricWeight() ? "kg" : weight.units
		});
	}

	static target(target) {
		const conversion = Converters.conversionInfo[target.template.units];
		if (!conversion) return target;
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

	static senses(senses) {
		const conversion = Converters.conversionInfo[senses.units ?? "ft"];
		if (!conversion) return senses;
		return foundry.utils.mergeObject(senses, {
			"darkvision": conversion.converter(senses.darkvision),
			"blindsight": conversion.converter(senses.blindsight),
			"tremorsense": conversion.converter(senses.tremorsense),
			"truesight": conversion.converter(senses.truesight),
			"units": conversion.units
		});
	}

	static volume(volume) {
		return foundry.utils.mergeObject(volume, {
			"value": Converters.pcToL(volume.value),
			"units": convertMetricVolume() ? "liter" : volume.units
		});
	}

	static movement(movement) {
		const conversion = Converters.conversionInfo[movement.units ?? "ft"];
		if (!conversion) return movement;
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
			if (activities[key].range) Converters.range(activities[key].range);

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
	            const conversion = Converters.conversionInfo[adv.configuration.distance.units || "ft"];
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

	static communication(communication) {
		Object.keys(communication).forEach(key => {
			const conversion = Converters.conversionInfo[communication[key].units];
			if (conversion) {
				foundry.utils.mergeObject(communication[key], {
					"value": conversion.converter(communication[key].value),
					"units": conversion.units
				});
			}
		});
	}

	static footsToMeters(ft) {
		if (!convertMetricLength() || !ft || isNaN(parseInt(ft))) return ft;

		return Converters.round(parseInt(ft) * 0.3);
	}

	static milesToMeters(mi) {
		if (!convertMetricLength() || !mi || isNaN(parseInt(mi))) return mi;

		return Converters.round(parseInt(mi) * 1.5);
	}

	static pcToL(pc) {
		if (!convertMetricVolume() || !pc) return pc;

		return Converters.round(parseInt(pc) * 28.317);
	}

	static round(num) {
		return Math.round((num + Number.EPSILON) * 100) / 100;
	}

	static lbToKg(lb) {
		if (!convertMetricWeight() || !lb) return lb;

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
					duration: { special: translation.duration ?? activity.duration?.special },
					range: { special: translation.range ?? activity.range?.special },
					target: { affects: { special: translation.target ?? activity.target?.affects?.special } },
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
					hint: translation.hint ?? adv.hint,
					configuration: {
						identifier: adv.configuration.identifier?.length > 0 ? adv.configuration.identifier : adv.title?.slugify()
					}
				});
			}
			return adv;
		});
	}
}