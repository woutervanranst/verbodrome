/**
 * The Spanish compound tenses (grammar design §4.6): haber in a simple tense plus the participle, and the negative
 * imperative, no plus the present subjunctive. Every chain builds its tense for every verb. The perfect chains take the
 * pack's `compound-participle`, which leaves out the participles the lexicon keeps out of the compound tenses (he
 * elegido, never he electo); the ra / se and dated tags of the auxiliary word carry over to the form.
 */
import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { SpanishLexeme } from './classify.js';
import { spanishRules as rules } from './rules.js';

const participle: ChainElement = { verb: 'main', nonFinite: 'compound-participle' };

function perfect(
  mood: string, tense: string, rule: Periphrasis['rule'], auxiliary: ChainElement,
): Periphrasis<SpanishLexeme> {
  return { mood, tense, rule, chain: [auxiliary, participle] };
}

const finite = (mood: string, tense: string): ChainElement => ({ verb: 'perfectAuxiliary', finite: { mood, tense } });
const nonFinite = (form: string): ChainElement => ({ verb: 'perfectAuxiliary', nonFinite: form });

export const spanishPeriphrases: readonly Periphrasis<SpanishLexeme>[] = [
  perfect('indicative', 'perfect', rules['es.periphrasis.perfect'], finite('indicative', 'present')),
  perfect('indicative', 'pluperfect', rules['es.periphrasis.pluperfect'], finite('indicative', 'imperfect')),
  perfect('indicative', 'past_anterior', rules['es.periphrasis.past-anterior'], finite('indicative', 'simple_past')),
  perfect('indicative', 'future_perfect', rules['es.periphrasis.future-perfect'], finite('indicative', 'future')),
  perfect('conditional', 'past', rules['es.periphrasis.conditional-perfect'], finite('conditional', 'present')),
  perfect('subjunctive', 'past', rules['es.periphrasis.subjunctive-perfect'], finite('subjunctive', 'present')),
  perfect('subjunctive', 'pluperfect', rules['es.periphrasis.subjunctive-pluperfect'], finite('subjunctive', 'imperfect')),
  perfect('subjunctive', 'future_perfect', rules['es.periphrasis.subjunctive-future-perfect'], finite('subjunctive', 'future')),
  perfect('infinitive', 'past', rules['es.periphrasis.infinitive-perfect'], nonFinite('infinitive')),
  perfect('gerund', 'past', rules['es.periphrasis.gerund-perfect'], nonFinite('gerund')),
  {
    mood: 'imperative', tense: 'negative', rule: rules['es.periphrasis.negative-imperative'],
    chain: [{ word: 'no', role: 'moodMarker' }, { verb: 'main', finite: { mood: 'subjunctive', tense: 'present' } }],
  },
];
