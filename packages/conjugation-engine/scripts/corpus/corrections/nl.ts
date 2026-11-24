import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../model.ts';

const stemSource = 'https://woordenlijst.org/zoeken/leidraad/11/1.html';
const auxiliarySource = 'https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic';
const subjects = ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'] as const;
const reflexives = ['me', 'je', 'zich', 'ons', 'jullie', 'zich'] as const;
const needsZijn = new Set(['bezwijken', 'blijken', 'glijden', 'rijzen', 'slinken', 'spruiten', 'wijken', 'zinken']);
const missingSubjects = new Set(['blijken', 'kosten', 'spijten', 'vriezen']);
const noImperative = new Set(['hoeven', 'kunnen', 'moeten', 'mogen']);

export function dutchCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  const { mood, tense, person, number } = cell.target;
  const slot = person === null ? -1 : (number === 'plural' ? 3 : 0) + person - 1;
  if (cell.availabilityMarker === 'notused' && mood !== 'imperative' && person !== null
    && (file.infinitive === 'blijken' || file.infinitive === 'kosten' || (file.infinitive === 'spijten' && person === 3))) {
    draft.unavailable = false;
    draft.note('The source overrestricts its impersonal template: this grammatical personal/unipersonal subject slot is standard.',
      'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic');
  }
  if (file.infinitive === 'spijten' && person !== null && person !== 3) {
    draft.markUnavailable('The standard unipersonal spijten paradigm does not license first/second-person subjects; the source fills template slots mechanically.',
      'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic');
  }
  if (missingSubjects.has(file.infinitive) && person !== null && !draft.unavailable && mood !== 'imperative' && !cell.pronoun) {
    const pronoun = file.infinitive === 'spijten' && number === 'singular' ? 'het' : subjects[slot];
    if (!pronoun) throw new Error(`Invalid corpus person in ${file.file}:${index}.`);
    draft.change('The table suppresses pronoun labels; full-phrase expectations restore the appropriate grammatical subject.',
      'https://e-ans.ivdnt.org/topics/pid/ans020302lingtopic', text => `${pronoun} ${text}`);
  }
  if (file.infinitive === 'bannen') {
    draft.change('The native mixed verb bannen has past participle gebannen, not a mechanically weak geband.',
      'https://woordenlijst.org/zoeken/?q=bannen', text => text.replace(/geband/gu, 'gebannen'));
  }
  if (file.infinitive === 'eten') {
    draft.change('Eten has the exceptional past participle gegeten; vowel diaeresis cannot derive it as geëten.',
      'https://woordenlijst.org/zoeken/?q=eten', text => text.replace(/geëten/gu, 'gegeten'));
  }
  if (file.infinitive === 'mogen') {
    draft.change('The modern strong participle of mogen is gemogen, not gemoogd.',
      'https://woordenlijst.org/zoeken/?q=mogen', text => text.replace(/gemoogd/gu, 'gemogen'));
  }
  if (file.infinitive === 'weven') {
    draft.change('A native written stem ending in underlying v is devoiced to f, including before weak de/den.',
      stemSource, text => text.replace(/weev/gu, 'weef'));
  }
  if (file.infinitive === 'schuilen' && mood === 'indicative' && tense === 'past' && number === 'plural') {
    draft.change('A long oo is written o in the open syllable of the strong plural scholen.',
      stemSource, text => text.replace(/schoolen/gu, 'scholen'));
  }
  if (file.infinitive === 'zeggen' && mood === 'indicative' && tense === 'past' && number === 'plural') {
    draft.change('The standard plural principal part is zeiden (or zegden); zeien is not the modern written paradigm.',
      'https://woordenlijst.org/zoeken/?q=zeggen', text => text.replace(/zeien/gu, 'zeiden'));
  }
  if (needsZijn.has(file.infinitive)) {
    if (mood === 'indicative' && tense === 'perfect') {
      const forms = ['ben', 'bent', 'is', 'zijn', 'zijn', 'zijn'] as const;
      const auxiliary = forms[slot];
      if (!auxiliary) throw new Error(`Invalid perfect slot in ${file.file}:${index}.`);
      draft.change('This intransitive change-of-state/movement verb selects zijn rather than the source auxiliary hebben.',
        auxiliarySource, text => text.replace(/^(\S+) (heb|hebt|heeft|hebben) /u, `$1 ${auxiliary} `));
    } else if (mood === 'indicative' && tense === 'pluperfect') {
      draft.change('This verb selects the past of zijn for the pluperfect.',
        auxiliarySource, text => text.replace(/^(\S+) (had|hadden) /u, `$1 ${number === 'singular' ? 'was' : 'waren'} `));
    } else if (tense === 'future_perfect' || (mood === 'conditional' && tense === 'past')) {
      draft.change('The compound future/conditional retains zijn as its infinitive perfect auxiliary.',
        auxiliarySource, text => text.replace(/hebben$/u, 'zijn'));
    }
  }
  if (noImperative.has(file.infinitive) && mood === 'imperative') {
    draft.markUnavailable('This modal/negative-polarity verb has no ordinary standard imperative; the source copies a present-indicative form.',
      'https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic');
  }
  if (file.infinitive === 'vergissen' && !draft.unavailable) {
    const reflexive = person === null ? 'zich' : reflexives[slot];
    if (!reflexive) throw new Error(`Invalid reflexive slot in ${file.file}:${index}.`);
    draft.change('Zich vergissen is obligatorily reflexive; the source systematically omits its required pronoun.',
      'https://e-ans.ivdnt.org/topics/pid/ans020204lingtopic', text => {
        if (mood === 'participle' && tense === 'past') return text;
        if (person === null) return `zich ${text}`;
        if (mood === 'imperative') return `${text} ${reflexive}`;
        if (mood === 'indicative' && (tense === 'present' || tense === 'past')) return `${text} ${reflexive}`;
        return text.replace(/^(\S+ \S+) (.+)$/u, `$1 ${reflexive} $2`);
      });
  }
  return draft.finish();
}
