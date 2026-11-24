/**
 * The toy language's explanation messages, one set per locale. `satisfies Record<keyof typeof toyRules, string>` makes a
 * rule without a message (or a message for no rule) a type error. A message may use the rule's declared params and
 * `{before}` and `{after}`. Write an apostrophe before a placeholder as `''`, never `'`.
 */
import type { toyRules } from './pack.js';

export const en = {
  'xx.classify.listed': '{before} is listed in the lexicon as {after}.',
  'xx.classify.a-verb': '{before} ends in -a: class {after}.',
  'xx.assume.unlisted': 'Assuming the verb is regular: it is not in the lexicon.',
  'xx.avail.no-participle': 'This verb has no participle, so the perfect and the past participle do not exist.',
  'xx.lex.present': 'Irregular verb: the present of {before} is the whole word {after}.',
  'xx.stem.drop-a': 'Drop -a from {before}: {after}-.',
  'xx.stem.listed': 'The lexicon lists the stem {after}- for {before}.',
  'xx.end.present': 'Present, {person} {number}: add -{ending}.',
  'xx.end.past': '{tense}: add -{ending} to {before}-.',
  'xx.end.imperative': 'Imperative: add -e to {before}-.',
  'xx.end.long': 'Literary long ending: add -{ending}.',
  'xx.end.passive': 'Passive: add -ur- to the stem {before}-.',
  'xx.end.infinitive': 'Infinitive: add -a to {before}-.',
  'xx.end.present-participle': 'Present participle: add -ante to {before}-.',
  'xx.end.participle': 'Past participle: add -{ending} to {before}-.',
  'xx.orth.c-qu': 'Spelling: c is written qu before {vowel}, so {before} becomes {after}.',
  'xx.orth.ph-f': 'Rectified spelling: ph is written f, so {before} becomes {after}.',
  'xx.periphrasis.perfect': 'Perfect: the present of {auxiliary} plus the past participle.',
  'xx.periphrasis.passive-perfect': 'Passive perfect: the present of esta plus the past participle.',
  'xx.periphrasis.future': 'Future: the present of vada, the word a, then the infinitive.',
  'xx.periphrasis.future-inverted': 'Literary future: the infinitive, then the present of haba.',
  'xx.periphrasis.conditional': 'Future in the past: the past of vada, then the infinitive.',
  'xx.agree.gender': 'The participle agrees in gender: {gender}.',
  'xx.clause.particle-final': 'The separable particle {particle} goes to the end of the clause.',
  'xx.clause.particle-attached': 'The particle {particle} attaches to the verb: {before} becomes {after}.',
} as const satisfies Record<keyof typeof toyRules, string>;

export const nl = {
  'xx.classify.listed': '{before} staat in het lexicon als {after}.',
  'xx.classify.a-verb': '{before} eindigt op -a: klasse {after}.',
  'xx.assume.unlisted': 'Aangenomen dat het werkwoord regelmatig is: het staat niet in het lexicon.',
  'xx.avail.no-participle': 'Dit werkwoord heeft geen deelwoord, dus het perfectum en het voltooid deelwoord bestaan niet.',
  'xx.lex.present': 'Onregelmatig werkwoord: de tegenwoordige tijd van {before} is het hele woord {after}.',
  'xx.stem.drop-a': 'Laat -a weg van {before}: {after}-.',
  'xx.stem.listed': 'Het lexicon geeft de stam {after}- voor {before}.',
  'xx.end.present': 'Tegenwoordige tijd, {person} {number}: voeg -{ending} toe.',
  'xx.end.past': '{tense}: voeg -{ending} toe aan {before}-.',
  'xx.end.imperative': 'Gebiedende wijs: voeg -e toe aan {before}-.',
  'xx.end.long': 'Literaire lange uitgang: voeg -{ending} toe.',
  'xx.end.passive': 'Lijdend: voeg -ur- toe aan de stam {before}-.',
  'xx.end.infinitive': 'Onbepaalde wijs: voeg -a toe aan {before}-.',
  'xx.end.present-participle': 'Tegenwoordig deelwoord: voeg -ante toe aan {before}-.',
  'xx.end.participle': 'Voltooid deelwoord: voeg -{ending} toe aan {before}-.',
  'xx.orth.c-qu': 'Spelling: c wordt qu geschreven voor {vowel}, dus {before} wordt {after}.',
  'xx.orth.ph-f': 'Gerectificeerde spelling: ph wordt f geschreven, dus {before} wordt {after}.',
  'xx.periphrasis.perfect': 'Perfectum: de tegenwoordige tijd van {auxiliary} plus het voltooid deelwoord.',
  'xx.periphrasis.passive-perfect': 'Lijdend perfectum: de tegenwoordige tijd van esta plus het voltooid deelwoord.',
  'xx.periphrasis.future': 'Toekomende tijd: de tegenwoordige tijd van vada, het woord a en dan de onbepaalde wijs.',
  'xx.periphrasis.future-inverted': 'Literaire toekomende tijd: de onbepaalde wijs en dan de tegenwoordige tijd van haba.',
  'xx.periphrasis.conditional': 'Toekomende tijd in het verleden: de verleden tijd van vada en dan de onbepaalde wijs.',
  'xx.agree.gender': 'Het deelwoord komt overeen in geslacht: {gender}.',
  'xx.clause.particle-final': 'Het scheidbare partikel {particle} gaat naar het einde van de zin.',
  'xx.clause.particle-attached': 'Het partikel {particle} hecht zich aan het werkwoord: {before} wordt {after}.',
} as const satisfies Record<keyof typeof toyRules, string>;
