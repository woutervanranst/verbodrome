/**
 * The runtime i18n check: every form, every unavailable target and every verb analysis a language produces for its
 * queries explains in every locale without throwing, and no rendered text (summary, section title, step) has a
 * placeholder left in it (`{`, `}`) or the word `undefined`. A language adds one entry to `checked`, with the engine
 * that conjugates it and the queries to run; a query that the engine rejects with a ConjugationError has nothing to
 * explain and is skipped.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Engine } from '../../src/core/engine.js';
import { ConjugationError } from '../../src/errors.js';
import { locales } from '../../src/i18n/locales/index.js';
import type { Explainable } from '../../src/i18n/explain.js';
import type { ConjugationResult } from '../../src/types.js';
import { engine } from '../../src/default-engine.js';

interface Checked {
  readonly language: string;
  readonly engine: Engine;
  readonly queries: readonly Readonly<Record<string, unknown>>[];
}

/** The queries of a language's characterization snapshot. */
const snapshotQueries = (language: string): Readonly<Record<string, unknown>>[] =>
  JSON.parse(readFileSync(new URL(`../characterization/${language}.queries.json`, import.meta.url), 'utf8')) as Readonly<Record<string, unknown>>[];

const checked: readonly Checked[] = [
  { language: 'nl', engine, queries: snapshotQueries('nl') },
  { language: 'fr', engine, queries: snapshotQueries('fr') },
  { language: 'en', engine, queries: [...(JSON.parse(readFileSync(new URL('../fixtures/en.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => file.infinitive), 'glorp', 'blit', 'frobe', 'glish', 'glotch', 'flox', 'bliz', 'plaw', 'plory', 'floy', 'snie', 'sklee', 'ploe', 'blye', 'plargue', 'ploto', 'zamic', 'squip', 'trimbit', 'reblit', 'frandel', 'outswim', 'walk', 'stop', 'hope', 'hop', 'try', 'panic', 'picnic', 'travel', 'cancel', 'label', 'model', 'equal', 'fuel', 'dial', 'compel', 'control', 'patrol', 'excel', 'prefer', 'occur', 'admit', 'visit', 'benefit', 'focus', 'target', 'combat', 'enter', 'conquer', 'profit', 'interpret', 'offer', 'develop', 'format', 'handicap', 'kidnap', 'program', 'worship', 'parallel', 'quiz', 'veto', 'echo', 'die', 'tie', 'dye', 'hoe', 'singe', 'agree', 'argue', 'glue', 'queue', 'solo', 'gas', 'fulfil', 'fulfill', 'dive', 'prove', 'learn', 'spell', 'sneak', 'light', 'spring', 'awake', 'show', 'sew', 'thrive', 'input', 'slay', 'misspell', 'underlie', 'outbid', 'behave', 'relay'].map(infinitive => ({ language: 'en', infinitive })) },
  {
    language: 'de', engine, queries: [...(JSON.parse(readFileSync(new URL('../fixtures/de.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => file.infinitive), 'schlinken', 'fralten', 'blagnen', 'plaxen', 'trissen', 'wumpeln', 'flompieren', 'verschlinken', 'aufschlinken', 'umschlinken', 'machen', 'arbeiten', 'atmen', 'reisen', 'sammeln', 'wandern', 'ändern', 'lächeln', 'studieren', 'anerkennen', 'verschlafen', 'herumfahren', 'rechnen', 'öffnen', 'mixen', 'küssen', 'regnen', 'kommen', 'gehen', 'sein', 'haben', 'backen', 'schreien', 'gelingen', 'geschehen', 'finden', 'halten', 'bitten', 'tun', 'lesen', 'essen', 'sitzen', 'helfen', 'gewinnen', 'stehlen', 'können', 'beantragen', 'bedingen', 'beugen', 'überzeugen', 'wagen', 'heissen']
      .flatMap(infinitive => [{ language: 'de', infinitive }, { language: 'de', infinitive, subject: '2.formal' }]),
  },
  {
    language: 'es', engine, queries: [...(JSON.parse(readFileSync(new URL('../fixtures/es.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => file.infinitive), 'blorpar', 'fluzar', 'trobacar', 'drolgar', 'rimiguar', 'plontuar', 'flobiar', 'blaular', 'troger', 'blorecer', 'treer', 'fluñir', 'plostuir', 'bladucir', 'blorparse', 'protener', 'blotener', 'reir', 'blodeír', 'trasoír', 'enviar', 'cambiar', 'continuar', 'aislar', 'rehusar', 'construir', 'huir', 'rehuir', 'freír', 'sofreír', 'sonreír', 'entreoír', 'componer', 'deshacer', 'rehacer', 'prever', 'mantener', 'retrotraer', 'morir', 'vestirse', 'sentarse', 'reírse', 'dormirse', 'irse', 'devolver', 'imprimir', 'nevar', 'estudiar', 'argüir', 'concernir', 'atañer', 'balbucir', 'pudrir', 'agriar', 'evacuar', 'engrosar']
      .flatMap(infinitive => [{ language: 'es', infinitive }, { language: 'es', infinitive, subject: '2sg.formal' }, { language: 'es', infinitive, gender: 'feminine', mood: 'indicative', tense: 'present' }]),
  },
  {
    language: 'it', engine, queries: [...new Set([...(JSON.parse(readFileSync(new URL('../fixtures/it.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => file.infinitive), ...readdirSync(new URL('../goldens/it/authority/', import.meta.url)).flatMap(name => (JSON.parse(readFileSync(new URL(`../goldens/it/authority/${name}`, import.meta.url), 'utf8')) as { cells: { lemma: string }[] }).cells.map(cell => cell.lemma)), 'blorpare', 'flugare', 'tricare', 'sbonciare', 'sbasciare', 'trongiare', 'trebiare', 'frogliare', 'strognare', 'blendere', 'flattere', 'flacere', 'tronire', 'sbradurre', 'stramettere', 'blomettere', 'blorparsi'])]
      .flatMap(infinitive => [{ language: 'it', infinitive }, { language: 'it', infinitive, subject: '3sg.formal' }]),
  },
  {
    language: 'la', engine, queries: [
      ...(JSON.parse(readFileSync(new URL('../fixtures/la.json', import.meta.url), 'utf8')) as { infinitive: string }[]).map(file => ({ language: 'la', infinitive: file.infinitive, gender: 'masculine', agreement: {} })),
      ...['blorpāre', 'flūdēre', 'tregere', 'plundīre', 'blorpārī', 'trapī', 'mundīrī', 'blorperi', 'dūcāre', 'recapere', 'flēscere', 'frolere', 'secāre', 'augēre', 'claudere', 'occidere', 'contingere', 'sepelīre', 'oblīvīscī', 'orīrī', 'audēre', 'fīdere', 'prōdesse', 'abesse', 'coepisse', 'meminisse', 'ōdisse', 'nōvisse', 'facere', 'calefacere', 'cōnficere', 'afferre', 'anteferre', 'adīre', 'exīre', 'dare', 'circumdare', 'edere', 'licēre', 'oportēre', 'paenitēre', 'pluere', 'tonāre', 'inquam', 'āiō', 'fārī', 'quaesō', 'cedo', 'salvēre', 'avēre', 'quīre', 'vēnīre', 'stāre', 'habere', 'possidēre']
        .map(infinitive => ({ language: 'la', infinitive })),
      { language: 'la', infinitive: 'blapere', stems: { present: 'blapiō' } }, { language: 'la', infinitive: 'tregere', stems: { present: 'tregeō' } },
    ],
  },
];

const leftover = /[{}]|undefined/u;

/** What is wrong with the explanations of one query's result, in every locale. */
function problemsOf({ language, engine }: Checked, query: Readonly<Record<string, unknown>>): string[] {
  let result: ConjugationResult;
  try {
    result = engine.conjugate(query);
  } catch (error) {
    if (error instanceof ConjugationError) return [];
    throw error;
  }
  const subjects: Explainable[] = [...result.forms, ...result.unavailableTargets, result.analysis];
  return Object.keys(locales).flatMap(locale => subjects.flatMap(subject => {
    const where = `${JSON.stringify(query)} (${locale})`;
    try {
      const { summary, sections } = engine.explain(language, subject, locale);
      const texts = [summary, ...sections.flatMap(section => [section.title, ...section.steps.map(s => s.text)])];
      return texts.filter(text => leftover.test(text)).map(text => `${where}: ${text}`);
    } catch (error) {
      return [`${where}: ${error instanceof Error ? error.message : String(error)}`];
    }
  }));
}

describe('runtime i18n', () => {
  it.each(checked.map(entry => [entry.language, entry] as const))('%s: every form, unavailable target and analysis explains in every locale', (_, entry) => {
    expect(entry.queries.length).toBeGreaterThan(0);
    const problems = entry.queries.flatMap(query => problemsOf(entry, query));
    expect(problems.slice(0, 20), `${problems.length} problems`).toEqual([]);
  }, 120_000);
});
