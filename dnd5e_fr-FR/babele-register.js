
Hooks.once('init', () => {

	if(typeof Babele !== 'undefined') {
		
		Babele.get().register({
			module: 'dnd5e_fr-FR',
			lang: 'fr',
			dir: 'compendium'
		});

		Babele.get().registerConverters({
			"weight": (value) => { return parseInt(value)/2 },
			"range": (range) => {
				if(range) {
					if(range.units === 'ft') {
						if(range.long) {
							range = mergeObject(range, { long: range.long*0.3 });
						}
						return mergeObject(range, { value: range.value*0.3 });
					}
					if(range.units === 'mi') {
						if(range.long) {
							range = mergeObject(range, { long: range.long*1.5 });
						}
						return mergeObject(range, { value: range.value*1.5 });
					}
					return range;
				}
			}
		});
	}
});