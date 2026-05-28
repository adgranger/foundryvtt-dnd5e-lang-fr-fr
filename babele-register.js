import { registerCustomEnrichersFr } from "./enrichers-fr.mjs";
import NPCDataFr from "./npc-embedded-fr.mjs";

Hooks.once("babele.init", (babele) => {

	babele.register({
		module: "dnd5e_fr-FR",
		lang: "fr",
		dir: "compendium_fr"
	});

	babele.registerConverters({
		"tokens": Converters.tokens(),
		"alignment": Converters.alignment(),
		"planarSubtype": Converters.planarSubtype(),
		"effectsChanges": Converters.effectsChanges(),
		"tableResultRange": Converters.tableResultRange(),
		"imperialToMetric": Converters.imperialToMetric()
	});
});

Hooks.once("ready", () => {
	registerCustomEnrichersFr();
	CONFIG.Actor.dataModels.npc = NPCDataFr;
});

Hooks.on("babele.translateDocumentData", (context) => {
    if (context.metadata?.type !== "JournalEntry") return;

    const journalId = context.source?._id;
    if (!journalId || !journalPagesToSort[journalId]) return;
	
    if (!context.translated?.pages) return;

	context.translated.pages = Converters.sortPages(
		context.translated.pages,
		journalPagesToSort[journalId]
	);
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

	static imperialToMetric() {
        return (value, translation, data) => Converters._imperialToMetric(value, translation, data);
    }

	static _imperialToMetric(value, translation, data) {
		const conversion = Converters.conversionInfo[value?.units ?? value?.template?.units ?? "ft"];
		const converted = {};
		if (conversion) {
			if (value?.value) converted.value = conversion.converter(value.value);
			if (value?.long) converted.long = conversion.converter(value.long);
			if (value?.reach) converted.reach = conversion.converter(value.reach);
			if (value?.distance) converted.distance = conversion.converter(value.distance);
			if (value?.burrow) converted.burrow = conversion.converter(value.burrow);
			if (value?.climb) converted.climb = conversion.converter(value.climb);
			if (value?.swim) converted.swim = conversion.converter(value.swim);
			if (value?.walk) converted.walk = conversion.converter(value.walk);
			if (value?.fly) converted.fly = conversion.converter(value.fly);
			if (value?.bright) converted.bright = conversion.converter(value.bright);
			if (value?.dim) converted.dim = conversion.converter(value.dim);
			if (value?.range) converted.range = conversion.converter(value.range);
			if (value?.units) converted.units = conversion.units;
			if (value?.template) {
				converted.template = {
					...Object.fromEntries(
						["size", "height", "width"]
							.map(k => [k, conversion.converter(value.template[k])])
					),
					units: conversion.units
				};
			}
			if (value?.ranges) {
				converted.ranges = Object.fromEntries(
					["darkvision", "blindsight", "tremorsense", "truesight"]
						.map(k => [k, conversion.converter(value.ranges[k])])
				);
			}
			if (value?.paces) {
				converted.paces = Object.fromEntries(
					["air", "land", "water"].map(k => [k, conversion.converter(value.paces[k])])
				);
			}
			if (value?.speeds) {
				converted.speeds = Object.fromEntries(
					["air", "land", "water"].map(k => [k, conversion.converter(value.speeds[k])])
				);
			}
			const detectionModeKeys = new Set(["lightPerception", "basicSight", "seeAll", "feelTremor", "blindsight", "senseInvisibility", "seeInvisibility", "senseAll"]);
			if (Object.keys(value ?? {}).some(k => detectionModeKeys.has(k))) {
				return Object.fromEntries(
					Object.entries(value).map(([k, mode]) => [
						k,
						mode?.range ? { ...mode, range: conversion.converter(mode.range) } : mode
					])
				);
			}
			if (value && typeof value === "object" && !Array.isArray(value) &&
				Object.values(value).every(v => v && typeof v === "object" && "value" in v && Object.keys(v).length === 1)) {
				return Object.fromEntries(
					Object.entries(value).map(([k, entry]) => [
						k, { value: conversion.converter(entry.value) }
					])
				);
			}
		}
		if (value?.affects?.special) converted.affects = { special: translation ?? value.affects.special };
		if (value?.special) converted.special = translation ?? value.special;

		return Object.keys(converted).length ? foundry.utils.mergeObject(value, converted, { inplace: false }) :  value;
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
			},
			"lb": {
				converter: Converters.lbToKg,
				units: convertMetricWeight() ? "kg" : "lb"
			},
			"cubicFoot": {
				converter: Converters.pcToL,
				units: convertMetricVolume() ? "liter" : "cubicFoot"
			}
		};
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

	static lbToKg(lb) {
		if (!convertMetricWeight() || !lb) return lb;
		return parseInt(lb) / 2;
	}

    static round(num) {
		return Math.round((num + Number.EPSILON) * 100) / 100;
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
							return nameA.localeCompare(nameB, undefined, { numeric: true });
						});
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
								const [from, to] = startIndex <= endIndex
									? [startIndex, endIndex]
									: [endIndex, startIndex];
								groupIds = workingPages.slice(from, to + 1).map(p => p._id);
							}
						}

						const before = workingPages
							.slice(0, parentIndex + 1)
							.filter(p => !firstPagesIds.includes(p._id) && !groupIds.includes(p._id));

						const sortedGroup = groupIds
							.map(id => workingPages.find(p => p._id === id))
							.filter(Boolean);

						if (group.isRange) {
							sortedGroup.sort((a, b) => {
								const nameA = group.includeArticle ? a.name : normalizeName(a.name);
								const nameB = group.includeArticle ? b.name : normalizeName(b.name);
								return nameA.localeCompare(nameB, undefined, { numeric: true });
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
			pages.sort((a, b) => normalizeName(a.name).localeCompare(normalizeName(b.name), undefined, { numeric: true }));
		}

		pages.forEach((page, index) => page.sort = (index + 1) * 1000);
		return pages;
	}

	static tokens() {
        return (tokens, translations, data, tc, runtime = {}) => Converters._tokens(tokens, translations, data, tc, runtime);
    }

    static _tokens(tokens, translations, data, tc, runtime = {}) {
        tokens.map(token => {
            return foundry.utils.mergeObject(token, {
                light: Converters._imperialToMetric(token.light),
                sight: Converters._imperialToMetric(token.sight)
            });
        });

        if (!translations) return tokens;

		const documentMappings = 
			runtime?.currentCompendium?.()?.documentMappings
			?? game.babele.documentMappings;
		
		const actorMapping = documentMappings.mappingFor("Actor");

		const fakeCompendium = {
        	documentMappings,
        	translationMatchStrategies: () => []
    	};

		const enrichedRuntime = typeof runtime?.child === "function"
			? runtime.child({ currentCompendium: fakeCompendium })
			: { 
				globalPacks: runtime?.globalPacks ?? new foundry.utils.Collection(),
				localPacks: runtime?.localPacks ?? new foundry.utils.Collection(),
				currentCompendium: fakeCompendium
			};

        return tokens.map(token => {
            const translation = translations[token._id] || translations[token.name];
			if (!translation) return token;

			const delta = token.delta ?? {};
			let deltaTranslated = delta;
			actorMapping.prepare(delta, translation, enrichedRuntime);
			const payload = actorMapping.map(delta, translation, enrichedRuntime);
			deltaTranslated = foundry.utils.mergeObject(
				foundry.utils.deepClone(delta),
				payload,
				{ inplace: false }
			);

            const customTokenName = !!translation.name && !deltaTranslated.name;
            
			return foundry.utils.mergeObject(token, {
                name: translation.name ?? token.name,
                delta: deltaTranslated
            }, { inplace: false });
        });
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
				return alignments[key]?.[gender] ?? null;
			})
			.filter(Boolean)
			.join(" ");

		return translated || alignment;
	}

	static planarSubtype() {
		return (habitat, translation) => {
			if (!translation) return habitat;
			return habitat.map(hab => {
				return hab.subtype ? foundry.utils.mergeObject(hab, { subtype: translation ?? hab.subtype }) : hab;
			});
		};
	}

	static effectsChanges() {
		return (changes, translations) => Converters._effectsChanges(changes, translations);
	}

	static _effectsChanges(changes, translations) {
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
			return changes.map((change, index) => {
				const translation = translations[index];
				if (translation) {
					return foundry.utils.mergeObject(change, { value: translation ?? change.value });
				}
				return change;
			});
		}

		return changes;
	}

	static tableResultRange() {
		return (range, translation, data) => { return tableResultRangeToSort[data._id] ?? range; };
	}
}

export var journalPagesToSort = {
	//SRD 5.1
	//Chapter 3: Classes
	"gqecphEUnz4ktrQ9": { firstPages: ["8jxEuy0PV2HNySQC"] },
	//Chapter 10: Spellcasting
	"QvPDSUsAiEn3hD8s": { firstPages: ["FX9TS9vmt4dyOoqJ", "evx9TWix4wYU51a5", "wre9ECSVuEyJBYhr"] },
	//Appendix A: Conditions
	"w7eitkpD7QQTB6j0": { firstPages: ["ZOCWbO9IYvBf9WyR"] },
	//Appendix D: Senses and Speeds
	"eVtpEGXjA2tamEIJ": [
		"8AIlZ95v54mL531X", "I6ABWHBYwGl55dLY", "0RBamBThjzeAdMSt", "8iC24otVX4n1yrYw",
		"eW0LypO5xZZdq4I9", "I13SYX1zaCLYmaYF", "EQWAcrLYsd96MzJH", "X2CTP455Zpr7Shs9"
	],
	//SRD 5.2
	//Character Species
	"phbSpeciesDescri": { firstPages: ["7iLsgz6RUQJVpUsH"] },
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
				associatePages: ["RVcWSqblHIs7SUzn", "BNxLbtJofbNGzjsp", "eYX5eimGuYhHPoj4"]
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

export var tableResultRangeToSort = {
	//SRD 5.1
	//Armor of Resistance
	"UqDDkk2pPl8ie6uh": [5, 5], "AmEk8tmLabEJFVyu": [2, 2], "QUKt9KwrAYP8Jmt6": [3, 3], "d4BJohZD8FK6BvLz": [4, 4],
	//Feather Token
	"yMjCpwgQ9iUdVbLU": [76, 85], "Vp4nAXa7C7DPlXgl": [86, 100], "X8dN3QxCYSHZ0N4P": [61, 75], "o6r3K6XPZlTu0YS4": [46, 60], "s04A4UK1mru0AasT": [21, 45],
	//Iron Flask
	"26H3dT6zZJqebxPm": [72, 73], "eFk7YbFzQtlnUdBb": [68, 71], "yjQe2JQ48L7h8zQ0": [97, 99], "8TnhHMMB9PtIm9VF": [84, 87],
	"Wg74NTthpFjHxdNj": [88, 88], "qey2iKAlN806bAx7": [89, 92], "4nUbeSIBG6MIVDYs": [93, 93], "cMsHbb6RlFodREik": [94, 96],
	//Necklace of Prayer Beads
	"W7SvVNcfCqLHrvfI": [14, 19], "fTpvVX4tMhYUcPto": [10, 13], "TUi01QTJM62t7HBX": [7, 8], "7O9jSLol4pqANO0w": [9, 9],
	//Potion of Resistance
	"MDRNc2tXzsP8Qylc": [5, 5], "SecPdaSHw67ASGhd": [2, 2], "QsgW6uOtCQcRejJd": [3, 3], "03ho6s1UiX5GD1nq": [4, 4],
	//Reincarnate
	"Ld8L2fxaT85DRMuY": [9, 12], "PpXTfkQwmQRkPQ8d": [80, 88], "UuL705fCv7nOxOtL": [89, 96], "U4HhLYU73mo3Bbfa": [13, 16],
	"u2O2wIWUxrPtGEiI": [51, 59], "U6xuiyOi3gm4tLdf": [17, 24], "wK6rhiPJMjD4h3my": [25, 28], "idg4VgxIGsdOFjzY": [29, 34],
	"XQRdGlTr3dG24ZMP": [1, 4], "XeiU0TAHRvd30aXE": [5, 8], "EvQkNNXDmDgcjUWi": [35, 42], "AP3lIMJ3JdZOhOKX": [43, 50],
	"uDnhR73w2UVWYsRW": [60, 79],
	//Ring of Resistance
	"tBgNOJLPOTZIo5FT": [5, 5], "sqeqHhdqB5PtK9qT": [2, 2], "SGy7SaxIbTR5rfiX": [3, 3], "ngvsB3agtiHUCGtz": [4, 4],
	//SRD 5.2
	//Ammunition of Slaying: Creature Type
	"7gOENkePCrW02UwC": [11, 15], "bBzSzzTMgsRu2p9m": [16, 20], "5IAfN2gE45YNRnH5": [21, 25], "x7mSfJ8AjeVv3NRI": [46, 55],
	"w8UkRFQNaRdjewAd": [56, 65], "NfUynzHOgrEO5mmb": [66, 70], "x3ELDvpdCuJRDeDg": [71, 75], "evZ08L9NQb1evYe9": [81, 90],
	"aL8OS42JpqroJaaW": [91, 95], "4WNFaBpWyeDphNcG": [96, 100],
	//Armor of Resistance Type
	"eJkcua7kOtectwDX": [2, 2], "MQVpjSCnzqIKWNu2": [3, 3], "tJKURr8q9I73BV2y": [4, 4], "MWsbp9Vjx5ZFyydf": [5, 5],
	//Candle of Invocation: Outer Plane Destination
	"5ajkPx3j34og3PQq": [26, 33], "ToqvjVmLEWuqyXV8": [34, 38], "efnExAQ7h5U5JY9c": [39, 46], "pCP4ICaQKzln5zTc": [47, 51],
	"vXez4BUgXFHAayCM": [52, 56], "36NsH0b08cWRJ5S3": [57, 61], "q7ketUvAJCoLBkHc": [62, 69], "dmCLeLfvwj5jLDnN": [70, 77],
	"FNEgnQ7Zo62CbsSo": [78, 82], "5VNozBp2PgScksuZ": [83, 87], "vctndF7xPiru2vGe": [88, 95],
	//Iron Flask Contents
	"XqZtH1EFDI1q7sSR": [52, 53], "xHh95qbfKFKEq01U": [54, 54], "GA2oN1ONYtd2d1oM": [55, 56], "b4NphZw4kd43WgoD": [57, 57],
	"zpHwjd1YJow38mZB": [58, 60], "8OiTu5NP3dChxsCJ": [61, 62], "lrHMKxSlGjCLPuOZ": [63, 64], "kuilN1qOGLjst4Wl": [65, 66],
	"obCOgvqVL9KjwcpP": [67, 68], "NzMZ2MpPTeoIJi2F": [69, 70], "yJ7LJnX0RVRAJO63": [71, 72], "WHHUs8y6pKDZ7uBv": [73, 75],
	"ZOcXFCF42vOPHsbg": [76, 76], "zSaswLLoeZtDpkQv": [77, 78], "kZ8HdRRcmHuMhKkE": [79, 79], "znmeCmvYog5uU6lh": [80, 81],
	"s07bwP0mZ7VjthM5": [82, 83], "qPWo77BQmkdMAG2C": [84, 85], "mk8RnOBZMpdVvsCH": [86, 86], "QORMgdB0pFnRQhBA": [87, 88],
	"uwaotDWieh3D6R5g": [89, 90], "JdQs70UnIA9AiqbE": [91, 91], "ENAbwd5BuTe2MSlN": [92, 92], "VqMOV26INyDc0A6O": [93, 94],
	"FNCHezQEOJoukpBO": [95, 95], "Rg4S4iYh5EZtrE39": [96, 98], "Q2qN5Nx2eUTi61RL": [99, 99], "8FK8zuLGc0tDJm4p": [100, 100],
	//Necklace of Prayer Beads Type
	"rO4l6hUX4STCaLnr": [11, 16], "AYyoSc0yTxndZKvK": [17, 20], "rLL2e4XBcPzZ10so": [7, 8], "EIMC5cl350CzhRLU": [9, 9], "b0h1ljFd14vqLQSO": [10, 10],
	//Potion of Resistance Type
	"3oIOBK8BgRYfKafk": [5, 5], "XKHBRiYlsavqLLeO": [2, 2], "RNYLvvsXg3HisLPS": [3, 3], "yp10YxYVnVXwyUlZ": [4, 4],
	//Reincarnated Species
	"Ym4LPQm1DMZ3iUBH": [8, 8], "9FtTDJCOwnD97SOu": [5, 5], "RI73kNpd5iAababR": [6, 6], "6L3KbE75ugKNdbhg": [7, 7],
	"8g4dm4vqB60zPWw5": [3, 3], "ncs8GLvSuavCJAqf": [4, 4],
	//Ring of Resistance: Damage Type and Gemstone
	"xnFb80dWJtRoNx7k": [5, 5], "e0N3YSm0uveQ1gWw": [2, 2], "97EfeVQ5Nh5wQhtY": [3, 3], "J3sfMzhF6UTSGgGq": [4, 4],
	//Sub-Languages Table
	"pyVRbUOfHAgtAvnf": [9, 9], "LoCbKgBhdONPEPVB": [1, 1], "0uKZmKF7znJNVuzU": [10, 11], "llH2J2NFDJ7eTCim": [2, 3],
	"ldceHBQUUr4q4wxq": [4, 4], "K6WzOtBKakv6WBWo": [5, 5], "8jwF2ojzhkWpRtUw": [6, 6], "b0CKmtsTQ7J2GBz0": [7, 8],
	//Teleport Mishap
	"KShVQqILsbEKwNQ1": [54, 100]
};