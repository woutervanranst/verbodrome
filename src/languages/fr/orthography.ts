export type Spelling = 'rectified' | 'traditional';

const graveOnly = /(?:achet|cel|cisel|démantel|écartel|encastel|gel|halet|martel|model|pel|furet|crochet)$/u;
const doubled = /(?:appel|jet|interpel)$/u;

export function erStem(root: string, ending: string, spelling: Spelling, future = false, keepY = false): string {
  let stem = spelling === 'rectified' ? root.replace(/interpell$/u, 'interpel').replace(/î/gu, 'i').replace(/û/gu, 'u') : root;
  const mute = future || ['e', 'es', 'ent'].includes(ending);
  if (mute) {
    if (!keepY && /y$/u.test(stem) && !/[eé]y$/u.test(stem)) stem = stem.slice(0, -1) + 'i';
    if (doubled.test(stem) || (spelling === 'traditional' && /e[lt]$/u.test(stem) && !graveOnly.test(stem))) {
      stem += stem.slice(-1);
    } else if (/e([^aeiouyàâäéèêëîïôöùûüœ]|[bcdfgkptv][lr]|[gq]u)$/u.test(stem)) {
      stem = stem.replace(/e([^aeiouyàâäéèêëîïôöùûüœ]|[bcdfgkptv][lr]|[gq]u)$/u, 'è$1');
    } else if ((!future || spelling === 'rectified') && /é([^aeiouàâäéèêëîïôöùûüœ]{1,2}|[gq]u)$/u.test(stem)) {
      stem = stem.replace(/é([^aeiouàâäéèêëîïôöùûüœ]{1,2}|[gq]u)$/u, 'è$1');
    }
  }
  if (/^[aâo]/u.test(ending)) {
    if (stem.endsWith('c')) stem = stem.slice(0, -1) + 'ç';
    else if (stem.endsWith('g')) stem += 'e';
  }
  return stem;
}

export function infinitiveSpelling(lemma: string, spelling: Spelling): string {
  if (spelling === 'traditional') return lemma;
  return lemma.replace(/asseoir$/u, 'assoir').replace(/surseoir$/u, 'sursoir')
    .replace(/interpeller$/u, 'interpeler').replace(/î/gu, 'i').replace(/û/gu, 'u');
}

export function simpleSpelling(word: string, lemma: string, spelling: Spelling, mood: string, tense: string, index: number): string {
  if (spelling === 'rectified' && lemma === 'gésir' && tense === 'present') return word.replace(/î/gu, 'i');
  if (spelling === 'traditional') {
    if ((tense === 'future' || mood === 'conditional') && /(?:naitre|paitre|croitre)$/u.test(lemma.replace(/î/gu, 'i'))) {
      return word.replace(/itr/u, 'îtr');
    }
    if ((mood === 'indicative' || mood === 'imperative') && tense === 'present' && index === 2) {
      if (/(?:naître|paître|croître|plaire)$/u.test(lemma)) return word.replace(/it$/u, 'ît');
      if (lemma === 'clore') return 'clôt';
    }
    if ((tense === 'future' || mood === 'conditional') && lemma === 'asseoir') return word.replace(/^assoir/u, 'asseoir');
    if ((tense === 'future' || mood === 'conditional') && lemma === 'surseoir') return word.replace(/^sursoir/u, 'surseoir');
  }
  if (lemma === 'croître' && (tense === 'simple_past' || (mood === 'subjunctive' && tense === 'imperfect'))) {
    return word.replace(/u/gu, 'û');
  }
  return word;
}
