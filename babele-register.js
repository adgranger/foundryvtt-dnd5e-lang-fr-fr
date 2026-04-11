import { Converters as babeleConverters } from "../babele/script/converters.js";
import { registerCustomEnrichersFr } from "./enrichers-fr.mjs";
import NPCDataFr from "./npc-embedded-fr.mjs";

Hooks.once('init', () => {

	if (typeof Babele !== 'undefined') {

		game.babele.register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium_fr'
		});

		game.babele.registerConverters({
			"items": babeleConverters.fromDefaultMapping("Item", "items"),
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
			"rangeActivities": Converters.imperialToMetric("rangeActivities"),
			"distanceAdvancement": Converters.imperialToMetric("distanceAdvancement"),
			"pages": Converters.pages(),
			"tokens": Converters.tokens(),
			"effects": Converters.effects(),
			"alignment": Converters.alignment(),
			"activities": Converters.activities(),
			"advancement": Converters.advancement(),
			"planarSubtype": Converters.planarSubtype()
		});
	}
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
		return (value) => {
			switch (type) {
				case "grid": return Converters.grid(value);
				case "range": return Converters.range(value);
				case "weight": return Converters.weight(value);
				case "target": return Converters.target(value);
				case "senses": return Converters.senses(value);
				case "volume": return Converters.volume(value);
				case "travel": return Converters.travel(value);
				case "movement": return Converters.movement(value);
				case "tokenLight": return Converters.tokenLight(value);
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
		const conversion = Converters.conversionInfo[target.template?.units];
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

	static rangeActivities(activities) {
		Object.keys(activities).forEach(key => {
			if (activities[key].range) Converters.range(activities[key].range);
			if (activities[key].target) Converters.target(activities[key].target);
		});

		return activities;
	}

	static distanceAdvancement(advancements) {
		Object.keys(advancements).forEach(key => {
			const adv = advancements[key];
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

		return advancements;
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

	// Override babele pages converters
	static pages() {
		return (pages, translations, data) => Converters._pages(pages, translations, data);
	}

	static _pages(pages, translations, data) {
		pages.map(data => {
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

		return Converters.sortPages(pages, journalPagesToSort[data._id]);
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

	static sortPages(pages, journal) {
		if (!journal) return pages;

		const normalizeName = name =>
			name
				.toLowerCase()
				.replace(/^(l')/i, "")
				.replace(/^(la|les|le|une|un|des)\s+/i, "")
				.replace(/\b(d'|de la|de l'|des|de|du)\b\s*/gi, "")
				.trim();

		if (journal.length || Object.keys(journal).length) {
			if (Array.isArray(journal)) {
				const sortedPages = journal.map(id => pages.find(p => p._id === id)).filter(Boolean);
				const remainingPages = pages.filter(p => !journal.includes(p._id));
				pages = [...sortedPages, ...remainingPages];
			} else {
				const firstPagesIds = Array.isArray(journal.firstPages) ? journal.firstPages : [];
				const firstPages = firstPagesIds.map(id => pages.find(p => p._id === id)).filter(Boolean);

				if (journal.conserveOriginalSort) {
					pages.sort((a, b) => a.sort - b.sort);
				} else {
					pages = pages
						.filter(p => !firstPagesIds.includes(p._id))
						.sort((a, b) => {
							const nameA = journal.includeArticle ? a.name : normalizeName(a.name);
							const nameB = journal.includeArticle ? b.name : normalizeName(b.name);
							return nameA.localeCompare(nameB);
						});;
				}

				let otherPages = [];
				if (journal.pagesGroups?.length) {
					let workingPages = [...pages];
					for (const group of journal.pagesGroups) {
						const parentIndex = workingPages.findIndex(p => p._id === group.parent);
						if (parentIndex === -1 || !group.associatePages?.length) continue;

						let groupIds = [...group.associatePages];

						if (group.isRange && group.associatePages.length === 2) {
							const [startId, endId] = group.associatePages;
							const startIndex = workingPages.findIndex(p => p._id === startId);
							const endIndex = workingPages.findIndex(p => p._id === endId);
							if (startIndex !== -1 && endIndex !== -1) {
								const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
								groupIds = workingPages.slice(from, to + 1).map(p => p._id);
							}
						}

						const before = workingPages
							.slice(0, parentIndex + 1)
							.filter(p => !firstPagesIds.includes(p._id) && !groupIds.includes(p._id));

						const sortedGroup = groupIds.map(id => workingPages.find(p => p._id === id)).filter(Boolean);

						if (group.isRange) {
							sortedGroup.sort((a, b) => {
								const nameA = group.includeArticle ? a.name : normalizeName(a.name);
								const nameB = group.includeArticle ? b.name : normalizeName(b.name);
								return nameA.localeCompare(nameB);
							});
						}

						const after = workingPages
							.slice(parentIndex + 1)
							.filter(p => !firstPagesIds.includes(p._id) && !groupIds.includes(p._id));

						workingPages = [...before, ...sortedGroup, ...after];
					}
					otherPages = workingPages;
				} else {
					otherPages = pages;
				}

				pages = [...firstPages, ...otherPages];
			}
		} else {
			pages.sort((a, b) => normalizeName(a.name).localeCompare(normalizeName(b.name)));
		}

		return pages.forEach((page, index) => page.sort = (index + 1) * 1000);
	}

	static tokens() {
        return (tokens, translations, data, tc) => Converters._tokens(tokens, translations, data, tc);
    }

    static _tokens(tokens, translations, data, tc) {
        tokens.map(token => {
            return foundry.utils.mergeObject(token, {
                light: Converters.tokenLight(token.light),
                sight: { range: Converters.footsToMeters(token.sight.range) }
            });
        });

        if (!translations) return tokens;

        return tokens.map(token => {
            const translation = translations[token._id] || translations[token.name];
            if (!translation) return token;

            const delta = token.delta;
            const actorConverter = babeleConverters.fromDefaultMapping("Actor", "actors");
            const deltaTranslated = delta ? actorConverter([delta], { [delta._id]: translation }, data, tc)[0] : delta;
            if (!deltaTranslated.name) deltaTranslated.name = translation.name ?? delta.name;
            return foundry.utils.mergeObject(token, {
                name: translation.name ?? token.name,
                delta: deltaTranslated
            });
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
			"system.attributes.senses.ranges.blindsight",
			"system.attributes.senses.ranges.darkvision",
			"system.attributes.senses.ranges.tremorsense",
			"system.attributes.senses.ranges.truesight",
			"system.attributes.senses.blindsight", //Avant 5.3.0, à supprimer plus tard
			"system.attributes.senses.darkvision", //Avant 5.3.0, à supprimer plus tard
			"system.attributes.senses.tremorsense", //Avant 5.3.0, à supprimer plus tard
			"system.attributes.senses.truesight" //Avant 5.3.0, à supprimer plus tard
		];

		changes.forEach(change => {
			if (change.mode != 1) {
				const value = String(change.value ?? "");
				if (movementSensesType.includes(change.key)) {
					if (value.startsWith("+") || value.startsWith("-")) {
						change.value = `${value[0]}${Converters.footsToMeters(value.substring(1))}`;
					} else {
						change.value = Converters.footsToMeters(value);
					}
				}
				if (["system.range.value", "system.range.long"].includes(change.key)) {
					if (parseInt(value)) {
						change.value = Converters.footsToMeters(value);
					} else {
						const match = value.match(/^(.+?)\s*(\d+)(?:\s+(.*))?$/);
						if (match) {
							let [_, begin, numberStr, end] = match;
							begin ??= "";
							const convertedNumber = Converters.footsToMeters(numberStr);
							end ??= "";
							change.value = `${begin} ${convertedNumber} ${end}`;
						}
					}
				}
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

		Object.keys(advancements).forEach(key => {
			const adv = advancements[key];
			const translation = translations[adv._id] || translations[adv.title];
			if (translation) {
				foundry.utils.mergeObject(adv, {
					title: translation.title ?? adv.title,
					hint: translation.hint ?? adv.hint,
					configuration: {
						identifier: adv.configuration.identifier?.length > 0 ? adv.configuration.identifier : adv.title?.slugify()
					}
				});
			}
		});

		return advancements;
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

export var journalPagesToSort = {
	//SRD 5.1
	//Chapter 3: Classes
	"gqecphEUnz4ktrQ9": {
		firstPages: ["8jxEuy0PV2HNySQC"]
	},
	//Chapter 10: Spellcasting
	"QvPDSUsAiEn3hD8s": {
		firstPages: ["FX9TS9vmt4dyOoqJ", "evx9TWix4wYU51a5", "wre9ECSVuEyJBYhr"]
	},
	//Appendix A: Conditions
	"w7eitkpD7QQTB6j0": {
		firstPages: ["ZOCWbO9IYvBf9WyR"]
	},
	//Appendix D: Senses and Speeds
	"eVtpEGXjA2tamEIJ": [
		"8AIlZ95v54mL531X", "I6ABWHBYwGl55dLY", "0RBamBThjzeAdMSt", "8iC24otVX4n1yrYw",
		"eW0LypO5xZZdq4I9", "I13SYX1zaCLYmaYF", "EQWAcrLYsd96MzJH", "X2CTP455Zpr7Shs9"
	],
	//SRD 5.2
	//Character Species
	"phbSpeciesDescri": {
		firstPages: ["7iLsgz6RUQJVpUsH"]
	},
	//Spells
	"phbSpells0000000": {
		conserveOriginalSort: true,
		pagesGroups: [
			{
				parent: "yspaGdvukcwiodvl",
				isRange: true,
				associatePages: ["wwia6Wwo4BgE9GSI", "6AnqLUowgdsqMFvz"]
			}
		]
	},
	//Rules Glossary
	"phbAppendixCRule": {
		firstPages: ["FvDonO0qOQWp1RIw"],
		pagesGroups: [
			{
				parent: "SsIXfzS2ZttwAaKj",
				associatePages: [
					"f4fZHwBvpbpzRyn4", "w1AGsemFERfjqWNx", "3YJIuyCMmuUrfmuX", "Nuz0Wx4a4aAPcC34",
					"rqhOsUY4wWa1oHTy", "4V59Q1dlWjNhpJGo", "nI9tN6Oq7fCV7hcA", "iIIDUsmSOkL0xNzF",
					"ySj4gYZ4ADZoia7R", "6l6nBKip4LqB1sCU", "5S8i59qskkd9GGcJ", "UDlogfdiT2uYEZz4"
				]
			},
			{
				parent: "ahMxQJTGDhq08GWQ",
				associatePages: [
					"RVcWSqblHIs7SUzn", "BNxLbtJofbNGzjsp", "eYX5eimGuYhHPoj4"
				]
			},
			{
				parent: "5hyEitPd1Kb27fP5",
				associatePages: [
					"gAvV8TLyS8UGq00x", "lCwPWK4ODxw2IV1x", "FZFvLNOX0lHaHZ1k", "mPBGM1vguT5IPzxT", "earBo4vQPC1ti4g7"
				]
			},
			{
				parent: "UIKLZmiLuENHk1wn",
				associatePages: [
					"QxCrRcgMdUd3gfzz", "KbQ1k0OIowtZeQgp", "qlRw66tJhk0zLnwq", "uDogReMO6QtH6NDw", "vLAsIUa0FhZNsyLk",
					"93uaingTESo8N1qL", "HWs8kEojffqwTSJz", "dqLeGdpHtb8FfcxX", "jSQtPgNm0i4f3Qi3", "EjbXjvyQAMlDyANI",
					"fZCRaKEJd4KoQCqH", "MQIZ1zRLWRcNOtPN", "4i3G895hy99piand", "RnxZoTglPnLc6UPb", "6vtLuQT9lwZ9N299"
				]
			},
			{
				parent: "On6Sg3vUokAkXBB5",
				associatePages: [
					"JwK8XOkGSX9xE5Dc", "p5qUBMQO7shfNeCD", "i3ijpxEn5LuSO7C0",
					"eSsITWhcNMkoa9WP", "T1ln1l6uKkkMuieP", "LgpZdAOhTnSHGCNa"
				]
			}
		]
	},
	//Monsters A to Z
	"mmMonstersAtoZ00": {},
	//Animals
	"mmAppendixAAnima": {}
};