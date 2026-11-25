/**
 * Stress, orthographic syllables and the written accent (grammar design §4.5), as pure functions over a word and the
 * index of its stressed vowel. Ortografía 2010: two adjacent vowels share a syllable unless both are open (a, e, o) or
 * the close one (i, u) is the stressed one; ui and iu always share one; an h between vowels does not split them; a
 * one-syllable word takes no tilde; otherwise the general rules decide.
 */

const plain: Readonly<Record<string, string>> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
const accented: Readonly<Record<string, string>> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

/** The word without acute accents (the diaeresis stays). */
export function stripAccents(word: string): string {
  return word.normalize('NFC').replace(/[áéíóú]/gu, letter => plain[letter]!);
}

const isOpenLetter = (letter: string): boolean => /[aeoáéó]/u.test(letter);

/** Whether the letter at `index` is a vowel letter: not the silent u of gue/gui/que/qui, y only word-final after a vowel. */
function isVowelAt(word: string, index: number): boolean {
  const letter = word[index] ?? '';
  const previous = word[index - 1] ?? '';
  const next = word[index + 1] ?? '';
  if (isOpenLetter(letter) || /[iíúü]/u.test(letter)) return true;
  if (letter === 'u') return !(previous === 'q' || (previous === 'g' && /[eiéí]/u.test(next)));
  if (letter === 'y') return index === word.length - 1 && index > 0 && isVowelAt(word, index - 1);
  return false;
}

/** The indices of the vowel letters of `word` (grammar design §4.5 step 1). */
export function vowelIndices(word: string): number[] {
  const indices: number[] = [];
  for (let index = 0; index < word.length; index++) if (isVowelAt(word, index)) indices.push(index);
  return indices;
}

/** Two vowel letters that touch: next to each other, or with only an h between them. */
function adjacent(word: string, left: number, right: number): boolean {
  return right === left + 1 || (right === left + 2 && word[left + 1] === 'h');
}

/** The index of the vowel letter `fromEnd` places from the end of the word (1 = the last). */
export function endingStress(word: string, fromEnd: number): number {
  const indices = vowelIndices(stripAccents(word));
  const index = indices[indices.length - fromEnd];
  if (index === undefined) throw new RangeError(`${word} has no vowel ${fromEnd} from the end.`);
  return index;
}

/**
 * The stressed vowel of a root-stressed form, looked for in the first `stemLength` letters of `word`, after the prefix:
 * the stem's last vowel, unless it is a close vowel ending the stem after a consonant, which is a glide (cambi-o) for
 * a verb without hiatus that has another vowel; in a group of vowel letters the open one, or for a hiatus verb (whose
 * stem the lexicon does not store) the close one. Null when the stem has no vowel after the prefix.
 */
export function rootStressIn(word: string, stemLength: number, base: { prefixLength: number; hiatus: boolean; stored: boolean }): number | null {
  const plainWord = stripAccents(word);
  const candidates = vowelIndices(plainWord).filter(index => index >= base.prefixLength && index < stemLength);
  const hiatus = base.hiatus && !base.stored;
  let position = candidates.length - 1;
  if (position < 0) return null;
  const last = candidates[position]!;
  const glide = !hiatus && position > 0 && last === stemLength - 1 && /[iuü]/u.test(plainWord[last]!) && !isVowelAt(plainWord, last - 1);
  if (glide) position--;
  let start = position;
  let end = position;
  while (start > 0 && adjacent(plainWord, candidates[start - 1]!, candidates[start]!)) start--;
  while (end < candidates.length - 1 && adjacent(plainWord, candidates[end]!, candidates[end + 1]!)) end++;
  const group = candidates.slice(start, end + 1);
  if (group.length === 1) return group[0]!;
  const close = group.filter(index => !isOpenLetter(plainWord[index]!));
  const open = group.filter(index => isOpenLetter(plainWord[index]!));
  if (hiatus && close.length) return close.at(-1)!;
  return open[0] ?? group.at(-1)!;
}

/** The stressed vowel of a root-stressed stem on its own (`rootStressIn` with the whole stem). */
export function rootStress(stem: string, base: { prefixLength: number; hiatus: boolean; stored: boolean }): number | null {
  return rootStressIn(stem, stem.length, base);
}

/** The syllable nuclei of `word` as groups of vowel indices, given its stressed vowel (§4.5 step 3). */
export function nuclei(word: string, stressed: number): number[][] {
  const plainWord = stripAccents(word);
  const groups: number[][] = [];
  for (const index of vowelIndices(plainWord)) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    if (group !== undefined && previous !== undefined && adjacent(plainWord, previous, index) && together(plainWord, previous, index, stressed)) group.push(index);
    else groups.push([index]);
  }
  return groups;
}

/** Whether two touching vowels share a nucleus. */
function together(word: string, left: number, right: number, stressed: number): boolean {
  const leftOpen = isOpenLetter(word[left]!);
  const rightOpen = isOpenLetter(word[right]!);
  if (leftOpen && rightOpen) return false;
  if (!leftOpen && !rightOpen) return true;
  const close = leftOpen ? right : left;
  return close !== stressed;
}

/**
 * The stressed vowel of a correctly written word: its tilde, or else the syllable the general rules leave without one
 * (the second-to-last when the word ends in a vowel, n or s, the last otherwise), on its open vowel.
 */
export function writtenStress(word: string): number {
  const accented = [...word.normalize('NFC')].findIndex(letter => /[áéíóú]/u.test(letter));
  if (accented >= 0) return accented;
  const plainWord = stripAccents(word);
  const groups = nuclei(plainWord, -1);
  const vowelOrNs = /[aeiou]$/u.test(plainWord) || (/[ns]$/u.test(plainWord) && isVowelAt(plainWord, plainWord.length - 2));
  const group = groups[groups.length - (vowelOrNs && groups.length > 1 ? 2 : 1)];
  if (group === undefined) throw new RangeError(`${word} has no vowel.`);
  return group.find(index => isOpenLetter(plainWord[index]!)) ?? group.at(-1)!;
}

export type Accent = {
  /** What decides the tilde: a stressed close vowel beside an open one, the general rules, one syllable, or nothing. */
  kind: 'hiatus' | 'general' | 'monosyllable' | 'none';
  stress: 'final' | 'penultimate' | 'antepenultimate';
  written: string;
};

const positions: readonly Accent['stress'][] = ['final', 'penultimate', 'antepenultimate'];

/** The word written with the tilde its stressed vowel calls for (§4.5 step 4); a tilde it already has is rewritten. */
export function writeAccent(word: string, stressed: number): Accent {
  const plainWord = stripAccents(word);
  const indices = vowelIndices(plainWord);
  if (!indices.includes(stressed)) throw new RangeError(`${word} has no vowel at ${stressed}.`);
  const groups = nuclei(plainWord, stressed);
  const groupIndex = groups.findIndex(group => group.includes(stressed));
  const stress = positions[Math.min(groups.length - 1 - groupIndex, 2)]!;
  const mark = (index: number): string => plainWord.slice(0, index) + (accented[plainWord[index]!] ?? plainWord[index]!) + plainWord.slice(index + 1);

  const letter = plainWord[stressed]!;
  const neighbours = indices.filter(index => adjacent(plainWord, index, stressed) || adjacent(plainWord, stressed, index));
  if (/[iu]/u.test(letter) && neighbours.some(index => isOpenLetter(plainWord[index]!))) {
    return { kind: 'hiatus', stress, written: mark(stressed) };
  }
  if (groups.length === 1) return { kind: indices.length > 1 ? 'monosyllable' : 'none', stress, written: plainWord };
  const vowelOrNs = /[aeiou]$/u.test(plainWord) || (/[ns]$/u.test(plainWord) && isVowelAt(plainWord, plainWord.length - 2));
  const tilde = stress === 'final' ? vowelOrNs : stress === 'penultimate' ? !vowelOrNs : true;
  if (!tilde) return { kind: 'none', stress, written: plainWord };
  const group = groups[groupIndex]!;
  const target = isOpenLetter(letter) ? stressed : group.find(index => isOpenLetter(plainWord[index]!)) ?? group.at(-1)!;
  return { kind: 'general', stress, written: mark(target) };
}
