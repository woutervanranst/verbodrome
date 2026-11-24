/** English messages every language shares: grammatical terms and the headings of an explanation. */
export const core = {
  'term.person.1': '1st person',
  'term.person.2': '2nd person',
  'term.person.3': '3rd person',
  'term.number.singular': 'singular',
  'term.number.plural': 'plural',
  'term.gender.masculine': 'masculine',
  'term.gender.feminine': 'feminine',
  'term.gender.neuter': 'neuter',
  'term.voice.active': 'active',
  'term.voice.passive': 'passive',
  'term.case.nominative': 'nominative',
  'term.case.genitive': 'genitive',
  'term.case.dative': 'dative',
  'term.case.accusative': 'accusative',
  'term.case.ablative': 'ablative',
  // {text} the form, {mood} and {tense} its native labels.
  'explain.summary.form': '{text}: {mood}, {tense}',
  // {mood} and {tense} the native labels of the target, {reason} the UnavailableTarget reason.
  'explain.summary.unavailable': '{mood}, {tense}: unavailable ({reason, select, impersonal {impersonal} defective {defective} noImperative {no imperative} other {other}})',
  // {lemma} the verb, {classification} the class it follows.
  'explain.summary.analysis': '{lemma}: {classification}',
  'explain.section.form': 'The whole form',
  'explain.section.availability': 'Availability',
  'explain.section.classify': 'The verb',
} as const;
