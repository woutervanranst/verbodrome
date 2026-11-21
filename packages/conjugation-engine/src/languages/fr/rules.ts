import { personIndex, itemAt } from '../../parts.js';
import { ConjugationError } from '../../errors.js';
import type { ResolvedTarget } from '../../types.js';
import type { FrenchParadigm, PastVowel } from './exceptions.js';
import { erStem, simpleSpelling } from './orthography.js';
import type { Spelling } from './orthography.js';

const imperfect = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'] as const;
const future = ['ai', 'as', 'a', 'ons', 'ez', 'ont'] as const;
const subjunctive = ['e', 'es', 'e', 'ions', 'iez', 'ent'] as const;
const simplePast: Readonly<Record<PastVowel, readonly string[]>> = {
  a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
};
const imperfectSubjunctive: Readonly<Record<PastVowel, readonly string[]>> = {
  a: ['asse', 'asses', 'ât', 'assions', 'assiez', 'assent'],
  i: ['isse', 'isses', 'ît', 'issions', 'issiez', 'issent'],
  u: ['usse', 'usses', 'ût', 'ussions', 'ussiez', 'ussent'],
  in: ['insse', 'insses', 'înt', 'inssions', 'inssiez', 'inssent'],
};

export function regularParadigms(lemma: string, kind: 'er' | 'ir' | 're'): FrenchParadigm[] {
  const root = lemma.slice(0, -2);
  const vowel = lemma.endsWith('ïr') ? 'ï' : 'i';
  const paradigm: FrenchParadigm = {
    kind, singular: kind === 'ir' ? root + vowel : root, plural: kind === 'ir' ? root + vowel + 'ss' : root,
    thirdPlural: kind === 'ir' ? root + vowel + 'ss' : root,
    future: kind === 're' ? lemma.slice(0, -1) : lemma,
    past: root, pastVowel: kind === 'er' ? 'a' : 'i',
    participle: root + (kind === 'er' ? 'é' : kind === 'ir' ? vowel : 'u'),
    ...(vowel === 'ï' ? { diaeresisPast: true } : {}),
  };
  return kind === 'er' && lemma.endsWith('ayer')
    ? [{ ...paradigm, pattern: 'y-to-i' }, { ...paradigm, pattern: 'keep-y' }]
    : [paradigm];
}

function stem(paradigm: FrenchParadigm, root: string, ending: string, spelling: Spelling, futureTense = false): string {
  return paradigm.kind === 'er'
    ? erStem(root, ending, spelling, futureTense, paradigm.pattern === 'keep-y')
    : root;
}

function present(paradigm: FrenchParadigm, index: number, spelling: Spelling): string {
  const override = paradigm.presentCells?.[index];
  if (override) return override;
  if (index === 3 || index === 4) {
    const ending = index === 3 ? 'ons' : 'ez';
    return stem(paradigm, paradigm.plural, ending, spelling) + ending;
  }
  if (index === 5) return stem(paradigm, paradigm.thirdPlural, 'ent', spelling) + 'ent';
  const endings = paradigm.singularEndings ?? (paradigm.kind === 'er' ? ['e', 'es', 'e'] : ['s', 's', /[dt]$/u.test(paradigm.singular) ? '' : 't']);
  const ending = itemAt(endings, index);
  return stem(paradigm, paradigm.singular, ending, spelling) + ending;
}

export function simpleForms(paradigm: FrenchParadigm, lemma: string, target: ResolvedTarget, spelling: Spelling): string[] {
  const index = personIndex(target);
  let word: string;
  let additional: readonly string[] = [];
  if (target.mood === 'imperative') {
    word = paradigm.imperativeCells?.[index] ?? present(paradigm, index, spelling);
    if (index === 1 && (paradigm.kind === 'er' || paradigm.singularEndings?.[0] === 'e')) word = word.replace(/s$/u, '');
    additional = paradigm.imperativeAlternatives?.[index] ?? [];
  } else if (target.mood === 'subjunctive' && target.tense === 'present') {
    const ending = itemAt(subjunctive, index);
    const root = index === 3 || index === 4
      ? (paradigm.subjunctivePlural ?? paradigm.plural)
      : (paradigm.subjunctiveSingular ?? paradigm.thirdPlural);
    word = paradigm.subjunctiveCells?.[index] ?? stem(paradigm, root, ending, spelling) + ending;
    if (index === 3 || index === 4) additional = (paradigm.subjunctivePluralAlternatives ?? []).map(alternative => alternative + ending);
  } else if (target.mood === 'subjunctive' && target.tense === 'imperfect') {
    let ending = itemAt(imperfectSubjunctive[paradigm.pastVowel], index);
    if (paradigm.diaeresisPast) ending = ending.replace(/^[iî]/u, 'ï');
    word = stem(paradigm, paradigm.past, ending, spelling) + ending;
  } else if (target.tense === 'present' && target.mood === 'indicative') {
    word = present(paradigm, index, spelling);
    additional = paradigm.presentAlternatives?.[index] ?? [];
  } else if (target.tense === 'imperfect') {
    const ending = itemAt(imperfect, index);
    word = stem(paradigm, paradigm.plural, ending, spelling) + ending;
  } else if (target.tense === 'simple_past') {
    let ending = itemAt(simplePast[paradigm.pastVowel], index);
    if (paradigm.diaeresisPast) ending = ending.replace(/^[iî]/u, 'ï');
    word = stem(paradigm, paradigm.past, ending, spelling) + ending;
  } else if (target.tense === 'future' || target.mood === 'conditional') {
    const ending = itemAt(target.mood === 'conditional' ? imperfect : future, index);
    const root = paradigm.kind === 'er' && !paradigm.lexicalFuture
      ? stem(paradigm, paradigm.singular, '', spelling, true) + 'er'
      : paradigm.future;
    word = root + ending;
    additional = (paradigm.futureAlternatives ?? []).map(alternative => alternative + ending);
  } else {
    throw new ConjugationError('GENERATION_FAILURE', `French simple-form dispatch failed for ${target.mood}/${target.tense}.`);
  }
  return [word, ...additional].map(form => simpleSpelling(form, lemma, spelling, target.mood, target.tense, index));
}

export function presentParticiples(paradigm: FrenchParadigm, spelling: Spelling): string[] {
  return [
    paradigm.presentParticiple ?? stem(paradigm, paradigm.plural, 'ant', spelling) + 'ant',
    ...(paradigm.presentParticipleAlternatives ?? []),
  ];
}

export function pastParticiple(paradigm: FrenchParadigm, gender: string, number: string, spelling: Spelling): string {
  let word = paradigm.participle;
  if (paradigm.invariableParticiple) return word;
  if (spelling === 'rectified') word = word.replace(/interpellé$/u, 'interpelé');
  const distinguishCroitre = spelling === 'rectified' && word === 'crû';
  if (word === 'mû' && spelling === 'rectified') word = 'mu';
  if (gender === 'feminine') word = paradigm.feminineParticiple ?? (distinguishCroitre ? word : word.replace(/û$/u, 'u')) + 'e';
  if (number === 'plural') {
    if (gender !== 'feminine' && !distinguishCroitre) word = word.replace(/û$/u, 'u');
    if (!/[sx]$/u.test(word)) word += 's';
  }
  return word;
}
