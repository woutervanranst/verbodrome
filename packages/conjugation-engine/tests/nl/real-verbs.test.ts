/**
 * Real verbs, each checked against woordenlijst.org (its lexicon service, database gig_pro_wrdlst; the number is the
 * lemma id): the 1st person singular present, 3rd person singular present, 1st person singular past and past participle
 * woordenlijst.org gives, and its perfect auxiliary. Every row was a wrong form in the final Dutch review
 * (dutch-final-review.md) and stays here as a regression test with the correct Dutch.
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import type { DutchConjugationOptions } from '../../src/types.js';

/** infinitive, woordenlijst.org lemma id, ik …, hij …, ik … (past), participle, auxiliary. */
type Row = readonly [string, number, string, string, string, string, 'hebben' | 'zijn' | 'hebben/zijn'];

const texts = (query: Omit<DutchConjugationOptions, 'language'>): string[] =>
  [...new Set(conjugate({ language: 'nl', ...query } as DutchConjugationOptions).forms.map(form => form.text))];

/** The four forms and the auxiliaries of `infinitive`, as the engine gives them. */
function engineRow(infinitive: string) {
  const finite = (tense: 'present' | 'past', person: 1 | 3) => texts({ infinitive, mood: 'indicative', tense, person, number: 'singular' });
  return {
    present1: finite('present', 1), present3: finite('present', 3), past1: finite('past', 1),
    participle: texts({ infinitive, mood: 'participle', tense: 'past' }),
    auxiliaries: conjugate({ language: 'nl', infinitive }).analysis.auxiliaries.join('/'),
  };
}

const check = (rows: readonly Row[]) => it.each(rows)('%s (woordenlijst.org lemma %i)', (infinitive, _id, ik, hij, past, participle, auxiliary) => {
  expect(engineRow(infinitive)).toEqual({
    present1: [`ik ${ik}`], present3: [`hij ${hij}`], past1: [`ik ${past}`], participle: [participle], auxiliaries: auxiliary,
  });
});

describe('real verbs checked against woordenlijst.org', () => {
  describe('N1: a separable verb whose rest has an unstressed prefix keeps it, without ge-', () => {
    check([
  ['terugbetalen', 113016, 'betaal terug', 'betaalt terug', 'betaalde terug', 'terugbetaald', 'hebben'],
  ['uitbetalen', 113252, 'betaal uit', 'betaalt uit', 'betaalde uit', 'uitbetaald', 'hebben'],
  ['aanbetalen', 110369, 'betaal aan', 'betaalt aan', 'betaalde aan', 'aanbetaald', 'hebben'],
  ['voorbereiden', 113682, 'bereid voor', 'bereidt voor', 'bereidde voor', 'voorbereid', 'hebben'],
  ['toevertrouwen', 113214, 'vertrouw toe', 'vertrouwt toe', 'vertrouwde toe', 'toevertrouwd', 'hebben'],
  ['afbestellen', 110647, 'bestel af', 'bestelt af', 'bestelde af', 'afbesteld', 'hebben'],
  ['uitvergroten', 113527, 'vergroot uit', 'vergroot uit', 'vergrootte uit', 'uitvergroot', 'hebben'],
  ['opgebruiken', 112483, 'gebruik op', 'gebruikt op', 'gebruikte op', 'opgebruikt', 'hebben'],
  ['doorverbinden', 111386, 'verbind door', 'verbindt door', 'verbond door', 'doorverbonden', 'hebben'],
  ['uitverkopen', 113529, 'verkoop uit', 'verkoopt uit', 'verkocht uit', 'uitverkocht', 'hebben'],
    ]);
  });

  describe('N1: a rest is read with an unstressed prefix only when one is there', () => {
    check([
      ['opbellen', 112380, 'bel op', 'belt op', 'belde op', 'opgebeld', 'hebben'],
      ['uitbeelden', 113247, 'beeld uit', 'beeldt uit', 'beeldde uit', 'uitgebeeld', 'hebben'],
      ['opbeuren', 112382, 'beur op', 'beurt op', 'beurde op', 'opgebeurd', 'hebben'],
      ['bijbenen', 120010, 'been bij', 'beent bij', 'beende bij', 'bijgebeend', 'hebben'],
      ['opverven', 112604, 'verf op', 'verft op', 'verfde op', 'opgeverfd', 'hebben'],
      ['opgeven', 112485, 'geef op', 'geeft op', 'gaf op', 'opgegeven', 'hebben'],
      ['afgelasten', 110699, 'gelast af', 'gelast af', 'gelastte af', 'afgelast', 'hebben'],
      ['uitbesteden', 113251, 'besteed uit', 'besteedt uit', 'besteedde uit', 'uitbesteed', 'hebben'],
      ['terugverdienen', 113092, 'verdien terug', 'verdient terug', 'verdiende terug', 'terugverdiend', 'hebben'],
      ['voorverwarmen', 113834, 'verwarm voor', 'verwarmt voor', 'verwarmde voor', 'voorverwarmd', 'hebben'],
    ]);

    it('reads the rest the same way through a separable prefix hint', () => {
      expect(texts({ infinitive: 'terugbetalen', separablePrefix: 'terug', mood: 'participle', tense: 'past' })).toEqual(['terugbetaald']);
      expect(texts({ infinitive: 'uitverkopen', separablePrefix: 'uit', mood: 'indicative', tense: 'past', person: 3, number: 'singular' })).toEqual(['hij verkocht uit']);
    });
  });
});
