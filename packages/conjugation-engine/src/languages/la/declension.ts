/**
 * Declined non-finite forms (GD §§4.6, 6.3): the -us, -a, -um declension of the perfect and future participle and the
 * gerundive (A&G §110), the third declension of the present participle (A&G §§117–121), and which agreements a
 * non-finite cell is generated in.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { one } from '../../core/fork.js';
import type { Fork } from '../../core/fork.js';
import type { Agreement, Case, Gender, GrammaticalNumber } from '../../core/grammar.js';
import type { LatinLexeme } from './lexicon.js';
import { latinRules } from './rules.js';

/** The ten non-finite form ids of the Latin grammar (GD §6.1). */
export type LatinNonFiniteForm = 'presentInfinitive' | 'presentInfinitivePassive' | 'perfectInfinitive' | 'presentParticiple'
  | 'perfectParticiple' | 'futureParticiple' | 'gerundive' | 'gerund' | 'supine' | 'fore';

const genders: readonly Gender[] = ['masculine', 'feminine', 'neuter'];
const numbers: readonly GrammaticalNumber[] = ['singular', 'plural'];
const cases: readonly Case[] = ['nominative', 'genitive', 'dative', 'accusative', 'ablative', 'vocative'];

export const citation: Agreement = { gender: 'masculine', number: 'singular', case: 'nominative' };

export const isCitation = (agreement: Agreement | undefined): boolean =>
  agreement === undefined || (agreement.gender === 'masculine' && agreement.number === 'singular' && (agreement.case ?? 'nominative') === 'nominative');

const index = (agreement: Agreement): number => cases.indexOf(agreement.case ?? 'nominative') + (agreement.number === 'plural' ? 6 : 0);

/** The endings of bonus, -a, -um (A&G §110), case-major per number: nom gen dat acc abl voc. */
const usTable: Readonly<Record<Gender, readonly string[]>> = {
  masculine: ['us', 'ī', 'ō', 'um', 'ō', 'e', 'ī', 'ōrum', 'īs', 'ōs', 'īs', 'ī'],
  feminine: ['a', 'ae', 'ae', 'am', 'ā', 'a', 'ae', 'ārum', 'īs', 'ās', 'īs', 'ae'],
  neuter: ['um', 'ī', 'ō', 'um', 'ō', 'um', 'a', 'ōrum', 'īs', 'a', 'īs', 'a'],
};

/** The endings of egēns after its stem vowel (A&G §§117.b, 118, 121): ns in the nominative, nt- elsewhere. */
const nsTable: Readonly<Record<'common' | 'neuter', readonly string[]>> = {
  common: ['ns', 'ntis', 'ntī', 'ntem', 'nte', 'ns', 'ntēs', 'ntium', 'ntibus', 'ntēs', 'ntibus', 'ntēs'],
  neuter: ['ns', 'ntis', 'ntī', 'ns', 'nte', 'ns', 'ntia', 'ntium', 'ntibus', 'ntia', 'ntibus', 'ntia'],
};

const terms = (agreement: Agreement) => ({
  case: { term: 'case' as const, id: agreement.case ?? 'nominative' },
  gender: { term: 'gender' as const, id: agreement.gender },
  number: { term: 'number' as const, id: agreement.number },
});

/** The -us ending of an agreement. */
export function usEnding(agreement: Agreement): string {
  return usTable[agreement.gender][index(agreement)]!;
}

/**
 * A word in -us declined: `word` is its citation form (amātus), `stem` what precedes -us (amāt), `opening` the steps
 * that build the citation form. A citation agreement records no declension step.
 */
export function declineUs(stem: string, suffix: string, agreement: Agreement | undefined, opening: readonly DerivationStep[]): Fork<string> {
  if (isCitation(agreement)) return one(`${suffix}us`, opening);
  const ending = usEnding(agreement!);
  return one(suffix + ending, [
    ...opening, step(latinRules['la.end.decline-us'], `${stem}${suffix}us`, stem + suffix + ending, { ending, ...terms(agreement!) }),
  ]);
}

/** Whether a present participle's agreement uses the oblique stem in -nt- (every form but the nominative-like ones). */
export function isOblique(agreement: Agreement | undefined): boolean {
  if (agreement === undefined) return false;
  return !nsTable[agreement.gender === 'neuter' ? 'neuter' : 'common'][index(agreement)]!.startsWith('ns');
}

/**
 * The present participle's ending after `stem` (`vowel` is the connecting e of the third and fourth conjugations), with
 * the tagged second forms: ablative -ī (adjectival) and accusative plural -īs. `oblique` is set when the stem is the
 * lexical oblique stem (eunt-), which already ends in -nt.
 */
export function declineNs(stem: string, vowel: string, agreement: Agreement | undefined, oblique = false): Fork<string> {
  const nominative = `${vowel}ns`;
  const opening = oblique ? [] : [step(latinRules['la.end.present-participle'], stem, stem + nominative, { ending: nominative })];
  if (isCitation(agreement)) return one(nominative, opening);
  const chosen = agreement!;
  const suffix = nsTable[chosen.gender === 'neuter' ? 'neuter' : 'common'][index(chosen)]!;
  const full = oblique ? suffix.slice(2) : vowel + suffix;
  const decline = (text: string): DerivationStep =>
    step(latinRules['la.end.decline-ns'], oblique ? stem : stem + nominative, stem + text, { ending: oblique ? text : vowel + suffix, ...terms(chosen) });
  const forms = [...one(full, [...opening, decline(full)])];
  if (chosen.number === 'singular' && chosen.case === 'ablative') {
    const second = full.replace(/e$/u, 'ī');
    forms.push(...one(second, [...opening, decline(full), step(latinRules['la.end.ablative-i'], stem + full, stem + second)], { pattern: 'adjectival' }));
  }
  if (chosen.number === 'plural' && chosen.case === 'accusative' && chosen.gender !== 'neuter') {
    const second = full.replace(/ēs$/u, 'īs');
    forms.push(...one(second, [...opening, decline(full), step(latinRules['la.end.accusative-is'], stem + full, stem + second)], { pattern: 'is' }));
  }
  return forms;
}

function every(genderList: readonly Gender[], numberList: readonly GrammaticalNumber[], caseList: readonly Case[]): Agreement[] {
  return genderList.flatMap(gender => numberList.flatMap(number => caseList.map(grammaticalCase => ({ gender, number, case: grammaticalCase }))));
}

/**
 * The agreements a non-finite cell is generated in (GD §6.3): its citation agreement without the `agreement` option,
 * every agreement the form has with it (filtered afterwards by `acceptsForm`). Infinitive compounds take the nominative
 * and the accusative; an impersonal passive and an impersonal gerundive (eundum) stand in the neuter singular.
 */
export function agreementsFor(form: string, query: Readonly<Record<string, unknown>>, lexeme: LatinLexeme, infinitive: boolean, impersonalPassive: boolean): readonly Agreement[] {
  const declined = query.agreement !== undefined;
  if (infinitive) {
    if (impersonalPassive) return every(['neuter'], ['singular'], declined ? ['nominative', 'accusative'] : ['nominative']);
    return declined ? every(genders, numbers, ['nominative', 'accusative']) : [citation];
  }
  switch (form) {
    case 'gerund': return every(['neuter'], ['singular'], declined ? ['genitive', 'dative', 'accusative', 'ablative'] : ['genitive']);
    case 'supine': return every(['masculine'], ['singular'], declined ? ['accusative', 'ablative'] : ['accusative']);
    case 'gerundive':
      if (lexeme.passive === 'impersonal') return every(['neuter'], ['singular'], declined ? ['nominative', 'accusative'] : ['nominative']);
      return declined ? every(genders, numbers, cases) : [citation];
    default:
      return declined ? every(genders, numbers, cases) : [citation];
  }
}
