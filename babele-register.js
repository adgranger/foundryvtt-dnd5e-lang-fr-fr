import {FieldMapping} from "./FieldMapping.js";

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
			"pages": Converters.pages(),
			"weight": Converters.weight(),
			"range": Converters.range(),
			"rangeActivities": Converters.rangeActivities(),
			"target": Converters.target(),
			"sightRange": Converters.sightRange(),
			"alignement": Converters.alignment(),
			"movement": Converters.movement(),
			"senses": Converters.senses(),
			"damage": Converters.damage(),
			"armor": Converters.armor(),
			"languages": Converters.languages(),
			"token": Converters.token(),
			"requirements": Converters.requirements(),
			"source": Converters.source(),
			"type": Converters.type(),
			"adv_sizehint": Converters.advsizehint(),
			"advancement" : Converters.advancement(),
			"items": Converters.items(),
			"itemsMonster": Converters.itemsMonster(),
			"effects": Converters.effects(),
			"activities": Converters.activities()
		});
	}
});

Hooks.once('ready', () => {
	setEncumbranceData();
	fixExhaustion();
});

Hooks.on('createScene', (scene) => {
	if (convertEnabled()) {
		// Structure changed in foundry v12
		if (game.data.release.generation == 12){
			scene.update({
				"grid.units": "m", "grid.distance": 1.5
			});
		}
		else {
			scene.update({
				"gridUnits": "m", "gridDistance": 1.5
			});
		}	
	}
});

Hooks.on("renderActorSheet", async function () {
	skillSorting();
});

function convertEnabled() {
	return game.settings.get("dnd5e_fr-FR", "convert");
}

function setEncumbranceData() {
	let convert = convertEnabled();
	game.settings.set("dnd5e", "metricWeightUnits", convert);

	if (convert){
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
	if (convertEnabled()){
		CONFIG.DND5E.conditionTypes.exhaustion.reduction = foundry.utils.mergeObject(
			CONFIG.DND5E.conditionTypes.exhaustion.reduction, {
				speed: 1.5
			}
		);
	}
}

async function skillSorting() {
	const lists = document.getElementsByClassName("skills-list");
	for (let list of lists) {
		const competences = list.childNodes;
		let complist = [];
		for (let sk of competences) {
			if (sk.innerText && sk.tagName == "LI") {
				complist.push(sk);
			}
		}
		complist.sort(function (a, b) {
			return (a.innerText > b.innerText) ? 1 : -1;
		});
		for (let sk of complist) {
			list.appendChild(sk)
		}
	}
}

/**
 * Utility class with all predefined converters
 */

export class Converters {
	
	// Override babele page to translate tooltips
	static pages() {
		return (pages, translations) => Converters._pages(pages, translations);
	}
	static _pages(pages, translations) {
		return pages.map(data => {
			if (!translations) {
				return data;
			}

			let translation = translations[data._id];
			if (!translation) {								
				translation = translations[data.name];
				if (!translation) {	
					console.warn(`Missing translation : ${data._id} ${data.name}`)
					return data;
				}
			}
		
			// TODO: Need to add tooltip translation in weblate
			if (data.system.tooltip && data.system.tooltip.length > 0 && !translation.tooltip ){
				translation.tooltip = translation.text;
			}
			return foundry.utils.mergeObject(data, {
				name: translation.name,
				image: { caption: translation.caption ?? data.image.caption },
				src: translation.src ?? data.src,
				text: { content: translation.text ?? data.text.content },
				video: {
					width: translation.width ?? data.video.width,
					height: translation.height ?? data.video.height,
				},
				system: { tooltip: translation.tooltip ?? data.system.tooltip },
				translated: true,
			});
		});
	}

	static weight() {
		return (value) => Converters._weight(value);
	}

	static _weight(value) {
		if (!convertEnabled() || value.units === "kg") {
			return value;
		}
		return foundry.utils.mergeObject( value, {
			"value" : Converters.lbToKg(value.value),
			"units" : "kg"
		});
	}

	static range() {
		return (range) => Converters._range(range);
	}

	static _range(range) {
		if (!range) {
			return range;
		}

		if (!convertEnabled()) {
			return range;
		}
		if (range.units === "ft") {
			return foundry.utils.mergeObject(range, {
				"value": Converters.footsToMeters(range.value),
				"long": Converters.footsToMeters(range.long),
				"reach": Converters.footsToMeters(range.reach),
				"units": "m"
			});
		}
		if (range.units === "mi") {
			return foundry.utils.mergeObject(range, {
				"value": Converters.milesToMeters(range.value),
				"long": Converters.milesToMeters(range.long),
				"reach": Converters.milesToMeters(range.reach),
				"units": "km"
			});
		}
		return range;
	}

	static rangeActivities() {
		return (activities) => Converters._rangeActivities(activities);
	}

	static _rangeActivities(activities) {
		if (!activities) {
			return activities;
		}

		if (!convertEnabled()) {
			return activities;
		}

		Object.keys(activities).forEach(key => {
			Converters._range(activities[key].range);
			
			if (activities[key].target?.template?.units === "ft") {
				foundry.utils.mergeObject( activities[key].target.template, {
					"size": Converters.footsToMeters(activities[key].target.template.size),
					"units": "m"
				});
			}
		});

		return activities;
	}

    static target() {
        return (target) => Converters._target(target);
    }

    static _target(target) {
        if (!target) return target;

		if (!convertEnabled()) return target;
		
		if (target.template.units === "ft") {
			return foundry.utils.mergeObject(target, {
			    template: {
					"size": Converters.footsToMeters(target.template.size),
					"height": Converters.footsToMeters(target.template.height),
					"width": Converters.footsToMeters(target.template.width),
					"units": "m"
			    },
			    affects: {
			        "count": Converters.footsToMeters(target.affects.count)
			    }
			});
		}
		if (target.template.units === "mi") {
			return foundry.utils.mergeObject(target, {
			    template: {
					"size": Converters.milesToMeters(target.template.size),
					"height": Converters.milesToMeters(target.template.height),
					"width": Converters.milesToMeters(target.template.width),
					"units": "km"
			    },
			    affects: {
			        "count": Converters.milesToMeters(target.affects.count)
			    }
			});
		}
		return target;
    }

	static sightRange() {
		return (range) => Converters._sightRange(range);
	}

	static _sightRange(range) {
		if (!convertEnabled()) {
			return range;
		}
		return Converters.footsToMeters(range)
	}

	static alignment(){
		return (alignment) => Converters._alignment(alignment);
	}

	static _alignment(alignment) {
		return alignments[alignment.toLowerCase()];
	}

	static movement() {
		return (movement) => Converters._movement(movement);
	}

	static _movement(movement) {

		if (!convertEnabled()) {
			return movement;
		}

		let convert = (value) => { return value; };
		let units = movement.units;
		if (units === 'ft' || units === null) {
			convert = (value) => { return Converters.footsToMeters(value) };
			units = "m";
		}
		if (units === 'ml') {
			convert = (value) => { return Converters.milesToMeters(value) };
			units = "m";
		}

		return foundry.utils.mergeObject(movement, {
			burrow: convert(movement.burrow),
			climb: convert(movement.climb),
			fly: convert(movement.fly),
			swim: convert(movement.swim),
			units: units,
			walk: convert(movement.walk)
		});
	}

	static senses() {
		return (senses) => Converters._senses(senses);
	}

	static _senses(senses) {
		if(!convertEnabled()) {
			return senses;
		}

		let convert = (value) => { return value; };
		let units = senses.units;
		if(units === 'ft' || units === null) {
			convert = (value) => { return Converters.footsToMeters(value) };
			units = "m";
		}
		if(units === 'ml') {
			convert = (value) => { return Converters.milesToMeters(value) };
			units = "m";
		}

		return foundry.utils.mergeObject(senses, {
			darkvision: convert(senses.darkvision),
			blindsight: convert(senses.blindsight),
			tremorsense: convert(senses.tremorsense),
			truesight: convert(senses.truesight),
			units: units,
			special: specialSenses[senses.special] ?? senses.special
		});
	}

	static damage() {
		return (damage) => Converters._damage(damage);
	}

	static _damage(damage) {
		let names = damage.split(';');
		let translated = [];
		names.map(name => name.trim()).forEach(name => {
			translated.push(damages[name.toLowerCase()] ?? name);
		});
		return translated.join('; ');
	}

	static armor() {
		return (armor) => Converters._armor(armor);
	}

	static _armor(armor) {
		let names = armor.split(';');
		let translated = [];
		names.map(name => name.trim()).forEach(name => {
			translated.push(armors[name.toLowerCase()] ?? name);
		});
		return translated.join('; ');
	}

	static languages() {
		return (lang) => Converters._languages(lang);
	}

	static _languages(lang) {
		if (!lang) {
			return lang;
		}

		const languagesSplit = lang.split(';');
		let languagesFin = '';
		let languagesTr = '';
		languagesSplit.forEach(function (el) {
			el = el.trim();
			languagesTr = languages[el.toLowerCase()];
			if (languagesTr) {
				languagesFin = languagesFin ? languagesFin + ';' + languagesTr : languagesTr;
			}
			else {
				languagesFin = languagesFin ? languagesFin + ';' + el : el;
			}
		});
		return languagesFin;
	}

	static token() {
		return (token) => Converters._token(token);
	}

	static _token(token) {
		return foundry.utils.mergeObject(
			token, {
				sight: Converters.footsToMeters(token.dimSight),
				brightSight: Converters.footsToMeters(token.brightSight)
			}
		);
	}

	static requirements() {
		return (requis) => Converters._requirements(requis);
	}

	static _requirements(requis) {
		let names = requis.split(',');
		let translated = [];
		names.map(name => name.trim()).forEach(name => {
			let keys = Object.keys(requirements);
			let translatedName = name.toLowerCase();
			keys.forEach(key => {
				translatedName = translatedName.replace(key, requirements[key]);
			});
			translated.push(translatedName);
		});
		return translated.join(', ');
	}

	static source() {
		return (source) => Converters._source(source);
	}

	static _source(source) {
		return foundry.utils.mergeObject(
			source, {
			book: sources[source.book],
			custom: sources[source.custom]
		});
	}

	static type() {
		return (type) => Converters._type(type);
	}

	static _type(type) {
		let typesFin = '';
		let typesTr = '';
		if (type.subtype) {
			const typesSplit = type.subtype.split(',');
			typesSplit.forEach(function (el) {
				el = el.trim();
				typesTr = types[el.toLowerCase()];
				if (typesTr) {
					typesFin = typesFin ? typesFin + ', ' + typesTr : typesTr;
				}
				else {
					typesFin = typesFin ? typesFin + ', ' + el : el;
				}
			});
		}
		return foundry.utils.mergeObject(type, {
			custom: types[type.custom?.toLowerCase()] ?? type.custom,
			subtype: typesFin
		});
	}

	static advsizehint() {
		return (advancements, translation) => Converters._advsizehint(advancements, translation);
	}

	static _advsizehint(advancements, translation) {	
		if (!translation) {
			return advancements;
		}

		advancements.forEach(adv => {
			if (adv.type === "Size"){
				foundry.utils.mergeObject(adv, {
					configuration:{
						hint: translation
					}
				});
			}
		});

		return advancements;
	}
	
	static advancement() {
		return (advancements, translations, data, tc) => Converters._advancement(advancements, translations, data, tc);
	}

	static _advancement(advancements, translations, data, tc) {					
		advancements.forEach(adv => {
			switch (adv.type) {
				case "HitPoints":
					foundry.utils.mergeObject(adv, {
						title: game.i18n.localize("DND5E." + adv.type)
					});
					break;
				case "ItemGrant":
					foundry.utils.mergeObject(adv, {
						title: advName[adv.title] ?? game.i18n.localize("DND5E." + adv.title)
					});
					break;
				case "AbilityScoreImprovement":{
					if (adv.title === "Ability Score Improvement"){
						foundry.utils.mergeObject(adv, {
							title: game.i18n.localize("DND5E.ADVANCEMENT.AbilityScoreImprovement.Title")
						});
					}
					break;
				}
				case "ScaleValue":
				case "ItemChoice":
				case "Trait":	
					if (adv.title !== "") {								
						if (advName[adv.title]) {
							foundry.utils.mergeObject(adv, {
								title: advName[adv.title]
							});		
						}
						else {
							console.warn(`Can't find "${adv.title}" translation`);
						}
					}

					if(adv.hint && adv.hint !== ""){	
						if (hints[adv.hint]) {
							foundry.utils.mergeObject(adv, {
								hint: hints[adv.hint]
							});
						}
						else {
							console.warn(`Can't find hint "${adv.hint}" translation`);
						}
					}
					break;
				default:
					break;
			}
			
		});

		return advancements;
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
				    requirements: item.system.requirements ? Converters._requirements(item.system.requirements) : item.system.requirements,
					description: { value: translation.description ?? item.system.description.value },
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
				const translation = translations[effect.name];
				if (translation) {
					return foundry.utils.mergeObject(effect, {
						name: translation.name ?? effect.name,
						description: translation.description ?? effect.description
					});
				}
				return effect;
			});
        }
        
        return data;
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
    			    profiles : activity.profiles ? Converters._summonProfiles(activity.profiles, translation.profiles) : activity.profiles
				});
			}
		});

		return activities;
	}

	static _summonProfiles(profiles, translations) {
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

	static round(num) {
		return Math.round((num + Number.EPSILON) * 100) / 100;
	}

	static lbToKg(lb) {
		if (!lb) {
			return lb;
		}
		return parseInt(lb) / 2;
	}

	static footsToMeters(ft) {
		if (!ft) {
			return ft;
		}
		return Converters.round(parseInt(ft) * 0.3);
	}

	static milesToMeters(mi) {
		if (!mi) {
			return mi;
		}
		return Converters.round(parseInt(mi) * 1.5);
	}
}

export var alignments = {
	"chaotic evil": "Chaotique Mauvais",
	"chaotic neutral": "Chaotique Neutre",
	"chaotic good": "Chaotique Bon",
	"neutral evil": "Neutre Mauvais",
	"true neutral": "Neutre",
	"neutral": "Neutre",
	"neutral good": "Neutre Bon",
	"neutral good evil(50%) or neutral evil(50%)": "Neutre Bon (50 %) ou Neutre Mauvais (50 %)",
	"lawful evil": "Loyal Mauvais",
	"lawful neutral": "Loyal Neutre",
	"lawful good": "Loyal Bon",
	"chaotic good evil": "Chaotique Bon/Mauvais",
	"lawful chaotic evil": "Loyal/Chaotique Mauvais",
	"unaligned": "Non alignée",
	"any non-lawful alignment": "Tout alignement autre que Loyal",
	"any non-lawful": "Tout alignement autre que Loyal",
	"any non-good alignment": "Tout alignement autre que Bon",
	"any non-good": "Tout alignement autre que Bon",
	"any chaotic": "Tout alignement Chaotique",
	"any evil": "Tout alignement Mauvais",
	"any alignment": "Tout alignement",
	"any": "Tout alignement"
};

export var languages = {
	"giant eagle": "Aigle Géant",
	"worg": "Worg",
	"winter wolf": "Loup Artique",
	"sahuagin": "Sahuagin",
	"giant owl": "chouette géante",
	"blink dog": "chien esquiveur",
	"giant elk": "cervidé géant",
	"giant owl, understands but cannot speak all but giant owl": "Chouette Géante, comprend mais ne peut pas parler sauf en Chouette Géante",
	"giant elk but can't speak them": "Elan Géant, mais ne peut pas le parler",
	"common and auran (understands but cannot speak)": "comprend le commun et l'aérien mais ne les parle pas",
	"understands abyssal, celestial, infernal, and primordial but can't speak": "comprend l'abyssal, le céleste, l'infernal et le primordial, mais ne parle pas",
	"understands celestial, common, elvish, and sylvan but can't speak": "comprend le céleste, le commun, l'elfique et le sylvestre, mais ne parle pas",
	"understands common, elvish, and sylvan but can't speak them": "comprend le commun, l'elfique et le sylvestre, mais ne peut pas les parler",
	"understands abyssal, common, and infernal but can't speak": "comprend l'abyssal, le commun et l'infernal, mais ne parle pas",
	"understands infernal but can't speak it": "comprend l'infernal mais ne peut pas le parler",
	"understands draconic but can't speak": "comprend le draconic mais ne peut pas le parler",
	"understands common but doesn't speak it": "comprend le commun mais ne peut pas le parler",
	"understands common but can't speak": "comprend le commun, mais ne parle pas",
	"understands abyssal but can't speak": "comprend l'infernal mais ne peut pas le parler",
	"understands sylvan but can't speak it": "comprend le sylvestre, mais ne le parle pas",
	"understands deep speech but can't speak": "comprend le profond, mais ne parle pas",
	"understands commands given in any language but can't speak": "comprend les ordres donnés dans n'importe quelle langue mais ne peut pas parler",
	"understands all languages it knew in life but can't speak": "comprend toutes les langues qu'il parlait de son vivant, mais ne parle pas",
	"understands the languages it knew in life but can't speak": "comprend les langues qu'il parlait de son vivant, mais ne parle pas",
	"understands but can't speak": "comprend mais ne parle pas",
	"(can't speak in rat form)": "(Ne peut pas parler sous forme de rat)",
	"(can't speak in boar form)": "(ne peut pas parler sous forme de sanglier)",
	"(can't speak in bear form)": "(ne peut pas parler sous forme d'ours)",
	"(can't speak in tiger form)": "(ne peut pas parler sous forme de tigre)",
	"(can't speak in wolf form)": "(ne peut pas parler sous forme de loup)",
	"any one language (usually common)": "une langue quelconque (généralement le commun)",
	"any one language": "une au choix",
	"any two": "deux au choix",
	"any two languages": "deux au choix",
	"any four languages": "quatre au choix",
	"5 other languages": "5 autres langues",
	"(any 6 languages)": "six au choix",
	"any, usually common": "généralement le commun",
	"one language known by its creator": "une langue connue de son créateur",
	"the languages it knew in life": "celles qu'il parlait de son vivant",
	"those it knew in life": "celles qu'il parlait de son vivant",
	"all it knew in life": "celles qu'il parlait de son vivant",
	"any it knew in life": "celles qu'il parlait de son vivant",
	"languages it knew in life": "celles qu'il parlait de son vivant",
	"any languages it knew in life": "celles qu'il connaissait de son vivant",
	"all, telepathy 120 ft.": "toutes, télépathie 36m",
	"telepathy 60 ft.": "télépathie 18m",
	"telepathy 60ft. (works only with creatures that understand abyssal)": "télépathie 18 m (ne fonctionne qu'avec les créatures qui comprennent l'abyssal)",
	"telepathy 60 ft. (works only with creatures that understand abyssal)": "télépathie 18 m (ne fonctionne qu'avec les créatures qui comprennent l'abyssal)",
	"telepathy 120 ft.": "télépathie 36m",
	"but can't speak": "mais ne peut pas parler",
	"but can't speak it": "mais ne peut pas le parler",
	"choice": "au choix",
	"all languages known to its summoner": "toutes les langues connues de la créature qui l'a convoqué",
	"understands the languages of its creator but can't speak": "comprend les langues de son créateur mais ne paut pas les parler",
	"understands the languages of its creator but cannot speak": "comprend les langues de son créateur, mais ne parle pas",
	"understands common and giant but can't speak": "comprend le commun et le gigant, mais ne parle pas",
	"cannot speak": "ne parle pas",
	"can't speak": "ne parle pas",
	"all": "toutes"
};

export var types = {
	"dragonborn": "Drakéide",
	"dwarf": "Nain",
	"elf": "Elfe",
	"gnome": "Gnome",
	"orc": "Orc",
	"halfling": "Halfelin",
	"human": "Humain",
	"tiefling": "Tieffelin",
	"any race": "Toute race",
	"shapechanger": "Métamorphe",
	"demon": "Démon",
	"devil": "Diable",
	"goblinoid" : "Gobelinoïde",
	"lizardfolk": "Saurial",
	"merfolk": "Thalasséen",
	"grimlock": "Torve"
};

export var requirements = {
    "barbarian": "Barbare",
	"bard": "Barde",
	"cleric": "Clerc",
	"druid": "Druide",
	"fighter": "Guerrier",
	"monk": "Moine",
	"paladin": "Paladin",
	"ranger": "Rôdeur",
	"rogue": "Roublard",
	"sorcerer": "Ensorceleur",
	"warlock": "Occultiste",
	"wizard": "Magicien",
	"champion": "Champion",
	"college of lore": "Collège du savoir",
	"oath of devotion": "Serment de dévotion",
	"life domain": "Domaine de la Vie",
	"circle of the land": "Cercle de la terre",
	"the fiend": "Le fiélon",
	"hunter": "Chasseur",
	"school of evocation": "Ecole d'évocation",
	"path of the berserker": "Berserker",
	"eldritch blast": "Décharge occulte",
	"pact of the tome": "Pacte du grimoire",
	"pact of the blade": "Pacte de la lame",
	"pact of the chain": "Pacte de la chaîne",
	"way of the open hand": "Voie de la main ouverte",
	"draconic bloodline": "Lignée draconique",
	"str": "FOR",
	"or higher": "ou plus",
 	"thief": "Voleur",
	"lightfoot halfling": "Halfelin pied-léger",
	"copper dragonborn": "Drakéide de cuivre",
	"bronze dragonborn": "Drakéide de bronze",
	"silver dragonborn": "Drakéide d'argent",
	"brass dragonborn": "Drakéide d'airain",
	"white dragonborn": "Drakéide blanc",
	"black dragonborn": "Drakéide noir",
	"green dragonborn": "Drakéide vert",
	"blue dragonborn": "Drakéide bleu",
	"gold dragonborn": "Drakéide d'or",
	"red dragonborn": "Drakéide rouge",
	"rock gnome": "Gnome des roches",
	"half-elf": "Demi-elfe",
	"tiefling": "Tieffelin",
	"half-orc": "Demi-Orc",
	"halfling": "Halfelin",
	"dwarf": "Nain",
	"elf": "Elfe",
	"owl": "Chouette",
	"octopus": "Pieuvre",
	"baboon": "Babouin",
	"lemure": "Lémure",
	"bats": "Chauves-souris",
	"bat": "Chauve-souris",
	"eagle": "Aigle",
	"frog": "Grenouille",
	"raven": "Corbeau",
	"jackal": "Chacal",
	"weasel": "Belette",
	"fire beetle": "Scarabée de feu",
	"vulture": "Vautour",
	"hawk": "Faucon",
	"awakened shrub": "Arbuste éveillé",
	"cat": "Chat",
	"badger": "Blaireau",
	"goat": "Chèvre",
	"hyena": "Hyène"
};

export var sources = {
	"SRD 5.1": "DRS 5.1"
};

export var hints = {
	"Light Armor, Medium Armor, & Shields (druids will not wear armor or use shields made of metal)": 
	  "Armures légères, armures intermédiaires, Boucliers (les druides ne portent ni armure ni bouclier faits de métal)",
  
	"You adopt a particular style of fighting as your specialty. Choose one of the following options. You can’t take a Fighting Style option more than once, even if you later get to choose again.":
	  "Vous choisissez de vous spécialiser dans un style de combat particulier. Choisissez l’une des options suivantes. Vous ne pouvez pas opter plus d’une fois pour un même Style de combat, si vous avez de nouveau la possibilité d’en choisir un.",
  
	"Choose two 3rd-level wizard spells in your spellbook as your signature spells.":
	  "Choisissez deux sorts de magicien du 3e niveau de votre grimoire comme sorts de prédilection.",
  
	"Your mastery of the ki flowing through you makes you immune to disease and poison.":
	  "Votre maîtrise du ki qui circule en vous est telle que vous devenez immunisé contre les maladies et les poisons.",
  
	"If an eldritch invocation has prerequisites, you must meet them to learn it. You can learn the invocation at the same time that you meet its prerequisites. A level prerequisite refers to your level in this class.":
	  "Si une manifestation occulte a des prérequis, vous devez les remplir pour l’apprendre. Vous pouvez apprendre une manifestation dès l’instant où vous remplissez ses prérequis. Un prérequis de niveau fait référence à votre niveau dans cette classe.",
  
	"Choose one 6th-level spell from the warlock spell list as this arcanum.":
	  "Choisissez comme arcanum un sort du 6e niveau dans la liste des sorts d’occultiste.",
  
	"Choose one 7th-level spell from the warlock spell list as this arcanum.":
	  "Choisissez comme arcanum un sort du 7e niveau dans la liste des sorts d’occultiste.",
  
	"Choose one 8th-level spell from the warlock spell list as this arcanum.":
	  "Choisissez comme arcanum un sort du 8e niveau dans la liste des sorts d’occultiste.",
  
	"Choose one 9th-level spell from the warlock spell list as this arcanum.":
	  "Choisissez comme arcanum un sort du 9e niveau dans la liste des sorts d’occultiste.",
  
	"The divine magic flowing through you makes you immune to disease.":
	  "La magie divine qui vous parcourt vous immunise contre les maladies.",
  
	"Choose one of the following options. You can’t take a Fighting Style option more than once, even if you later get to choose again.":
	  "Choisissez l’une des options suivantes. Vous ne pouvez pas opter plus d’une fois pour un même Style de combat, si vous avez de nouveau la possibilité d’en choisir un.",
  
	"Expertise": 
	  "Expertise",
  
	"You have acquired greater mental strength. You gain proficiency in Wisdom saving throws.":
	  "Vous avez acquis une grande force mentale. Vous recevez la maîtrise des jets de sauvegarde de Sagesse."
  };
  
export var advName = {
	"Unarmed Strike": "Frappe à mains nues (Moine)",
	"Cantrips Known": "Sorts mineurs connus",
	"Spells Known": "Sorts connus",
	"Bardic Inspiration Die": "Inspiration bardique",
	"Song of rest Die": "Chant reposant",
	"Brutal Critical Dice": "Critique brutal",
	"Rages": "Rages",
	"Rage Damage": "Dégâts de rage",
	"Wild Shape CR": "Forme sauvage",
	"Channel Divinity Uses": "Utilisations du Conduit divin",
	"Destroy Undead CR": "Destruction des morts-vivants",
	"Indomitable Uses": "Utilisations d'Inflexible",
	"Action Surge Uses": "Utilisations de la Fougue",
	"Martial Arts Die": "Dés d'Arts martiaux",
	"Aura Radius": "Rayon de l'Aura",
	"Fighting Style": "Style de combat",
	"Mystic Arcanum (6th level)": "Arcanum mystique (6e niveau)",
	"Mystic Arcanum (7th level)": "Arcanum mystique (7e niveau)",
	"Mystic Arcanum (8th level)": "Arcanum mystique (8e niveau)",
	"Mystic Arcanum (9th level)": "Arcanum mystique (9e niveau)",
	"Eldritch Invocations": "Manifestation occultes",
	"Pact Boon": "Pacte [Occultiste]",
	"Divine Strike Damage": "Dégâts d'Impact divin",
	"Additional Fighting Style": "Style de combat supplémentaire",
	"Hunter's Prey": "Proie du chasseur",
	"Defensive Tactics": "Tactiques défensives",
	"Multiattack": "Attaques multiples",
	"Superior Hunter's Defense": "Défense supérieure du chasseur",
	"Additionnal Magicat Secrets": "Secrets magiques supplémentaires",
	"Feature": "Aptitude"
};

export var specialSenses = {
    "Blind beyond this radius": "ne voit rien au-delà de ce rayon",
    "10 ft. while deafened (blind beyond this radius)": " 3 m s'il est assourdi (ne voit rien au-delà de ce rayon)"
};

export var damages = {
    "advantage on saving throws against being charmed": "avantagé aux jets de sauvegarde contre l'état charmé",
    "advantage on saving throws against charms": "avantagé aux jets de sauvegarde contre l'état charmé",
    "advantage against being frightenned": "avantagé contre l'état effrayé",
    "advantage against being frightened": "avantagé contre l'état effrayé",
    "magic can't put you to sleep": "la magie ne peut pas vous endormir",
    "magical sleep": "sommeil magique",
    "damage from spells": "dégâts des sorts"
};

export var armors = {
    "(no metal)": "(pas en métal)"
};