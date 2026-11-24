/**
 * The ending sets of the three productive groups, 51 endings each in cell order (GD §4.3): present, imparfait, passé
 * simple, futur, subjonctif présent, subjonctif imparfait, conditionnel; then imperative 2sg/1pl/2pl, participe présent,
 * the four past participles and the infinitive. The er set keeps the infinitive's er inside the future and conditional
 * endings (lev + erai), so the er spelling rules share one trigger.
 *
 * Generated once from the aimer, finir and rompre tables of `models.ts` at commit 1e3c0a6 by
 * `scripts/fr/bootstrap-families.ts`, and maintained by hand from now on.
 */

export const erEndings: readonly string[] = [
  'e', 'es', 'e', 'ons', 'ez', 'ent',
  'ais', 'ais', 'ait', 'ions', 'iez', 'aient',
  'ai', 'as', 'a', 'âmes', 'âtes', 'èrent',
  'erai', 'eras', 'era', 'erons', 'erez', 'eront',
  'e', 'es', 'e', 'ions', 'iez', 'ent',
  'asse', 'asses', 'ât', 'assions', 'assiez', 'assent',
  'erais', 'erais', 'erait', 'erions', 'eriez', 'eraient',
  'e', 'ons', 'ez', 'ant', 'é', 'ée', 'és', 'ées', 'er',
];

export const irEndings: readonly string[] = [
  'is', 'is', 'it', 'issons', 'issez', 'issent',
  'issais', 'issais', 'issait', 'issions', 'issiez', 'issaient',
  'is', 'is', 'it', 'îmes', 'îtes', 'irent',
  'irai', 'iras', 'ira', 'irons', 'irez', 'iront',
  'isse', 'isses', 'isse', 'issions', 'issiez', 'issent',
  'isse', 'isses', 'ît', 'issions', 'issiez', 'issent',
  'irais', 'irais', 'irait', 'irions', 'iriez', 'iraient',
  'is', 'issons', 'issez', 'issant', 'i', 'ie', 'is', 'ies', 'ir',
];

export const reEndings: readonly string[] = [
  's', 's', 't', 'ons', 'ez', 'ent',
  'ais', 'ais', 'ait', 'ions', 'iez', 'aient',
  'is', 'is', 'it', 'îmes', 'îtes', 'irent',
  'rai', 'ras', 'ra', 'rons', 'rez', 'ront',
  'e', 'es', 'e', 'ions', 'iez', 'ent',
  'isse', 'isses', 'ît', 'issions', 'issiez', 'issent',
  'rais', 'rais', 'rait', 'rions', 'riez', 'raient',
  's', 'ons', 'ez', 'ant', 'u', 'ue', 'us', 'ues', 're',
];
