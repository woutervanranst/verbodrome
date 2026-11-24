// Builds the query lists the characterization snapshots are generated from.
// It reads engine internals (the model table, the lexicons, the Dutch exception tables) to enumerate
// every lexical entry; plan 3 deletes this script, the generated JSON files stay.
import { readFile, writeFile } from 'node:fs/promises';
import { conjugate } from '../../src/index.js';
import type { ConjugationOptions } from '../../src/index.js';
import { aspiratedH, dualAuxiliary, essentialReflexives, etreVerbs, indirectReflexives, knownAvoirVerbs, restrictions } from '../../src/languages/fr/lexicon.js';
import { frenchModels } from '../../src/languages/fr/models.js';
import { dutchExceptions, dutchLoans, inseparableDerivatives, inseparableVerbs, separableVerbs } from '../../src/languages/nl/exceptions.js';
import { queryHeader } from './serialize.ts';
import type { CharacterizationQuery } from './serialize.ts';

type Query = Record<string, unknown> & CharacterizationQuery;

// Imported by a computed specifier so the type check of this package does not include the app's sources.
const verbsModule = '../../../../apps/verbodrome/src/config/verbs.ts';
const { VERBS } = await import(verbsModule) as {
  VERBS: readonly { readonly fr: string; readonly nl: { readonly infinitive: string } & Readonly<Record<string, unknown>> }[];
};

const run = (query: Query) => conjugate(query as unknown as ConjugationOptions);

const fixtureInfinitives = async (language: 'fr' | 'nl'): Promise<string[]> => {
  const url = new URL(`../../tests/fixtures/${language}.json`, import.meta.url);
  const fixtures = JSON.parse(await readFile(url, 'utf8')) as { infinitive: string }[];
  return [...new Set(fixtures.map(fixture => fixture.infinitive))];
};

// --- French ---

const derivatives = `conduire construire atteindre plaindre paraître inscrire circonvenir compromettre démentir inclure rebattre
annexer interviewer amonceler cacheter décrire taire suffire maudire nuire luire foutre raire asservir convenir advenir ressortir
interpeller interpeler assoir`.split(/\s+/u);

const probes = `bleder crebler pequer blexer zenir blettre glouloir plotoir blouvoir blouper ploucer glonger brumir plordre`.split(/\s+/u);

const consonantStart = /^[^aeiouyàâäéèêëîïôöùûüÿœæ]/iu;
const probeFor = (suffix: string): string => `${consonantStart.test(suffix) ? 'zo' : 'zol'}${suffix}`;

const elidesBefore = /^[aeiouyàâäéèêëîïôöùûüÿœæh]/iu;
const reflexiveFrench = (lemma: string): string => (elidesBefore.test(lemma) ? `s'${lemma}` : `se ${lemma}`);

/** Options literals of `conjugate`, `first` and `parseConjugationOptions` calls in the unit tests that carry a hint or an agreement. */
const frenchHinted: readonly Query[] = [
  { language: 'fr', infinitive: 'aimer', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', precedingDirectObject: { gender: 'feminine', number: 'plural' } },
  ...(['model', 'classHint', 'both', 'wrongModel'] as const).map((kind): Query => ({
    language: 'fr', infinitive: 'ressortir', mood: 'indicative', tense: 'present', person: 3, number: 'singular', gender: 'masculine',
    ...(kind === 'model' ? { model: 'finir' } : kind === 'classHint' ? { classHint: 'ir' } : kind === 'both' ? { model: 'finir', classHint: 're' } : { model: 'aimer' }),
  })),
  { language: 'fr', infinitive: 'blouper', mood: 'indicative', tense: 'future', person: 1, number: 'singular', stems: { future: 'bloupr' } },
  { language: 'fr', infinitive: 'blouper', stems: { future: 'bloupr' } },
  { language: 'fr', infinitive: 'blouper', stems: {} },
  { language: 'fr', infinitive: 'émouvoir', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } },
  { language: 'fr', infinitive: 'accroître', mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'plural' } },
  ...[{ gender: 'feminine', number: 'singular' }, { gender: 'masculine', number: 'plural' }, { gender: 'feminine', number: 'plural' }].map((agreement): Query => (
    { language: 'fr', infinitive: 'croître', mood: 'participle', tense: 'past', agreement })),
  { language: 'fr', infinitive: 'croître', mood: 'participle', tense: 'past', preferredOrthography: 'traditional', agreement: { gender: 'feminine', number: 'singular' } },
  ...(['avoir', 'être'] as const).map((auxiliary): Query => (
    { language: 'fr', infinitive: 'convenir', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', gender: 'feminine', auxiliary })),
  ...(['avoir', 'être'] as const).map((auxiliary): Query => (
    { language: 'fr', infinitive: 'croître', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', auxiliary })),
  { language: 'fr', infinitive: 'croître', mood: 'indicative', tense: 'perfect', person: 1, number: 'plural', agreement: { gender: 'feminine', number: 'plural' } },
  { language: 'fr', infinitive: 'aimer', mood: 'participle', tense: 'past', agreement: { gender: 'feminine' } },
  { language: 'fr', infinitive: 'absoudre', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } },
  { language: 'fr', infinitive: 'absoudre', mood: 'participle', tense: 'past', preferredOrthography: 'traditional', agreement: { gender: 'masculine', number: 'singular' } },
  { language: 'fr', infinitive: 'dormir', precedingDirectObject: { gender: 'feminine', number: 'plural' } },
  { language: 'fr', infinitive: 'dormir', mood: 'participle', tense: 'past', agreement: { gender: 'feminine' } },
  ...['interpeler', 'interpeller'].flatMap((infinitive): Query[] => [
    { language: 'fr', infinitive, mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'plural' } },
    { language: 'fr', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'plural', preferredOrthography: 'traditional' },
  ]),
  ...['inclure', 'exclure', 'taire', 'dissoudre'].map((infinitive): Query => (
    { language: 'fr', infinitive, mood: 'participle', tense: 'past', agreement: { gender: 'feminine', number: 'singular' } })),
  { language: 'fr', infinitive: 'férir', mood: 'participle', tense: 'past', agreement: { gender: 'masculine', number: 'singular' } },
  // The tests never pass these two hints; probed here so the snapshot covers every option the engine accepts.
  { language: 'fr', infinitive: 'aimer', aspiratedH: true },
  { language: 'fr', infinitive: 'haïr', aspiratedH: false },
  { language: 'fr', infinitive: 'se parler', reflexiveObject: 'indirect' },
  { language: 'fr', infinitive: 'se laver', reflexiveObject: 'direct' },
  { language: 'fr', infinitive: 'se laver', reflexiveObject: 'indirect' },
];

/** Hints of the `model` option are inferred from the unhinted analysis, as `tests/fr-models.test.ts` does. */
const frenchModelEchoes: readonly Query[] = ['ploucer', 'atteindre', 'parler', 'brumir'].map((infinitive): Query => {
  const { analysis } = run({ language: 'fr', infinitive, mood: 'indicative', tense: 'present' });
  return { language: 'fr', infinitive, mood: 'indicative', tense: 'present', model: analysis.classification };
});

async function frenchQueries(): Promise<Query[]> {
  const corpus = await fixtureInfinitives('fr');
  const lemmas = new Set<string>(corpus);
  for (const model of frenchModels) {
    lemmas.add(model.id);
    for (const lemma of [...model.lemmas, ...model.except]) lemmas.add(lemma);
    for (const suffix of model.suffixes) lemmas.add(probeFor(suffix));
  }
  for (const set of [etreVerbs, dualAuxiliary, knownAvoirVerbs, indirectReflexives, essentialReflexives, aspiratedH]) {
    for (const lemma of set) lemmas.add(lemma);
  }
  for (const lemma of Object.keys(restrictions)) lemmas.add(lemma);
  for (const verb of VERBS) lemmas.add(verb.fr);
  for (const lemma of [...derivatives, ...probes]) lemmas.add(lemma);
  for (const lemma of [...indirectReflexives, ...essentialReflexives, ...corpus.slice(0, 30)]) lemmas.add(reflexiveFrench(lemma));

  const queries: Query[] = [];
  for (const infinitive of lemmas) {
    const base: Query = { language: 'fr', infinitive };
    queries.push(base, { ...base, gender: 'masculine' });
    let result: ReturnType<typeof run>;
    try {
      result = run(base);
    } catch {
      continue;
    }
    if (result.forms.some(form => form.variant.orthography !== 'both')) queries.push({ ...base, preferredOrthography: 'traditional' });
    if (result.analysis.auxiliaries.length > 1) {
      for (const auxiliary of result.analysis.auxiliaries) queries.push({ ...base, auxiliary });
    }
  }
  return [...queries, ...frenchHinted, ...frenchModelEchoes];
}

// --- Dutch ---

const dutchProbes = 'zorpen zorven zollen trapen opzorpen verzorpen bezorpelen wandelen blieken'.split(/\s+/u);

const dutchHinted: readonly Query[] = [
  { language: 'nl', infinitive: 'vergissen', reflexive: false },
  { language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'past', person: 1, number: 'plural', stems: { pastPlural: 'zurpen' } },
  { language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'pluperfect', person: 1, number: 'plural', stems: { pastPlural: 'zurpen' } },
  { language: 'nl', infinitive: 'zorpen', stems: {} },
  { language: 'nl', infinitive: 'zorpen', stems: { stem: 'zorp' } },
  { language: 'nl', infinitive: 'opzorpen', separablePrefix: 'OP', stems: { stem: 'ZORP' } },
  ...(['gaan', 'staan', 'slaan'] as const).flatMap((infinitive): Query[] => [
    { language: 'nl', infinitive, mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true },
    { language: 'nl', infinitive, mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'u', inversion: true },
  ]),
  { language: 'nl', infinitive: 'rijden', mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true },
  { language: 'nl', infinitive: 'houden', mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'je', inversion: true },
  { language: 'nl', infinitive: 'werken', mood: 'indicative', tense: 'present', pronoun: 'u' },
  { language: 'nl', infinitive: 'werken', pronoun: 'u', person: 1 },
  { language: 'nl', infinitive: 'werken', mood: 'subjunctive' },
  { language: 'nl', infinitive: 'werken', gender: 'feminine' },
];

async function dutchQueries(): Promise<Query[]> {
  const corpus = await fixtureInfinitives('nl');
  const lemmas = new Set<string>(corpus);
  for (const table of [dutchExceptions, separableVerbs, inseparableDerivatives, inseparableVerbs, dutchLoans]) {
    for (const lemma of Object.keys(table)) lemmas.add(lemma);
  }
  for (const verb of VERBS) lemmas.add(verb.nl.infinitive);
  for (const lemma of ['voorkomen', 'overleggen', 'doorlopen', 'overlopen', 'ondergaan', ...dutchProbes]) lemmas.add(lemma);
  for (const lemma of ['vergissen', 'schamen', 'bemoeien', ...corpus.slice(0, 10)]) lemmas.add(`zich ${lemma}`);

  const bases: Query[] = [...lemmas].map(infinitive => ({ language: 'nl', infinitive }));
  // Dutch counterparts with the lexical hints the trainer passes along (not the prompt-only complement and tail).
  for (const { nl } of VERBS) {
    const { complement: _complement, tail: _tail, ...hinted } = nl;
    if (Object.keys(hinted).length > 1) bases.push({ language: 'nl', ...hinted });
  }
  return [
    ...bases.flatMap(base => [base, { ...base, pronoun: 'u' }, { ...base, pronoun: 'het' }, { ...base, inversion: true }]),
    ...dutchHinted,
  ];
}

// --- Output ---

/** Sorted by header, one query per header. */
function normalize(queries: readonly Query[]): Query[] {
  const byHeader = new Map(queries.map(query => [queryHeader(query), query] as const));
  return [...byHeader].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, query]) => query);
}

const directory = new URL('../../tests/characterization/', import.meta.url);
for (const [language, queries] of [['fr', await frenchQueries()], ['nl', await dutchQueries()]] as const) {
  const sorted = normalize(queries);
  await writeFile(new URL(`${language}.queries.json`, directory), `[\n${sorted.map(query => JSON.stringify(query)).join(',\n')}\n]\n`);
  console.log(`${language}: ${sorted.length} queries`);
}
