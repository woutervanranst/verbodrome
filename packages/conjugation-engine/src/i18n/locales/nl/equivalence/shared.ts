/**
 * De Nederlandse teksten van de gedeelde equivalentienoten: de stappen van de versoepeling (`eq.note.*`) en de
 * uitzonderingen per talenpaar (`eq.pair.*`). Gewone tekst zonder plaatshouders of rechte apostrof.
 */
import type { sharedNotes as english } from '../../en/equivalence/shared.js';

export const sharedNotes = {
  'eq.note.no-counterpart': 'De doeltaal heeft geen tijd die met deze vorm overeenkomt.',
  'eq.note.relaxed-register': 'Alleen een verouderde tijd komt hiermee overeen; die wordt tegenwoordig nauwelijks nog gebruikt.',
  'eq.note.relaxed-remoteness': 'De doeltaal heeft geen aparte tijd voor iets wat net gebeurd is of zo meteen gebeurt; je gebruikt de gewone tijd.',
  'eq.note.relaxed-aspect': 'De doeltaal drukt dit aspect niet uit met een aparte tijd; de tijd die er het dichtst bij ligt, wordt gebruikt.',
  'eq.note.no-subjunctive': 'De doeltaal heeft geen tijd in de aanvoegende wijs die hiermee overeenkomt; de aantonende wijs wordt gebruikt.',
  'eq.note.no-conditional': 'De doeltaal heeft geen tijd in de voorwaardelijke wijs die hiermee overeenkomt; de aantonende wijs wordt gebruikt.',
  'eq.note.negation-added': 'De ontkennende gebiedende wijs is de gewone gebiedende wijs met een ontkenning erbij; de tijd zelf blijft dezelfde.',
  'eq.note.passive-not-modelled': 'De doeltaal vormt de lijdende vorm met een hulpwerkwoord (worden, être, werden, be, ser, essere) en het voltooid deelwoord: zet dat hulpwerkwoord in de gegeven tijd.',
  'eq.pair.fr-nl.near-future': 'Het Franse aller plus infinitief komt overeen met gaan plus infinitief: vervoeg gaan in de onvoltooid tegenwoordige tijd en voeg de infinitief toe (je vais manger: ik ga eten).',
  'eq.pair.fr-nl.recent-past': 'Het Franse venir de plus infinitief wordt in het Nederlands de voltooid tegenwoordige tijd met net (je viens de manger: ik heb net gegeten).',
  'eq.pair.fr-nl.hortative': 'De eerste persoon meervoud van de Franse gebiedende wijs wordt in het Nederlands laten we plus infinitief (chantons: laten we zingen).',
  'eq.pair.fr-en.perfect-result': 'De Engelse present perfect gebruik je alleen als het resultaat nu nog van belang is (I have lost my keys); voor een afgesloten gebeurtenis gebruikt het Engels de simple past.',
  'eq.pair.subjunctive-clause': 'Het Nederlands gebruikt de aanvoegende wijs niet meer: deze vorm wordt weergegeven met de aantonende wijs, meestal in een bijzin.',
} as const satisfies Record<keyof typeof english, string>;
