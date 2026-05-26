import { registerCustomEnrichersFr } from "./enrichers-fr.mjs";
import NPCDataFr from "./npc-embedded-fr.mjs";

Hooks.once("babele.init", (babele) => {
	babele.register({
		module: "dnd5e_fr-FR",
		lang: "fr",
		dir: "compendium_fr"
	});

	babele.registerConverters({
		"grid": Converters.imperialToMetric("grid"),
		"range": Converters.imperialToMetric("range"),
		"weight": Converters.imperialToMetric("weight"),
		"target": Converters.imperialToMetric("target"),
		"senses": Converters.imperialToMetric("senses"),
		"volume": Converters.imperialToMetric("volume"),
		"travel": Converters.imperialToMetric("travel"),
		"movement": Converters.imperialToMetric("movement"),
		"tokenLight": Converters.imperialToMetric("tokenLight"),
		"sightRange": Converters.imperialToMetric("sightRange"),
		"communication": Converters.imperialToMetric("communication"),
		"advancementIdentifier": Converters.advancementIdentifier(),
		"advancementDistance": Converters.advancementDistance(),
		"advancementScaleDistance": Converters.advancementScaleDistance(),
		"effectDistanceChange": Converters.effectDistanceChange(),
		"effectRangeChange": Converters.effectRangeChange(),
		"alignment": Converters.alignment(),
		"planarSubtype": Converters.planarSubtype()
	});
});

Hooks.once('ready', () => {
	registerCustomEnrichersFr();
	CONFIG.Actor.dataModels.npc = NPCDataFr;
});

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
		const converter = (value, translation) => {
			switch (type) {
				case "grid": return Converters.grid(value);
				case "range": return Converters.range(value, translation);
				case "weight": return Converters.weight(value);
				case "target": return Converters.target(value, translation);
				case "senses": return Converters.senses(value);
				case "volume": return Converters.volume(value);
				case "travel": return Converters.travel(value);
				case "movement": return Converters.movement(value);
				case "tokenLight": return Converters.tokenLight(value);
				case "sightRange": return Converters.footsToMeters(value);
				case "communication": return Converters.communication(value);
				default:
					console.warn(`Type: '${type}' not implemented !`);
					break;
			}
		};

		converter.extract = (value, _source, _tc, context = {}) => {
			if (type === "range" && context.path === "range") return value?.special;
			if (type === "target" && context.path === "target") return value?.affects?.special;
			return undefined;
		};

		return converter;
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
			},
			"mph": {
				converter: Converters.milesToMeters,
				units: convertMetricLength() ? "kph" : "mph"
			}
		};
	}

	static grid(grid) {
		const conversion = Converters.conversionInfo[grid.units];
		if (!conversion) return grid;
		return foundry.utils.mergeObject(grid, {
			"distance": conversion.converter(grid.distance),
			"units": conversion.units
		});
	}

	static range(range, translation) {
		const converted = {};
		const conversion = Converters.conversionInfo[range.units];
		if (convertMetricLength() && conversion) {
			foundry.utils.mergeObject(converted, {
				"value": conversion.converter(range.value),
				"long": conversion.converter(range.long),
				"reach": conversion.converter(range.reach),
				"units": conversion.units
			});
		}

		Converters.applyScalarOrObjectTranslation(converted, "special", translation);
		return Object.keys(converted).length ? converted : undefined;
	}

	static weight(weight) {
		return foundry.utils.mergeObject(weight, {
			"value": Converters.lbToKg(weight.value),
			"units": convertMetricWeight() ? "kg" : weight.units
		});
	}

	static target(target, translation) {
		const converted = {};
		const conversion = Converters.conversionInfo[target.template?.units];
		if (convertMetricLength() && conversion) {
			foundry.utils.mergeObject(converted, {
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

		Converters.applyScalarOrObjectTranslation(converted, "affects.special", translation);
		return Object.keys(converted).length ? converted : undefined;
	}

	static senses(senses) {
		const conversion = Converters.conversionInfo[senses.units ?? "ft"];
		if (!conversion) return senses;
		return foundry.utils.mergeObject(senses, {
			"ranges": {
				"darkvision": conversion.converter(senses.ranges.darkvision),
				"blindsight": conversion.converter(senses.ranges.blindsight),
				"tremorsense": conversion.converter(senses.ranges.tremorsense),
				"truesight": conversion.converter(senses.ranges.truesight),
			},
			"units": conversion.units
		});
	}

	static volume(volume) {
		return foundry.utils.mergeObject(volume, {
			"value": Converters.pcToL(volume.value),
			"units": convertMetricVolume() ? "liter" : volume.units
		});
	}

	static travel(travel) {
		const conversion = Converters.conversionInfo[travel.units];
		if (!conversion) return travel;
		return foundry.utils.mergeObject(travel, {
			"paces": {
				"air": conversion.converter(travel.paces?.air),
				"land": conversion.converter(travel.paces?.land),
				"water": conversion.converter(travel.paces?.water)
			},
			"speeds": {
				"air": conversion.converter(travel.speeds?.air),
				"land": conversion.converter(travel.speeds?.land),
				"water": conversion.converter(travel.speeds?.water)
			},
			"units": conversion.units
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

	static applyScalarOrObjectTranslation(target, fallbackPath, translation) {
		if (typeof translation === "undefined" || translation === null) return;
		if (Converters.isPlainObject(translation)) {
			foundry.utils.mergeObject(target, translation);
			return;
		}
		foundry.utils.setProperty(target, fallbackPath, translation);
	}

	static isPlainObject(value) {
		return !!value && typeof value === "object" && !Array.isArray(value);
	}

	static advancementIdentifier() {
		return (identifier, _translation, advancement) => {
			if (identifier?.length > 0) return identifier;
			return advancement?.title?.slugify();
		};
	}

	static advancementDistance() {
		return (distance, _translation, advancement) => {
			if (!convertMetricLength()) return undefined;
			if (advancement?.type !== "ScaleValue" || advancement?.configuration?.type !== "distance") return undefined;

			const conversion = Converters.conversionInfo[distance.units || "ft"];
			return conversion ? { "units": conversion.units } : undefined;
		};
	}

	static advancementScaleDistance() {
		return (scale, _translation, advancement) => {
			if (!convertMetricLength()) return undefined;
			if (advancement?.type !== "ScaleValue" || advancement?.configuration?.type !== "distance") return undefined;

			const conversion = Converters.conversionInfo[advancement.configuration.distance?.units || "ft"];
			if (!conversion) return undefined;

			return Object.entries(scale).reduce((converted, [key, value]) => {
				converted[key] = { "value": conversion.converter(value.value) };
				return converted;
			}, {});
		};
	}

	static tokenLight(light) {
		return foundry.utils.mergeObject(light, {
			"bright": Converters.footsToMeters(light.bright),
			"dim": Converters.footsToMeters(light.dim)
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

	static effectDistanceChange() {
		return (value, translation, change) => {
			if (change?.mode == 1) return translation;

			const translated = String(translation ?? "");
			if (translated.startsWith("+") || translated.startsWith("-")) {
				return `${translated[0]}${Converters.footsToMeters(translated.substring(1))}`;
			}

			return Converters.footsToMeters(translated);
		};
	}

	static effectRangeChange() {
		return (value, translation, change) => {
			if (change?.mode == 1) return translation;

			const translated = String(translation ?? "");
			if (parseInt(translated)) {
				return Converters.footsToMeters(translated);
			}

			const match = translated.match(/^(.+?)\s*(\d+)(?:\s+(.*))?$/);
			if (!match) return translation;

			let [_, begin, numberStr, end] = match;
			begin ??= "";
			end ??= "";
			const convertedNumber = Converters.footsToMeters(numberStr);
			return `${begin} ${convertedNumber} ${end}`;
		};
	}

	static alignment() {
		return (alignment, translation, data) => Converters._alignment(alignment, translation, data);
	}

	static _alignment(alignment, translation, data) {
		if (translation) return translation;

		const alignments = {
			good: { f: "Bonne", m: "Bon" },
			evil: { f: "Mauvaise", m: "Mauvais" },
			neutral: { f: "Neutre", m: "Neutre" },
			lawful: { f: "Loyale", m: "Loyal" },
			chaotic: { f: "Chaotique", m: "Chaotique" },
			unaligned: { f: "non alignée", m: "non aligné" }
		};

		const monsterTypes = {
			aberration: "f", beast: "f", celestial: "m", construct: "m",
			dragon: "m", elemental: "m", fey: "f", fiend: "m",
			giant: "m", humanoid: "m", monstrosity: "f", ooze: "f",
			plant: "f", undead: "m"
		};

		const type = data?.system?.details?.type?.value?.toLowerCase();
		const gender = monsterTypes[type] ?? "m";

		if (!alignment || typeof alignment !== "string") return alignment;

		const translated = alignment
			.split(" ")
			.map(part => {
				const key = part.toLowerCase();
				if (key === "typically") return "généralement";
				const entry = alignments[key];
				return entry?.[gender] ?? null;
			})
			.filter(Boolean)
			.join(" ");

		return translated || alignment;
	}

	static planarSubtype() {
		return (habitat, translation) => Converters._planarSubtype(habitat, translation);
	}

	static _planarSubtype(habitat, translation) {
		if (!translation) return habitat;
		return habitat.map(hab => {
			if (hab.subtype) return foundry.utils.mergeObject(hab, { subtype: translation ?? hab.subtype });
			return hab;
		});
	}
}
