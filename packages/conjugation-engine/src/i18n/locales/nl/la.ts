import type { latinRules } from '../../../languages/la/rules.js';

/** Dutch messages of the Latin rules, for Dutch-speaking secondary-school pupils (schoolgrammatica). */
export const la = {
  'la.classify.lexicon': '{before} staat in het lexicon: {parts}.',
  'la.classify.compound': '{before} is {prefix}- + {base}; samengestelde werkwoorden van {base} gaan {parts}.',
  'la.classify.conjugation': '{before} eindigt op -{ending}: {conjugation, select, first {eerste} second {tweede} third {derde} thirdIo {derde (-iō)} fourth {vierde} other {onregelmatige}} vervoeging.',
  'la.classify.io': 'De eerste persoon {after} eindigt op -iō: een werkwoord van de derde vervoeging op -iō, dat zijn i houdt voor a, o, u en lange ē.',
  'la.classify.deponent': '{before} heeft een passieve infinitief: het werkwoord is een deponens, met passieve vormen en een actieve betekenis.',
  'la.classify.semi-deponent': '{before} is een semideponens: actieve vormen in de tijden van de praesensstam, passieve vormen met actieve betekenis in de tijden van de perfectumstam.',
  'la.classify.assume-third': 'Er staat geen lengteteken op de e van -ere, dus het werkwoord wordt als derde vervoeging genomen; schrijf -ēre of geef de eerste persoon op -eō voor de tweede vervoeging.',
  'la.classify.assume-second-deponent': 'Er staat geen lengteteken op -eri, dus het werkwoord wordt als deponens van de tweede vervoeging (-ērī) genomen.',
  'la.classify.assume-consonant-stem': 'Zonder eerste persoon op -iō wordt het werkwoord niet als werkwoord op -iō genomen.',
  'la.classify.assume-quantity': 'De lengte van de klinkers in de stam is niet bekend: klinkers zonder lengteteken blijven zonder lengteteken.',
  'la.classify.assume-passive': 'Aangenomen wordt dat het werkwoord een volledig passivum heeft, zoals een overgankelijk werkwoord.',
  'la.classify.assume-compound': 'Samengestelde werkwoorden van {base} verschillen; aangenomen wordt dat {prefix}- + {base} de vorm uit het lexicon volgt.',
  'la.classify.default-parts': 'Niet in het lexicon: het gewone perfectum en supinum van de {conjugation, select, first {eerste} second {tweede} fourth {vierde} other {}} vervoeging worden aangenomen.',
  'la.classify.default-sigmatic': 'Niet in het lexicon: een perfectum met -s- wordt aangenomen, het meest voorkomende type in de derde vervoeging bij een stam op een medeklinker als c, g, p of d.',
  'la.classify.default-uo': 'Niet in het lexicon: een werkwoord op -uō krijgt het perfectum -uī en het supinum -ūtum.',
  'la.classify.default-sco': 'Niet in het lexicon: een werkwoord op -scō verliest -sc- en krijgt -vī en -tum.',
  'la.classify.default-u': 'Niet in het lexicon: een stam op l, m, n, r, s of x krijgt het perfectum -uī en het supinum -itum.',
} as const satisfies Record<keyof typeof latinRules, string>;
