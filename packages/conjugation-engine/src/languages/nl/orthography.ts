import { ConjugationError } from '../../errors.js';

export interface DutchStem {
  readonly written: string;
  readonly underlying: string;
}

export function nativeStem(infinitive: string, override?: string, unstressed?: boolean, inseparable = ''): DutchStem {
  if (!infinitive.endsWith('en') && !override) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `No ordinary Dutch -en stem for ${infinitive}; provide a lexical model or stem.`);
  }
  const raw = infinitive.endsWith('en') ? infinitive.slice(0, -2) : infinitive.slice(0, -1);
  let stem = override ?? raw;
  if (!override) {
    const doubled = /([bcdfghjklmnpqrstvwxz])\1$/u.test(stem);
    if (doubled) stem = stem.slice(0, -1);
    const lexicalRoot = inseparable ? raw.slice(inseparable.length) : raw;
    const vowelGroups = lexicalRoot.match(/[aeiouy]+/gu)?.length ?? 0;
    const reducedE = unstressed ?? (vowelGroups > 1 && /e[lrn]$/u.test(lexicalRoot));
    if (!doubled && !reducedE) {
      stem = stem.replace(/(^|[^aeiouy])([aeou])([bcdfghjklmnpqrstvwxz])$/u, '$1$2$2$3');
    }
  }
  return {
    underlying: /[vz]$/u.test(raw) ? stem.replace(/[fs]$/u, raw.slice(-1)) : stem,
    written: stem.replace(/v$/u, 'f').replace(/z$/u, 's'),
  };
}

export function weakSuffixes(underlying: string, override?: 'd' | 't' | 'both'): readonly ('d' | 't')[] {
  if (override === 'both') return ['d', 't'];
  if (override) return [override];
  const pronouncedStem = underlying.replace(/e$/u, '');
  return [/(?:ch|sh|[tkfschpx])$/u.test(pronouncedStem) ? 't' : 'd'];
}

export function gePrefix(word: string): string {
  if (/^[\p{L}]-/u.test(word)) return 'ge-' + word;
  const vowels: Readonly<Record<string, string>> = { e: 'ë', i: 'ï', u: 'ü' };
  const initial = vowels[word[0] ?? ''];
  return 'ge' + (initial ? initial + word.slice(1) : word);
}

export function strongPastPlural(singular: string): string {
  if (/(de|te)$/u.test(singular)) return singular + 'n';
  if (/(^|[^aeiouy])o[bcdfghjklmnpqrstvwxz]$/u.test(singular)) return singular + singular.slice(-1) + 'en';
  let stem = singular;
  if (/[fs]$/u.test(stem)) stem = stem.slice(0, -1) + (stem.endsWith('f') ? 'v' : 'z');
  stem = stem.replace(/([aeou])\1([bcdfghjklmnpqrstvwxz])$/u, '$1$2');
  return stem + 'en';
}
