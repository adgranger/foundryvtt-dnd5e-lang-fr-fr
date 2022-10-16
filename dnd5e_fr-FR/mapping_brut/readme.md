Liste des mappings pour générer le squelette EN : 
 - à coller dans le répertoire compendium du module (../Data/modules/dnde_fr-FR/compendium)
 - lancer un monde
 - le bouton translation sur les compendiums exportera l'ensemble des clés ( sans les items redéfinis pour les monstres, cf issue babele), idéalement en mode 'compatibility' pour weblate

 => pour monsters et tables, le dossier avant_rework, permet de faire le delta (git) avant d'éventuels ajout dans les fichiers EN
    -> reprise manuelle des tables au format attendu babele
    -> pour initier les items des monstres : 
        - on export avec la clé "items": "items" dans le fichier de 'mapping_brut' concerné
        puis à partir du json généré : 
        - utilisation du site https://jsonformatter.org/json-parser# avec en règle de transfo JMESPath : 
           @.entries.*.[name, {name: name, description: description, items: items[*].[name, {name: name}, system.{description: description.value}]}]
        - à partir de la sauvegarde du json généré, quelques manipulation pour obtenir le json voulu  (ajout label, entries & mise en forme)