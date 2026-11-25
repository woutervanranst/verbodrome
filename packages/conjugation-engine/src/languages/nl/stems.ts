/**
 * The Dutch present stem, the base of every regular form: the infinitive without -en, spelled by the rules for open
 * and closed syllables (lopen: loop), with a single final consonant (bakken: bak) and f or s for a final v or z (leven:
 * leef, reizen: reis). The e of an unstressed last syllable stays single (wandelen: wandel). A listed stem (kunnen: kan,
 * a loan's English spelling, a hinted stem) replaces the derivation. Each rule that applies records a step.
 */
import { step } from '../../core/derivation.js';
import type { DerivationStep } from '../../core/derivation.js';
import { ConjugationError } from '../../errors.js';
import { dutchRules } from './rules.js';

export interface PresentStem {
  /** The stem as written: werk, loop, leef, reis. */
  readonly written: string;
  /** The stem before f and s are written for v and z (leev, reiz): 't kofschip looks at its last sound. */
  readonly underlying: string;
  /** How the stem was formed from the infinitive, in order. */
  readonly steps: readonly DerivationStep[];
}

/** What a present stem is formed from. */
export interface StemSource {
  /** The infinitive the stem comes from: the base verb of a derivative (werken for verwerken). */
  readonly infinitive: string;
  /** A stem the lexicon, the loan table or a hint gives, which replaces the derivation. */
  readonly listed: string | undefined;
  /** Whether the last syllable is unstressed, as the lexicon or a hint says; undefined: inferred from the spelling. */
  readonly unstressed: boolean | undefined;
  /** An unstressed prefix the inference does not count (her in herinneren); '' for none. */
  readonly prefix: string;
}

/** A consonant written double at the end (bakk). */
const doubleConsonant = /([bcdfghjklmnpqrstvwxz])\1$/u;
/**
 * A single a, e, o or u before one final consonant, not after another vowel: a long vowel in an open syllable (lop).
 * x is not such a consonant: it stands for two sounds, /ks/, so the vowel before it is in a closed syllable and short
 * (faxen: fax, relaxen: relax). The Leidraad never writes x double after a short vowel (2.2) and spells the stem by the
 * rules for open and closed syllables (11.1).
 */
const openSyllable = /(^|[^aeiouy])([aeou])([bcdfghjklmnpqrstvwz])$/u;

/**
 * The present stem of `infinitive`. Without a listed stem: drop -en; then either write a doubled final consonant once,
 * or write a long vowel double in the now closed syllable (not before x, which closes the syllable already; a stressed
 * ë too, with no trema after i: kopiëren, kopieer), unless it is the unstressed e of a last syllable in -el, -er, -en
 * or -em (inferred when the root, without `prefix`, has more than one vowel group; Leidraad 2.2 lists -em with ademen);
 * finally write a final v or z as f or s. Throws AMBIGUOUS_CLASSIFICATION for an infinitive without -en and without a listed stem.
 */
export function presentStem({ infinitive, listed, unstressed, prefix }: StemSource): PresentStem {
  if (!infinitive.endsWith('en') && !listed) {
    throw new ConjugationError('AMBIGUOUS_CLASSIFICATION', `No ordinary Dutch -en stem for ${infinitive}; provide a lexical model or stem.`);
  }
  const raw = infinitive.endsWith('en') ? infinitive.slice(0, -2) : infinitive.slice(0, -1);
  const steps: DerivationStep[] = [];
  let stem = listed ?? raw;
  if (listed) {
    steps.push(step(dutchRules['nl.stem.lexical'], infinitive, listed));
  } else {
    steps.push(step(dutchRules['nl.stem.drop-en'], infinitive, raw));
    const doubled = doubleConsonant.test(stem);
    if (doubled) {
      const single = stem.slice(0, -1);
      steps.push(step(dutchRules['nl.stem.undouble-consonant'], stem, single));
      stem = single;
    } else {
      const root = prefix ? raw.slice(prefix.length) : raw;
      const vowelGroups = root.match(/[aeiouy]+/gu)?.length ?? 0;
      // The unstressed e follows a consonant: insinuer- (u + e) is two full vowels, not an unstressed last syllable.
      const unstressedE = unstressed ?? (vowelGroups > 1 && /[^aeiouy]e[lrnm]$/u.test(root));
      // A stressed ë before the last consonant is long too (creëren: creëer); after i the trema goes (kopieer).
      // ue is two vowels, not one (Leidraad 7.1), so the e after it is long too: insinueren, insinueer.
      const long = stem.replace(openSyllable, '$1$2$2$3').replace(/ë([bcdfghjklmnpqrstvwz])$/u, 'ëe$1')
        .replace(/((?:^|[^aeo])u)e([bcdfghjklmnpqrstvwz])$/u, '$1ee$2');
      // The unstressed e is recorded where it keeps the vowel from being written double.
      if (long !== stem && unstressedE) steps.push(step(dutchRules['nl.stem.unstressed-e'], stem, stem));
      else if (long !== stem) {
        steps.push(step(dutchRules['nl.stem.lengthen-vowel'], stem, long));
        stem = long;
        const plain = stem.replace(/iëe([bcdfghjklmnpqrstvwz])$/u, 'iee$1');
        if (plain !== stem) {
          steps.push(step(dutchRules['nl.stem.no-trema'], stem, plain));
          stem = plain;
        }
      }
    }
  }
  const written = stem.replace(/v$/u, 'f').replace(/z$/u, 's');
  if (written !== stem) steps.push(step(dutchRules['nl.stem.devoice'], stem, written));
  // A listed stem may be written with f or s already; its underlying sound is the infinitive's v or z.
  const underlying = /[vz]$/u.test(raw) ? stem.replace(/[fs]$/u, raw.slice(-1)) : stem;
  return { written, underlying, steps };
}
