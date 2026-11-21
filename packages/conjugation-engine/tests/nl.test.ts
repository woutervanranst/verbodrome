import { describe, expect, it } from 'vitest';
import { expandTargets } from '../src/catalogue.js';
import { resolveDutch } from '../src/languages/nl/index.js';
import { dutchExceptions } from '../src/languages/nl/exceptions.js';
import { renderParts } from '../src/render.js';
import type { DutchConjugationOptions } from '../src/types.js';

function dutch(options: DutchConjugationOptions): string[] {
  const engine = resolveDutch(options);
  return [...new Set(expandTargets(options).flatMap(target => engine.generate(target).forms.map(form => renderParts('nl', form.parts))))];
}

describe('Dutch grammatical generation', () => {
  it('conjugates invented verbs without lexical entries', () => {
    expect(dutch({ language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik zorp']);
    expect(dutch({ language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik zorpte']);
    expect(dutch({ language: 'nl', infinitive: 'zorpen', mood: 'participle', tense: 'past' })).toEqual(['gezorpt']);
    expect(dutchExceptions).not.toHaveProperty('zorpen');
  });

  it.each([
    ['leven', 'ik leefde'], ['reizen', 'ik reisde'],
    ['maken', 'ik maakte'], ['wandelen', 'ik wandelde'],
    ['antwoorden', 'ik antwoordde'],
  ])('preserves spelling and underlying voicing for %s', (infinitive, expected) => {
    expect(dutch({ language: 'nl', infinitive, mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toContain(expected);
  });

  it('drops the present t for inverted jij but not formal u', () => {
    expect(dutch({ language: 'nl', infinitive: 'werken', mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true })).toEqual(['werk jij']);
    expect(dutch({ language: 'nl', infinitive: 'werken', mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'u', inversion: true })).toEqual(['werkt u']);
    expect(dutch({ language: 'nl', infinitive: 'hebben', mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'u' })).toEqual(['u hebt', 'u heeft']);
  });

  it('separates particles only when the construction detaches them', () => {
    expect(dutch({ language: 'nl', infinitive: 'opstaan', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik sta op']);
    expect(dutch({ language: 'nl', infinitive: 'opstaan', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['ik ben opgestaan']);
    expect(dutch({ language: 'nl', infinitive: 'bezoeken', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik bezocht']);
    expect(dutch({ language: 'nl', infinitive: 'bezoeken', mood: 'participle', tense: 'past' })).toEqual(['bezocht']);
  });

  it('uses loan stems and retains pronunciation-dependent alternatives', () => {
    expect(dutch({ language: 'nl', infinitive: 'updaten', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik updatete']);
    expect(dutch({ language: 'nl', infinitive: 'updaten', mood: 'participle', tense: 'past' })).toEqual(['geüpdatet']);
    expect(dutch({ language: 'nl', infinitive: 'leasen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik leasede', 'ik leasete']);
  });

  it('retains obligatory reflexives in simple and compound constructions', () => {
    expect(dutch({ language: 'nl', infinitive: 'vergissen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik vergis me']);
    expect(dutch({ language: 'nl', infinitive: 'vergissen', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['ik heb me vergist']);
    expect(() => dutch({ language: 'nl', infinitive: 'vergissen', reflexive: false })).toThrow('requires a reflexive');
  });

  it('restores ga/sta/sla stems under inversion instead of trimming a t', () => {
    for (const [infinitive, stem, closed] of [['gaan', 'ga', 'gaat'], ['staan', 'sta', 'staat'], ['slaan', 'sla', 'slaat']] as const) {
      const options = { language: 'nl', infinitive, mood: 'indicative', tense: 'present', person: 2, number: 'singular' } as const;
      expect(dutch(options)).toEqual([`jij ${closed}`]);
      expect(dutch({ ...options, inversion: true })).toEqual([`${stem} jij`]);
      expect(dutch({ ...options, pronoun: 'u', inversion: true })).toEqual([`${closed} u`]);
    }
  });

  it('places ge before e-mail and accepts independent strong plural hints', () => {
    expect(dutch({ language: 'nl', infinitive: 'e-mailen', mood: 'participle', tense: 'past' })).toEqual(['ge-e-maild']);
    expect(dutch({ language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'past', person: 1, number: 'plural', stems: { pastPlural: 'zurpen' } })).toEqual(['wij zurpen']);
    expect(dutch({ language: 'nl', infinitive: 'zorpen', mood: 'indicative', tense: 'pluperfect', person: 1, number: 'plural', stems: { pastPlural: 'zurpen' } })).toEqual(['wij hadden gezorpt']);
    expect(dutch({ language: 'nl', infinitive: 'hijsen', mood: 'indicative', tense: 'past', person: 1, number: 'plural' })).toEqual(['wij hesen']);
  });

  it('retains accepted stem alternatives in jij/je inversion', () => {
    expect(dutch({ language: 'nl', infinitive: 'rijden', mood: 'indicative', tense: 'present', person: 2, number: 'singular', inversion: true }))
      .toEqual(['rijd jij', 'rij jij']);
    expect(dutch({ language: 'nl', infinitive: 'houden', mood: 'indicative', tense: 'present', person: 2, number: 'singular', pronoun: 'je', inversion: true }))
      .toEqual(['houd je', 'hou je']);
  });

  it('does not inherit weather restrictions into personal freezing derivatives', () => {
    expect(dutch({ language: 'nl', infinitive: 'vriezen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([]);
    expect(dutch({ language: 'nl', infinitive: 'invriezen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik vries in']);
    expect(dutch({ language: 'nl', infinitive: 'bevriezen', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['wij bevriezen']);
    expect(dutch({ language: 'nl', infinitive: 'invriezen', mood: 'imperative', tense: 'present', person: 2, number: 'plural' })).toEqual(['vries in']);
  });
});
