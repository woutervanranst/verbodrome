/** The sound-preserving consonant spelling French, Spanish and Italian share, each with its own grapheme table. */
import { describe, expect, it } from 'vitest';
import { defineRules } from '../../src/core/derivation.js';
import { applyJunctureRules } from '../../src/core/juncture.js';
import { conjugate } from '../../src/index.js';
import { consonantSpelling } from '../../src/languages/shared/romance.js';

interface Context { readonly group: string; readonly stressedI?: boolean }
const rules = defineRules({
  'xx.orth.c-cedilla': { stage: 'orthography' },
  'xx.orth.c-qu': { stage: 'orthography', params: { vowel: 'text' } },
  'xx.orth.velar-h': { stage: 'orthography', params: { letter: 'text' } },
  'xx.orth.palatal-i-drop': { stage: 'orthography' },
});

/** A French, a Spanish and two Italian tables, as the packs declare them. */
const cCedilla = consonantSpelling<Context>({ info: rules['xx.orth.c-cedilla'], letters: { c: 'ç' }, before: /^[aoâôuû]/u, applies: ({ group }) => group === 'er' });
const cQu = consonantSpelling<Context>({
  info: rules['xx.orth.c-qu'], letters: { c: 'qu' }, before: /^[eiéí]/u, applies: ({ group }) => group === 'car',
  describe: before => ({ vowel: before.ending.charAt(0) }),
});
const velarH = consonantSpelling<Context>({
  info: rules['xx.orth.velar-h'], letters: { c: 'ch', g: 'gh' }, before: /^[ei]/u, applies: ({ group }) => group === 'are',
  describe: before => ({ letter: before.stem.slice(-1) }),
});
const palatalIDrop = consonantSpelling<Context>({
  info: rules['xx.orth.palatal-i-drop'], letters: { ci: 'c', gi: 'g' }, before: /^[ei]/u, applies: ({ group, stressedI }) => group === 'are' && stressedI !== true,
});

const spell = (rule: typeof cCedilla, stem: string, ending: string, context: Context) => {
  const [outcome] = applyJunctureRules([rule], { stem, ending }, context);
  return { text: outcome!.value.stem + outcome!.value.ending, steps: outcome!.steps.map(item => [item.rule, item.before, item.after, item.params]) };
};

describe('consonantSpelling: the stem\'s final letters respelt before a class of vowels', () => {
  it.each([
    ['fr plaçons', cCedilla, 'plac', 'ons', { group: 'er' }, 'plaçons', [['xx.orth.c-cedilla', 'placons', 'plaçons', {}]]],
    ['fr placez: no change before e', cCedilla, 'plac', 'ez', { group: 'er' }, 'placez', []],
    ['fr: not outside the er group', cCedilla, 'plac', 'ons', { group: 'ir' }, 'placons', []],
    ['es busqué', cQu, 'busc', 'é', { group: 'car' }, 'busqué', [['xx.orth.c-qu', 'buscé', 'busqué', { vowel: 'é' }]]],
    ['es buscó: no change before o', cQu, 'busc', 'ó', { group: 'car' }, 'buscó', []],
    ['it cerchi', velarH, 'cerc', 'i', { group: 'are' }, 'cerchi', [['xx.orth.velar-h', 'cerci', 'cerchi', { letter: 'c' }]]],
    ['it pagherò', velarH, 'pag', 'erò', { group: 'are' }, 'pagherò', [['xx.orth.velar-h', 'pagerò', 'pagherò', { letter: 'g' }]]],
    ['it comincerò', palatalIDrop, 'cominci', 'erò', { group: 'are' }, 'comincerò', [['xx.orth.palatal-i-drop', 'comincierò', 'comincerò', {}]]],
    ['it: a stressed i stays', palatalIDrop, 'scii', 'ate', { group: 'are', stressedI: true }, 'sciiate', []],
  ] as const)('%s', (_, rule, stem, ending, context, text, steps) => {
    expect(spell(rule, stem, ending, context)).toEqual({ text, steps });
  });

  it('is the rule each pack records', () => {
    const one = (query: Record<string, unknown>) => conjugate(query as never).forms[0]!;
    const orthography = (query: Record<string, unknown>) => one(query).parts.flatMap(part => part.steps ?? []).filter(item => item.stage === 'orthography').map(item => item.rule);
    expect(one({ language: 'fr', infinitive: 'placer', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }).text).toBe('nous plaçons');
    expect(orthography({ language: 'es', infinitive: 'buscar', mood: 'indicative', tense: 'simple_past', person: 1, number: 'singular' })).toContain('es.orth.c-qu');
    expect(orthography({ language: 'it', infinitive: 'cercare', mood: 'indicative', tense: 'present', person: 2, number: 'singular' })).toContain('it.orth.velar-h');
    expect(orthography({ language: 'fr', infinitive: 'manger', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toContain('fr.orth.g-e');
  });
});
