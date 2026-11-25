/**
 * Dutch explanations of the German rules, for Dutch-speaking secondary-school pupils: one sentence each in plain Dutch
 * with the school-grammar terms they know, naming the forms through {before}, {after} and the rule's params. An
 * apostrophe directly before a placeholder is written twice.
 */
import type { germanRules } from '../../../languages/de/rules.js';

/** The class names `{after}` of `de.classify.lexicon` can be. */
const classes = 'weak {een zwak werkwoord} strong {een sterk werkwoord} mixed {een gemengd werkwoord} preteritePresent {een werkwoord dat vervoegd wordt zoals de modale werkwoorden} irregular {een onregelmatig werkwoord} other {een {after} werkwoord}';

/** The particles that can also be unstressed prefixes. */
const dual = (text: string) => ['durch', 'hinter', 'über', 'um', 'unter', 'voll', 'wider', 'wieder'].map(particle => `${particle} {${text}}`).join(' ');

export const de = {
  'de.classify.lexicon': `{before} staat in de woordenlijst als {after, select, ${classes}}.`,
  'de.classify.derivative': '{before} is {prefix} + {root}, dus het wordt vervoegd zoals {root}.',
  'de.classify.separable': '{particle}- is een scheidbaar voorvoegsel: het krijgt de klemtoon en staat los van de persoonsvorm.',
  'de.classify.inseparable': '{prefix}- is hier een onscheidbaar voorvoegsel: het blijft altijd aan het werkwoord vast.',
  'de.classify.assume-separable': `{particle, select, ${dual('Aangenomen dat {particle}- de klemtoon krijgt en scheidbaar is, want het werkwoord staat niet in de woordenlijst; zonder klemtoon zou het een onscheidbaar voorvoegsel zijn.')} other {Aangenomen dat {particle}- een scheidbaar voorvoegsel is, want het werkwoord staat niet in de woordenlijst.}}`,
  'de.classify.denominal': 'Een werkwoord met {prefix}- vóór een scheidbaar voorvoegsel is afgeleid van een zelfstandig naamwoord: het is zwak en onscheidbaar.',
  'de.classify.not-derived': '{before} is niet afgeleid van {root}: het wordt op zichzelf vervoegd.',
  'de.classify.default-weak': 'Aangenomen dat het een zwak werkwoord is, want het staat niet in de woordenlijst.',
  'de.classify.default-haben': 'Aangenomen dat de voltooide tijd met haben gevormd wordt.',
  'de.classify.default-stress': 'Aangenomen dat de klemtoon op de eerste lettergreep ligt, dus het voltooid deelwoord (Partizip II) krijgt ge-.',
  'de.classify.ieren': 'Werkwoorden op -ieren hebben de klemtoon op -ier-, dus het voltooid deelwoord (Partizip II) krijgt geen ge-.',
  'de.classify.assume-root-auxiliary': 'Aangenomen dat {before} de voltooide tijd met hetzelfde hulpwerkwoord vormt als {root}.',
  'de.classify.transliteration': '{written} wordt gelezen als {read}: ss staat voor ß, en ae, oe, ue voor ä, ö, ü.',
  'de.classify.hint': 'Zoals gevraagd is {hint} {value}.',
} as const satisfies Record<keyof typeof germanRules, string>;
