import { FrenchClassFeatures } from './class/ClassFeatures.js'; //----WIP---


var typeAlignement = {
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
	"unaligned": "Sans alignement"
};
var typeCreature = {
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

var remplLanguages = {
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
}

function remplSens(chaine) {
	var regexp = /([0-9]+)/gi; // recherche des valeurs numériques
	chaine = chaine.replace(/ft/gi, 'm'); // toutes les occurences en ft
	chaine = chaine.replace(/feet/gi, 'm'); // toutes les occurences en feet (pfff)
	chaine = chaine.replace(/Darkvision/gi, "Vision dans le noir");
	chaine = chaine.replace(/Darvision/gi, "Vision dans le noir"); //bug ^^
	chaine = chaine.replace(/Blindsight/gi, "Vision aveugle");
	chaine = chaine.replace(/Truesight/gi, "Vision véritable");
	chaine = chaine.replace(/tremorsense/gi, "Perception des vibrations");
	chaine = chaine.replace(/Blind Beyond/gi, "Aveugle au-delà");
	chaine = chaine.replace(/this radius/gi, "de ce rayon");
	chaine = chaine.replace((chaine.match(regexp)), parseInt(chaine.match(regexp)) * 0.3);
	chaine = chaine.replace("(blind beyond this radius)", "(aveugle au-delà de ce rayon)");
	return chaine;
}

function remplDi(chaine) {
	chaine = chaine.replace(/bludgeoning/gi, 'contondant');
	chaine = chaine.replace(/piercing/gi, 'perforant');
	chaine = chaine.replace(/and/gi, 'et');
	chaine = chaine.replace(/slashing/gi, 'tranchant');
	chaine = chaine.replace(/from/gi, 'd\'');
	chaine = chaine.replace(/nonmagical attacks/gi, 'attaques non magiques');
	chaine = chaine.replace(/that aren't silvered/gi, 'non réalisées avec des armes en argent');
	chaine = chaine.replace(/not made with silvered weapons/gi, 'non réalisées avec des armes en argent');
	return chaine;
}

function remplRequ(chaine) {
	chaine = chaine.replace(/Human/gi, 'Humain');
	chaine = chaine.replace(/Half-Orc/gi, 'Demi-Orc');
	chaine = chaine.replace(/Halfling/gi, 'Halfelin');
	chaine = chaine.replace(/Elf/gi, 'Elfe');
	chaine = chaine.replace(/Gnome/gi, 'Gnome');
	chaine = chaine.replace(/Dragonborn/gi, 'Sangdragon');
	chaine = chaine.replace(/Rock Gnome/gi, 'Gnome des roches');
	chaine = chaine.replace(/Dwarf/gi, 'Nain');
	chaine = chaine.replace(/Elf, Half-Elf/gi, 'Elfe, Demi-elfe');
	chaine = chaine.replace(/Elfe, Half-Elfe/gi, 'Elfe, Demi-elfe');
	chaine = chaine.replace(/Tiefling/gi, 'Tieffelin');
	chaine = chaine.replace(/Draconic Bloodlin/gi, 'Lignée Draconique');
	chaine = chaine.replace(/Barbarian/gi, 'Barbare');
	chaine = chaine.replace(/Bard/gi, 'Barde');
	chaine = chaine.replace(/Wizard /gi, 'Magicien');
	chaine = chaine.replace(/Warlock/gi, 'Sorcier');
	chaine = chaine.replace(/Cleric /gi, 'Clerc');
	chaine = chaine.replace(/Sorcerer /gi, 'Ensorceleur');
	chaine = chaine.replace(/Ranger /gi, 'Rôdeur');
	chaine = chaine.replace(/Paladin /gi, 'Paladin');
	chaine = chaine.replace(/Monk/gi, 'Moine');
	chaine = chaine.replace(/Druid /gi, 'Druide');
	chaine = chaine.replace(/Fighter /gi, 'Guerrier');
	chaine = chaine.replace(/Rogue/gi, 'Roublard');
	chaine = chaine.replace(/Chmapion/gi, 'Champion');
	chaine = chaine.replace(/Hunter/gi, 'Chasseur');
	chaine = chaine.replace(/The Fiend/gi, 'Le fiélon');
	chaine = chaine.replace(/Oath of Devotion/gi, 'Serment de dévotion');
	chaine = chaine.replace(/Life Domain/gi, 'Domaine de la Vie');
	chaine = chaine.replace(/Thief/gi, 'Voleur');
	chaine = chaine.replace(/School of Evocation/gi, 'Ecole d\'évocation');
	chaine = chaine.replace(/Path of the Berserker/gi, 'Berserker');
	chaine = chaine.replace(/Way of the Open Hand/gi, 'Voie de la main ouverte');
	chaine = chaine.replace(/STR/gi, 'FOR');
	chaine = chaine.replace(/or higher/gi, 'ou plus');
	chaine = chaine.replace(/College of Lore/gi, 'Collège du savoir');
	chaine = chaine.replace(/Circle of the Land/gi, 'Cercle de la terre');
	return chaine;
}


Hooks.once('init', () => {
	CONFIG.DND5E.classFeatures = FrenchClassFeatures;
	//	CONFIG.debug.hooks = true;

	// affichage du chtit boutons traducFR ? (par défaut non)
	game.settings.register("dnd5e_fr-FR", "noCtrlVersions", {
        name: 'Désactiver le contrôle des versions',
        hint: 'Permet de désactiver le contrôle et l\'éventuelle alerte d\'une version non testée du système Dnd5 et du module Babele par ce module de traduction',
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
		onChange: value => { 
			window.location.reload();
	  }
    });
	// affichage du chtit boutons traducFR ? (par défaut non)
	game.settings.register("dnd5e_fr-FR", "noConvMetre", {
        name: 'Ignorer les conversions',
        hint: 'Désactive les conversions et les intialisations en système métrique ... sauf quand le texte est \'en dur\' dans la traduction ;) et sur la surcharge d\'acteur avec l\'option ci-dessous. ',
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
		onChange: value => { 
			window.location.reload();
	  }
    });
	// affichage du chtit boutons traducFR ? (par défaut non)
	game.settings.register("dnd5e_fr-FR", "importFR", {
        name: 'Afficher le bouton de tradFR',
        hint: 'Un petit bouton sur les fiches de perso permettant quelques traductions supplémentaires (alignement, classes, etc) lors d\'import de campagnes ou d\'acteur de compendium non traduit (pas directement dans le compendium, mais dans les acteurs) . ATTENTION : cela écrase les valeurs initiales - pas de retour arrière... (faîtes une copie :) )',
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
		onChange: value => { 
			window.location.reload();
	  }
    });


	if (typeof Babele !== 'undefined') {

		Babele.get().register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium'
		});

		Babele.get().registerConverters({
			"weight": (value) => { 
				if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") ) {
					return parseInt(value) / 2
				} else {
					return value;
				};
			},
			"range": (range) => {
				if (range) {
					if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") ) {
						if (range.units === 'ft') {
							if (range.long) {
								range = mergeObject(range, { long: range.long * 0.3 });
							}
							return mergeObject(range, { value: range.value * 0.3 });
						}
						if (range.units === 'mi') {
							if (range.long) {
								range = mergeObject(range, { long: range.long * 1.5 });
							}
							return mergeObject(range, { value: range.value * 1.5 });
						}
					}
					return range;
				}
			},
			"movement": (movement) => {
				if (movement) {
					if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") ) {
						if (movement.units === 'ft') {
							for (var i in movement) {
								if (movement[i] === 'ft') {
									movement[i] = 'm'
								} else {
									movement[i] = movement[i] * 0.3
								}
							}
						}
						if (movement.units === 'mi') {
							for (var i in movement) {
								if (movement[i] === 'mi') {
									movement[i] = 'km'
								} else {
									movement[i] = movement[i] * 1.5
								}
							}
						}
					}
					return movement;
				}
			},
			"alignement": (alignement) => {
				return typeAlignement[alignement.toLowerCase()];
			},
			"requirements": (typeR) => {
				return remplRequ(typeR);
			},
			"type": (typeC) => {
				return typeCreature[typeC.toLowerCase()];
			},

			"senses": (sens) => {
				if (sens != null) {
					//console.log(JSON.parse(JSON.stringify(sens)));
					const sensSplit = sens.split(', ');
					//console.log(JSON.parse(JSON.stringify(sensSplit)));
					var sensTr = '';
					sensSplit.forEach(function (el) {
						//console.log(JSON.parse(JSON.stringify(el))); 
						sensTr = remplSens(el) + ' ' + sensTr;
					}
					);
					return sensTr;
				}
			},
			"di": (diC) => {
				return remplDi(diC);
			},
			"languages": (languages) => {
				if (languages != null) {
					//console.log(JSON.parse(JSON.stringify(languages)));
					const languagesSplit = languages.split('; ');
					var languagesFin = '';
					var languagesTr = '';
					languagesSplit.forEach(function (el) {
						languagesTr = remplLanguages[el.toLowerCase()];
						if (languagesTr != null) {
							if (languagesFin == '') {
								languagesFin = languagesTr;
							} else {
								languagesFin = languagesFin + ' ; ' + languagesTr;
							}
						}
					});
					return languagesFin;
				}
			}
		});
		if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") ) {
			CONFIG.DND5E.encumbrance.currencyPerWeight = 100;
			CONFIG.DND5E.encumbrance.strMultiplier = 7.5;
			CONFIG.DND5E.movementUnits = {
				"m": "DND5E.DistFt",
				"km": "DND5E.DistMi"
			}
		}
	}
});

// un ptit disclaimer de version dd5 & babele parce que bon ... 
Hooks.once('ready', () => {
	if (!game.user.isGM) return;
	if (game.settings.get("dnd5e_fr-FR", "noCtrlVersions") ) return;
	if (game.system.data.name == "dnd5e" && game.system.data.version < "1.2.2") {
		ChatMessage.create({
			"content": "<strong>Version dnd5e obsolète : </strong></br> Cette version du module fr a été vérifiée pour les versions de dnd5e v1.1.1. </br> Vous retrouverez les versions adaptées à votre version de dnd5e sur <a href=\"https://foundryvtt.com/packages/dnd5e_fr-FR/ \"> cette page  <\a>"
		})
	}
	if (game.modules.get("babele").active && game.modules.get("babele").data.version != "1.24") {
		ChatMessage.create({
			"content": "<strong>Version Babele non testée : </strong></br> Cette version du module fr a été vérifiée pour la version de Babele  v1.20"
		})
	}
});
// init fdp à 9m
Hooks.on('createActor', (actor) => {
	console.log(JSON.parse(JSON.stringify(actor.data.data.attributes.movement.walk)));
	if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") && actor.data.data.attributes.movement.walk == 30 ) {
		mergeObject(actor.data.data.attributes.movement, { units: "m", walk: 9 });
		//console.log(actor.data.data.attributes.movement);
		actor.update({ data: actor.data.data });
		actor.render(true);
	}
});

// pour transco les acteurs (chargement de scenar tout fait)
// éhontement adapté de babele
// options a ajouter dans le menu  ???
Hooks.on('renderActorSheet', (app, html, data) => {
	if (game.user.isGM && data.editable && game.settings.get("dnd5e_fr-FR", "importFR") ) {
		let title = "transcoFR";
		let openBtn = $(`<a class="tradFR" title="${title}"><i class="fas fa-chevron-circle-down"></i>${title}</a>`);
		openBtn.click(ev => {
			transcoActor(app.entity);
		});
		html.closest('.app').find('.tradFR').remove();
		let titleElement = html.closest('.app').find('.window-title');
		openBtn.insertAfter(titleElement);
	}
});

function transcoActor(actor) {
	//console.log(actor.data.data.attributes.movement.units);
	if (actor.compendium) return; //certainement plus nécessaire mais bon
	// TODO sécurité simple avant ajout d'un parmetre en option
	if (game.settings.get("core", "language") === "fr") {
	// passage des valeurs de déplacements en systeme metrique si besoin		
		let moveMetric = actor.data.data.attributes.movement; 
		if (moveMetric.units === "ft") {
			mergeObject(moveMetric, { units: "m" });
			// à améliorer :)
			mergeObject(moveMetric, { walk: moveMetric.walk * 0.3 });
			mergeObject(moveMetric, { burrow: moveMetric.burrow * 0.3 });
			mergeObject(moveMetric, { climb: moveMetric.climb * 0.3 });
			mergeObject(moveMetric, { fly: moveMetric.fly * 0.3 });
			mergeObject(moveMetric, { swim: moveMetric.swim * 0.3 });
		}
		let detailsFR = actor.data.data.details;
		if (detailsFR.alignment != null) { mergeObject(detailsFR, { alignment: typeAlignement[detailsFR.alignment.toLowerCase()] }) };
		if (detailsFR.type != null) { mergeObject(detailsFR, { type: typeCreature[detailsFR.type.toLowerCase()] }) };

		let traitsFR = actor.data.data.traits;
		if (traitsFR.senses != null) {
			const sensSplit = traitsFR.senses.split(', ');
			var sensTr = '';
			sensSplit.forEach(function (el) {
				sensTr = remplSens(el) + ' ' + sensTr;
			});
			mergeObject(traitsFR, { senses: sensTr });
		};
		if (traitsFR.languages.custom != null) {
			const languagesSplit = traitsFR.languages.custom.split('; ');
			var languagesFin = '';
			var languagesTr = '';
			languagesSplit.forEach(function (el) {
				languagesTr = remplLanguages[el.toLowerCase()];
				if (languagesTr != null) {
					if (languagesFin == '') {
						languagesFin = languagesTr;
					} else {
						languagesFin = languagesFin + ' ; ' + languagesTr;
					}
				}
			});
			mergeObject(traitsFR.languages, { custom: languagesFin });
		}
		if (traitsFR.di.custom != null) { mergeObject(traitsFR.di, { custom: remplDi(traitsFR.di.custom) }) };
		if (traitsFR.dr.custom != null) { mergeObject(traitsFR.dr, { custom: remplDi(traitsFR.dr.custom) }) };
	
		// on met à jour l'acteur !!! 
		actor.update({ data: actor.data.data });
	}
	// et si on voulait repasser en en ? 
	if (game.settings.get("core", "language") === "en") {
		let moveMetric = actor.data.data.attributes.movement;
		if (moveMetric.units === "m") {
			mergeObject(moveMetric, { units: "ft" });
		}
		actor.update({ data: actor.data.data });
	}
}

// pour passer les scenes en 1.5
Hooks.on('preCreateScene', (scenedata) => {
	if (!game.settings.get("dnd5e_fr-FR", "noConvMetre") ) {
		scenedata.gridDistance = 1.5
		scenedata.gridUnits = "m"
	}
})

// tri des compétences @rwanoux
async function trieAlphabFR() {
	const lists = document.getElementsByClassName("skills-list");
	for (let list of lists) {
		//	console.log(list.tagName)
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
Hooks.on("renderActorSheet", async function () {
	trieAlphabFR();
});
