/**
 * De Nederlandse uitleg bij de Franse regels, voor leerlingen die Frans leren: één zin per regel, met de vormen zelf
 * via {before}, {after} en de parameters van de regel. Een regel krijgt zijn tekst in de taak die hem invoert.
 */
import type { FrenchRuleId } from '../../../languages/fr/rules.js';
import type { fr as en } from '../en/fr.js';

export const fr = {
  'fr.clause.subject': 'Het onderwerp {pronoun} staat vóór het werkwoord.',
  'fr.clause.subject-gender': 'Deze vorm hoort bij een {gender} onderwerp: il of ils als het mannelijk is, elle of elles als het vrouwelijk is, en een deelwoord dat met het onderwerp overeenkomt, krijgt hetzelfde geslacht.',
  'fr.clause.impersonal-subject': 'Dit werkwoord is onpersoonlijk: het onderwerp is altijd il (‘het’) en wordt nooit elle.',
  'fr.clause.que': 'De subjonctif staat na que, zoals hij in een bijzin gebruikt wordt.',
  'fr.clause.gerund-en': 'De gérondif is en met daarna het onvoltooid deelwoord.',
  'fr.clause.reflexive-pronoun': 'Een wederkerend werkwoord krijgt het wederkerend voornaamwoord {pronoun} vóór het werkwoord.',
  'fr.clause.reflexive-imperative': 'In de gebiedende wijs staat het wederkerend voornaamwoord achter het werkwoord, met een streepje: -{pronoun}.',
  'fr.clause.participle-forms': 'Het voltooid deelwoord op zichzelf, in de vorm voor {gender} {number}.',
  'fr.clause.invariable-participle': 'Dit voltooid deelwoord verandert nooit: het heeft geen vrouwelijke vorm en geen meervoud.',
} as const satisfies Partial<Record<FrenchRuleId, string>> & Record<keyof typeof en, string>;
