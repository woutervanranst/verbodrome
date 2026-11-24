/**
 * De uitleg bij het Spaanse pakket in het Nederlands, voor leerlingen van het middelbaar onderwijs: één zin per regel,
 * met de vormen zelf via `{before}` / `{after}` en de parameters van de regel. Een apostrof vlak voor een placeholder
 * schrijf je als `''`.
 */
import type { SpanishRuleId } from '../../../languages/es/rules.js';

export const es = {
  'es.classify.conjugation': '{before} eindigt op {ending}, dus het regelmatige voorbeeldwerkwoord is {model}.',
  'es.classify.reflexive': '{before} is wederkerend: het werkwoord is {base}, en bij elke vorm hoort een wederkerend voornaamwoord (me, te, se, nos, os).',
  'es.classify.restore-accent': 'Een infinitief op -eír of -oír heeft altijd een accent op de i, dus {before} schrijf je {after}.',
  'es.classify.lexicon': '{before} staat in het woordenboek en wordt vervoegd zoals {model}.',
  'es.classify.two-paradigms': '{before} heeft twee vervoegingen met een verschillende betekenis; deze gaat zoals {model}.',
  'es.classify.prefixed': '{before} is {prefix} + {base}, dus het heeft dezelfde onregelmatige vormen als {base}.',
  'es.classify.family': 'Werkwoorden op {suffix} hebben dezelfde onregelmatige vormen, dus {before} gaat zoals {model}.',
  'es.classify.uar-stress': 'Bij werkwoorden op -uar zoals {before} krijgt de u zelf de klemtoon als de stam beklemtoond is (actúo), maar niet na g of c (averiguo).',
  'es.classify.hint': 'De aanwijzing {hint} bepaalt hoe {before} vervoegd wordt.',
  'es.classify.assume-regular': '{before} staat niet in het woordenboek, dus we nemen aan dat het regelmatig is, zonder klinkerwisseling in de stam.',
  'es.classify.assume-glide': 'We nemen aan dat de {vowel} voor -ar in {before} één lettergreep vormt met de klinker erna, zoals in cambiar (cambio) en niet zoals in enviar (envío).',
  'es.classify.assume-diphthong': 'We nemen aan dat de klinkers {vowels} in {before} een tweeklank vormen, zoals in causar (causo) en niet zoals in aislar (aíslo).',
  'es.classify.assume-zc': 'We nemen aan dat {before} net als conocer een z voor de c zet (conozco).',
} as const satisfies Record<SpanishRuleId, string>;
