/**
 * The English explanations of the French rules, for a learner: one sentence each, naming the forms through {before},
 * {after} and the rule's params. A rule gets its message in the task that implements it (plan 3, shadow mode).
 */
import type { FrenchRuleId } from '../../../languages/fr/rules.js';

export const fr = {
  'fr.clause.subject': 'The subject pronoun {pronoun} comes before the verb.',
  'fr.clause.subject-gender': 'This form is for a {gender} subject: il or ils for a masculine one, elle or elles for a feminine one, and a participle that agrees with the subject takes its gender.',
  'fr.clause.impersonal-subject': 'This verb is impersonal: its only subject is the neutral il, which never becomes elle.',
  'fr.clause.que': 'The subjunctive is given after que, the way it is used in a clause.',
  'fr.clause.gerund-en': 'The gerund is en followed by the present participle.',
  'fr.clause.reflexive-pronoun': 'A pronominal verb takes the reflexive pronoun {pronoun} before the verb.',
  'fr.clause.reflexive-imperative': 'In the imperative the reflexive pronoun follows the verb, joined by a hyphen: -{pronoun}.',
  'fr.clause.participle-forms': 'The past participle on its own, in its {gender} {number} form.',
  'fr.clause.invariable-participle': 'This past participle never changes: it has no feminine or plural form.',
} as const satisfies Partial<Record<FrenchRuleId, string>>;
