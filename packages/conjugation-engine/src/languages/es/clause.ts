/**
 * The Spanish clause (grammar design §6). Word order: que (subjunctive) · subject pronoun (finite, not a command) · no
 * (negative command) · proclitic reflexive pronoun · auxiliary · verb. The reflexive pronoun is attached to the end of an
 * affirmative command, an infinitive or a gerund (to haber in their compound forms): the vosotros command loses its -d
 * before os (not idos, beside which the RAE accepts iros), the nosotros command its -s before nos, and the longer word
 * keeps its stress and is written by the accent rules (levántate). Participles after haber do not agree.
 */
import { wordPart } from '../../core/clause.js';
import type { ChainWord, ClauseGrammar } from '../../core/clause.js';
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { chain, one } from '../../core/fork.js';
import type { Fork, VariantTags } from '../../core/fork.js';
import { grammaticalPart } from '../../parts.js';
import type { ConjugationPart, PartFeatures, ResolvedTarget } from '../../types.js';
import type { SpanishLexeme } from './classify.js';
import { spanishRules as rules } from './rules.js';
import { stripAccents, writeAccent, writtenStress } from './syllables.js';

/** The mood, tense and verb form a non-finite word's part carries. */
const nonFiniteFeatures: Readonly<Record<string, Partial<PartFeatures>>> = {
  infinitive: { mood: 'infinitive', tense: 'present', verbForm: 'infinitive' },
  gerund: { mood: 'gerund', tense: 'present', verbForm: 'gerund' },
  participle: { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
  'compound-participle': { mood: 'participle', tense: 'past', verbForm: 'pastParticiple' },
};

export function featuresOf(word: ChainWord): Partial<PartFeatures> {
  return word.cell?.kind === 'nonFinite' ? nonFiniteFeatures[word.cell.form] ?? {} : {};
}

const reflexivePronouns = ['me', 'te', 'se', 'nos', 'os', 'se'] as const;

/** The reflexive pronoun of a target: by person and number (usted and ustedes take se), se for the non-finite forms. */
function reflexivePronoun(target: ResolvedTarget): string {
  if (target.person === null || target.number === null) return 'se';
  return reflexivePronouns[(target.number === 'plural' ? 3 : 0) + target.person - 1]!;
}

/** The targets whose reflexive pronoun follows the verb: the affirmative command, the infinitive and the gerund. */
const takesEnclitic = (target: ResolvedTarget): boolean =>
  (target.mood === 'imperative' && target.tense === 'present') || target.mood === 'infinitive' || target.mood === 'gerund';

/** One way the pronoun attaches: the verb's text as it stands before the pronoun, the steps and the tags. */
interface Attachment { readonly verb: string; readonly steps: readonly DerivationStep[]; readonly tags: VariantTags }

/**
 * The verb word with the pronoun attached: the -d or -s it loses, then the word written with the stress where the verb
 * had it. Returns the verb's part and the pronoun's, one pair per accepted form (idos and iros).
 */
function attach(word: ChainWord, pronoun: string, target: ResolvedTarget, lexeme: SpanishLexeme, rendering: Parameters<typeof wordPart>[0])
  : Fork<readonly ConjugationPart[]> {
  const verb = word.text;
  const stressed = writtenStress(verb);
  const joined = verb + pronoun;
  const attached = step(rules['es.clause.enclitic'], verb, joined, { pronoun });
  const command = target.mood === 'imperative';
  let ways: Attachment[] = [{ verb, steps: [attached], tags: {} }];
  if (command && target.person === 2 && target.number === 'plural' && pronoun === 'os' && verb.endsWith('d')) {
    if (lexeme.infinitive === 'ir') {
      // The RAE accepts iros, the infinitive ir with os, beside the older idos, which keeps its d.
      ways = [
        { verb: 'ir', steps: [step(rules['es.clause.iros'], verb, `ir${pronoun}`)], tags: { pattern: 'iros' } },
        { verb, steps: [attached], tags: { pattern: 'idos' } },
      ];
    } else {
      const dropped = verb.slice(0, -1);
      ways = [{ verb: dropped, steps: [attached, step(rules['es.clause.enclitic-d-drop'], joined, dropped + pronoun)], tags: {} }];
    }
  } else if (command && target.person === 1 && target.number === 'plural' && pronoun === 'nos' && verb.endsWith('s')) {
    const dropped = verb.slice(0, -1);
    ways = [{ verb: dropped, steps: [attached, step(rules['es.clause.enclitic-s-drop'], joined, dropped + pronoun)], tags: {} }];
  }
  return ways.map(way => {
    const before = way.verb + pronoun;
    const accent = writeAccent(stripAccents(way.verb) + pronoun, stressed);
    const accentSteps = accent.written === before ? [] : [step(rules['es.clause.enclitic-accent'], before, accent.written, { stress: accent.stress })];
    const verbPart = wordPart(rendering, { ...word, text: accent.written.slice(0, way.verb.length), steps: [...word.steps, ...way.steps, ...accentSteps] }, featuresOf(word));
    return { value: [verbPart, grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, {}, 'attached')], steps: [], tags: way.tags };
  });
}

export const spanishClause: ClauseGrammar<SpanishLexeme> = {
  agreements: () => one(null),
  assemble(words, { lexeme, target, subject, rendering }) {
    const opening: ConjugationPart[] = [];
    const steps: DerivationStep[] = [];
    if (target.mood === 'subjunctive') {
      opening.push(grammaticalPart(rendering, 'moodMarker', 'que'));
      steps.push(step(rules['es.clause.que'], null, null));
    }
    // A weather verb has no subject (llueve), so no pronoun.
    if (subject !== null && subject.pronoun !== null && target.mood !== 'imperative' && !lexeme.entry.impersonal) {
      opening.push(grammaticalPart(rendering, 'subject', subject.pronoun, null, { person: subject.person, number: subject.number, gender: subject.gender ?? null }));
      steps.push(step(rules['es.clause.subject'], null, null, { pronoun: subject.pronoun }));
    }
    const pronoun = lexeme.reflexive && target.mood !== 'participle' ? reflexivePronoun(target) : null;
    const enclitic = pronoun !== null && takesEnclitic(target);
    const host = words.findIndex(word => word.cell !== null);
    let parts: Fork<readonly ConjugationPart[]> = one(opening, steps);
    for (const [index, word] of words.entries()) {
      if (pronoun !== null && index === host && enclitic) {
        parts = chain(parts, before => chain(attach(word, pronoun, target, lexeme, rendering), after => one([...before, ...after])));
        continue;
      }
      const proclitic = pronoun !== null && index === host
        ? one([grammaticalPart(rendering, 'reflexivePronoun', pronoun, null, { person: target.person, number: target.number })],
          [step(rules['es.clause.proclitic'], null, null, { pronoun })])
        : one<ConjugationPart[]>([]);
      parts = chain(parts, before => chain(proclitic, clitic => one([...before, ...clitic, wordPart(rendering, word, featuresOf(word))])));
    }
    return parts;
  },
};
