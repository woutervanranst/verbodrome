import { ConjugationError } from '../../errors.js';
import { itemAt, personIndex } from '../../parts.js';
import type { DutchConjugationOptions, ResolvedTarget } from '../../types.js';
import type { DutchLexeme } from './exceptions.js';

export function presentForms(
  lemma: string, lexical: DutchLexeme, stem: DutchStem, target: ResolvedTarget, options: DutchConjugationOptions,
): string[] {
  const index = personIndex(target);
  if (options.pronoun === 'u' && index === 1 && lexical.formalPresent) return [...lexical.formalPresent];
  if (index > 2) return [lemma];
  const ending = index > 0 && !stem.written.endsWith('t') ? 't' : '';
  const root = ending && /(^|[^a])a$/u.test(stem.written) ? stem.written + 'a' : stem.written;
  const word = lexical.presentCells?.[index] ?? root + ending;
  let forms = [word, ...(lexical.presentAlternatives?.[index] ?? [])];
  if (options.inversion && index === 1 && options.pronoun !== 'u') {
    forms = lexical.presentCells?.[index]
      ? forms.map(form => form === 'bent' ? 'ben' : form.replace(/t$/u, ''))
      : [stem.written, ...(lexical.presentAlternatives?.[0] ?? []), ...(lexical.presentAlternatives?.[index] ?? [])];
  }
  return [...new Set(forms)];
}

export function pastForms(lexical: DutchLexeme, stem: DutchStem, target: ResolvedTarget, options: DutchConjugationOptions, loanSuffix?: 'd' | 't' | 'both'): string[] {
  if (target.number === 'plural' && options.stems?.pastPlural) return [options.stems.pastPlural];
  const suffixes = weakSuffixes(stem.underlying, options.stems?.pastSuffix ?? loanSuffix);
  const weak = suffixes.map(suffix => stem.written + suffix + 'e' + (target.number === 'plural' ? 'n' : ''));
  if (options.stems?.pastSingular) {
    return target.number === 'singular' ? [options.stems.pastSingular]
      : [options.stems.pastPlural ?? strongPastPlural(options.stems.pastSingular)];
  }
  if (!lexical.pastSingular) return weak;
  const forms = target.number === 'singular' ? [...lexical.pastSingular]
    : lexical.pastSingular.map((singular, index) => lexical.pastPlural?.[index] ?? strongPastPlural(singular));
  return [...new Set([...forms, ...(lexical.alsoWeakPast ? weak : [])])];
}

export function participles(
  lexical: DutchLexeme, stem: DutchStem, options: DutchConjugationOptions,
  inseparable: string, loanSuffix?: 'd' | 't' | 'both',
): string[] {
  if (options.stems?.pastParticiple) return [options.stems.pastParticiple];
  const weak = weakSuffixes(stem.underlying, options.stems?.pastSuffix ?? loanSuffix).map(suffix => {
    const word = stem.written + (stem.written.endsWith(suffix) ? '' : suffix);
    return inseparable ? word : gePrefix(word);
  });
  return [...new Set(lexical.participles ? [...lexical.participles, ...(lexical.alsoWeakParticiple ? weak : [])] : weak)];
}

export function imperativeForms(lexical: DutchLexeme, stem: DutchStem): string[] {
  return [lexical.imperative ?? stem.written, ...(lexical.presentAlternatives?.[0] ?? [])];
}

export function auxiliaryPresent(lemma: string, target: ResolvedTarget, options: DutchConjugationOptions, lexical: DutchLexeme, stem: DutchStem): string {
  return itemAt(presentForms(lemma, lexical, stem, target, options), 0);
}

// The legacy spelling helpers (moved here from orthography.ts, whose name the staged grammar now uses).
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
