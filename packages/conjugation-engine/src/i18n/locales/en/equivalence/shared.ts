/**
 * The notes of the tense equivalence that belong to no one language: the relaxation ladder (`eq.note.*`), and the pair
 * overrides (`eq.pair.*`). Plain text, no placeholders and no straight apostrophe: a trainer shows the message as it is.
 */
export const sharedNotes = {
  'eq.note.no-counterpart': 'The target language has no tense in its catalogue that corresponds to this form.',
  'eq.note.relaxed-register': 'Only a dated tense corresponds to this form; it is hardly used today.',
  'eq.note.relaxed-remoteness': 'The target language does not mark nearness in time; the plain tense is used.',
  'eq.note.relaxed-aspect': 'The target language does not mark this aspect in a separate tense; the closest tense is used.',
  'eq.note.no-subjunctive': 'The target language has no subjunctive tense that corresponds to this one; the indicative is used.',
  'eq.note.no-conditional': 'The target language has no conditional tense that corresponds to this one; the indicative is used.',
  'eq.note.negation-added': 'The negative imperative is the plain imperative plus a negation word; the tense itself is the same.',
  'eq.note.passive-not-modelled': 'The passive of the target language is not modelled; the active tense is given.',
  'eq.pair.fr-nl.near-future': 'French aller plus infinitive corresponds to Dutch gaan plus infinitive: ask for the present tense of gaan and add the infinitive.',
  'eq.pair.fr-nl.recent-past': 'French venir de plus infinitive is rendered in Dutch with the perfect and the word net.',
  'eq.pair.fr-nl.hortative': 'The French first person plural imperative is built in Dutch with laten we plus infinitive.',
  'eq.pair.fr-en.perfect-result': 'The English present perfect fits only when the result still matters now (I have lost my keys); for a finished event English uses the simple past.',
  'eq.pair.en-fr.si-clause': 'After si French puts the unreal in the indicative: the imperfect for if I were (si j’étais), the pluperfect for if I had known (si j’avais su).',
  'eq.pair.subjunctive-clause': 'Dutch has no subjunctive: it renders this form with the indicative, usually in a subordinate clause.',
} as const;
