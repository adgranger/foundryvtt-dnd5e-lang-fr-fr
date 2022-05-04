
var types = {
	"aberration (shapechanger)": "Aberration (métamorphe)",
	"aberration": "Aberration",
	"beast": "Bête",
	"celestial (titan)": "Céleste (titan)",
	"celestial": "Céleste",
	"construct": "Créature artificielle",
	"dragon": "Dragon",
	"elemental": "Élémentaire",
	"fey": "Fée",
	"fiend (demon)": "Fiélon (démon)",
	"fiend (demon, orc)": "Fiélon (démon, orc)",
	"fiend (demon, shapechanger)": "Fiélon (démon, métamorphe)",
	"fiend (devil)": "Fiélon (diable)",
	"fiend (devil, shapechanger)": "Fiélon (diable, métamorphe)",
	"fiend (gnoll)": "Fiélon (gnoll)",
	"fiend (shapechanger)": "Fiélon (métamorphe)",
	"fiend (yugoloth)": "Fiélon (yugoloth)",
	"fiend": "Fiélon",
	"giant (cloud giant)": "Géant (géant des nuages)",
	"giant (fire giant)": "Géant (géant du feu)",
	"giant (frost giant)": "Géant (géant du givre)",
	"giant (hill giant)": "Géant (géant des collines)",
	"giant (stone giant)": "Géant (géant des pierres)",
	"giant (storm giant)": "Géant (géant des tempêtes)",
	"giant": "Géant",
	"humanoid (aarakocra)": "Humanoïde (aarakocra)",
	"humanoid (any race)": "Humanoïde (toute race)",
	"humanoid (bullywug)": "Humanoïde (brutacien)",
	"humanoid (dwarf)": "Humanoïde (nain)",
	"humanoid (elf)": "Humanoïde (elfe)",
	"humanoid (firenewt)": "Humanoïde (triton du feu)",
	"humanoid (gith)": "Humanoïde (gith)",
	"humanoid (gnoll)": "Humanoïde (gnoll)",
	"humanoid (gnome)": "Humanoïde (gnome)",
	"humanoid (goblinoid)": "Humanoïde (gobelinoïde)",
	"humanoid (grimlock)": "Humanoïde (torve)",
	"humanoid (grung)": "Humanoïde (grung)",
	"humanoid (human)": "Humanoïde (humain)",
	"humanoid (human, shapechanger)": "Humanoïde (humain, métamorphe)",
	"humanoid (kenku)": "Humanoïde (kenku)",
	"humanoid (kobold)": "Humanoïde (kobold)",
	"humanoid (kuo-toa)": "Humanoïde (kuo-toa)",
	"humanoid (lizardfolk)": "Humanoïde (homme-lézard)",
	"humanoid (merfolk)": "Humanoïde (homme-poisson)",
	"humanoid (orc)": "Humanoïde (orc)",
	"humanoid (quaggoth)": "Humanoïde (quaggoth)",
	"humanoid (sahuagin)": "Humanoïde (sahuagin)",
	"humanoid (shapechanger)": "Humanoïde (métamorphe)",
	"humanoid (thri-kreen)": "Humanoïde (thri-kreen)",
	"humanoid (troglodyte)": "Humanoïde (troglodyte)",
	"humanoid (xvart)": "Humanoïde (xvart)",
	"humanoid (yuan-ti)": "Humanoïde (yuan-ti)",
	"humanoid": "Humanoïde",
	"monstrosity (shapechanger)": "Créature monstrueuse (métamorphe)",
	"monstrosity (shapechanger, yuan-ti)": "Créature monstrueuse (métamorphe, yuan-ti)",
	"monstrosity (titan)": "Créature monstrueuse (titan)",
	"monstrosity": "Créature monstrueuse",
	"ooze": "Vase",
	"plant": "Plante",
	"swarm of Tiny beasts": "Nuée de bêtes",
	"undead (shapechanger)": "Mort-vivant (métamorphe)",
	"undead": "Mort-vivant"
};

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
	"Eldritch Blast": "Décharge occulte", //??
	"Pact of the Tome": "Pacte du grimoire",
	"Pact of the Blade": "Pacte de la lame",
	"Pact of the Chain": "Pacte de la chaîne",
	"Way of the Open Hand": "Voie de la main ouverte"
};

var rarity = {
	"Common": "Commun",
	"Uncommon": "peu commun",
	"Rare": "Rare",
	"Very rare": "Très rare",
	"Legendary": "Légendaire"
};

function round(num) {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function lbToKg(lb) {
	if(!lb) {
		return lb;
	}
	return parseInt(lb)/2;
}

function footsToMeters(ft) {
	if(!ft) {
		return ft;
	}
	return round(parseInt(ft)*0.3);
}

function milesToMeters(mi) {
	if(!mi) {
		return mi;
	}
	return round(parseInt(mi)*1.5);
}

function parseSenses(sensesText) {
	const senses = sensesText.split('. ');
	let parsed = '';
	senses.forEach(sense => { parsed = parseSense(sense) + ' ' + parsed; });
	return parsed;
}

function parseSense(sense) {
	var regexp = /([0-9]+)/gi;
	sense = sense.replace(/ft/gi, 'm');
	sense = sense.replace(/feet/gi, 'm');
	sense = sense.replace(/Darkvision/gi, "Vision dans le noir");
	sense = sense.replace(/Darvision/gi, "Vision dans le noir"); //bug ^^
	sense = sense.replace(/Blindsight/gi, "Vision aveugle");
	sense = sense.replace(/Truesight/gi, "Vision véritable");
	sense = sense.replace(/tremorsense/gi, "Perception des vibrations");
	sense = sense.replace(/Blind Beyond/gi, "Aveugle au-delà");
	sense = sense.replace(/this radius/gi, "de ce rayon");
	sense = sense.replace((sense.match(regexp)), footsToMeters(sense.match(regexp)));
	sense = sense.replace("(blind beyond this radius)", "(aveugle au-delà de ce rayon)");
	return sense;
}

function parseDamage(damage) {
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


function convertEnabled() {
	return game.settings.get("dnd5e_fr-FR", "convert");
}

function setEncumbranceData() {
	let convert = convertEnabled();
	game.settings.set("dnd5e", "metricWeightUnits", convert);
}

// ==== \\
//  Ne maintenant plus que du bout des doigts le module, 
//   le code ci-dessous est repris depuis la version italienne ( @Simone ) 
// ==== \\	
Hooks.once('init', () => {

	if(typeof Babele !== 'undefined') {

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
			dir: 'compendium'
		});

		Babele.get().registerConverters({
			"weight": (value) => {
				if(!convertEnabled()) {
					return value;
				}
				return lbToKg(value);
			},
			"range": (range) => {
				if(range) {
					if(!convertEnabled()) {
						return range;
					}
					if(range.units === "ft") {
						return mergeObject(range, {
							"value": footsToMeters(range.value),
							"long": footsToMeters(range.long),
							"units": "m"
						});
					}
					if(range.units === "mi") {
						return mergeObject(range, {
							"value": milesToMeters(range.value),
							"long": milesToMeters(range.long),
							"units": "km"
						});
					}
					return range;
				}
			},
			"alignement": (alignment) => {
				return alignments[alignment.toLowerCase()];
			},
			"movement": (movement) => {

				if(!convertEnabled()) {
					return movement;
				}

				let convert = (value) => { return value; };
				let units = movement.units;
				if(units === 'ft') {
					convert = (value) => { return footsToMeters(value) };
					units = "m";
				}
				if(units === 'ml') {
					convert = (value) => { return milesToMeters(value) };
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
			},
			"senses": (senses) => {
				return senses ? parseSenses(senses) : null;
			},
			"di": (damage) => {
				return parseDamage(damage);
			},
			"languages": (lang) => {
				if (lang != null ) {
					const languagesSplit = lang.split('; ');
					let languagesFin = '';
					let languagesTr = '';
					languagesSplit.forEach(function(el){
						languagesTr = languages[el.toLowerCase()] ;
						if (languagesTr != null) {
							if (languagesFin === '') {
								languagesFin = languagesTr;
							}  else {
								languagesFin = languagesFin + ' ; '  + languagesTr;
							}
						}
					});
					return languagesFin;
				}
			},
			"token": (token) => {
				mergeObject(
					token, {
						dimSight: footsToMeters(token.dimSight),
						brightSight: footsToMeters(token.brightSight)
					}
				);
			},
			"race": (race) => {
				return races[race] ? races[race] : race;
			},
			"rarity": (r) => {
				return rarity[r] ? rarity[r] : r
			},
			"raceRequirements": (requirements) => {
				let names = requirements.split(',');
				let translated = [];
				names.map(name => name.trim()).forEach(name => {
					translated.push(races[name] ? races[name] : name)
				});
				return translated.join(', ');
			},
			"classRequirements": (requirements) => {
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
		});
	}
});

Hooks.once('ready', () => {
	setEncumbranceData();
});

Hooks.on('createScene', (scene) => {
	if(convertEnabled()) {
		scene.update({
			"gridUnits": "m", "gridDistance": 1.5
		});
	}
});

Hooks.on('createActor', (actor) => {
	if(actor.getFlag("babele", "translated")) {
		return;
	}
	if(convertEnabled()) {
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
		complist.sort(function(a, b) {
			return (a.innerText > b.innerText) ? 1 : -1;
		});
		for (let sk of complist) {
			list.appendChild(sk)
		}
	}
}

Hooks.on("renderActorSheet", async function() {
	skillSorting();
});