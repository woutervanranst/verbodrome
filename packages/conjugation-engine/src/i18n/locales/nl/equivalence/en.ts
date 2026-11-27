/** De Nederlandse teksten van de noten bij de Engelse tijden (`src/equivalence/en.ts`). */
import type { enNotes as english } from '../../en/equivalence/en.js';

export const enNotes = {
  'eq.en.progressive': 'De Engelse continuous-vorm benadrukt dat een handeling aan de gang is; andere talen gebruiken de gewone tijd, of een omschrijving zoals aan het plus infinitief in het Nederlands.',
  'eq.en.duration': 'De perfect continuous drukt uit hoe lang iets al duurt tot op het moment waarover men spreekt; veel talen gebruiken daarvoor de gewone tegenwoordige of verleden tijd met een tijdsbepaling (ik wacht al een uur).',
  'eq.en.past-both': 'De Engelse simple past dekt zowel afgeronde gebeurtenissen als toestanden en gewoontes in het verleden; andere talen verdelen die over twee tijden.',
  'eq.en.subjunctive-mandative': 'De aanvoegende wijs van de tegenwoordige tijd staat na werkwoorden die een eis uitdrukken en in formeel Engels (that he be told).',
  'eq.en.subjunctive-irrealis': 'De aanvoegende wijs van de verleden tijd drukt na if iets onwerkelijks uit (if I were); veel talen gebruiken na if een verleden tijd.',
  'eq.en.ing-both': 'De -ing-vorm is zowel een deelwoord als een gerundium.',
  'eq.en.compound-inf-perfect': 'De voltooide infinitief is in het Engels een samengestelde vorm: to have plus het voltooid deelwoord (to have worked).',
  'eq.en.compound-having': 'Het Engels vormt een voltooid deelwoord of gerundium met having plus het voltooid deelwoord (having worked).',
} as const satisfies Record<keyof typeof english, string>;
