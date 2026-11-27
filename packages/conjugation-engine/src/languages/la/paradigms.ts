/**
 * Latin ending sets (GD §4.6; A&G §§163, 168–169, 179; Bennett §§96, 101–111), written in their underlying form: the
 * quantity rules of `orthography.ts` shorten and drop vowels at the junction (amā + t → amat, amā + ō → amō).
 */

/** The ending columns: a = first (amā-), e = second (monē-), i = fourth (audī-), c = third, consonant and -iō stems. */
export type EndingColumn = 'a' | 'e' | 'i' | 'c';

type Table = Readonly<Record<EndingColumn, string>>;

const same = (a: string, i: string, c: string): Table => ({ a, e: a, i, c });

/**
 * Endings per cell key `${mood}.${tense}.${voice}`, slots in the order of the catalogue entry (finite: 1sg 2sg 3sg 1pl 2pl
 * 3pl; present imperative: 2sg 2pl; future imperative: 2sg 3sg 2pl 3pl); `-` is an empty ending, `x` a slot with none.
 */
const presentSystem: Readonly<Record<string, Table>> = {
  'indicative.present.active': same('ō s t mus tis nt', 'ō s t mus tis unt', 'ō is it imus itis unt'),
  'indicative.present.passive': same('or ris tur mur minī ntur', 'or ris tur mur minī untur', 'or eris itur imur iminī untur'),
  'indicative.imperfect.active': same('bām bās bāt bāmus bātis bānt', 'ēbām ēbās ēbāt ēbāmus ēbātis ēbānt', 'ēbām ēbās ēbāt ēbāmus ēbātis ēbānt'),
  'indicative.imperfect.passive': same('bār bāris bātur bāmur bāminī bāntur', 'ēbār ēbāris ēbātur ēbāmur ēbāminī ēbāntur', 'ēbār ēbāris ēbātur ēbāmur ēbāminī ēbāntur'),
  'indicative.future.active': same('bō bis bit bimus bitis bunt', 'ām ēs ēt ēmus ētis ēnt', 'ām ēs ēt ēmus ētis ēnt'),
  'indicative.future.passive': same('bor beris bitur bimur biminī buntur', 'ār ēris ētur ēmur ēminī ēntur', 'ār ēris ētur ēmur ēminī ēntur'),
  'subjunctive.present.active': { a: 'ēm ēs ēt ēmus ētis ēnt', e: 'ām ās āt āmus ātis ānt', i: 'ām ās āt āmus ātis ānt', c: 'ām ās āt āmus ātis ānt' },
  'subjunctive.present.passive': { a: 'ēr ēris ētur ēmur ēminī ēntur', e: 'ār āris ātur āmur āminī āntur', i: 'ār āris ātur āmur āminī āntur', c: 'ār āris ātur āmur āminī āntur' },
  'subjunctive.imperfect.active': same('rēm rēs rēt rēmus rētis rēnt', 'rēm rēs rēt rēmus rētis rēnt', 'erēm erēs erēt erēmus erētis erēnt'),
  'subjunctive.imperfect.passive': same('rēr rēris rētur rēmur rēminī rēntur', 'rēr rēris rētur rēmur rēminī rēntur', 'erēr erēris erētur erēmur erēminī erēntur'),
  'imperative.present.active': same('- te', '- te', 'e ite'),
  'imperative.present.passive': same('re minī', 're minī', 'ere iminī'),
  'imperative.future.active': same('tō tō tōte ntō', 'tō tō tōte untō', 'itō itō itōte untō'),
  'imperative.future.passive': same('tor tor x ntor', 'tor tor x untor', 'itor itor x untor'),
};

/** The perfect system, on the perfect stem, the same for every class (A&G §169; the perfect subjunctive after Bennett §101). */
const perfectSystem: Readonly<Record<string, string>> = {
  'indicative.perfect': 'ī istī it imus istis ērunt',
  'indicative.pluperfect': 'erām erās erāt erāmus erātis erānt',
  'indicative.future_perfect': 'erō eris erit erimus eritis erint',
  'subjunctive.perfect': 'erīm erīs erīt erīmus erītis erīnt',
  'subjunctive.pluperfect': 'issēm issēs issēt issēmus issētis issēnt',
};

/** The present subjunctive of velim, nōlim, mālim (A&G §168.e Note 2). */
export const optativeEndings: readonly string[] = 'īm īs īt īmus ītis īnt'.split(' ');

const slotsOf = (text: string): string[] => text.split(' ').map(item => item === '-' ? '' : item);

/** The underlying endings of a present-system cell for one column, in slot order (`x`: the slot has none). */
export function endingsFor(column: EndingColumn, cellKey: string): readonly string[] {
  const table = presentSystem[cellKey];
  if (!table) throw new Error(`No Latin present-system endings for ${cellKey}.`);
  return slotsOf(table[column]);
}

/** The perfect-system endings of `${mood}.${tense}`, in slot order. */
export function perfectEndings(tenseKey: string): readonly string[] {
  const endings = perfectSystem[tenseKey];
  if (!endings) throw new Error(`No Latin perfect-system endings for ${tenseKey}.`);
  return slotsOf(endings);
}

export const isPerfectTense = (mood: string, tense: string): boolean => Object.hasOwn(perfectSystem, `${mood}.${tense}`);

/** The present and passive infinitive endings (A&G §166): -re / -rī after a long stem vowel, -ere / -ī after a consonant. */
export function infinitiveEnding(column: EndingColumn, passive: boolean): string {
  return column === 'c' ? passive ? 'ī' : 'ere' : passive ? 'rī' : 're';
}

/** The literary -re for a second singular passive in -ris (amāris → amāre; A&G p. 94; GD §4.6), or null. */
export function passiveReVariant(ending: string): string | null {
  return ending.endsWith('ris') ? `${ending.slice(0, -3)}re` : null;
}
