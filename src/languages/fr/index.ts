import { ConjugationError } from '../../errors.js';
import { finiteFeatures, grammaticalPart, itemAt, personIndex } from '../../parts.js';
import { renderParts } from '../../render.js';
import type {
  Agreement, ConjugationPart, FormVariant, FrenchConjugationOptions, Gender,
  GeneratedForm, GenerationResult, GrammaticalNumber, ResolvedTarget, UnavailableTarget,
} from '../../types.js';
import type { LanguageEngine } from '../adapter.js';
import { frenchDerivativeFamilies, frenchExceptions } from './exceptions.js';
import type { FrenchParadigm } from './exceptions.js';
import { infinitiveSpelling } from './orthography.js';
import type { Spelling } from './orthography.js';
import { pastParticiple, presentParticiples, regularParadigms, simpleForms } from './rules.js';

const genders = ['masculine', 'feminine'] as const;
const numbers = ['singular', 'plural'] as const;
const subjectPronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'] as const;
const reflexivePronouns = ['me', 'te', 'se', 'nous', 'vous', 'se'] as const;
const etreVerbs = new Set([
  'aller', 'arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'retomber',
  'naître', 'renaître', 'mourir', 'décéder', 'venir', 'advenir', 'devenir',
  'intervenir', 'parvenir', 'provenir', 'revenir', 'survenir', 'échoir',
  'partir', 'repartir', 'sortir', 'ressortir',
]);
const dualAuxiliary = new Set([
  'choir', 'croître', 'déchoir', 'faillir', 'accourir', 'convenir', 'descendre', 'monter', 'remonter',
  'passer', 'repasser', 'retourner', 'rentrer', 'sortir', 'ressortir', 'demeurer',
]);
const indirectReflexives = new Set(['parler', 'téléphoner', 'mentir', 'nuire', 'succéder', 'sourire']);
const aspiratedH = new Set(['haïr', 'hacher', 'haleter', 'hanter', 'harceler', 'hâter', 'hisser', 'huer', 'hurler']);
const essentialReflexives = new Set(['méfier', 'souvenir', 'enfuir', 'abstenir', 'évanouir', 'repentir']);
const knownAvoirVerbs = new Set([
  'aimer', 'apprécier', 'assiéger', 'broyer', 'créer', 'céder', 'finir', 'jeter',
  'manger', 'modeler', 'payer', 'peser', 'placer', 'acheter', 'appeler', 'laver', 'parler',
  'asservir', 'interpeller',
]);

interface LexicalModel {
  readonly lemma: string;
  readonly family: string;
  readonly paradigms: readonly FrenchParadigm[];
  readonly source: 'lexicon' | 'regularRule' | 'explicitHint';
}

function prefixed(paradigm: FrenchParadigm, prefix: string): FrenchParadigm {
  const prefixedCells = (cells: Readonly<Partial<Record<number, string>>>): Readonly<Partial<Record<number, string>>> =>
    Object.fromEntries(Object.entries(cells).map(([index, text]) => [index, prefix + text]));
  return {
    ...paradigm,
    singular: prefix + (paradigm.singular === 'croî' ? 'croi' : paradigm.singular), plural: prefix + paradigm.plural,
    thirdPlural: prefix + paradigm.thirdPlural, future: prefix + paradigm.future,
    past: prefix + paradigm.past, participle: prefix + (['mû', 'crû'].includes(paradigm.participle) ? paradigm.participle.replace('û', 'u') : paradigm.participle),
    ...(paradigm.participle === 'dormi' && ['en', 'ren'].includes(prefix) ? { invariableParticiple: false } : {}),
    ...(paradigm.feminineParticiple ? { feminineParticiple: prefix + paradigm.feminineParticiple } : {}),
    ...(paradigm.subjunctiveSingular ? { subjunctiveSingular: prefix + paradigm.subjunctiveSingular } : {}),
    ...(paradigm.subjunctivePlural ? { subjunctivePlural: prefix + paradigm.subjunctivePlural } : {}),
    ...(paradigm.presentParticiple ? { presentParticiple: prefix + paradigm.presentParticiple } : {}),
    ...(paradigm.presentCells ? { presentCells: prefixedCells(paradigm.presentCells) } : {}),
    ...(paradigm.subjunctiveCells ? { subjunctiveCells: prefixedCells(paradigm.subjunctiveCells) } : {}),
    ...(paradigm.imperativeCells ? { imperativeCells: prefixedCells(paradigm.imperativeCells) } : {}),
  };
}

function indirectReflexive(options: FrenchConjugationOptions, lemma: string): boolean {
  return options.reflexiveObject === 'indirect'
    || (options.reflexiveObject === undefined && indirectReflexives.has(lemma));
}

function lexicalModel(lemma: string, options: FrenchConjugationOptions): LexicalModel {
  const traditional = lemma.replace(/assoir$/u, 'asseoir').replace(/sursoir$/u, 'surseoir')
    .replace(/interpeler$/u, 'interpeller');
  const canonical = Object.keys(frenchExceptions).find(key => key === traditional || key.replace(/î/gu, 'i') === traditional) ?? traditional;
  const modelClass = options.model === 'aimer' ? 'er' : options.model === 'finir' ? 'ir' : options.model === 'rendre' ? 're' : undefined;
  if (options.classHint && options.model && options.classHint !== modelClass) {
    throw new ConjugationError('INVALID_HINT', 'French classHint and model must describe the same regular class.');
  }
  const explicitClass = options.classHint ?? modelClass;
  if (explicitClass) {
    if (!(explicitClass === 'ir' ? /[iï]r$/u.test(canonical) && !canonical.endsWith('oir') : canonical.endsWith(explicitClass))) {
      throw new ConjugationError('INVALID_HINT', `French class ${explicitClass} is incompatible with ${canonical}.`);
    }
    return {
      lemma: canonical, family: `group${explicitClass === 'er' ? 1 : explicitClass === 'ir' ? 2 : 3}`,
      paradigms: regularParadigms(canonical, explicitClass), source: 'explicitHint',
    };
  }
  const direct = frenchExceptions[canonical];
  if (direct && !options.model) return { lemma: canonical, family: canonical, paradigms: direct, source: 'lexicon' };
  if (options.model && !['aimer', 'finir', 'rendre'].includes(options.model)) {
    const model = frenchExceptions[options.model];
    if (!model || !canonical.endsWith(options.model)) {
      throw new ConjugationError('INVALID_HINT', 'An irregular French model must be a known suffix of the requested infinitive.');
    }
    const prefix = canonical.slice(0, -options.model.length);
    return { lemma: canonical, family: options.model, paradigms: model.map(paradigm => prefixed(paradigm, prefix)), source: 'explicitHint' };
  }
  for (const [family, prefixes] of Object.entries(frenchDerivativeFamilies)) {
    const prefix = canonical.slice(0, -family.length);
    if (!canonical.endsWith(family) || !prefixes.includes(prefix)) continue;
    const paradigms = itemAt([frenchExceptions[family]], 0);
    if (!paradigms) throw new ConjugationError('GENERATION_FAILURE', `Missing French family ${family}.`);
    const derived = paradigms.map(paradigm => prefixed(paradigm, prefix));
    if (family === 'dire' && prefix !== 're') {
      return { lemma: canonical, family, paradigms: derived.map(paradigm => ({
        ...paradigm, presentCells: { ...paradigm.presentCells, 4: prefix + 'disez' },
      })), source: 'lexicon' };
    }
    return { lemma: canonical, family, paradigms: derived, source: 'lexicon' };
  }
  if (['concevoir', 'percevoir', 'apercevoir', 'décevoir'].includes(canonical)) {
    const replacement = canonical.slice(0, -6);
    const original = itemAt(itemAt([frenchExceptions['recevoir']], 0) ?? [], 0);
    const replace = (text: string): string => replacement + text.slice(2);
    return {
      lemma: canonical, family: 'recevoir', source: 'lexicon',
      paradigms: [{ ...original, singular: replace(original.singular), plural: replace(original.plural),
        thirdPlural: replace(original.thirdPlural), future: replace(original.future),
        past: replace(original.past), participle: replace(original.participle) }],
    };
  }
  if (canonical === 'prévoir') {
    const original = itemAt(frenchExceptions['voir'] ?? [], 0);
    return { lemma: canonical, family: 'voir', source: 'lexicon', paradigms: [{ ...prefixed(original, 'pré'), future: 'prévoir' }] };
  }
  if (['partir', 'sortir', 'mentir', 'repartir', 'ressortir'].includes(canonical)) {
    const root = canonical.slice(0, -2);
    return { lemma: canonical, family: 'dormir', source: 'lexicon', paradigms: [{
      kind: 'irregular', singular: root.slice(0, -1), plural: root, thirdPlural: root,
      future: canonical, past: root, pastVowel: 'i', participle: root + 'i',
    }] };
  }
  const kind = canonical.endsWith('er') ? 'er' : /[iï]r$/u.test(canonical) ? 'ir' : canonical.endsWith('re') ? 're' : undefined;
  if (!kind || canonical.endsWith('oir')) {
    const hints = options.stems;
    if (!hints?.singular || !hints.plural || !hints.future || !hints.past || !hints.pastVowel || !hints.pastParticiple) {
      throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `No productive French model for ${canonical}; provide a compatible model or complete principal parts.`);
    }
    return { lemma: canonical, family: 'principal-parts', source: 'explicitHint', paradigms: [{
      kind: 'irregular', singular: hints.singular, plural: hints.plural,
      thirdPlural: hints.thirdPlural ?? hints.plural, future: hints.future, past: hints.past,
      pastVowel: hints.pastVowel, participle: hints.pastParticiple,
    }] };
  }
  if (!(kind === 'ir' ? /[iï]r$/u.test(canonical) : canonical.endsWith(kind))) {
    throw new ConjugationError('INVALID_HINT', `French class ${kind} is incompatible with ${canonical}.`);
  }
  return {
    lemma: canonical, family: `group${kind === 'er' ? 1 : kind === 'ir' ? 2 : 3}`,
    paradigms: regularParadigms(canonical, kind),
    source: 'regularRule',
  };
}

function withHints(paradigm: FrenchParadigm, options: FrenchConjugationOptions): FrenchParadigm {
  const hints = options.stems;
  if (!hints) return paradigm;
  return {
    ...paradigm,
    ...(hints.singular ? { singular: hints.singular } : {}),
    ...(hints.plural ? { plural: hints.plural } : {}),
    ...(hints.thirdPlural ? { thirdPlural: hints.thirdPlural } : {}),
    ...(hints.future ? { future: hints.future, lexicalFuture: true } : {}),
    ...(hints.past ? { past: hints.past } : {}),
    ...(hints.pastVowel ? { pastVowel: hints.pastVowel } : {}),
    ...(hints.pastParticiple ? { participle: hints.pastParticiple } : {}),
  };
}

function unavailable(lemma: string, family: string, reflexive: boolean, target: ResolvedTarget): UnavailableTarget | null {
  const { mood, tense, person, number } = target;
  let reason: UnavailableTarget['reason'] | null = null;
  if (lemma === 'advenir' && person !== null && person !== 3) reason = 'defective';
  if (lemma === 'advenir' && mood === 'imperative') reason = 'noImperative';
  if (family === 'falloir' || family === 'pleuvoir') {
    if (person !== null && (person !== 3 || (number === 'plural' && family === 'falloir'))) reason = 'impersonal';
    if (mood === 'imperative') reason = 'noImperative';
    if (family === 'falloir' && ((mood === 'participle' || mood === 'gerund') && tense === 'present')) reason = 'defective';
  }
  if (['seoir', 'messeoir', 'échoir'].includes(family) && person !== null && person !== 3) reason = 'defective';
  if (['seoir', 'messeoir'].includes(family)) {
    const allowed = (mood === 'indicative' && ['present', 'imperfect', 'future', 'near_future', 'recent_past'].includes(tense))
      || (mood === 'conditional' && tense === 'present')
      || (mood === 'subjunctive' && tense === 'present')
      || (mood === 'participle' && ['present', 'past'].includes(tense))
      || (mood === 'infinitive' && tense === 'present')
      || (mood === 'gerund' && tense === 'present');
    if (!allowed) reason = 'defective';
  }
  if (family === 'gésir') {
    const allowed = (mood === 'indicative' && ['present', 'imperfect', 'near_future', 'recent_past'].includes(tense))
      || (mood === 'participle' && tense === 'present') || (mood === 'infinitive' && tense === 'present')
      || (mood === 'gerund' && tense === 'present');
    if (!allowed) reason = 'defective';
  }
  if (family === 'choir' && (
    (mood === 'indicative' && tense === 'imperfect')
    || (mood === 'subjunctive' && (tense === 'present' || (tense === 'imperfect' && !(person === 3 && number === 'singular'))))
    || (mood === 'imperative' && tense === 'present')
    || ((mood === 'participle' || mood === 'gerund') && tense === 'present')
  )) reason = 'defective';
  if (family === 'déchoir' && (
    (mood === 'indicative' && tense === 'imperfect') || (mood === 'imperative' && tense === 'present')
    || ((mood === 'participle' || mood === 'gerund') && tense === 'present')
  )) reason = 'defective';
  if (family === 'faillir' && mood === 'imperative') reason = 'noImperative';
  if (['absoudre', 'clore', 'paître', 'traire'].includes(family) && (
    (mood === 'indicative' && tense === 'simple_past') || (mood === 'subjunctive' && tense === 'imperfect')
  )) reason = 'defective';
  if (family === 'clore') {
    if (mood === 'indicative' && tense === 'imperfect') reason = 'defective';
    if (mood === 'indicative' && tense === 'present' && number === 'plural' && person !== 3) reason = 'defective';
    if (mood === 'imperative' && tense === 'present' && number === 'plural') reason = 'defective';
  }
  if (family === 'paître' && person !== null && compoundTenses.has(tense)) reason = 'defective';
  if (family === 'pouvoir' && mood === 'imperative') reason = 'noImperative';
  if (reflexive && mood === 'imperative' && tense === 'past') reason = 'noImperative';
  return reason ? {
    target, reason,
    explanation: `The reference paradigm of ${reflexive ? 'se ' : ''}${lemma} has no ${mood}/${tense} form in this slot.`,
    source: `https://leconjugueur.lefigaro.fr/conjugaison/verbe/${encodeURIComponent(lemma)}.html`,
  } : null;
}

function lexicalPart(lemma: string, word: string, target: ResolvedTarget, aspirated: boolean): ConjugationPart {
  return grammaticalPart('lexicalVerb', word, lemma, finiteFeatures(target), 'space', aspirated);
}

function infinitivePart(lemma: string, spelling: Spelling, aspirated: boolean): ConjugationPart {
  return grammaticalPart('lexicalVerb', infinitiveSpelling(lemma, spelling), lemma, {
    mood: 'infinitive', tense: 'present', verbForm: 'infinitive',
  }, 'space', aspirated);
}

function clitic(target: ResolvedTarget, affirmative = false): ConjugationPart {
  const text = target.person === null ? 'se'
    : affirmative && target.person === 2 && target.number === 'singular' ? 'toi'
    : itemAt(reflexivePronouns, personIndex(target));
  return grammaticalPart('reflexivePronoun', text, null, { person: target.person, number: target.number }, affirmative ? 'hyphen' : 'space');
}

function subject(target: ResolvedTarget): ConjugationPart {
  let text: string = itemAt(subjectPronouns, personIndex(target));
  if (target.person === 3 && target.gender === 'feminine') text = target.number === 'singular' ? 'elle' : 'elles';
  return grammaticalPart('subject', text, null, { person: target.person, number: target.number, gender: target.gender });
}

function contextParts(target: ResolvedTarget): ConjugationPart[] {
  return [
    ...(target.mood === 'subjunctive' ? [grammaticalPart('moodMarker', 'que')] : []),
    ...(target.person !== null && target.mood !== 'imperative' ? [subject(target)] : []),
    ...(target.mood === 'gerund' ? [grammaticalPart('moodMarker', 'en')] : []),
  ];
}

function agreements(options: FrenchConjugationOptions, target: ResolvedTarget, auxiliary: string, reflexive: boolean, lemma: string): Agreement[] {
  if (target.mood === 'participle' && target.tense === 'past') {
    if (lemma === 'falloir' || lemma === 'pleuvoir') return [{ gender: 'masculine', number: 'singular' }];
    return (options.agreement?.gender ? [options.agreement.gender] : options.gender ? [options.gender] : genders).flatMap(gender =>
      (options.agreement?.number ? [options.agreement.number] : numbers).map(number => ({ gender, number })));
  }
  if (options.precedingDirectObject && (auxiliary === 'avoir' || reflexive)) return [options.precedingDirectObject];
  if (auxiliary === 'avoir' || (reflexive && indirectReflexive(options, lemma))) {
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

const compoundTenses = new Set(['perfect', 'pluperfect', 'past_anterior', 'future_perfect', 'past']);

export function resolveFrench(options: FrenchConjugationOptions): LanguageEngine {
  const inputLemma = options.infinitive.replace(/^(se |s')/u, '');
  const reflexive = /^(se |s')/u.test(options.infinitive) || essentialReflexives.has(inputLemma);
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(inputLemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a French infinitive, optionally prefixed with se or s\'.');
  if (options.classHint && !(options.classHint === 'ir' ? /[iï]r$/u.test(inputLemma) : inputLemma.endsWith(options.classHint))) {
    throw new ConjugationError('INVALID_HINT', `Class ${options.classHint} is incompatible with ${inputLemma}.`);
  }
  const model = lexicalModel(inputLemma, options);
  const { lemma, family } = model;
  const paradigms = model.paradigms.map(paradigm => withHints(paradigm, options));
  const auxiliaries = reflexive ? ['être'] : dualAuxiliary.has(lemma) ? ['avoir', 'être'] : [etreVerbs.has(lemma) ? 'être' : 'avoir'];
  if (options.auxiliary && (reflexive || model.source === 'lexicon' || etreVerbs.has(lemma) || knownAvoirVerbs.has(lemma)) && !auxiliaries.includes(options.auxiliary)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} does not accept auxiliary ${options.auxiliary} in this model.`);
  }
  if (options.reflexiveObject === 'indirect' && essentialReflexives.has(lemma)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} is essentially pronominal; its participle agrees with the subject.`);
  }
  if (options.precedingDirectObject && paradigms.every(paradigm => paradigm.invariableParticiple)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} has an invariant verbal participle in this model; a preceding quantity does not license object agreement.`);
  }
  const selectedAuxiliaries = options.auxiliary ? [options.auxiliary] : auxiliaries;
  const knownAuxiliary = model.source === 'lexicon' || frenchExceptions[lemma] !== undefined
    || etreVerbs.has(lemma) || dualAuxiliary.has(lemma) || knownAvoirVerbs.has(lemma);
  const aspirated = options.aspiratedH ?? aspiratedH.has(lemma);
  const spellings: readonly Spelling[] = options.preferredOrthography === 'traditional' ? ['traditional', 'rectified'] : ['rectified', 'traditional'];
  return {
    verbId: reflexive ? renderParts('fr', [grammaticalPart('reflexivePronoun', 'se'), grammaticalPart('lexicalVerb', lemma, lemma, {}, 'space', aspirated)]) : lemma,
    analysis: {
      lemma, classification: family, classificationSource: options.stems && Object.keys(options.stems).length ? 'explicitHint' : model.source,
      reflexive, auxiliaries: selectedAuxiliaries,
      assumptions: [
        ...(model.source === 'regularRule' ? [`${lemma} uses the regular ${paradigms[0]?.kind} model; lexical meaning and nonproductive classes cannot be inferred from spelling.`] : []),
        ...(!reflexive && !options.auxiliary && !knownAuxiliary ? ['An unlisted non-reflexive verb defaults to avoir.'] : []),
        ...(reflexive && !options.reflexiveObject && !essentialReflexives.has(lemma) && !indirectReflexives.has(lemma) ? ['The reflexive pronoun is assumed direct; specify indirect-object context when needed.'] : []),
        ...(lemma.startsWith('h') && options.aspiratedH === undefined && !aspiratedH.has(lemma) ? ['An unlisted initial h is assumed mute.'] : []),
      ],
    },
    generate(baseTarget): GenerationResult {
      const absent = unavailable(lemma, family, reflexive, baseTarget);
      if (absent) return { forms: [], unavailable: [absent] };
      const forms: GeneratedForm[] = [];
      const { mood, tense } = baseTarget;
      const simpleParticiple = mood === 'participle' && tense === 'past';
      const compound = !simpleParticiple && compoundTenses.has(tense);
      const impersonalSubject = family === 'falloir' || (family === 'pleuvoir' && baseTarget.number === 'singular');
      const targetGenders = (auxiliary: string, invariant = false): readonly (Gender | null)[] => {
        const subjectAgreement = compound && auxiliary === 'être' && !invariant
          && !(reflexive && (indirectReflexive(options, lemma) || options.precedingDirectObject));
        return !impersonalSubject && (baseTarget.person === 3 || (baseTarget.person !== null && subjectAgreement))
          ? options.gender ? [options.gender] : genders : [null];
      };
      for (const paradigm of paradigms) for (const spelling of spellings)
        for (const compoundAuxiliary of compound ? selectedAuxiliaries : [''])
          for (const gender of targetGenders(compoundAuxiliary, paradigm.invariableParticiple)) {
        if (paradigm.orthography && paradigm.orthography !== spelling) continue;
        const target = { ...baseTarget, gender };
        const variant = (auxiliary: string | null = null, construction: string | null = null): FormVariant => ({
          orthography: spelling, auxiliary,
          pattern: [paradigm.pattern, construction].filter(Boolean).join('.') || null,
          usage: paradigm.usage ?? (['simple_past', 'past_anterior'].includes(tense) || (mood === 'subjunctive' && ['imperfect', 'pluperfect'].includes(tense)) || construction === 'past-second' ? 'literary' : 'standard'),
          condition: family === 'pleuvoir' && target.number === 'plural' ? 'figurative'
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
          const auxiliaryParadigm = itemAt(frenchExceptions[auxiliary] ?? [], 0);
          for (const word of simpleForms(auxiliaryParadigm, auxiliary, auxTarget, spelling)) {
            add([
              ...prefix, grammaticalPart('auxiliary', word, auxiliary, finiteFeatures(auxTarget)),
              ...(tense === 'recent_past' ? [grammaticalPart('linker', 'de')] : []),
              ...(reflexive ? [clitic(target)] : []), infinitivePart(lemma, spelling, aspirated),
            ], target, auxiliary);
          }
        } else if (simpleParticiple) {
          if (paradigm.invariableParticiple) {
            add([grammaticalPart('lexicalVerb', paradigm.participle, lemma, {
              mood: 'participle', tense: 'past', verbForm: 'pastParticiple',
            }, 'space', aspirated)]);
            continue;
          }
          for (const agreement of agreements(options, target, '', reflexive, lemma)) {
            add([grammaticalPart('lexicalVerb', pastParticiple(paradigm, agreement.gender, agreement.number, spelling), lemma, {
              mood: 'participle', tense: 'past', gender: agreement.gender, number: agreement.number, verbForm: 'pastParticiple',
            }, 'space', aspirated)], { ...target, agreement });
          }
        } else if (compound) {
            const auxiliary = compoundAuxiliary;
            const auxParadigm = itemAt(frenchExceptions[auxiliary] ?? [], 0);
            const constructions = mood === 'conditional' ? [false, true] : [false];
            for (const second of constructions) for (const agreement of agreements(options, target, auxiliary, reflexive, lemma)) {
              const resolved = { ...target, agreement: paradigm.invariableParticiple ? null : agreement };
              const pp = grammaticalPart('lexicalVerb', pastParticiple(paradigm, agreement.gender, agreement.number, spelling), lemma, {
                mood: 'participle', tense: 'past', gender: paradigm.invariableParticiple ? null : agreement.gender,
                number: paradigm.invariableParticiple ? null : agreement.number, verbForm: 'pastParticiple',
              }, 'space', aspirated);
              let auxParts: ConjugationPart[];
              if (target.person !== null) {
                const auxTarget = compoundAuxiliaryTarget(target, second);
                auxParts = [grammaticalPart('auxiliary', itemAt(simpleForms(auxParadigm, auxiliary, auxTarget, spelling), 0), auxiliary, finiteFeatures(auxTarget))];
              } else if (mood === 'infinitive') {
                auxParts = [grammaticalPart('auxiliary', auxiliary, auxiliary, { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' })];
              } else {
                auxParts = [grammaticalPart('auxiliary', itemAt(presentParticiples(auxParadigm, spelling), 0), auxiliary, {
                  mood: 'participle', tense: 'present', verbForm: 'presentParticiple',
                })];
              }
              add([...prefix, ...(reflexive ? [clitic(target)] : []), ...auxParts, pp], resolved, auxiliary, mood === 'conditional' ? second ? 'past-second' : 'past-first' : null);
            }
        } else if (mood === 'infinitive') {
          add([...(reflexive ? [clitic(target)] : []), infinitivePart(lemma, spelling, aspirated)]);
        } else if (mood === 'participle' || mood === 'gerund') {
          for (const word of presentParticiples(paradigm, spelling)) {
            add([...prefix, ...(reflexive ? [clitic(target)] : []), grammaticalPart('lexicalVerb', word, lemma, {
              mood: 'participle', tense: 'present', verbForm: 'presentParticiple',
            }, 'space', aspirated)]);
          }
        } else {
          for (const word of simpleForms(paradigm, lemma, target, spelling)) {
            add([...prefix, ...(reflexive && mood !== 'imperative' ? [clitic(target)] : []),
              lexicalPart(lemma, word, target, aspirated), ...(reflexive && mood === 'imperative' ? [clitic(target, true)] : [])]);
          }
        }
      }
      return { forms, unavailable: [] };
    },
  };
}
