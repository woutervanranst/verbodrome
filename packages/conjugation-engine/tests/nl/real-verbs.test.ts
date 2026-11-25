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

  describe('separable verbs the spelling would read otherwise, listed', () => {
    check([
      ['overstappen', 112709, 'stap over', 'stapt over', 'stapte over', 'overgestapt', 'hebben/zijn'],
      ['onderduiken', 112355, 'duik onder', 'duikt onder', 'dook onder', 'ondergedoken', 'hebben/zijn'],
      ['overnemen', 112686, 'neem over', 'neemt over', 'nam over', 'overgenomen', 'hebben'],
      ['overslaan', 112703, 'sla over', 'slaat over', 'sloeg over', 'overgeslagen', 'hebben/zijn'],
      ['overgaan', 112658, 'ga over', 'gaat over', 'ging over', 'overgegaan', 'hebben/zijn'],
      ['overblijven', 112646, 'blijf over', 'blijft over', 'bleef over', 'overgebleven', 'zijn'],
      ['onderbrengen', 112350, 'breng onder', 'brengt onder', 'bracht onder', 'ondergebracht', 'hebben'],
      ['mislopen', 112056, 'loop mis', 'loopt mis', 'liep mis', 'misgelopen', 'hebben/zijn'],
      ['opeisen', 103945, 'eis op', 'eist op', 'eiste op', 'opgeëist', 'hebben'],
      ['inademen', 111524, 'adem in', 'ademt in', 'ademde in', 'ingeademd', 'hebben'],
      ['uitoefenen', 113400, 'oefen uit', 'oefent uit', 'oefende uit', 'uitgeoefend', 'hebben'],
      ['tegemoetkomen', 112973, 'kom tegemoet', 'komt tegemoet', 'kwam tegemoet', 'tegemoetgekomen', 'zijn'],
    ]);
  });

  describe('the stress of the last syllable: listed, recorded, or by the rules', () => {
    check([
      ['reageren', 107776, 'reageer', 'reageert', 'reageerde', 'gereageerd', 'hebben'],
      ['controleren', 104936, 'controleer', 'controleert', 'controleerde', 'gecontroleerd', 'hebben'],
      ['organiseren', 107275, 'organiseer', 'organiseert', 'organiseerde', 'georganiseerd', 'hebben'],
      ['presenteren', 107632, 'presenteer', 'presenteert', 'presenteerde', 'gepresenteerd', 'hebben'],
      ['repareren', 107866, 'repareer', 'repareert', 'repareerde', 'gerepareerd', 'hebben'],
      ['telefoneren', 108672, 'telefoneer', 'telefoneert', 'telefoneerde', 'getelefoneerd', 'hebben'],
      ['fotograferen', 103881, 'fotografeer', 'fotografeert', 'fotografeerde', 'gefotografeerd', 'hebben'],
      ['accepteren', 103981, 'accepteer', 'accepteert', 'accepteerde', 'geaccepteerd', 'hebben'],
      ['interesseren', 106054, 'interesseer', 'interesseert', 'interesseerde', 'geïnteresseerd', 'hebben'],
      ['investeren', 106073, 'investeer', 'investeert', 'investeerde', 'geïnvesteerd', 'hebben'],
      ['inspireren', 106043, 'inspireer', 'inspireert', 'inspireerde', 'geïnspireerd', 'hebben'],
      ['integreren', 106050, 'integreer', 'integreert', 'integreerde', 'geïntegreerd', 'hebben/zijn'],
      ['irriteren', 106080, 'irriteer', 'irriteert', 'irriteerde', 'geïrriteerd', 'hebben'],
      ['introduceren', 106069, 'introduceer', 'introduceert', 'introduceerde', 'geïntroduceerd', 'hebben'],
      ['informeren', 106032, 'informeer', 'informeert', 'informeerde', 'geïnformeerd', 'hebben'],
      ['installeren', 106044, 'installeer', 'installeert', 'installeerde', 'geïnstalleerd', 'hebben'],
      ['opereren', 107263, 'opereer', 'opereert', 'opereerde', 'geopereerd', 'hebben'],
      ['regeren', 103916, 'regeer', 'regeert', 'regeerde', 'geregeerd', 'hebben'],
      ['discussiëren', 110309, 'discussieer', 'discussieert', 'discussieerde', 'gediscussieerd', 'hebben'],
      ['afficheren', 104012, 'afficheer', 'afficheert', 'afficheerde', 'geafficheerd', 'hebben'],
      ['kopiëren', 110332, 'kopieer', 'kopieert', 'kopieerde', 'gekopieerd', 'hebben'],
      ['luisteren', 106654, 'luister', 'luistert', 'luisterde', 'geluisterd', 'hebben'],
      ['veranderen', 108909, 'verander', 'verandert', 'veranderde', 'veranderd', 'hebben/zijn'],
      ['ademen', 103997, 'adem', 'ademt', 'ademde', 'geademd', 'hebben'],
      ['wasemen', 109768, 'wasem', 'wasemt', 'wasemde', 'gewasemd', 'hebben'],
      ['creëren', 110302, 'creëer', 'creëert', 'creëerde', 'gecreëerd', 'hebben'],
      ['evalueren', 105375, 'evalueer', 'evalueert', 'evalueerde', 'geëvalueerd', 'hebben'],
      ['situeren', 108222, 'situeer', 'situeert', 'situeerde', 'gesitueerd', 'hebben'],
    ]);
  });

  describe('ge- and the trema', () => {
    check([
      ['uiten', 108858, 'uit', 'uit', 'uitte', 'geuit', 'hebben'],
      ['ijken', 103676, 'ijk', 'ijkt', 'ijkte', 'geijkt', 'hebben'],
      ['beëindigen', 104205, 'beëindig', 'beëindigt', 'beëindigde', 'beëindigd', 'hebben'],
    ]);
  });

  describe('verbs with two readings give both paradigms', () => {
    it.each([
      ['voorspellen', 'ik spel voor', 'voorgespeld', 'ik voorspel', 'voorspeld'],
      ['doorzoeken', 'ik zoek door', 'doorgezocht', 'ik doorzoek', 'doorzocht'],
      ['omgeven', 'ik geef om', 'omgegeven', 'ik omgeef', 'omgeven'],
    ])('%s (woordenlijst.org: one lemma for each reading)', (infinitive, separable, separableParticiple, inseparable, inseparableParticiple) => {
      const forms = (query: object) => conjugate({ language: 'nl', infinitive, ...query } as DutchConjugationOptions).forms.map(form => [form.text, form.variant.pattern]);
      expect(forms({ mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([[separable, 'separable'], [inseparable, 'inseparable']]);
      expect(forms({ mood: 'participle', tense: 'past' })).toEqual([[separableParticiple, 'separable'], [inseparableParticiple, 'inseparable']]);
    });
  });
});
