/**
 * The English pack's explanation messages in Dutch, for Dutch-speaking pupils learning English: plain Dutch, the school
 * terms they know, the English tense names their textbooks use. Exported as `english`, like the English locale's.
 */
import type { englishRules } from '../../../languages/en/rules.js';

export const english = {
  'en.classify.lexicon': '{before} is een onregelmatig werkwoord: past simple {past}, voltooid deelwoord {participle}.',
  'en.classify.suppletive': '{before} is helemaal onregelmatig: je leert elke vorm apart.',
  'en.classify.homograph': 'Deze vormen van {before} horen bij de betekenis "{meaning}".',
  'en.classify.prefixed': '{before} is {prefix}- + {base}, dus het heeft dezelfde onregelmatige vormen als {base}.',
  'en.classify.no-inherit': '{before} lijkt op {prefix}- + {base}, maar is een regelmatig werkwoord.',
  'en.classify.assume-regular': 'We nemen aan dat {before} regelmatig is (-ed): het staat niet in de lijst van onregelmatige werkwoorden.',
  'en.classify.hint-regular': 'Je vroeg naar de regelmatige vormen van {before}.',
  'en.classify.hint-irregular': 'Je gaf de past simple {past} en het voltooid deelwoord {participle} van {before}.',
  'en.classify.stress-listed': 'De klemtoon van {before} ligt op {stress, select, final {de laatste lettergreep} other {een eerdere lettergreep}}.',
  'en.classify.stress-hint': 'Je gaf aan dat de klemtoon van {before} op {stress, select, final {de laatste lettergreep} other {een eerdere lettergreep}} ligt.',
  'en.classify.assume-final-stress': 'We nemen aan dat de laatste lettergreep van {before} beklemtoond is: het lijkt op het voorvoegsel {prefix}- met een stam van één lettergreep.',
  'en.classify.assume-nonfinal-stress': 'We nemen aan dat de laatste lettergreep van {before} niet beklemtoond is: aan de spelling zie je de klemtoon niet.',
  'en.classify.keeps-e': '{before} houdt zijn e voor -ing.',
  'en.classify.doubles-unstressed': '{before} verdubbelt zijn laatste medeklinker, ook al is de laatste lettergreep niet beklemtoond.',
  'en.classify.l-not-doubled': '{before} verdubbelt zijn laatste l nooit.',
  'en.classify.plain-s': '{before} krijgt in de derde persoon enkelvoud alleen -s.',
} as const satisfies Record<keyof typeof englishRules, string>;
