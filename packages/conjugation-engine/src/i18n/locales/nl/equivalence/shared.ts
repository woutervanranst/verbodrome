/**
 * De Nederlandse teksten van de gedeelde equivalentienoten: de stappen van de versoepeling (`eq.note.*`) en de
 * uitzonderingen per talenpaar (`eq.pair.*`). Gewone tekst zonder plaatshouders of rechte apostrof.
 */
import type { sharedNotes as english } from '../../en/equivalence/shared.js';

export const sharedNotes = {
  'eq.note.no-counterpart': 'De doeltaal heeft in haar catalogus geen tijd die met deze vorm overeenkomt.',
  'eq.note.relaxed-register': 'Alleen een verouderde tijd komt hiermee overeen; die wordt vandaag nauwelijks nog gebruikt.',
  'eq.note.relaxed-remoteness': 'De doeltaal drukt nabijheid in de tijd niet uit met een aparte tijd; de gewone tijd wordt gebruikt.',
  'eq.note.relaxed-aspect': 'De doeltaal drukt dit aspect niet uit met een aparte tijd; de tijd die er het dichtst bij ligt, wordt gebruikt.',
  'eq.note.no-subjunctive': 'De doeltaal heeft geen tijd in de aanvoegende wijs die hiermee overeenkomt; de aantonende wijs wordt gebruikt.',
  'eq.note.no-conditional': 'De doeltaal heeft geen tijd in de voorwaardelijke wijs die hiermee overeenkomt; de aantonende wijs wordt gebruikt.',
  'eq.note.negation-added': 'De ontkennende gebiedende wijs is de gewone gebiedende wijs met een ontkenning erbij; de tijd zelf blijft dezelfde.',
  'eq.note.passive-not-modelled': 'De lijdende vorm van de doeltaal is niet opgenomen; de tijd in de bedrijvende vorm wordt gegeven.',
  'eq.pair.fr-nl.near-future': 'Frans aller plus infinitief komt overeen met het Nederlandse gaan plus infinitief: vraag de onvoltooid tegenwoordige tijd van gaan en voeg de infinitief toe.',
  'eq.pair.fr-nl.recent-past': 'Frans venir de plus infinitief wordt in het Nederlands weergegeven met de voltooid tegenwoordige tijd en het woord net.',
  'eq.pair.fr-nl.hortative': 'De eerste persoon meervoud van de Franse gebiedende wijs wordt in het Nederlands gevormd met laten we plus infinitief.',
  'eq.pair.fr-en.perfect-result': 'De Engelse present perfect past alleen als het resultaat nu nog telt (I have lost my keys); voor een afgeronde gebeurtenis gebruikt het Engels de simple past.',
  'eq.pair.en-fr.si-clause': 'Na si zet het Frans het onwerkelijke in de aantonende wijs: de imparfait voor if I were (si j’étais), de plus-que-parfait voor if I had known (si j’avais su).',
  'eq.pair.subjunctive-clause': 'Het Nederlands heeft geen aanvoegende wijs: deze vorm wordt weergegeven met de aantonende wijs, meestal in een bijzin.',
} as const satisfies Record<keyof typeof english, string>;
