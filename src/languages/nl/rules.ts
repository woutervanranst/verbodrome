import { itemAt, personIndex } from '../../parts.js';
import type { DutchConjugationOptions, ResolvedTarget } from '../../types.js';
import type { DutchLexeme } from './exceptions.js';
import type { DutchStem } from './orthography.js';
import { gePrefix, strongPastPlural, weakSuffixes } from './orthography.js';

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
