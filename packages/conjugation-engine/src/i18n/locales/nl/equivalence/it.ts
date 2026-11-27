/** De Nederlandse teksten van de noten bij de Italiaanse tijden (`src/equivalence/it.ts`). */
import type { itNotes as english } from '../../en/equivalence/it.js';

export const itNotes = {
  'eq.it.perfect-spoken': 'In Noord-Italië en in de spreektaal vervangt het passato prossimo het passato remoto.',
  'eq.it.simple-past-remote': 'Het passato remoto is de verleden tijd van het verhaal en van het verre verleden; in het zuiden is het nog gangbaar.',
  'eq.it.future-supposition': 'De toekomende tijd drukt ook een vermoeden uit (sarà vero).',
  'eq.it.cond-past-future-in-past': 'De condizionale passato drukt ook de toekomst uit, gezien vanuit het verleden (disse che sarebbe venuto).',
  'eq.it.gerund-as-participle': 'Het Italiaans heeft geen samengesteld deelwoord: het samengestelde gerundio neemt die plaats in (avendo cantato).',
} as const satisfies Record<keyof typeof english, string>;
