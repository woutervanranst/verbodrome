/**
 * An invented language (`xx`) that exercises every hook of the staged engine. It is not a model of any language and is
 * never imported from `src/`. Infinitives end in -a; the present takes -o -as -at -amos -etes -ant (passive: -ur- before
 * them); the perfect is haba (or esta) + a participle in -ado, which agrees in gender (-ada) except after haba.
 */
import { wordPart } from '../../src/core/clause.js';
import type { ClauseGrammar } from '../../src/core/clause.js';
import { defineRules, step } from '../../src/core/derivation.js';
import { one } from '../../src/core/fork.js';
import type { Fork } from '../../src/core/fork.js';
import type { JunctureRule } from '../../src/core/juncture.js';
import { allPersons, moodEntries, noPersons, variantRank } from '../../src/core/pack.js';
import type { CatalogueEntry, LanguagePack, PackRendering } from '../../src/core/pack.js';
import type { ChainElement, Periphrasis } from '../../src/core/periphrasis.js';
import { stagedEngine } from '../../src/core/staged.js';
import type { Cell, LexemeBase, StagedGrammar } from '../../src/core/staged.js';
import { ConjugationError } from '../../src/errors.js';
import { grammaticalPart, itemAt } from '../../src/parts.js';
import type { PartFeatures } from '../../src/types.js';

export const toyRules = defineRules({
  'xx.classify.listed': { stage: 'classify', kind: 'lexical' },
  'xx.classify.a-verb': { stage: 'classify' },
  'xx.assume.unlisted': { stage: 'classify', kind: 'assumption' },
  'xx.avail.no-participle': { stage: 'availability', kind: 'unavailable' },
  'xx.lex.present': { stage: 'stem', kind: 'lexical' },
  'xx.stem.drop-a': { stage: 'stem' },
  'xx.stem.listed': { stage: 'stem', kind: 'lexical' },
  'xx.end.present': { stage: 'ending', params: { ending: 'text', person: 'term', number: 'term' } },
  'xx.end.passive': { stage: 'ending' },
  'xx.end.infinitive': { stage: 'ending' },
  'xx.end.participle': { stage: 'ending', params: { ending: 'text' } },
  'xx.orth.c-qu': { stage: 'orthography' },
  'xx.periphrasis.perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'xx.periphrasis.passive-perfect': { stage: 'periphrasis' },
  'xx.periphrasis.future': { stage: 'periphrasis' },
  'xx.periphrasis.future-inverted': { stage: 'periphrasis' },
  'xx.agree.gender': { stage: 'clause', params: { gender: 'term' } },
  'xx.clause.particle-final': { stage: 'clause', params: { particle: 'text' } },
  'xx.clause.particle-attached': { stage: 'clause', params: { particle: 'text' } },
});

export interface ToyLexeme extends LexemeBase {
  /** The infinitive without its particle: what stems are formed from. */
  readonly base: string;
  /** Whole-word active present forms of a suppletive verb, singular 1-2-3 then plural 1-2-3. */
  readonly present: readonly string[] | null;
  /** Stems the lexicon lists for single present cells, keyed `person.number`. */
  readonly listedStems: Readonly<Record<string, string>>;
  readonly hasParticiple: boolean;
}

interface Entry {
  readonly auxiliaries?: readonly string[];
  readonly particle?: string;
  readonly present?: readonly string[];
  readonly stems?: Readonly<Record<string, string>>;
  readonly noParticiple?: true;
}

const lexicon: Readonly<Record<string, Entry>> = {
  haba: {},
  esta: {},
  vada: {},
  vena: { auxiliaries: ['haba', 'esta'] },
  esa: { present: ['so', 'es', 'est', 'somos', 'estes', 'sont'] },
  apzorpa: { particle: 'ap' },
  solea: { noParticiple: true },
  // Lists the 2pl stem the c-qu spelling rule already derives: two derivations of one form.
  roca: { stems: { '2.plural': 'roqu' } },
};

function lexemeOf(lemma: string): ToyLexeme {
  const listed = Object.hasOwn(lexicon, lemma);
  const entry: Entry = listed ? lexicon[lemma]! : {};
  return {
    lemma,
    verbId: lemma,
    classId: entry.present ? 'suppletive' : 'a-verb',
    classSource: listed ? 'lexicon' : 'regularRule',
    reflexive: false,
    auxiliaries: entry.auxiliaries ?? ['haba'],
    particle: entry.particle ? { text: entry.particle, separable: true } : null,
    base: entry.particle ? lemma.slice(entry.particle.length) : lemma,
    present: entry.present ?? null,
    listedStems: entry.stems ?? {},
    hasParticiple: !entry.noParticiple,
  };
}

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

const presentEndings = ['o', 'as', 'at', 'amos', 'etes', 'ant'] as const;
const subjectPronouns = ['mi', 'tu', 'il', 'nos', 'vos', 'ils'] as const;
const genders = ['masculine', 'feminine'] as const;

function slot(cell: FiniteCell): number {
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

const cQu: JunctureRule<{ readonly lexeme: ToyLexeme; readonly cell: Cell }> = {
  info: toyRules['xx.orth.c-qu'],
  apply: j => j.stem.endsWith('c') && j.ending.startsWith('e') ? one({ stem: `${j.stem.slice(0, -1)}qu`, ending: j.ending }) : null,
};

function ending(cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') return one('a', [step(toyRules['xx.end.infinitive'], stem, `${stem}a`)]);
    if (cell.form !== 'participle') throw new ConjugationError('GENERATION_FAILURE', `No toy form ${cell.form}.`);
    const text = cell.agreement?.gender === 'feminine' ? 'ada' : 'ado';
    return one(text, [step(toyRules['xx.end.participle'], stem, stem + text, { ending: text })]);
  }
  if (cell.tense !== 'present') throw new ConjugationError('GENERATION_FAILURE', `No toy simple tense ${cell.tense}.`);
  const personal = itemAt(presentEndings, slot(cell));
  const marker = cell.voice === 'passive' ? 'ur' : '';
  return one(marker + personal, [
    ...(marker ? [step(toyRules['xx.end.passive'], stem, stem + marker)] : []),
    step(toyRules['xx.end.present'], stem + marker, stem + marker + personal, {
      ending: personal, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
    }),
  ]);
}

const present = { mood: 'indicative', tense: 'present' } as const;
const agreeingParticiple: ChainElement = { verb: 'main', nonFinite: 'participle', agree: true };

const periphrases: readonly Periphrasis[] = [
  {
    mood: 'indicative', tense: 'perfect', voice: 'active', rule: toyRules['xx.periphrasis.perfect'],
    chain: [{ verb: 'perfectAuxiliary', finite: present }, agreeingParticiple],
  },
  {
    mood: 'indicative', tense: 'perfect', voice: 'passive', rule: toyRules['xx.periphrasis.passive-perfect'],
    chain: [{ verb: { lemma: 'esta' }, finite: present }, agreeingParticiple],
  },
  {
    mood: 'indicative', tense: 'future', rule: toyRules['xx.periphrasis.future'],
    chain: [{ verb: { lemma: 'vada' }, finite: present }, { word: 'a', role: 'linker' }, { verb: 'main', nonFinite: 'infinitive' }],
  },
  {
    mood: 'indicative', tense: 'future', rule: toyRules['xx.periphrasis.future-inverted'], pattern: 'inverted', usage: 'literary',
    chain: [{ verb: 'main', nonFinite: 'infinitive' }, { verb: { lemma: 'haba' }, finite: present }],
  },
];

const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

export const toyRendering: PackRendering = {
  onset: text => /^[aeiou]/u.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};

const clause: ClauseGrammar<ToyLexeme> = {
  /** The participle agrees in gender with the subject, except after haba. */
  agreements({ target, auxiliary }) {
    if (auxiliary === 'haba') return one(null);
    const number = target.number ?? 'singular';
    return genders.flatMap(gender =>
      one({ gender, number }, [step(toyRules['xx.agree.gender'], null, null, { gender: { term: 'gender', id: gender } })]));
  },
  /** Subject, then the verbs in recipe order; a separable particle follows a finite main verb at the end of the clause. */
  assemble(words, { lexeme, target, rendering }) {
    const particle = lexeme.particle;
    const separated = particle !== null && particle.separable
      && words.some(word => word.role === 'lexicalVerb' && word.cell?.kind === 'finite');
    const verbs = words.map(word => {
      const features = word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
      if (word.role !== 'lexicalVerb' || particle === null || separated) return wordPart(rendering, word, features);
      const attached = particle.text + word.text;
      const attachStep = step(toyRules['xx.clause.particle-attached'], word.text, attached, { particle: particle.text });
      return wordPart(rendering, { ...word, text: attached, steps: [...word.steps, attachStep] }, features);
    });
    const subject = target.person === null || target.number === null ? [] : [grammaticalPart(
      rendering, 'subject', itemAt(subjectPronouns, (target.number === 'plural' ? 3 : 0) + target.person - 1), null,
      { person: target.person, number: target.number },
    )];
    if (!separated) return one([...subject, ...verbs]);
    return one(
      [...subject, ...verbs, grammaticalPart(rendering, 'particle', particle.text)],
      [step(toyRules['xx.clause.particle-final'], null, null, { particle: particle.text })],
    );
  },
};

export const toyGrammar: StagedGrammar<ToyLexeme> = {
  classify(query) {
    const lemma = String(query.infinitive);
    if (!/^\p{L}+a$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'A toy infinitive is one word ending in -a.');
    const lexeme = lexemeOf(lemma);
    const steps = lexeme.classSource === 'lexicon'
      ? [step(toyRules['xx.classify.listed'], lemma, lexeme.classId)]
      : [step(toyRules['xx.classify.a-verb'], lemma, lexeme.classId), step(toyRules['xx.assume.unlisted'], null, null)];
    return { value: lexeme, steps, tags: {} };
  },
  lexemeOf,
  cellOf(target) {
    if (target.mood === 'infinitive') return { kind: 'nonFinite', form: 'infinitive' };
    if (target.mood === 'participle') return { kind: 'nonFinite', form: 'participle' };
    if (target.mood !== 'indicative' || target.tense !== 'present' || target.person === null || target.number === null) return null;
    // Active is the unmarked voice, so an active cell is the same cell a periphrasis asks for.
    return {
      kind: 'finite', mood: 'indicative', tense: 'present', person: target.person, number: target.number,
      ...(target.voice === 'passive' ? { voice: 'passive' as const } : {}),
    };
  },
  availability(lexeme, target) {
    if (lexeme.hasParticiple || (target.tense !== 'perfect' && target.mood !== 'participle')) return null;
    return { reason: 'defective', step: step(toyRules['xx.avail.no-participle'], null, null), source: 'Toy grammar §4' };
  },
  cell(lexeme, cell) {
    if (!lexeme.present || cell.kind !== 'finite' || cell.tense !== 'present' || cell.voice === 'passive') return null;
    const word = itemAt(lexeme.present, slot(cell));
    return one(word, [step(toyRules['xx.lex.present'], lexeme.lemma, word)]);
  },
  stem(lexeme, cell) {
    const stem = lexeme.base.slice(0, -1);
    const derived = one(stem, [step(toyRules['xx.stem.drop-a'], lexeme.base, stem)]);
    const listed = cell.kind === 'finite' ? lexeme.listedStems[`${cell.person}.${cell.number}`] : undefined;
    return listed === undefined ? derived : [...derived, ...one(listed, [step(toyRules['xx.stem.listed'], lexeme.base, listed)])];
  },
  ending: (_lexeme, cell, stem) => ending(cell, stem),
  orthography: [cQu],
  periphrases,
  clause,
};

const voiced = (entry: CatalogueEntry): CatalogueEntry =>
  entry.tense === 'present' || entry.tense === 'perfect' ? Object.freeze({ ...entry, voices: Object.freeze(['active', 'passive'] as const) }) : entry;

export const toyCatalogue: readonly CatalogueEntry[] = [
  ...moodEntries('indicative', 'Indicative', allPersons, [['present', 'Present'], ['perfect', 'Perfect'], ['future', 'Future']]).map(voiced),
  ...moodEntries('infinitive', 'Infinitive', noPersons, [['present', 'Present']]),
  ...moodEntries('participle', 'Participle', noPersons, [['past', 'Past']]),
];

export const toyPack: LanguagePack<'xx'> = {
  language: 'xx',
  label: 'Toy',
  catalogue: toyCatalogue,
  rendering: toyRendering,
  options: { fields: { voice: { kind: 'enum', values: ['active', 'passive'] } } },
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(toyGrammar, toyRendering, query),
};
