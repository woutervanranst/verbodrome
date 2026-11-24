/**
 * An invented language (`xx`) that exercises every hook of the staged engine. It is not a model of any language and is
 * never imported from `src/`. Infinitives end in -a; the present takes -o -as -at -amos -etes -ant (passive: -ur- before
 * them) and the past -i -is -it -imos -ites -int; the present participle ends in -ante; the perfect is haba (or esta) +
 * a past participle in -ado, which agrees in gender (-ada) standing alone, in the passive and after esta. The future is
 * the present of vada + a + the infinitive (literary: the infinitive + the present of haba); the conditional's future in
 * the past is the past of vada + the infinitive. Stems in -ph have a traditional and a rectified (-f) spelling; canta
 * has a literary long 1pl ending. The imperative exists only in the 2sg, adds -e to the stem and has no subject
 * pronoun. The `auxiliary` option narrows a verb's perfect auxiliaries to the one it names: a lexical hint is read in
 * `classify`, never by the core.
 *
 * A particle is separable (apzorpa: mi zorpo ap) unless the lexicon says otherwise; after an inseparable particle the
 * past participle ends in -ido (-ida). apvena has two readings, so two paradigms: separable and intransitive with esta
 * (il venat ap, il estat apvenado), or inseparable and transitive with haba (il apvenat, il habat apvenido); its forms
 * carry the pattern `separable` or `inseparable` and the condition `intransitive` or `transitive`. The `prefix` option
 * (separable or inseparable) keeps only the reading it names; the `auxiliary` option keeps the readings that take it.
 *
 * The simple past is one word for an ordinary verb (-ei -eis -eit -eimos -eites -eint) and a compound for a deponent
 * one (conata, `deponent` in the lexicon): the present of esta + the past participle, which agrees in gender. The
 * grammar's `cellOf` says which, lexeme by lexeme, and the periphrasis `applies` only to deponents.
 *
 * Subjects are slots: mi tu il nos vos ils by default, and on request the feminine ila (3sg.f) and the formal Vu
 * (2sg.formal), which addresses the listener but conjugates as a 3sg. The clause takes its pronoun from the slot.
 */
import { wordPart } from '../../src/core/clause.js';
import type { ClauseGrammar } from '../../src/core/clause.js';
import { defineRules, step } from '../../src/core/derivation.js';
import type { DerivationStep } from '../../src/core/derivation.js';
import { one } from '../../src/core/fork.js';
import type { Fork } from '../../src/core/fork.js';
import type { JunctureRule } from '../../src/core/juncture.js';
import { allPersons, moodEntries, noPersons, variantRank } from '../../src/core/pack.js';
import type { Citation, Work } from '../../src/core/sources.js';
import type { CatalogueEntry, LanguagePack, PackRendering, SubjectSlot } from '../../src/core/pack.js';
import type { ChainElement, Periphrasis } from '../../src/core/periphrasis.js';
import { stagedEngine, validateGrammar } from '../../src/core/staged.js';
import type { Cell, LexemeBase, StagedGrammar } from '../../src/core/staged.js';
import { ConjugationError } from '../../src/errors.js';
import { grammaticalPart, itemAt } from '../../src/parts.js';
import type { PartFeatures } from '../../src/types.js';

export const toyRules = defineRules({
  'xx.classify.listed': { stage: 'classify', kind: 'lexical' },
  'xx.classify.a-verb': { stage: 'classify' },
  'xx.assume.unlisted': { stage: 'classify', kind: 'assumption' },
  'xx.classify.separable': { stage: 'classify', params: { particle: 'text' } },
  'xx.classify.inseparable': { stage: 'classify', params: { particle: 'text' } },
  'xx.avail.no-participle': { stage: 'availability', kind: 'unavailable' },
  'xx.lex.present': { stage: 'stem', kind: 'lexical' },
  'xx.stem.drop-a': { stage: 'stem' },
  'xx.stem.listed': { stage: 'stem', kind: 'lexical' },
  'xx.end.present': { stage: 'ending', params: { ending: 'text', person: 'term', number: 'term' } },
  'xx.end.past': { stage: 'ending', params: { ending: 'text', tense: 'term' } },
  'xx.end.imperative': { stage: 'ending' },
  'xx.end.long': { stage: 'ending', params: { ending: 'text' } },
  'xx.end.simple-past': { stage: 'ending', params: { ending: 'text' } },
  'xx.end.passive': { stage: 'ending' },
  'xx.end.infinitive': { stage: 'ending' },
  'xx.end.present-participle': { stage: 'ending' },
  'xx.end.participle': { stage: 'ending', params: { ending: 'text' } },
  'xx.end.inseparable-participle': { stage: 'ending', params: { ending: 'text', particle: 'text' } },
  'xx.orth.c-qu': { stage: 'orthography', params: { vowel: 'text' } },
  'xx.orth.ph-f': { stage: 'orthography' },
  'xx.periphrasis.perfect': { stage: 'periphrasis', params: { auxiliary: 'text' } },
  'xx.periphrasis.passive-perfect': { stage: 'periphrasis' },
  'xx.periphrasis.future': { stage: 'periphrasis' },
  'xx.periphrasis.future-inverted': { stage: 'periphrasis' },
  'xx.periphrasis.conditional': { stage: 'periphrasis' },
  'xx.periphrasis.deponent-past': { stage: 'periphrasis' },
  'xx.agree.gender': { stage: 'clause', params: { gender: 'term' } },
  'xx.clause.particle-final': { stage: 'clause', params: { particle: 'text' } },
  'xx.clause.particle-attached': { stage: 'clause', params: { particle: 'text' } },
});

export const toyWorks = {
  toy: { id: 'toy', title: 'Toy Grammar', author: 'A. Invented', year: 2026 },
  'toy-lexicon': { id: 'toy-lexicon', title: 'The Toy Lexicon', url: 'https://example.org/toy-lexicon' },
} as const satisfies Record<string, Work>;

const grammarCitation = (locator: string): Citation => ({ work: 'toy', locator });
const lexiconCitation = (locator: string): Citation => ({ work: 'toy-lexicon', locator, url: 'https://example.org/toy-lexicon#entries' });

/** Every rule cites the grammar; rules that read the lexicon cite it too. */
export const toyCitations = {
  'xx.classify.listed': lexiconCitation('Entries'),
  'xx.classify.a-verb': grammarCitation('§1'),
  'xx.assume.unlisted': [grammarCitation('§1'), lexiconCitation('Entries')],
  'xx.classify.separable': [grammarCitation('§7.3'), lexiconCitation('Readings')],
  'xx.classify.inseparable': [grammarCitation('§7.3'), lexiconCitation('Readings')],
  'xx.avail.no-participle': grammarCitation('§4'),
  'xx.lex.present': lexiconCitation('Suppletive verbs'),
  'xx.stem.drop-a': grammarCitation('§1'),
  'xx.stem.listed': lexiconCitation('Stems'),
  'xx.end.present': grammarCitation('§2'),
  'xx.end.past': grammarCitation('§2.6'),
  'xx.end.imperative': grammarCitation('§2.7'),
  'xx.end.long': grammarCitation('§2.3'),
  'xx.end.simple-past': grammarCitation('§2.8'),
  'xx.end.passive': grammarCitation('§2.2'),
  'xx.end.infinitive': grammarCitation('§2.1'),
  'xx.end.present-participle': grammarCitation('§2.4'),
  'xx.end.participle': grammarCitation('§2.5'),
  'xx.end.inseparable-participle': grammarCitation('§2.5'),
  'xx.orth.c-qu': grammarCitation('§3.1'),
  'xx.orth.ph-f': grammarCitation('§3.2'),
  'xx.periphrasis.perfect': grammarCitation('§5.1'),
  'xx.periphrasis.passive-perfect': grammarCitation('§5.2'),
  'xx.periphrasis.future': grammarCitation('§5.3'),
  'xx.periphrasis.future-inverted': grammarCitation('§5.4'),
  'xx.periphrasis.conditional': grammarCitation('§5.5'),
  'xx.periphrasis.deponent-past': grammarCitation('§5.6'),
  'xx.agree.gender': grammarCitation('§6'),
  'xx.clause.particle-final': grammarCitation('§7.1'),
  'xx.clause.particle-attached': grammarCitation('§7.2'),
} as const satisfies Record<keyof typeof toyRules, Citation | readonly Citation[]>;

export interface ToyLexeme extends LexemeBase {
  /** The infinitive without its particle: what stems are formed from. */
  readonly base: string;
  /** Whole-word active present forms of a suppletive verb, singular 1-2-3 then plural 1-2-3. */
  readonly present: readonly string[] | null;
  /** Stems the lexicon lists for single present cells, keyed `person.number`. */
  readonly listedStems: Readonly<Record<string, string>>;
  readonly hasParticiple: boolean;
  /** Has the literary long 1pl present ending -amusse beside -amos. */
  readonly longPlural: boolean;
  /** A deponent verb has no one-word simple past: it forms it with esta and the past participle. */
  readonly deponent: boolean;
}

/** One reading of a particle verb whose particle is separable in one sense and inseparable in another. */
interface Reading {
  readonly separable: boolean;
  readonly auxiliaries: readonly string[];
  /** When the reading applies: the `condition` of its forms. */
  readonly condition: string;
}

interface Entry {
  readonly auxiliaries?: readonly string[];
  readonly particle?: string;
  /** One paradigm per reading, in this order; they replace `auxiliaries` and make the particle (in)separable. */
  readonly readings?: readonly Reading[];
  readonly present?: readonly string[];
  readonly stems?: Readonly<Record<string, string>>;
  readonly noParticiple?: true;
  readonly longPlural?: true;
  readonly deponent?: true;
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
  // A stem in -ph whose perfect auxiliary also has one: both words carry the spelling pair.
  grapha: { auxiliaries: ['epha'] },
  epha: {},
  canta: { longPlural: true },
  // Deponent: no one-word simple past, which is esta + the participle.
  conata: { deponent: true },
  // Separable and intransitive in one sense, inseparable and transitive in the other: two paradigms, never mixed.
  apvena: {
    particle: 'ap',
    readings: [
      { separable: true, auxiliaries: ['esta'], condition: 'intransitive' },
      { separable: false, auxiliaries: ['haba'], condition: 'transitive' },
    ],
  },
};

/** The lexeme of `lemma`; for an entry with readings, in `reading` (by default its first). */
function lexemeOf(lemma: string, reading?: Reading): ToyLexeme {
  const listed = Object.hasOwn(lexicon, lemma);
  const entry: Entry = listed ? lexicon[lemma]! : {};
  const chosen = reading ?? entry.readings?.[0];
  return {
    lemma,
    verbId: lemma,
    classId: entry.present ? 'suppletive' : 'a-verb',
    classSource: listed ? 'lexicon' : 'regularRule',
    reflexive: false,
    auxiliaries: chosen?.auxiliaries ?? entry.auxiliaries ?? ['haba'],
    particle: entry.particle ? { text: entry.particle, separable: chosen?.separable ?? true } : null,
    base: entry.particle ? lemma.slice(entry.particle.length) : lemma,
    present: entry.present ?? null,
    listedStems: entry.stems ?? {},
    hasParticiple: !entry.noParticiple,
    longPlural: entry.longPlural ?? false,
    deponent: entry.deponent ?? false,
  };
}

type FiniteCell = Extract<Cell, { kind: 'finite' }>;

const presentEndings = ['o', 'as', 'at', 'amos', 'etes', 'ant'] as const;
const pastEndings = ['i', 'is', 'it', 'imos', 'ites', 'int'] as const;
const simplePastEndings = ['ei', 'eis', 'eit', 'eimos', 'eites', 'eint'] as const;
const genders = ['masculine', 'feminine'] as const;

function slot(cell: FiniteCell): number {
  return (cell.number === 'plural' ? 3 : 0) + cell.person - 1;
}

type SpellingContext = { readonly lexeme: ToyLexeme; readonly cell: Cell };

/** Stem-final c is written qu before e. */
const cQu: JunctureRule<SpellingContext> = {
  info: toyRules['xx.orth.c-qu'],
  apply: j => j.stem.endsWith('c') && j.ending.startsWith('e') ? one({ stem: `${j.stem.slice(0, -1)}qu`, ending: j.ending }) : null,
  describe: (_, after) => ({ vowel: after.ending.charAt(0) }),
};

/** Stem-final ph: kept in the traditional spelling, written f in the rectified one. */
const phF: JunctureRule<SpellingContext> = {
  info: toyRules['xx.orth.ph-f'],
  apply: j => j.stem.endsWith('ph') ? [
    ...one(j, [], { orthography: 'traditional' }),
    ...one({ stem: `${j.stem.slice(0, -2)}f`, ending: j.ending }, [], { orthography: 'rectified' }),
  ] : null,
};

function ending(lexeme: ToyLexeme, cell: Cell, stem: string): Fork<string> {
  if (cell.kind === 'nonFinite') {
    if (cell.form === 'infinitive') return one('a', [step(toyRules['xx.end.infinitive'], stem, `${stem}a`)]);
    if (cell.form === 'presentParticiple') return one('ante', [step(toyRules['xx.end.present-participle'], stem, `${stem}ante`)]);
    if (cell.form !== 'participle') throw new ConjugationError('GENERATION_FAILURE', `No toy form ${cell.form}.`);
    const final = cell.agreement?.gender === 'feminine' ? 'a' : 'o';
    const particle = lexeme.particle;
    if (particle !== null && !particle.separable) {
      const text = `id${final}`;
      return one(text, [step(toyRules['xx.end.inseparable-participle'], stem, stem + text, { ending: text, particle: particle.text })]);
    }
    const text = `ad${final}`;
    return one(text, [step(toyRules['xx.end.participle'], stem, stem + text, { ending: text })]);
  }
  if (cell.mood === 'imperative') return one('e', [step(toyRules['xx.end.imperative'], stem, `${stem}e`)]);
  if (cell.tense === 'simple_past') {
    const personal = itemAt(simplePastEndings, slot(cell));
    return one(personal, [step(toyRules['xx.end.simple-past'], stem, stem + personal, { ending: personal })]);
  }
  if (cell.tense === 'past') {
    // The past has no passive. Its rule names the tense, which `explain` labels in the word's own mood.
    const personal = itemAt(pastEndings, slot(cell));
    return one(personal, [step(toyRules['xx.end.past'], stem, stem + personal, { ending: personal, tense: { term: 'tense', id: cell.tense } })]);
  }
  if (cell.tense !== 'present') throw new ConjugationError('GENERATION_FAILURE', `No toy simple tense ${cell.tense}.`);
  const personal = itemAt(presentEndings, slot(cell));
  const marker = cell.voice === 'passive' ? 'ur' : '';
  const regular = one(marker + personal, [
    ...(marker ? [step(toyRules['xx.end.passive'], stem, stem + marker)] : []),
    step(toyRules['xx.end.present'], stem + marker, stem + marker + personal, {
      ending: personal, person: { term: 'person', id: String(cell.person) }, number: { term: 'number', id: cell.number },
    }),
  ]);
  if (!lexeme.longPlural || marker || slot(cell) !== 3) return regular;
  return [...regular, ...one('amusse', [step(toyRules['xx.end.long'], stem, `${stem}amusse`, { ending: 'amusse' })], { usage: 'literary', pattern: 'long' })];
}

const present = { mood: 'indicative', tense: 'present' } as const;
const agreeingParticiple: ChainElement = { verb: 'main', nonFinite: 'participle', agree: true };

const periphrases: readonly Periphrasis<ToyLexeme>[] = [
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
  {
    // The auxiliary is conjugated in another mood than the target's: the indicative past inside a conditional.
    mood: 'conditional', tense: 'past', rule: toyRules['xx.periphrasis.conditional'],
    chain: [{ verb: { lemma: 'vada' }, finite: { mood: 'indicative', tense: 'past' } }, { verb: 'main', nonFinite: 'infinitive' }],
  },
  {
    // Only a deponent verb: an ordinary verb's simple past is a cell.
    mood: 'indicative', tense: 'simple_past', rule: toyRules['xx.periphrasis.deponent-past'], applies: lexeme => lexeme.deponent,
    chain: [{ verb: { lemma: 'esta' }, finite: present }, agreeingParticiple],
  },
];

const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  presentParticiple: { mood: 'participle', tense: 'present', verbForm: 'presentParticiple' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

export const toyRendering: PackRendering = {
  onset: text => /^[aeiou]/u.test(text) ? 'vowel' : 'consonant',
  sandhi: () => null,
  bareOmits: () => false,
};

const clause: ClauseGrammar<ToyLexeme> = {
  /** Only the past participle agrees in gender: standing alone, in the passive and after esta, never after haba. */
  agreements({ target, auxiliary }) {
    // Asked for a simple non-finite target, or for the past participle of a compound tense.
    const pastParticiple = target.mood === 'participle' ? target.tense === 'past' : target.mood !== 'infinitive';
    if (!pastParticiple || (auxiliary !== null && auxiliary !== 'esta')) return one(null);
    const number = target.number ?? 'singular';
    return genders.flatMap(gender =>
      one({ gender, number }, [step(toyRules['xx.agree.gender'], null, null, { gender: { term: 'gender', id: gender } })]));
  },
  /**
   * The subject slot's pronoun (none in the imperative), then the verbs in recipe order; a separable particle follows a
   * finite main verb at the end of the clause.
   */
  assemble(words, { lexeme, target, subject, rendering }) {
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
    const pronoun = target.mood === 'imperative' ? null : subject?.pronoun ?? null;
    const subjectParts = subject === null || pronoun === null ? [] : [grammaticalPart(
      rendering, 'subject', pronoun, null, { person: subject.person, number: subject.number, gender: subject.gender ?? null },
    )];
    if (!separated) return one([...subjectParts, ...verbs]);
    return one(
      [...subjectParts, ...verbs, grammaticalPart(rendering, 'particle', particle.text)],
      [step(toyRules['xx.clause.particle-final'], null, null, { particle: particle.text })],
    );
  },
};

/** How a lexeme is classified: from the lexicon, or by its -a ending with the assumption that it is regular. */
function classification(lexeme: ToyLexeme): DerivationStep[] {
  return lexeme.classSource === 'lexicon'
    ? [step(toyRules['xx.classify.listed'], lexeme.lemma, lexeme.classId)]
    : [step(toyRules['xx.classify.a-verb'], lexeme.lemma, lexeme.classId), step(toyRules['xx.assume.unlisted'], null, null)];
}

/**
 * One paradigm per reading of `lemma`, or the one paradigm of a verb without readings. A reading adds the step that
 * says whether its particle separates, and tags its forms with that (`pattern`) and with when it applies (`condition`).
 */
function paradigmsOf(lemma: string): Fork<ToyLexeme> {
  const readings = Object.hasOwn(lexicon, lemma) ? lexicon[lemma]!.readings : undefined;
  if (readings === undefined) {
    const lexeme = lexemeOf(lemma);
    return one(lexeme, classification(lexeme));
  }
  return readings.map(reading => {
    const lexeme = lexemeOf(lemma, reading);
    const rule = reading.separable ? toyRules['xx.classify.separable'] : toyRules['xx.classify.inseparable'];
    return {
      value: lexeme,
      steps: [...classification(lexeme), step(rule, lemma, null, { particle: lexeme.particle!.text })],
      tags: { pattern: reading.separable ? 'separable' : 'inseparable', condition: reading.condition },
    };
  });
}

/** The paradigms whose particle is of the kind the `prefix` hint names; a verb with no such paradigm is an INVALID_HINT. */
function withPrefixHint(lemma: string, paradigms: Fork<ToyLexeme>, hint: unknown): Fork<ToyLexeme> {
  if (hint === undefined) return paradigms;
  const kept = paradigms.filter(({ value: { particle } }) => particle !== null && particle.separable === (hint === 'separable'));
  if (!kept.length) throw new ConjugationError('INVALID_HINT', `${lemma} has no ${String(hint)} particle.`);
  return kept;
}

/**
 * The paradigms that can take the auxiliary the `auxiliary` hint names, each narrowed to it, so the analysis and every
 * compound form follow the hint. A verb none of whose paradigms can take it is an INVALID_HINT.
 */
function withAuxiliaryHint(lemma: string, paradigms: Fork<ToyLexeme>, hint: unknown): Fork<ToyLexeme> {
  if (hint === undefined) return paradigms;
  const kept = paradigms.filter(({ value }) => typeof hint === 'string' && value.auxiliaries.includes(hint));
  if (typeof hint !== 'string' || !kept.length) throw new ConjugationError('INVALID_HINT', `${lemma} does not take the auxiliary ${String(hint)}.`);
  return kept.map(paradigm => ({ ...paradigm, value: { ...paradigm.value, auxiliaries: [hint] } }));
}

export const toyGrammar: StagedGrammar<ToyLexeme> = {
  /** The paradigms of the verb, narrowed by the `prefix` hint and then by the `auxiliary` hint. */
  classify(query) {
    const lemma = String(query.infinitive);
    if (!/^\p{L}+a$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'A toy infinitive is one word ending in -a.');
    return withAuxiliaryHint(lemma, withPrefixHint(lemma, paradigmsOf(lemma), query.prefix), query.auxiliary);
  },
  lexemeOf,
  cellOf(target, lexeme) {
    if (target.mood === 'infinitive') return { kind: 'nonFinite', form: 'infinitive' };
    if (target.mood === 'participle') return { kind: 'nonFinite', form: target.tense === 'present' ? 'presentParticiple' : 'participle' };
    if (target.person === null || target.number === null) return null;
    if (target.mood === 'imperative') return { kind: 'finite', mood: 'imperative', tense: 'present', person: target.person, number: target.number };
    // A deponent verb's simple past is periphrastic; every other verb has it as a cell.
    const simple = target.tense === 'present' || target.tense === 'past' || (target.tense === 'simple_past' && !lexeme.deponent);
    if (target.mood !== 'indicative' || !simple) return null;
    // Active is the unmarked voice, so an active cell is the same cell a periphrasis asks for.
    return {
      kind: 'finite', mood: 'indicative', tense: target.tense, person: target.person, number: target.number,
      ...(target.voice === 'passive' ? { voice: 'passive' as const } : {}),
    };
  },
  availability(lexeme, target) {
    const needsParticiple = target.tense === 'perfect' || (target.mood === 'participle' && target.tense === 'past');
    if (lexeme.hasParticiple || !needsParticiple) return null;
    return { reason: 'defective', step: step(toyRules['xx.avail.no-participle'], null, null), source: 'Toy grammar §4' };
  },
  cell(lexeme, cell) {
    if (!lexeme.present || cell.kind !== 'finite' || cell.mood !== 'indicative' || cell.tense !== 'present' || cell.voice === 'passive') return null;
    const word = itemAt(lexeme.present, slot(cell));
    return one(word, [step(toyRules['xx.lex.present'], lexeme.lemma, word)]);
  },
  stem(lexeme, cell) {
    const stem = lexeme.base.slice(0, -1);
    const derived = one(stem, [step(toyRules['xx.stem.drop-a'], lexeme.base, stem)]);
    const listed = cell.kind === 'finite' ? lexeme.listedStems[`${cell.person}.${cell.number}`] : undefined;
    return listed === undefined ? derived : [...derived, ...one(listed, [step(toyRules['xx.stem.listed'], lexeme.base, listed)])];
  },
  ending,
  orthography: [cQu, phF],
  periphrases,
  clause,
};
validateGrammar(toyGrammar);

const voiced = (entry: CatalogueEntry): CatalogueEntry =>
  entry.tense === 'present' || entry.tense === 'perfect' ? Object.freeze({ ...entry, voices: Object.freeze(['active', 'passive'] as const) }) : entry;

export const toyCatalogue: readonly CatalogueEntry[] = [
  ...moodEntries('indicative', 'Indicative', allPersons, [['present', 'Present'], ['past', 'Past'], ['perfect', 'Perfect'], ['future', 'Future'], ['simple_past', 'Simple past']]).map(voiced),
  // The conditional's past has another label than the indicative's.
  ...moodEntries('conditional', 'Conditional', allPersons, [['past', 'Future in the past']]),
  ...moodEntries('imperative', 'Imperative', [[2, 'singular']], [['present', 'Present']]),
  ...moodEntries('infinitive', 'Infinitive', noPersons, [['present', 'Present']]),
  ...moodEntries('participle', 'Participle', noPersons, [['present', 'Present'], ['past', 'Past']]),
];

/** The default slots first in each person and number; ila and Vu only when a query names them. */
export const toySubjects: readonly SubjectSlot[] = [
  { id: '1sg', person: 1, number: 'singular', pronoun: 'mi', default: true },
  { id: '2sg', person: 2, number: 'singular', pronoun: 'tu', default: true },
  { id: '3sg', person: 3, number: 'singular', pronoun: 'il', gender: 'masculine', default: true },
  { id: '3sg.f', person: 3, number: 'singular', pronoun: 'ila', gender: 'feminine', default: false },
  { id: '2sg.formal', person: 3, number: 'singular', pronoun: 'Vu', register: 'formal', default: false },
  { id: '1pl', person: 1, number: 'plural', pronoun: 'nos', default: true },
  { id: '2pl', person: 2, number: 'plural', pronoun: 'vos', default: true },
  { id: '3pl', person: 3, number: 'plural', pronoun: 'ils', default: true },
];

export const toyPack: LanguagePack<'xx'> = {
  language: 'xx',
  label: 'Toy',
  catalogue: toyCatalogue,
  rendering: toyRendering,
  subjects: toySubjects,
  options: {
    fields: {
      voice: { kind: 'enum', values: ['active', 'passive'] },
      auxiliary: { kind: 'enum', values: ['haba', 'esta', 'epha'] },
      prefix: { kind: 'enum', values: ['separable', 'inseparable'] },
    },
  },
  rank: form => variantRank(form.variant, 'rectified'),
  engine: query => stagedEngine(toyGrammar, toyRendering, query),
  rules: toyRules,
  works: toyWorks,
  citations: toyCitations,
};
