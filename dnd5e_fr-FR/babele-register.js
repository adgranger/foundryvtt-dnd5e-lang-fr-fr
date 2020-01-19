
Hooks.on('init', () => {

	if(typeof Babele !== 'undefined') {
		Babele.get().register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium'
		}); 
	}
});