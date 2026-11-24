import { describe, expect, it } from 'vitest';
import { packs } from '../src/languages/index.js';
import { grammaticalPart } from '../src/parts.js';
import { renderParts } from '../src/render.js';

const part = grammaticalPart.bind(null, packs.fr.rendering);

describe('component rendering', () => {
  it('keeps subjects unelided and joins according to the replacement component', () => {
    const subject = part('subject', 'je');
    expect(renderParts('fr', [subject, part('lexicalVerb', 'aime', 'aimer')])).toBe("j'aime");
    expect(renderParts('fr', [subject, part('lexicalVerb', 'fais', 'faire')])).toBe('je fais');
    expect(subject.text).toBe('je');
  });

  it('does not repair component mismatches', () => {
    expect(renderParts('fr', [part('subject', 'nous'), part('lexicalVerb', 'aime', 'aimer')])).toBe('nous aime');
    expect(renderParts('fr', [part('moodMarker', 'que'), part('subject', 'tu'), part('lexicalVerb', 'faisons', 'faire')]))
      .toBe('que tu faisons');
  });

  it('handles marker, reflexive and linker elision without reparsing strings', () => {
    expect(renderParts('fr', [part('moodMarker', 'que'), part('subject', 'il'), part('lexicalVerb', 'aime')])).toBe("qu'il aime");
    expect(renderParts('fr', [part('subject', 'je'), part('reflexivePronoun', 'me'), part('auxiliary', 'étais'), part('lexicalVerb', 'lavé')]))
      .toBe("je m'étais lavé");
    expect(renderParts('fr', [part('auxiliary', 'viens'), part('linker', 'de'), part('lexicalVerb', 'aimer')])).toBe("viens d'aimer");
  });

  it('distinguishes aspirated h and preserves explicit hyphenation', () => {
    expect(renderParts('fr', [part('subject', 'je'), part('lexicalVerb', 'hais', 'haïr', {}, 'space', true)])).toBe('je hais');
    expect(renderParts('fr', [part('lexicalVerb', 'méfie'), part('reflexivePronoun', 'toi', 'se', {}, 'hyphen')])).toBe('méfie-toi');
  });

  it('projects bare forms without removing necessary nonfinite markers', () => {
    expect(renderParts('fr', [part('moodMarker', 'que'), part('subject', 'je'), part('lexicalVerb', 'aime')], { bare: true })).toBe('aime');
    expect(renderParts('fr', [part('moodMarker', 'en'), part('lexicalVerb', 'aimant')], { bare: true })).toBe('en aimant');
  });
});
