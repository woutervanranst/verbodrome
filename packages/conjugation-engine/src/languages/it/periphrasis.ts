import type { ChainElement, Periphrasis } from '../../core/periphrasis.js';
import type { ItalianLexeme } from './lexicon.js';
import { italianRules as R } from './rules.js';

/** The past participle of the queried verb, which agrees with the subject after essere. */
const participle: ChainElement = { verb: 'main', nonFinite: 'participle', agree: true };

/** A compound tense: a form of the verb's auxiliary (avere or essere) plus the past participle. */
function compound(mood: string, tense: string, rule: Periphrasis['rule'], auxiliary: ChainElement): Periphrasis<ItalianLexeme> {
  return { mood, tense, rule, chain: [auxiliary, participle], reports: 'perfectAuxiliary' };
}

const finite = (mood: string, tense: string): ChainElement => ({ verb: 'perfectAuxiliary', finite: { mood, tense } });

/** The nine compound tenses (grammar design §6.1); they apply to every verb, once per auxiliary it takes. */
export const italianPeriphrases: readonly Periphrasis<ItalianLexeme>[] = [
  compound('indicative', 'perfect', R['it.periphrasis.perfect'], finite('indicative', 'present')),
  compound('indicative', 'pluperfect', R['it.periphrasis.pluperfect'], finite('indicative', 'imperfect')),
  compound('indicative', 'past_anterior', R['it.periphrasis.past-anterior'], finite('indicative', 'simple_past')),
  compound('indicative', 'future_perfect', R['it.periphrasis.future-perfect'], finite('indicative', 'future')),
  compound('subjunctive', 'past', R['it.periphrasis.subjunctive-past'], finite('subjunctive', 'present')),
  compound('subjunctive', 'pluperfect', R['it.periphrasis.subjunctive-pluperfect'], finite('subjunctive', 'imperfect')),
  compound('conditional', 'past', R['it.periphrasis.conditional-past'], finite('conditional', 'present')),
  compound('infinitive', 'past', R['it.periphrasis.infinitive-past'], { verb: 'perfectAuxiliary', nonFinite: 'infinitive' }),
  compound('gerund', 'past', R['it.periphrasis.gerund-past'], { verb: 'perfectAuxiliary', nonFinite: 'gerund' }),
];
