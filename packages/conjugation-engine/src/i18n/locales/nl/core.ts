import type { core as english } from '../en/core.js';

/** Dutch messages every language shares; `satisfies` makes a key missing from the English catalog, or from this one, a type error. */
export const core = {
  'term.person.1': '1e persoon',
  'term.person.2': '2e persoon',
  'term.person.3': '3e persoon',
  'term.number.singular': 'enkelvoud',
  'term.number.plural': 'meervoud',
  'term.gender.masculine': 'mannelijk',
  'term.gender.feminine': 'vrouwelijk',
  'term.gender.neuter': 'onzijdig',
  'term.voice.active': 'bedrijvend',
  'term.voice.passive': 'lijdend',
  'term.case.nominative': 'nominatief',
  'term.case.genitive': 'genitief',
  'term.case.dative': 'datief',
  'term.case.accusative': 'accusatief',
  'term.case.ablative': 'ablatief',
  'term.case.vocative': 'vocatief',
  'explain.summary.form': '{text}: {mood}, {tense}',
  'explain.summary.unavailable': '{mood}, {tense}: niet beschikbaar ({reason, select, impersonal {onpersoonlijk} defective {defectief} noImperative {geen gebiedende wijs} noPassive {geen lijdende vorm} other {overig}})',
  'explain.summary.analysis': '{lemma}: {classification}',
  'explain.section.form': 'De hele vorm',
  'explain.section.availability': 'Beschikbaarheid',
  'explain.section.classify': 'Het werkwoord',
  'explain.section.classify.paradigm': 'Het werkwoord ({pattern})',
} as const satisfies Record<keyof typeof english, string>;
