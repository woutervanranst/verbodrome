/** De Nederlandse teksten van de noten bij de Duitse tijden (`src/equivalence/de.ts`). */
import type { deNotes as english } from '../../en/equivalence/de.js';

export const deNotes = {
  'eq.de.present-future': 'Het Duits gebruikt de tegenwoordige tijd vaak voor de toekomst, met een tijdsaanduiding erbij (ich komme morgen).',
  'eq.de.past-written': 'Het Präteritum is de verleden tijd van het geschreven verhaal; in gesproken taal gebruikt het Duits liever het Perfekt.',
  'eq.de.perfect-spoken': 'Het Perfekt is in gesproken taal de gewone verleden tijd, ook voor afgeronde gebeurtenissen.',
  'eq.de.future-supposition': 'Futur I drukt ook een vermoeden uit (er wird krank sein).',
  'eq.de.subjunctive-reported': 'Konjunktiv I is de vorm van de indirecte rede.',
  'eq.de.subjunctive-unreal': 'Konjunktiv II drukt iets onwerkelijks of een beleefd verzoek uit; in gesproken taal gebruikt men meestal de würde-vorm.',
  'eq.de.conditional-past-rare': 'De würde-vorm met een voltooide infinitief is zeldzaam; hätte met een voltooid deelwoord heeft de voorkeur.',
  'eq.de.subjunctive-as-indicative': 'Het Duits gebruikt de aantonende wijs waar andere talen de aanvoegende wijs gebruiken (dass du kommst); Konjunktiv I dient alleen voor de indirecte rede.',
} as const satisfies Record<keyof typeof english, string>;
