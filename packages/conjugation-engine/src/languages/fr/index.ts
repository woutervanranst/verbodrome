import { renderWith } from '../../core/render.js';
import { ConjugationError } from '../../errors.js';
import { finiteFeatures, grammaticalPart, itemAt, personIndex } from '../../parts.js';
import type {
  Agreement, ConjugationPart, FormVariant, FrenchConjugationOptions, Gender,
  GeneratedForm, GenerationResult, GrammaticalNumber, ResolvedTarget, UnavailableTarget,
} from '../../types.js';
import type { LanguageEngine } from '../adapter.js';
import {
  aspiratedH, canonicalLemma, dualAuxiliary, essentialReflexives, etreVerbs, indirectReflexives, knownAvoirVerbs, restrictions,
} from './lexicon.js';
import { frenchModels, modelById, selectModel } from './models.js';
import type { FrenchModel, ModelChoice } from './models.js';
import { completeHints, hintCells } from './principal.js';
import { frenchRendering } from './rendering.js';
import { cellTexts, finiteSlot, infinitiveSlot, pastParticipleSlot, presentParticipleSlot } from './table.js';
import type { ModelKind, Paradigm, Spelling } from './table.js';

const genders = ['masculine', 'feminine'] as const;
const numbers = ['singular', 'plural'] as const;
const subjectPronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const;
const reflexivePronouns = ['me', 'te', 'se', 'nous', 'vous', 'se'] as const;
const compoundTenses = new Set(['perfect', 'pluperfect', 'past_anterior', 'future_perfect', 'past']);

/** One inflectional pattern of a verb: its forms per table cell and spelling. */
interface Inflection {
  readonly pattern: string | null;
  readonly usage: Paradigm['usage'];
  forms(cell: number, spelling: Spelling): string[] | null;
}

interface Lexeme {
  readonly lemma: string;
  readonly family: string;
  readonly kind: ModelKind;
  readonly model: FrenchModel | null;
  readonly source: 'lexicon' | 'regularRule' | 'explicitHint';
  readonly selector: string | null;
  readonly inflections: readonly Inflection[];
}

function inflections(lemma: string, model: FrenchModel, overrides: ReadonlyMap<number, string[]> = new Map()): Inflection[] {
  const stem = lemma.slice(0, lemma.length - model.strip);
  return model.paradigms.map(paradigm => ({
    pattern: paradigm.pattern, usage: paradigm.usage,
    forms: (cell, spelling) => overrides.get(cell) ?? cellTexts(stem, itemAt(paradigm.cells, cell), spelling, model.kind === 'er'),
  }));
}

function lexemeFor(lemma: string, choice: ModelChoice, source: Lexeme['source'], overrides?: ReadonlyMap<number, string[]>): Lexeme {
  const { model, selector } = choice;
  return { lemma, family: model.id, kind: model.kind, model, source, selector, inflections: inflections(lemma, model, overrides) };
}

const knownLexemes = new Map<string, Lexeme>();
function knownLexeme(lemma: string): Lexeme {
  let lexeme = knownLexemes.get(lemma);
  if (!lexeme) {
    const choice = selectModel(lemma);
    if (!choice) throw new ConjugationError('GENERATION_FAILURE', `Missing French model for ${lemma}.`);
    lexeme = lexemeFor(lemma, choice, 'lexicon');
    knownLexemes.set(lemma, lexeme);
  }
  return lexeme;
}

function regularChoice(lemma: string, kind: 'er' | 'ir' | 're'): ModelChoice {
  const choice = selectModel(lemma, frenchModels.filter(model => model.productive && model.kind === kind));
  if (!choice) throw new ConjugationError('INVALID_HINT', `French class ${kind} is incompatible with ${lemma}.`);
  return choice;
}

function hintedChoice(lemma: string, id: string): ModelChoice {
  const model = modelById(id);
  const selector = model && [...model.suffixes, ...model.lemmas]
    .filter(candidate => lemma.endsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];
  if (!model || !selector || model.strip > lemma.length) {
    throw new ConjugationError('INVALID_HINT', 'An irregular French model must be a known suffix of the requested infinitive.');
  }
  return { model, selector, listed: selector === lemma };
}

function lexicalModel(lemma: string, options: FrenchConjugationOptions): Lexeme {
  const hints = options.stems && Object.keys(options.stems).length ? options.stems : undefined;
  const modelClass = options.model === 'aimer' ? 'er' : options.model === 'finir' ? 'ir' : options.model === 'rendre' ? 're' : undefined;
  if (options.classHint && options.model && options.classHint !== modelClass) {
    throw new ConjugationError('INVALID_HINT', 'French classHint and model must describe the same regular class.');
  }
  const explicitClass = options.classHint ?? modelClass;
  let choice: ModelChoice | undefined;
  let source: Lexeme['source'];
  if (explicitClass) {
    if (!(explicitClass === 'ir' ? /[iï]r$/u.test(lemma) && !lemma.endsWith('oir') : lemma.endsWith(explicitClass))) {
      throw new ConjugationError('INVALID_HINT', `French class ${explicitClass} is incompatible with ${lemma}.`);
    }
    choice = regularChoice(lemma, explicitClass);
    source = 'explicitHint';
  } else if (options.model) {
    choice = hintedChoice(lemma, options.model);
    source = 'explicitHint';
  } else {
    choice = selectModel(lemma);
    source = choice && (choice.listed || !choice.model.productive) ? 'lexicon' : 'regularRule';
  }
  if (choice) return lexemeFor(lemma, choice, source, hints ? hintCells(hints, choice.model.kind) : undefined);
  if (!completeHints(hints)) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `No productive French model for ${lemma}; provide a compatible model or complete principal parts.`);
  }
  const cells = hintCells(hints, 'irregular');
  cells.set(infinitiveSlot, [lemma]);
  return {
    lemma, family: 'principal-parts', kind: 'irregular', model: null, source: 'explicitHint', selector: null,
    inflections: [{ pattern: null, usage: 'standard', forms: cell => cells.get(cell) ?? null }],
  };
}

function indirectReflexive(options: FrenchConjugationOptions, lemma: string): boolean {
  return options.reflexiveObject === 'indirect'
    || (options.reflexiveObject === undefined && indirectReflexives.has(lemma));
}

function isCompound(target: ResolvedTarget): boolean {
  return !(target.mood === 'participle' && target.tense === 'past') && compoundTenses.has(target.tense);
}

/** The table cell holding a non-compound target's verb form (near future/recent past use the infinitive). */
function simpleCell(target: ResolvedTarget): number {
  if (target.tense === 'near_future' || target.tense === 'recent_past' || target.mood === 'infinitive') return infinitiveSlot;
  if (target.mood === 'participle' && target.tense === 'past') return pastParticipleSlot(null, null);
  if (target.mood === 'participle' || target.mood === 'gerund') return presentParticipleSlot;
  return finiteSlot(target);
}

function lexicalPart(lemma: string, word: string, target: ResolvedTarget, aspirated: boolean): ConjugationPart {
  return grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, finiteFeatures(target), 'space', aspirated);
}

function clitic(target: ResolvedTarget, affirmative = false): ConjugationPart {
  const text = target.person === null ? 'se'
    : affirmative && target.person === 2 && target.number === 'singular' ? 'toi'
    : itemAt(reflexivePronouns, personIndex(target));
  return grammaticalPart(frenchRendering, 'reflexivePronoun', text, null, { person: target.person, number: target.number }, affirmative ? 'hyphen' : 'space');
}

function subject(target: ResolvedTarget): ConjugationPart {
  let text: string = itemAt(subjectPronouns, personIndex(target));
  if (target.person === 3 && target.gender === 'feminine') text = target.number === 'singular' ? 'elle' : 'elles';
  return grammaticalPart(frenchRendering, 'subject', text, null, { person: target.person, number: target.number, gender: target.gender });
}

function contextParts(target: ResolvedTarget): ConjugationPart[] {
  return [
    ...(target.mood === 'subjunctive' ? [grammaticalPart(frenchRendering, 'moodMarker', 'que')] : []),
    ...(target.person !== null && target.mood !== 'imperative' ? [subject(target)] : []),
    ...(target.mood === 'gerund' ? [grammaticalPart(frenchRendering, 'moodMarker', 'en')] : []),
  ];
}

function agreements(options: FrenchConjugationOptions, target: ResolvedTarget, auxiliary: string, reflexive: boolean, lexeme: Lexeme): Agreement[] {
  if (target.mood === 'participle' && target.tense === 'past') {
    if (lexeme.model?.impersonal) return [{ gender: 'masculine', number: 'singular' }];
    return (options.agreement?.gender ? [options.agreement.gender] : options.gender ? [options.gender] : genders).flatMap(gender =>
      (options.agreement?.number ? [options.agreement.number] : numbers).map(number => ({ gender, number })));
  }
  if (options.precedingDirectObject && (auxiliary === 'avoir' || reflexive)) return [options.precedingDirectObject];
  if (auxiliary === 'avoir' || (reflexive && indirectReflexive(options, lexeme.lemma))) {
    return [{ gender: 'masculine', number: 'singular' }];
  }
  const agreementGenders: readonly Gender[] = target.gender ? [target.gender]
    : options.agreement?.gender ? [options.agreement.gender] : options.gender ? [options.gender] : genders;
  const agreementNumbers: readonly GrammaticalNumber[] = target.number ? [target.number]
    : options.agreement?.number ? [options.agreement.number] : numbers;
  return agreementGenders.flatMap(gender => agreementNumbers.map(number => ({ gender, number })));
}

function compoundAuxiliaryTarget(target: ResolvedTarget, second = false): ResolvedTarget {
  const map: Readonly<Record<string, readonly [ResolvedTarget['mood'], ResolvedTarget['tense']]>> = {
    'indicative.perfect': ['indicative', 'present'],
    'indicative.pluperfect': ['indicative', 'imperfect'],
    'indicative.past_anterior': ['indicative', 'simple_past'],
    'indicative.future_perfect': ['indicative', 'future'],
    'subjunctive.past': ['subjunctive', 'present'],
    'subjunctive.pluperfect': ['subjunctive', 'imperfect'],
    'conditional.past': second ? ['subjunctive', 'imperfect'] : ['conditional', 'present'],
    'imperative.past': ['imperative', 'present'],
  };
  const pair = map[`${target.mood}.${target.tense}`];
  if (!pair) throw new ConjugationError('GENERATION_FAILURE', `No French auxiliary construction for ${target.mood}/${target.tense}.`);
  return { ...target, mood: pair[0], tense: pair[1], agreement: null };
}

function firstForm(lexeme: Lexeme, cell: number, spelling: Spelling): string {
  return itemAt(itemAt(lexeme.inflections, 0).forms(cell, spelling) ?? [], 0);
}

export function resolveFrench(options: FrenchConjugationOptions): LanguageEngine {
  const inputLemma = options.infinitive.replace(/^(se |s')/u, '');
  const reflexive = /^(se |s')/u.test(options.infinitive) || essentialReflexives.has(inputLemma);
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(inputLemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a French infinitive, optionally prefixed with se or s\'.');
  if (options.classHint && !(options.classHint === 'ir' ? /[iï]r$/u.test(inputLemma) : inputLemma.endsWith(options.classHint))) {
    throw new ConjugationError('INVALID_HINT', `Class ${options.classHint} is incompatible with ${inputLemma}.`);
  }
  const lexeme = lexicalModel(canonicalLemma(inputLemma), options);
  const { lemma, family, model } = lexeme;
  const invariable = model?.invariableParticiple ?? false;
  const restriction = restrictions[lemma] ?? {};
  const auxiliaries = reflexive ? ['être'] : dualAuxiliary.has(lemma) ? ['avoir', 'être'] : [etreVerbs.has(lemma) ? 'être' : 'avoir'];
  if (options.auxiliary && (reflexive || lexeme.source === 'lexicon' || etreVerbs.has(lemma) || knownAvoirVerbs.has(lemma)) && !auxiliaries.includes(options.auxiliary)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} does not accept auxiliary ${options.auxiliary} in this model.`);
  }
  if (options.reflexiveObject === 'indirect' && essentialReflexives.has(lemma)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} is essentially pronominal; its participle agrees with the subject.`);
  }
  if (options.precedingDirectObject && invariable) {
    throw new ConjugationError('INVALID_HINT', `${lemma} has an invariant verbal participle in this model; a preceding quantity does not license object agreement.`);
  }
  const selectedAuxiliaries = options.auxiliary ? [options.auxiliary] : auxiliaries;
  const knownAuxiliary = lexeme.source === 'lexicon' || etreVerbs.has(lemma) || dualAuxiliary.has(lemma) || knownAvoirVerbs.has(lemma);
  const aspirated = options.aspiratedH ?? aspiratedH.has(lemma);
  const spellings: readonly Spelling[] = options.preferredOrthography === 'traditional' ? ['traditional', 'rectified'] : ['rectified', 'traditional'];
  const hinted = Boolean(options.stems && Object.keys(options.stems).length);

  const available = (cell: number): boolean => lexeme.inflections.some(inflection =>
    spellings.some(spelling => (inflection.forms(cell, spelling)?.length ?? 0) > 0));

  function unavailable(target: ResolvedTarget): UnavailableTarget | null {
    const { mood, tense, person, number } = target;
    let reason: UnavailableTarget['reason'] | null = null;
    if ((model?.thirdPersonOnly || restriction.thirdPersonOnly) && person !== null && person !== 3) reason = 'defective';
    if (isCompound(target)) {
      if (model?.compounds === 'none' || (model?.compounds === 'nonFinite' && person !== null)
        || !available(pastParticipleSlot(null, null))) reason = 'defective';
    } else if (!available(simpleCell(target))) {
      reason = 'defective';
    }
    if (model?.impersonal && person !== null && (person !== 3 || (model.impersonal === 'singular' && number === 'plural'))) reason = 'impersonal';
    if ((model?.noImperative || restriction.noImperative) && mood === 'imperative') reason = 'noImperative';
    if (reflexive && mood === 'imperative' && tense === 'past') reason = 'noImperative';
    return reason ? {
      target, reason,
      explanation: `The reference paradigm of ${reflexive ? 'se ' : ''}${lemma} has no ${mood}/${tense} form in this slot.`,
      source: `https://leconjugueur.lefigaro.fr/conjugaison/verbe/${encodeURIComponent(lemma)}.html`,
    } : null;
  }

  function infinitiveParts(spelling: Spelling): ConjugationPart[] {
    return (itemAt(lexeme.inflections, 0).forms(infinitiveSlot, spelling) ?? []).map(word => grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, {
      mood: 'infinitive', tense: 'present', verbForm: 'infinitive',
    }, 'space', aspirated));
  }

  return {
    verbId: reflexive ? renderWith(frenchRendering, [grammaticalPart(frenchRendering, 'reflexivePronoun', 'se'), grammaticalPart(frenchRendering, 'lexicalVerb', lemma, lemma, {}, 'space', aspirated)]) : lemma,
    analysis: {
      lemma, classification: family, classificationSource: hinted ? 'explicitHint' : lexeme.source,
      reflexive, auxiliaries: selectedAuxiliaries,
      assumptions: [
        ...(lexeme.source === 'regularRule' ? [`${lemma} uses the regular ${lexeme.kind} model; lexical meaning and nonproductive classes cannot be inferred from spelling.`] : []),
        ...(lexeme.source === 'lexicon' && model && lexeme.selector !== lemma && !model.productive
          ? [`${lemma} is inflected like ${family} from its -${lexeme.selector} ending.`] : []),
        ...(!reflexive && !options.auxiliary && !knownAuxiliary ? ['An unlisted non-reflexive verb defaults to avoir.'] : []),
        ...(reflexive && !options.reflexiveObject && !essentialReflexives.has(lemma) && !indirectReflexives.has(lemma) ? ['The reflexive pronoun is assumed direct; specify indirect-object context when needed.'] : []),
        ...(lemma.startsWith('h') && options.aspiratedH === undefined && !aspiratedH.has(lemma) ? ['An unlisted initial h is assumed mute.'] : []),
      ],
    },
    generate(baseTarget): GenerationResult {
      const absent = unavailable(baseTarget);
      if (absent) return { forms: [], unavailable: [absent] };
      const forms: GeneratedForm[] = [];
      const { mood, tense } = baseTarget;
      const simpleParticiple = mood === 'participle' && tense === 'past';
      const compound = isCompound(baseTarget);
      const impersonalSubject = model?.impersonal === 'singular' || (model?.impersonal === 'figurativePlural' && baseTarget.number === 'singular');
      const targetGenders = (auxiliary: string): readonly (Gender | null)[] => {
        const subjectAgreement = compound && auxiliary === 'être' && !invariable
          && !(reflexive && (indirectReflexive(options, lemma) || options.precedingDirectObject));
        return !impersonalSubject && (baseTarget.person === 3 || (baseTarget.person !== null && subjectAgreement))
          ? options.gender ? [options.gender] : genders : [null];
      };
      for (const inflection of lexeme.inflections) for (const spelling of spellings)
        for (const compoundAuxiliary of compound ? selectedAuxiliaries : [''])
          for (const gender of targetGenders(compoundAuxiliary)) {
        const target = { ...baseTarget, gender };
        const variant = (auxiliary: string | null = null, construction: string | null = null): FormVariant => ({
          orthography: spelling, auxiliary,
          pattern: [inflection.pattern, construction].filter(Boolean).join('.') || null,
          usage: inflection.usage === 'dated' ? 'dated'
            : (['simple_past', 'past_anterior'].includes(tense) || (mood === 'subjunctive' && ['imperfect', 'pluperfect'].includes(tense)) || construction === 'past-second' ? 'literary' : 'standard'),
          condition: model?.impersonal === 'figurativePlural' && target.number === 'plural' ? 'figurative'
            : auxiliary && auxiliaries.length > 1 ? `${auxiliary}: auxiliary choice depends on construction or lexical sense.` : null,
        });
        const add = (parts: readonly ConjugationPart[], resolved: ResolvedTarget = target, auxiliary: string | null = null, construction: string | null = null): void => {
          forms.push({
            target: resolved, parts, variant: variant(auxiliary, construction),
            ruleIds: [`fr.${family}.${mood}.${tense}`, ...(compound ? ['fr.compound.active', 'fr.participle.agreement'] : []), `fr.spelling.${spelling}`],
          });
        };
        const prefix = contextParts(target);
        if (tense === 'near_future' || tense === 'recent_past') {
          const auxiliary = tense === 'near_future' ? 'aller' : 'venir';
          const auxTarget = { ...target, mood: 'indicative' as const, tense: 'present' as const };
          const word = firstForm(knownLexeme(auxiliary), finiteSlot(auxTarget), spelling);
          for (const infinitive of infinitiveParts(spelling)) {
            add([
              ...prefix, grammaticalPart(frenchRendering, 'auxiliary', word, auxiliary, finiteFeatures(auxTarget)),
              ...(tense === 'recent_past' ? [grammaticalPart(frenchRendering, 'linker', 'de')] : []),
              ...(reflexive ? [clitic(target)] : []), infinitive,
            ], target, auxiliary);
          }
        } else if (simpleParticiple) {
          if (invariable) {
            for (const word of inflection.forms(pastParticipleSlot(null, null), spelling) ?? []) {
              add([grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' }, 'space', aspirated)]);
            }
            continue;
          }
          for (const agreement of agreements(options, target, '', reflexive, lexeme)) {
            for (const word of inflection.forms(pastParticipleSlot(agreement.gender, agreement.number), spelling) ?? []) {
              add([grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, {
                mood: 'participle', tense: 'past', gender: agreement.gender, number: agreement.number, verbForm: 'pastParticiple',
              }, 'space', aspirated)], { ...target, agreement });
            }
          }
        } else if (compound) {
          const auxiliary = compoundAuxiliary;
          const auxLexeme = knownLexeme(auxiliary);
          const constructions = mood === 'conditional' ? [false, true] : [false];
          for (const second of constructions) for (const agreement of agreements(options, target, auxiliary, reflexive, lexeme)) {
            const resolved = { ...target, agreement: invariable ? null : agreement };
            const cell = invariable ? pastParticipleSlot(null, null) : pastParticipleSlot(agreement.gender, agreement.number);
            for (const word of inflection.forms(cell, spelling) ?? []) {
              const pp = grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, {
                mood: 'participle', tense: 'past', gender: invariable ? null : agreement.gender,
                number: invariable ? null : agreement.number, verbForm: 'pastParticiple',
              }, 'space', aspirated);
              let auxParts: ConjugationPart[];
              if (target.person !== null) {
                const auxTarget = compoundAuxiliaryTarget(target, second);
                auxParts = [grammaticalPart(frenchRendering, 'auxiliary', firstForm(auxLexeme, finiteSlot(auxTarget), spelling), auxiliary, finiteFeatures(auxTarget))];
              } else if (mood === 'infinitive') {
                auxParts = [grammaticalPart(frenchRendering, 'auxiliary', auxiliary, auxiliary, { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' })];
              } else {
                auxParts = [grammaticalPart(frenchRendering, 'auxiliary', firstForm(auxLexeme, presentParticipleSlot, spelling), auxiliary, {
                  mood: 'participle', tense: 'present', verbForm: 'presentParticiple',
                })];
              }
              add([...prefix, ...(reflexive ? [clitic(target)] : []), ...auxParts, pp], resolved, auxiliary, mood === 'conditional' ? second ? 'past-second' : 'past-first' : null);
            }
          }
        } else if (mood === 'infinitive') {
          for (const infinitive of infinitiveParts(spelling)) add([...(reflexive ? [clitic(target)] : []), infinitive]);
        } else if (mood === 'participle' || mood === 'gerund') {
          for (const word of inflection.forms(presentParticipleSlot, spelling) ?? []) {
            add([...prefix, ...(reflexive ? [clitic(target)] : []), grammaticalPart(frenchRendering, 'lexicalVerb', word, lemma, {
              mood: 'participle', tense: 'present', verbForm: 'presentParticiple',
            }, 'space', aspirated)]);
          }
        } else {
          for (const word of inflection.forms(finiteSlot(target), spelling) ?? []) {
            add([...prefix, ...(reflexive && mood !== 'imperative' ? [clitic(target)] : []),
              lexicalPart(lemma, word, target, aspirated), ...(reflexive && mood === 'imperative' ? [clitic(target, true)] : [])]);
          }
        }
      }
      return { forms, unavailable: [] };
    },
  };
}

/** Whether an infinitive is listed by name in the model inventory (rather than covered by a suffix). */
export function isListedFrenchLemma(lemma: string): boolean {
  return selectModel(lemma)?.listed ?? false;
}
