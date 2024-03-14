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
			}
		});

		Babele.get().register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium_fr'
		});

		Babele.get().registerConverters({
			"pages": Converters.pages(),
			"weight": Converters.weight(),
			"range": Converters.range(),
			"sightRange": Converters.sightRange(),
			"alignement": Converters.alignment(),
			"movement": Converters.movement(),
			"senses": Converters.senses(),
			"di": Converters.damage(),
			"languages": Converters.languages(),
			"token": Converters.token(),
			"race": Converters.race(),
			"rarity": Converters.rarity(),
			"raceRequirements": Converters.raceRequirements(),
			"classRequirements": Converters.classRequirements(),
			"source": Converters.source(),
			"type": Converters.type(),
			"adv_sizehint": Converters.advsizehint(),
			"advancement" : Converters.advancement()
		});
	}
});

Hooks.once('ready', () => {
	setEncumbranceData();
});

Hooks.on('createScene', (scene) => {
	if (convertEnabled()) {
		scene.update({
			"gridUnits": "m", "gridDistance": 1.5
		});
	}
});

Hooks.on('createActor', (actor) => {
	if (actor.getFlag("babele", "translated")) {
		return;
	}
	if (convertEnabled()) {
		actor.update({
			token: {
				dimSight: footsToMeters(actor.data.token.dimSight),
				brightSight: footsToMeters(actor.data.token.brightSight)
			},
			data: {
				attributes: {
					movement: {
						burrow: 0,
						climb: 0,
						fly: 0,
						swim: 0,
						units: 'm',
						walk: 9
					}
				}
			}
		});
	}
})

Hooks.on("renderActorSheet", async function () {
	skillSorting();
});

function convertEnabled() {
	return game.settings.get("dnd5e_fr-FR", "convert");
}

function setEncumbranceData() {
	let convert = convertEnabled();
	game.settings.set("dnd5e", "metricWeightUnits", convert);

	// Fix system bug 
	CONFIG.DND5E.encumbrance.threshold.encumbered = mergeObject(
		CONFIG.DND5E.encumbrance.threshold.encumbered, {
			metric: 2.5
		}
	);
	CONFIG.DND5E.encumbrance.threshold.heavilyEncumbered = mergeObject(
		CONFIG.DND5E.encumbrance.threshold.heavilyEncumbered, {
			metric: 5
		}
	);
	CONFIG.DND5E.encumbrance.threshold.maximum = mergeObject(
		CONFIG.DND5E.encumbrance.threshold.maximum , {
			metric: 7.5
		}
	);
	CONFIG.DND5E.encumbrance.speedReduction = mergeObject(
		CONFIG.DND5E.encumbrance.speedReduction, {
			encumbered : 3,
			heavilyEncumbered : 6
		}
	);
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

class Converters {

	// Override babele page to translate tooltips
	static pages() {
		return (pages, translations) => Converters._pages(pages, translations);
	}
	static _pages(pages, translations) {
		return pages.map(data => {
			if (!translations) {
				return data;
			}

			const translation = translations[data.name];
			if (!translation) {
				return data;
			}

			return mergeObject(data, {
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
		if (!convertEnabled()) {
			return value;
		}
		return Converters.lbToKg(value);
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
			return mergeObject(range, {
				"value": Converters.footsToMeters(range.value),
				"long": Converters.footsToMeters(range.long),
				"units": "m"
			});
		}
		if (range.units === "mi") {
			return mergeObject(range, {
				"value": Converters.milesToMeters(range.value),
				"long": Converters.milesToMeters(range.long),
				"units": "km"
			});
		}
		return range;
	}

	static alignment() {
		return (alignment) => Converters._alignment(alignment);
	}

	static _alignment(alignment) {
		return alignments[alignment.toLowerCase()];
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
		if (units === 'ft') {
			convert = (value) => { return Converters.footsToMeters(value) };
			units = "m";
		}
		if (units === 'ml') {
			convert = (value) => { return Converters.milesToMeters(value) };
			units = "m";
		}

		return mergeObject(movement, {
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
		if(units === 'ft') {
			convert = (value) => { return Converters.footsToMeters(value) };
			units = "m";
		}
		if(units === 'ml') {
			convert = (value) => { return Converters.milesToMeters(value) };
			units = "m";
		}

		return mergeObject(senses, {
			darkvision: convert(senses.darkvision),
			blindsight: convert(senses.blindsight),
			tremorsense: convert(senses.tremorsense),
			truesight: convert(senses.truesight),
			units: units,
			special: convert(senses.special)
		});
	}

	static damage() {
		return (damage) => Converters._damage(damage);
	}

	static _damage(damage) {
		return Converters.parseDamage(damage);
	}

	static languages() {
		return (lang) => Converters._languages(lang);
	}

	static _languages(lang) {
		if (lang == null) {
			return lang;
		}

		const languagesSplit = lang.split('; ');
		let languagesFin = '';
		let languagesTr = '';
		languagesSplit.forEach(function (el) {
			languagesTr = languages[el.toLowerCase()];
			if (languagesTr != null) {
				if (languagesFin === '') {
					languagesFin = languagesTr;
				} else {
					languagesFin = languagesFin + ' ; ' + languagesTr;
				}
			}
		});
		return languagesFin;
	}

	static token() {
		return (token) => Converters._token(token);
	}

	static _token(token) {
		return mergeObject(
			token, {
				sight: Converters.footsToMeters(token.dimSight),
				brightSight: Converters.footsToMeters(token.brightSight)
			}
		);
	}

	static race() {
		return (race) => Converters._race(race);
	}

	static _race(race) {
		return races[race] ? races[race] : race;
	}

	static rarity() {
		return (r) => Converters._rarity(r);
	}

	static _rarity(r) {
		return rarity[r] ? rarity[r] : r
	}

	static raceRequirements() {
		return (requirements) => Converters._raceRequirements(requirements);
	}

	static _raceRequirements(requirements) {
		let names = requirements.split(',');
		let translated = [];
		names.map(name => name.trim()).forEach(name => {
			translated.push(races[name] ? races[name] : name)
		});
		return translated.join(', ');
	}

	static classRequirements() {
		return (requirements) => Converters._classRequirements(requirements);
	}

	static _classRequirements(requirements) {
		let names = requirements.split(',');
		let translated = [];
		names.map(name => name.trim()).forEach(name => {
			let keys = Object.keys(classes);
			let translatedName = name;
			keys.forEach(key => {
				translatedName = translatedName.replace(key, classes[key])
			});
			translated.push(translatedName)
		});
		return translated.join(', ');
	}

	static source() {
		return (source) => Converters._source(source);
	}

	static _source(source) {
		let keys = Object.keys(source);
		let translatedSource = source.book;

		if (translatedSource) {
			keys.forEach(key => {
				translatedSource = translatedSource.replace(key, sources[key])
			});
		}
		return mergeObject(
			source, {
			book: translatedSource
		}
		);
	}

	static type() {
		return (type) => Converters._type(type);
	}

	static _type(type) {	
		if (!type.subtype) {
			return 
		};

		let index;
		for (let key of Object.keys(races)) {
			if (key.toLowerCase() !== type.subtype.toLowerCase()){
				continue;
			}

			index = key;
			break;
		}

		return mergeObject(type,
			{
				subtype: index ? races[index].toLowerCase() : type.subtype,				
			}
		);
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
				mergeObject(adv, {
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
					mergeObject(adv, {
						title: game.i18n.localize("DND5E." + adv.type)
					});
					break;
				case "ItemGrant":
					mergeObject(adv, {
						title: game.i18n.localize("DND5E." + adv.title)
					});
					break;
				case "AbilityScoreImprovement":{
					mergeObject(adv, {
						title: game.i18n.localize("DND5E.AdvancementAbilityScoreImprovementTitle")
					});
					break;
				}
				case "ScaleValue":
				case "ItemChoice":
				case "Trait":
					const classFeaturesTranslations = game.babele.translations.find((item) => item.collection === "dnd5e.classfeatures");
					if (adv.title !== "") {						
						if (classFeaturesTranslations.entries[adv.title]) {
							mergeObject(adv, {
								title: classFeaturesTranslations.entries[adv.title].name
							});		
						}
						else {
							console.warn(`Can't find "${adv.title}" translation`);
						}
					}

					if(adv.configuration && adv.configuration.hint && adv.configuration.hint !== ""){
						if (classFeaturesTranslations.entries[adv.configuration.hint]) {
							mergeObject(adv, {
								configuration:{
									hint: classFeaturesTranslations.entries[adv.configuration.hint].hint
								}								
							});
						}
						else {
							console.warn(`Can't find hint "${adv.configuration.hint}" translation`);
						}
					}
					break;
				default:
					break;
			}
			
		});

		return advancements;
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

	static parseDamage(damage) {
		damage = damage.replace(/bludgeoning/gi, 'contondant');
		damage = damage.replace(/piercing/gi, 'perforant');
		damage = damage.replace(/and/gi, 'et');
		damage = damage.replace(/slashing/gi, 'tranchant');
		damage = damage.replace(/from/gi, 'd\'');
		damage = damage.replace(/nonmagical attacks/gi, 'attaques non magiques');
		damage = damage.replace(/that aren't silvered/gi, 'non réalisées avec des armes en argent');
		damage = damage.replace(/not made with silvered weapons/gi, 'non réalisées avec des armes en argent');
		return damage;
	}
}

var alignments = {
	"chaotic evil": "Chaotique Mauvais",
	"chaotic neutral": "Chaotique Neutre",
	"chaotic good": "Chaotique Bon",
	"neutral evil": "Neutre Mauvais",
	"true neutral": "Neutre",
	"neutral": "Neutre",
	"neutral good": "Neutre Bon",
	"lawful evil": "Loyal Mauvais",
	"lawful neutral": "Loyal Neutre",
	"lawful good": "Loyal Bon",
	"chaotic good evil": "Chaotique Bon/Mauvais",
	"lawful chaotic evil": "Loyal/Chaotique Mauvais",
	"unaligned": "Sans alignement",
	"any non-lawful": "n'importe lequel non loyal",
	"any": "n'importe lequel",
};

var languages = {
	"giant eagle": "Aigle Géant",
	"worg": "Worg",
	"winter wolf": "Loup Artique",
	"sahuagin": "Sahuagin",
	"giant owl, understands but cannot speak all but giant owl": "Chouette Géante, comprend mais ne peut pas parler sauf en Chouette Géante",
	"giant elk but can't speak them": "Elan Géant, mais ne peut pas le parler",
	"understands infernal but can't speak it": "comprend l'infernal mais ne peut pas le parler",
	"understands draconic but can't speak": "comprend le draconic mais ne peut pas le parler",
	"understands common but doesn't speak it": "comprend le commun mais ne peut pas le parler",
	"understands abyssal but can't speak": "comprend l'infernal mais ne peut pas le parler",
	"understands all languages it knew in life but can't speak": "comprend toutes les langues qu'il a apprises dans sa vie mais ne peut pas les parler",
	"understands commands given in any language but can't speak": "comprend les ordres donnés dans n'importe quelle langue mais ne peut pas parler",
	"(can't speak in rat form)": "(Ne peut pas parler sous forme de rat)",
	"(can't speak in boar form)": "(ne peut pas parler sous forme de sanglier)",
	"(can't speak in bear form)": "(ne peut pas parler sous forme d'ours)",
	"(can't speak in tiger form)": "(ne peut pas parler sous forme de tigre)",
	"any one language (usually common)": "une langue quelconque (généralement le commun)",
	"any two languages": "deux langues quelconques",
	"any four languages": "quatre langues quelconques",
	"5 other languages": "5 autres langues",
	"any, usually common": "généralement le commun",
	"one language known by its creator": "une langue connue de son créateur",
	"the languages it knew in life": "les langues qu'il connaissait dans la vie",
	"those it knew in life": "les langues qu'il connaissait dans la vie",
	"all it knew in life": "les langues qu'il connaissait dans la vie",
	"any it knew in life": "les langues qu'il connaissait dans la vie",
	"all, telepathy 120 ft.": "toutes, télépathie 36m",
	"telepathy 60 ft.": "télépathie 18m",
	"telepathy 60ft. (works only with creatures that understand abyssal)": "télépathie 18m (seulement avec les créatures qui connaissent l'abyssal)",
	"telepathy 120 ft.": "télépathie 36m",
	"but can't speak": "mais ne peut pas parler",
	"but can't speak it": "mais ne peut pas le parler",
	"choice": "au choix",
	"understands the languages of its creator but can't speak": "comprend les langues de son créateur mais ne paut pas les parler",
	"understands common and giant but can't speak": "comprend le géant et le commun mais ne peut pas les parler",
	"cannot speak": "Ne parle pas"
};

var races = {
	"Dragonborn": "Drakéide",
	"Dwarf": "Nain",
	"Hill Dwarf": "Nain des collines",
	"Elf": "Elfe",
	"High Elf": "Haut-elfe",
	"Rock Gnome": "Gnome des roches",
	"Gnome": "Gnome",
	"Half Elf": "Demi-elfe",
	"Half-Elf": "Demi-elfe",
	"Half-elf": "Demi-elfe",
	"Halfling": "Halfelin",
	"Lightfoot Halfling": "Halfelin pied-léger",
	"Half Orc": "Demi-Orc",
	"Half-Orc": "Demi-Orc",
	"HUMAN": "Humain",
	"Human": "Humain",
	"Variant Human": "Humain (variante)",
	"Tiefling": "Tieffelin"
};

var classes = {
	"Barbarian": "Barbare",
	"Bard": "Barde",
	"Cleric": "Clerc",
	"Druid": "Druide",
	"Fighter": "Guerrier",
	"Monk": "Moine",
	"Paladin": "Paladin",
	"Ranger": "Rôdeur",
	"Rogue": "Roublard",
	"Sorcerer": "Ensorceleur",
	"Warlock": "Occultiste",
	"Wizard": "Magicien",
	"Champion": "Champion",
	"College of Lore": "Collège du savoir",
	"Oath of Devotion": "Serment de dévotion",
	"Life Domain": "Domaine de la Vie",
	"Circle of the Land": "Cercle de la terre",
	"The Fiend": "Le fiélon",
	"Hunter": "Chasseur",
	"School of Evocation": "Ecole d'évocation",
	"Path of the Berserker": "Berserker",
	"Eldritch Blast": "Décharge occulte",
	"Pact of the Tome": "Pacte du grimoire",
	"Pact of the Blade": "Pacte de la lame",
	"Pact of the Chain": "Pacte de la chaîne",
	"Way of the Open Hand": "Voie de la main ouverte",
	"Draconic Bloodline": "Lignée draconique",
	"STR": "FOR",
	"or higher": "ou plus"
};

var sources = {
	"SRD": "DRS"
};

var rarity = {
	"Common": "Commun",
	"Uncommon": "peu commun",
	"Rare": "Rare",
	"Very rare": "Très rare",
	"Legendary": "Légendaire"
};