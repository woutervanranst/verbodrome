/**
 * What the English spelling rules and the stress decision read from a word's letters (design §3 "Syllables from
 * spelling", §4.4 "Definitions used by the predicates").
 */

const vowelLetters = 'aeiou';
const doublingConsonants = 'bdfgjklmnpqrstvz';

/** a, e, i, o or u. */
export function isVowelLetter(letter: string): boolean {
  return letter !== '' && vowelLetters.includes(letter);
}

/** Whether the letter at `index` is a vowel: a e i o u (not the u of qu), and y after a consonant letter. */
export function isVowelAt(word: string, index: number): boolean {
  const letter = word.charAt(index);
  if (letter === '' || (letter === 'u' && word.charAt(index - 1) === 'q')) return false;
  if (vowelLetters.includes(letter)) return true;
  return letter === 'y' && index > 0 && !isVowelAt(word, index - 1);
}

/** The number of vowel groups: maximal runs of vowels, where a word-final ial or uel counts as two (di·al, fu·el). */
export function vowelGroups(word: string): number {
  let groups = 0;
  for (let index = 0; index < word.length; index += 1) {
    if (isVowelAt(word, index) && !isVowelAt(word, index - 1)) groups += 1;
  }
  return /(?:ial|uel)$/u.test(word) ? groups + 1 : groups;
}

/** The letter before the final consonant is one vowel letter: not preceded by another vowel letter, unless that is the u of qu. */
export function singleVowelBeforeFinal(word: string): boolean {
  if (!isVowelLetter(word.charAt(word.length - 2))) return false;
  const before = word.charAt(word.length - 3);
  return !isVowelLetter(before) || (before === 'u' && word.charAt(word.length - 4) === 'q');
}

/** Ends in one vowel letter and a consonant that can double (`vc`): any consonant but c, h, w, x and y. */
export function endsInDoublingConsonant(word: string): boolean {
  return word !== '' && doublingConsonants.includes(word.charAt(word.length - 1)) && singleVowelBeforeFinal(word);
}

/** Ends in -ial or -uel, two syllables the vowel-group count reads as one (dial, fuel). */
export function endsInIalOrUel(word: string): boolean {
  return /(?:ial|uel)$/u.test(word);
}

/** Where British spelling doubles a final l without stress: one vowel + l, or -ial / -uel. */
export function britishLEnvironment(word: string): boolean {
  return (word.endsWith('l') && singleVowelBeforeFinal(word)) || endsInIalOrUel(word);
}

/** Whether the stress decides the spelling: the word ends vc, or in a British-l environment. */
export function needsStress(word: string): boolean {
  return endsInDoublingConsonant(word) || endsInIalOrUel(word);
}

/** The consonant letters before the first vowel (`qu` included). */
export function onset(word: string): string {
  let index = 0;
  while (index < word.length && !isVowelAt(word, index)) index += 1;
  return word.slice(0, index);
}
