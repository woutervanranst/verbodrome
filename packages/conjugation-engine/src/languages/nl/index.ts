import { ConjugationError } from '../../errors.js';
import { finiteFeatures, grammaticalPart, itemAt, personIndex } from '../../parts.js';
import type {
  ConjugationPart, DutchConjugationOptions, DutchPronoun, GeneratedForm,
  GenerationResult, ResolvedTarget, UnavailableTarget,
} from '../../types.js';
import type { LanguageEngine } from '../adapter.js';
import {
  dutchExceptions, dutchLoans, inseparableDerivatives, inseparableVerbs, separableVerbs,
} from './exceptions.js';
import type { DutchDerivative, DutchLexeme } from './exceptions.js';
import { nativeStem } from './orthography.js';
import { imperativeForms, participles, pastForms, presentForms } from './rules.js';

const subjects = ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'] as const;
const reflexives = ['me', 'je', 'zich', 'ons', 'jullie', 'zich'] as const;
const ambiguousPrefixes = new Set(['voorkomen', 'overleggen', 'doorlopen', 'overlopen', 'ondergaan']);

function availability(lemma: string, lexical: DutchLexeme, target: ResolvedTarget): UnavailableTarget | null {
  let reason: UnavailableTarget['reason'] | null = null;
  if (lexical.impersonal && target.person !== null && target.person !== 3) reason = 'impersonal';
  if (lexical.singularOnly && target.person !== null && target.number === 'plural') reason = 'impersonal';
  if (lexical.noImperative && target.mood === 'imperative') reason = 'noImperative';
  if (lexical.noCompound && !(target.mood === 'infinitive' || (target.mood === 'participle' && target.tense === 'present')
    || (target.mood === 'indicative' && ['present', 'past'].includes(target.tense)))) reason = 'defective';
  return reason ? {
    target, reason, explanation: `${lemma} has no modern ${target.mood}/${target.tense} form in this slot.`,
    source: 'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic',
  } : null;
}

function subject(target: ResolvedTarget, options: DutchConjugationOptions, impersonal: boolean): ConjugationPart {
  const text = options.pronoun ?? (impersonal && target.number === 'singular' ? 'het' : itemAt(subjects, personIndex(target)));
  return grammaticalPart('subject', text, null, { person: target.person, number: target.number });
}

function reflexivePart(target: ResolvedTarget, pronoun?: DutchPronoun): ConjugationPart {
  const text = target.person === null ? 'zich' : pronoun === 'u'
    ? target.mood === 'imperative' ? 'u' : 'zich' : itemAt(reflexives, personIndex(target));
  return grammaticalPart('reflexivePronoun', text, null, { person: target.person, number: target.number });
}

export function resolveDutch(options: DutchConjugationOptions): LanguageEngine {
  const expressedReflexive = options.infinitive.startsWith('zich ');
  const lemma = options.infinitive.replace(/^zich /u, '');
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(lemma)) throw new ConjugationError('INVALID_INFINITIVE', 'Expected a Dutch infinitive, optionally prefixed with zich.');
  if (ambiguousPrefixes.has(lemma) && !options.separablePrefix && !options.inseparablePrefix) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `${lemma} has separable and inseparable senses; supply a prefix hint.`);
  }
  if (options.separablePrefix && options.inseparablePrefix) {
    throw new ConjugationError('INVALID_HINT', 'A Dutch prefix cannot be both separable and inseparable.');
  }
  const hintedPrefix = options.separablePrefix ?? options.inseparablePrefix;
  if (hintedPrefix && (!lemma.startsWith(hintedPrefix) || lemma === hintedPrefix)) {
    throw new ConjugationError('INVALID_HINT', `Prefix ${hintedPrefix} is not a proper prefix of ${lemma}.`);
  }
  if (options.separablePrefix && inseparableVerbs[lemma]) {
    throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical inseparable prefix.`);
  }
  if (options.inseparablePrefix && separableVerbs[lemma]) {
    throw new ConjugationError('INVALID_HINT', `${lemma} has a lexical separable prefix.`);
  }
  const knownSeparable = separableVerbs[lemma];
  const knownInseparable = inseparableDerivatives[lemma];
  if (options.separablePrefix && knownSeparable && options.separablePrefix !== knownSeparable.prefix) {
    throw new ConjugationError('INVALID_HINT', `The verified separable prefix of ${lemma} is ${knownSeparable.prefix}.`);
  }
  const derivative: DutchDerivative | undefined = options.separablePrefix
    ? { prefix: options.separablePrefix, base: lemma.slice(options.separablePrefix.length) }
    : options.inseparablePrefix && !dutchExceptions[lemma]
      ? { prefix: options.inseparablePrefix, base: lemma.slice(options.inseparablePrefix.length) }
      : knownSeparable ?? knownInseparable;
  const separable = options.separablePrefix ?? knownSeparable?.prefix ?? '';
  const inseparable = options.inseparablePrefix ?? knownInseparable?.prefix ?? inseparableVerbs[lemma] ?? '';
  const base = derivative?.base ?? lemma;
  const baseLexical = dutchExceptions[base] ?? {};
  const personal = derivative?.personal ?? knownSeparable?.personal ?? knownInseparable?.personal;
  const lexical: DutchLexeme = personal ? { ...baseLexical, impersonal: false, singularOnly: false, noImperative: false } : baseLexical;
  const loan = dutchLoans[base];
  const isLoan = options.classHint === 'loan' || Boolean(loan);
  if (options.classHint === 'loan' && !loan && !options.stems?.stem) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', 'An unlisted English loan needs its pronounced/written stem; silent e cannot be inferred from spelling.');
  }
  if (options.classHint === 'strong' && !lexical.pastSingular && (!options.stems?.pastSingular || !options.stems.pastParticiple)) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', 'An unlisted strong verb needs a past singular and past participle.');
  }
  if (options.classHint === 'weak' && lexical.pastSingular && !lexical.alsoWeakPast) {
    throw new ConjugationError('INVALID_HINT', `${lemma} is not a weak verb in the verified lexical model.`);
  }
  const stem = nativeStem(base, options.stems?.stem ?? loan?.stem ?? lexical.stem,
    options.stems?.unstressedFinalSyllable ?? lexical.unstressedFinalSyllable,
    derivative ? inseparableVerbs[base] ?? '' : inseparable);
  const reflexive = expressedReflexive || options.reflexive === true || lexical.reflexive === true;
  if (options.reflexive === false && (expressedReflexive || lexical.reflexive)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} requires a reflexive pronoun.`);
  }
  const defaultAuxiliary = derivative?.auxiliary ?? knownSeparable?.auxiliary ?? knownInseparable?.auxiliary ?? lexical.auxiliary ?? 'hebben';
  const auxiliaries = defaultAuxiliary === 'both' ? ['hebben', 'zijn'] : [defaultAuxiliary];
  const selectedAuxiliaries = options.auxiliary ? [options.auxiliary] : auxiliaries;
  if (options.auxiliary && dutchExceptions[base] && !auxiliaries.includes(options.auxiliary)) {
    throw new ConjugationError('INVALID_HINT', `${lemma} does not accept auxiliary ${options.auxiliary} in this lexical model.`);
  }
  const prefix = derivative?.prefix ?? '';
  const finiteWord = (word: string): string => separable ? word : prefix + word;
  const participleWord = (word: string): string => {
    const underlying = prefix && inseparable && !inseparableVerbs[base] ? word.replace(/^ge/u, '') : word;
    return prefix + underlying;
  };
  const inflections = participles(lexical, stem, options, inseparable, loan?.pastSuffix).map(participleWord);
  const source = options.classHint || (options.stems && Object.keys(options.stems).length) || hintedPrefix ? 'explicitHint'
    : dutchExceptions[base] || loan || derivative || inseparableVerbs[lemma] ? 'lexicon' : 'regularRule';
  const knownBase = Boolean(dutchExceptions[base] || loan);
  const classification = isLoan ? 'loan' : options.classHint === 'strong' || lexical.pastSingular ? 'strong'
    : lexical.participles ? 'mixed' : 'weak';
  const infinitives = lemma === 'zijn' ? ['zijn', 'wezen'] : [lemma];
  return {
    verbId: reflexive ? `zich ${lemma}` : lemma,
    analysis: {
      lemma, classification, classificationSource: source, reflexive, auxiliaries: selectedAuxiliaries,
      assumptions: [
        ...(!knownBase && !options.classHint ? ['An unlisted Dutch verb defaults to the weak native model.'] : []),
        ...(!knownBase && !options.stems?.stem && options.stems?.unstressedFinalSyllable === undefined ? ['Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs.'] : []),
        ...(!knownBase && !options.auxiliary && !derivative?.auxiliary ? ['An unlisted verb defaults to hebben; lexical meaning may require zijn.'] : []),
        ...(!knownBase && !hintedPrefix && !knownSeparable && !knownInseparable && !inseparableVerbs[lemma] ? ['Separability is not inferred by stripping an unknown written prefix.'] : []),
      ],
    },
    generate(target): GenerationResult {
      const absent = availability(lemma, lexical, target);
      if (absent) return { forms: [], unavailable: [absent] };
      const forms: GeneratedForm[] = [];
      const { mood, tense } = target;
      const lexicalFinite = (word: string, ownTarget = target): ConjugationPart =>
        grammaticalPart('lexicalVerb', finiteWord(word), lemma, finiteFeatures(ownTarget));
      const lexicalInfinitive = (word: string): ConjugationPart =>
        grammaticalPart('lexicalVerb', word, lemma, { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' });
      const lexicalParticiple = (word: string): ConjugationPart =>
        grammaticalPart('lexicalVerb', word, lemma, { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' });
      const add = (parts: readonly ConjugationPart[], auxiliary: string | null = null, condition: string | null = null): void => {
        forms.push({
          target, parts,
          variant: { orthography: 'both', auxiliary, pattern: null, usage: 'standard', condition },
          ruleIds: [`nl.${classification}.${mood}.${tense}`, ...(separable ? ['nl.prefix.separable'] : []), ...(inseparable ? ['nl.prefix.inseparable'] : [])],
        });
      };
      const clitics = reflexive ? [reflexivePart(target, options.pronoun)] : [];
      const detached = separable ? [grammaticalPart('particle', separable)] : [];
      const finiteSequence = (verb: ConjugationPart, tail: readonly ConjugationPart[]): ConjugationPart[] => {
        const pronoun = subject(target, options, lexical.impersonal === true);
        return [...(options.inversion ? [verb, pronoun] : [pronoun, verb]), ...clitics, ...tail];
      };
      if (mood === 'infinitive') {
        for (const word of infinitives) add([...clitics, lexicalInfinitive(word)], null, word === 'wezen' ? 'Spoken infinitive alternative to zijn.' : null);
      } else if (mood === 'participle') {
        if (tense === 'past') {
          for (const word of inflections) add([lexicalParticiple(word)]);
        } else {
          add([...clitics, grammaticalPart('lexicalVerb', lemma + 'd', lemma, {
            mood: 'participle', tense: 'present', verbForm: 'presentParticiple',
          })]);
        }
      } else if (mood === 'imperative') {
        for (const word of imperativeForms(lexical, stem)) add([lexicalFinite(word), ...clitics, ...detached]);
      } else if (mood === 'indicative' && (tense === 'present' || tense === 'past')) {
        const words = tense === 'present' ? presentForms(base, lexical, stem, target, options) : pastForms(lexical, stem, target, options, loan?.pastSuffix);
        for (const word of words) add(finiteSequence(lexicalFinite(word), detached));
      } else {
        const futureConstruction = tense === 'future' || tense === 'future_perfect' || mood === 'conditional';
        const compound = tense === 'perfect' || tense === 'pluperfect' || tense === 'future_perfect' || (mood === 'conditional' && tense === 'past');
        const auxiliaryTense = mood === 'conditional' || tense === 'pluperfect' ? 'past' : 'present';
        const auxTarget: ResolvedTarget = { ...target, mood: 'indicative', tense: auxiliaryTense };
        for (const auxiliary of compound ? selectedAuxiliaries : ['zullen']) {
          const finiteAuxiliary = futureConstruction ? 'zullen' : auxiliary;
          const auxLexical = dutchExceptions[finiteAuxiliary];
          if (!auxLexical) throw new ConjugationError('GENERATION_FAILURE', `Missing Dutch auxiliary ${finiteAuxiliary}.`);
          const auxStem = nativeStem(finiteAuxiliary, auxLexical.stem);
          const auxiliaryOptions: DutchConjugationOptions = {
            language: 'nl', infinitive: finiteAuxiliary,
            ...(options.pronoun ? { pronoun: options.pronoun } : {}),
            ...(options.inversion !== undefined ? { inversion: options.inversion } : {}),
          };
          const auxWords = auxiliaryTense === 'present' ? presentForms(finiteAuxiliary, auxLexical, auxStem, auxTarget, options)
            : pastForms(auxLexical, auxStem, auxTarget, auxiliaryOptions);
          for (const auxWord of auxWords) {
            const finite = grammaticalPart('auxiliary', auxWord, finiteAuxiliary, finiteFeatures(auxTarget));
            if (compound) {
              for (const word of inflections) for (const finalAuxiliary of futureConstruction ? auxiliary === 'zijn' ? ['zijn', 'wezen'] : ['hebben'] : ['']) {
                const tail = [lexicalParticiple(word), ...(finalAuxiliary ? [grammaticalPart('auxiliary', finalAuxiliary, auxiliary, {
                  mood: 'infinitive', tense: 'present', verbForm: 'infinitive',
                })] : [])];
                add(finiteSequence(finite, tail), auxiliary, finalAuxiliary === 'wezen' ? 'Spoken infinitive alternative to zijn.'
                  : auxiliaries.length > 1 ? 'Auxiliary choice depends on transitivity, movement or change of state.' : null);
              }
            } else {
              for (const word of infinitives) add(finiteSequence(finite, [lexicalInfinitive(word)]), finiteAuxiliary, word === 'wezen' ? 'Spoken infinitive alternative to zijn.' : null);
            }
          }
        }
      }
      return { forms, unavailable: [] };
    },
  };
}
