import type { CorpusCell, CorpusCorrection, CorpusFile } from './corpus.ts';

const nlStemSource = 'https://woordenlijst.org/zoeken/leidraad/11/1.html';
const nlAuxiliarySource = 'https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic';
const nlSubjects = ['ik', 'jij', 'hij', 'wij', 'jullie', 'zij'] as const;
const nlReflexives = ['me', 'je', 'zich', 'ons', 'jullie', 'zich'] as const;
const needsZijn = new Set(['bezwijken', 'blijken', 'glijden', 'rijzen', 'slinken', 'spruiten', 'wijken', 'zinken']);
const missingSubjects = new Set(['blijken', 'kosten', 'spijten', 'vriezen']);
const noImperative = new Set(['hoeven', 'kunnen', 'moeten', 'mogen']);

export function corpusCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  let expected = [...cell.expected];
  let unavailable = cell.sourceUnavailable;
  const reasons: string[] = [];
  let source = '';
  let correctedTarget: CorpusCell['target'] | null = null;
  const { mood, tense, person, number } = cell.target;
  const change = (reason: string, url: string, transform: (text: string) => string): void => {
    const corrected = expected.map(transform);
    if (JSON.stringify(corrected) !== JSON.stringify(expected)) {
      expected = corrected;
      reasons.push(reason);
      source = url;
    }
  };
  const markUnavailable = (reason: string, url: string): void => {
    if (!unavailable) {
      expected = [];
      unavailable = true;
      reasons.push(reason);
      source = url;
    }
  };
  if (file.language === 'fr') {
    if (['falloir', 'pleuvoir', 'seoir', 'messeoir', 'être', 'dormir', 'plaire', 'pouvoir', 'rire'].includes(file.infinitive) && mood === 'participle' && tense === 'past' && !unavailable) {
      correctedTarget = { ...cell.target, agreement: null };
      reasons.push('This invariant verbal participle has no grammatical gender/number inflection; repeated source agreement headings collapse to one applicable target. Adjectival uses are outside scope.');
      source = `https://www.cnrtl.fr/definition/${encodeURIComponent(file.infinitive)}`;
    }
    if (file.infinitive === 'déchoir' && mood === 'subjunctive' && tense === 'imperfect' && person === 2 && number === 'singular') {
      change('The source substitutes a present-subjunctive cell under the imperfect heading; the past-simple stem gives déchusses.',
        'https://www.cnrtl.fr/definition/d%C3%A9choir',
        text => text.replace('déchoies', 'déchusses'));
    }
    if (file.infinitive === 'clore' && unavailable && (tense === 'near_future' || tense === 'recent_past') && number === 'plural' && (person === 1 || person === 2)) {
      const prefix = person === 1 ? 'nous' : 'vous';
      const phrase = tense === 'near_future' ? `${prefix} ${person === 1 ? 'allons' : 'allez'} clore`
        : `${prefix} ${person === 1 ? 'venons' : 'venez'} de clore`;
      expected = [phrase];
      unavailable = false;
      reasons.push('Periphrases conjugate aller/venir, not clore: a defective clore present-plural stem does not suppress its infinitive.');
      source = 'https://www.cnrtl.fr/definition/clore';
    }
    if (['seoir', 'messeoir'].includes(file.infinitive) && ((mood === 'participle' && tense === 'perfect')
      || (mood === 'infinitive' && tense === 'past') || (mood === 'gerund' && tense === 'past'))) {
      markUnavailable('This defective verb exists only in simple forms; the source mechanically inserts an auxiliary before an isolated sis/messis.',
        `https://www.cnrtl.fr/definition/${file.infinitive}`);
    }
    if (file.infinitive === 'messeoir') {
      change('The alternate present participle retains the mes- prefix; seyant alone belongs to seoir.',
        'https://www.cnrtl.fr/definition/messeoir',
        text => text.replace(/(^| )seyant(?= |$)/gu, '$1messeyant'));
    }
    if (file.infinitive === 'pleuvoir' && file.pattern === 'second') {
      change('The figurative plural retains third-group stems: plurent, pleuvront, plussent; the historical table incorrectly analogizes first-group endings.',
        'https://www.cnrtl.fr/definition/pleuvoir',
        text => text.replace(/pleuvèrent/gu, 'plurent').replace(/pleuver/gu, 'pleuvr').replace(/pleuvassent/gu, 'plussent'));
    }
  } else {
    const slot = person === null ? -1 : (number === 'plural' ? 3 : 0) + person - 1;
    if (cell.availabilityMarker === 'notused' && mood !== 'imperative' && person !== null
      && (file.infinitive === 'blijken' || file.infinitive === 'kosten' || (file.infinitive === 'spijten' && person === 3))) {
      unavailable = false;
      reasons.push('The source overrestricts its impersonal template: this grammatical personal/unipersonal subject slot is standard.');
      source = 'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic';
    }
    if (file.infinitive === 'spijten' && person !== null && person !== 3) {
      markUnavailable('The standard unipersonal spijten paradigm does not license first/second-person subjects; the source fills template slots mechanically.',
        'https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic');
    }
    if (missingSubjects.has(file.infinitive) && person !== null && !unavailable && mood !== 'imperative' && !cell.pronoun) {
      const pronoun = file.infinitive === 'spijten' && number === 'singular' ? 'het' : nlSubjects[slot];
      if (!pronoun) throw new Error(`Invalid corpus person in ${file.file}:${index}.`);
      change('The table suppresses pronoun labels; full-phrase expectations restore the appropriate grammatical subject.',
        'https://e-ans.ivdnt.org/topics/pid/ans020302lingtopic', text => `${pronoun} ${text}`);
    }
    if (file.infinitive === 'bannen') {
      change('The native mixed verb bannen has past participle gebannen, not a mechanically weak geband.',
        'https://woordenlijst.org/zoeken/?q=bannen', text => text.replace(/geband/gu, 'gebannen'));
    }
    if (file.infinitive === 'eten') {
      change('Eten has the exceptional past participle gegeten; vowel diaeresis cannot derive it as geëten.',
        'https://woordenlijst.org/zoeken/?q=eten', text => text.replace(/geëten/gu, 'gegeten'));
    }
    if (file.infinitive === 'mogen') {
      change('The modern strong participle of mogen is gemogen, not gemoogd.',
        'https://woordenlijst.org/zoeken/?q=mogen', text => text.replace(/gemoogd/gu, 'gemogen'));
    }
    if (file.infinitive === 'weven') {
      change('A native written stem ending in underlying v is devoiced to f, including before weak de/den.',
        nlStemSource, text => text.replace(/weev/gu, 'weef'));
    }
    if (file.infinitive === 'schuilen' && mood === 'indicative' && tense === 'past' && number === 'plural') {
      change('A long oo is written o in the open syllable of the strong plural scholen.',
        nlStemSource, text => text.replace(/schoolen/gu, 'scholen'));
    }
    if (file.infinitive === 'zeggen' && mood === 'indicative' && tense === 'past' && number === 'plural') {
      change('The standard plural principal part is zeiden (or zegden); zeien is not the modern written paradigm.',
        'https://woordenlijst.org/zoeken/?q=zeggen', text => text.replace(/zeien/gu, 'zeiden'));
    }
    if (needsZijn.has(file.infinitive)) {
      if (mood === 'indicative' && tense === 'perfect') {
        const forms = ['ben', 'bent', 'is', 'zijn', 'zijn', 'zijn'] as const;
        const auxiliary = forms[slot];
        if (!auxiliary) throw new Error(`Invalid perfect slot in ${file.file}:${index}.`);
        change('This intransitive change-of-state/movement verb selects zijn rather than the source auxiliary hebben.',
          nlAuxiliarySource, text => text.replace(/^(\S+) (heb|hebt|heeft|hebben) /u, `$1 ${auxiliary} `));
      } else if (mood === 'indicative' && tense === 'pluperfect') {
        change('This verb selects the past of zijn for the pluperfect.',
          nlAuxiliarySource, text => text.replace(/^(\S+) (had|hadden) /u, `$1 ${number === 'singular' ? 'was' : 'waren'} `));
      } else if (tense === 'future_perfect' || (mood === 'conditional' && tense === 'past')) {
        change('The compound future/conditional retains zijn as its infinitive perfect auxiliary.',
          nlAuxiliarySource, text => text.replace(/hebben$/u, 'zijn'));
      }
    }
    if (noImperative.has(file.infinitive) && mood === 'imperative') {
      markUnavailable('This modal/negative-polarity verb has no ordinary standard imperative; the source copies a present-indicative form.',
        'https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic');
    }
    if (file.infinitive === 'vergissen' && !unavailable) {
      const reflexive = person === null ? 'zich' : nlReflexives[slot];
      if (!reflexive) throw new Error(`Invalid reflexive slot in ${file.file}:${index}.`);
      change('Zich vergissen is obligatorily reflexive; the source systematically omits its required pronoun.',
        'https://e-ans.ivdnt.org/topics/pid/ans020204lingtopic', text => {
          if (mood === 'participle' && tense === 'past') return text;
          if (person === null) return `zich ${text}`;
          if (mood === 'imperative') return `${text} ${reflexive}`;
          if (mood === 'indicative' && (tense === 'present' || tense === 'past')) return `${text} ${reflexive}`;
          return text.replace(/^(\S+ \S+) (.+)$/u, `$1 ${reflexive} $2`);
        });
    }
  }
  return reasons.length ? {
    file: file.file, cell: index, original: cell.original, expected, unavailable,
    reason: reasons.join(' '), source, target: cell.target, correctedTarget,
  } : null;
}
