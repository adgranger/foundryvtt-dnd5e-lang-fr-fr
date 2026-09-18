const PATH = "modules/dnd5e_fr-FR/official-content-fr.json";

export function registerOfficialContentFr() {
  const cls = dnd5e.applications.WelcomeScreen;
  if ( !cls ) return;
  const original = cls.prototype.getModules;
  cls.prototype.getModules = async function() {
    const modules = await original.call(this);
    const fr = await fetch(PATH).then(r => r.json()).catch(() => null);
    if ( !fr ) return modules;
    for ( const category of Object.values(modules ?? {}) ) {
      for ( const [id, data] of Object.entries(category) ) Object.assign(data, fr[id] ?? {});
    }
    return modules;
  };
}
