/**
 * Dutch messages of the Dutch rules, one per rule id, written for pupils in secondary school with the terms of school
 * grammar (stam, uitgang, zwak en sterk werkwoord, voltooid deelwoord). A message may use the rule's params and
 * {before} / {after}.
 */
import type { dutchRules } from '../../../languages/nl/rule-table.js';

export const dutch = {
  'nl.classify.lexicon': '{before} heeft een eigen regel in de werkwoordenlijst: {after, select, strong {een sterk werkwoord} mixed {een half onregelmatig werkwoord (zwakke verleden tijd, sterk voltooid deelwoord)} other {een zwak werkwoord}}.',
  'nl.classify.loan': '{before} is een werkwoord dat uit het Engels geleend is, dus de stam is de stam die ervoor is opgegeven en wordt niet met de Nederlandse regels gevormd.',
  'nl.classify.separable': '{before} is een scheidbaar werkwoord: {particle} krijgt de klemtoon en kan los van het werkwoord staan.',
  'nl.classify.inseparable': '{before} begint met het onbeklemtoonde voorvoegsel {prefix}-, dat nooit loskomt, dus het voltooid deelwoord krijgt geen ge-.',
  'nl.classify.default-weak': '{before} staat niet in de lijst met werkwoorden, dus we nemen aan dat het een zwak werkwoord is.',
  'nl.classify.default-syllables': 'De stam van {before} schrijven we volgens de regels voor open en gesloten lettergrepen; spreek je het anders uit, geef dan zelf de stam of de klemtoon op.',
  'nl.classify.default-hebben': "We nemen aan dat {before} in de voltooide tijden het hulpwerkwoord 'hebben' krijgt, al vraagt de betekenis soms om 'zijn'.",
  'nl.classify.default-unprefixed': 'We zoeken in {before} geen scheidbaar deel of voorvoegsel, want aan de spelling zie je niet of een werkwoord scheidbaar is, dus behandelen we het als een werkwoord zonder voorvoegsel.',
  'nl.stem.drop-en': 'Haal -en van {before} af, dan heb je de stam: {after}-.',
  'nl.stem.undouble-consonant': 'Aan het eind van een woord schrijf je geen dubbele medeklinker, dus {before}- wordt {after}-.',
  'nl.stem.lengthen-vowel': 'Een lange klank in een gesloten lettergreep schrijf je met twee klinkers, dus {before}- wordt {after}-.',
  'nl.stem.unstressed-e': 'De laatste lettergreep van {before}- heeft geen klemtoon, dus de klinker schrijf je niet dubbel: de stam blijft {after}-.',
  'nl.stem.devoice': 'Aan het eind van een woord schrijf je geen v of z maar f of s, dus {before}- wordt {after}-.',
  'nl.stem.lexical': 'De stam van {before} is {after}-, zoals die voor dit werkwoord is opgegeven.',
} as const satisfies Record<keyof typeof dutchRules, string>;
