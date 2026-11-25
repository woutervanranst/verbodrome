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
      ['misgaan', 112052, 'ga mis', 'gaat mis', 'ging mis', 'misgegaan', 'zijn'],
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

  describe('G1: a stem-final -el/-er/-en/-em is unstressed only when the root, without particle and prefix, has two syllables', () => {
    // Derivatives of nemen take its forms: the root nem is one syllable, so it follows the open-syllable rule.
    check([
      ['ontnemen', 107160, 'ontneem', 'ontneemt', 'ontnam', 'ontnomen', 'hebben'],
      ['vernemen', 109261, 'verneem', 'verneemt', 'vernam', 'vernomen', 'hebben'],
      ['benemen', 104357, 'beneem', 'beneemt', 'benam', 'benomen', 'hebben'],
      ['deelnemen', 111187, 'neem deel', 'neemt deel', 'nam deel', 'deelgenomen', 'hebben'],
      ['waarnemen', 113859, 'neem waar', 'neemt waar', 'nam waar', 'waargenomen', 'hebben'],
      ['kennisnemen', 111839, 'neem kennis', 'neemt kennis', 'nam kennis', 'kennisgenomen', 'hebben'],
    ]);

    // Unlisted verbs with an unstressed prefix: the prefix is read, so the root is one syllable (lengthening) and there is no ge-.
    check([
      ['verdelen', 108966, 'verdeel', 'verdeelt', 'verdeelde', 'verdeeld', 'hebben'],
      ['bespelen', 104454, 'bespeel', 'bespeelt', 'bespeelde', 'bespeeld', 'hebben'],
      ['verspelen', 109407, 'verspeel', 'verspeelt', 'verspeelde', 'verspeeld', 'hebben'],
      ['beheren', 104242, 'beheer', 'beheert', 'beheerde', 'beheerd', 'hebben'],
      ['bezeren', 104584, 'bezeer', 'bezeert', 'bezeerde', 'bezeerd', 'hebben'],
    ]);

    // A root of two syllables keeps its unstressed ending, with the prefix, the particle or neither.
    check([
      ['verademen', 108902, 'veradem', 'verademt', 'verademde', 'verademd', 'hebben'],
      ['ademen', 103997, 'adem', 'ademt', 'ademde', 'geademd', 'hebben'],
      ['wandelen', 109755, 'wandel', 'wandelt', 'wandelde', 'gewandeld', 'hebben/zijn'],
      ['herinneren', 105841, 'herinner', 'herinnert', 'herinnerde', 'herinnerd', 'hebben'],
      ['veranderen', 108909, 'verander', 'verandert', 'veranderde', 'veranderd', 'hebben/zijn'],
      ['ondertekenen', 107062, 'onderteken', 'ondertekent', 'ondertekende', 'ondertekend', 'hebben'],
      ['tekenen', 108669, 'teken', 'tekent', 'tekende', 'getekend', 'hebben'],
      ['regenen', 107820, 'regen', 'regent', 'regende', 'geregend', 'hebben'],
      ['openen', 107261, 'open', 'opent', 'opende', 'geopend', 'hebben'],
      ['zegenen', 109904, 'zegen', 'zegent', 'zegende', 'gezegend', 'hebben'],
      ['ergeren', 105358, 'erger', 'ergert', 'ergerde', 'geërgerd', 'hebben'],
    ]);

    it('keeps a monosyllabic root without a prefix on the open-syllable rule (spelen: speel)', () => {
      expect(engineRow('spelen')).toMatchObject({ present1: ['ik speel'], participle: ['gespeeld'] });
    });

    it('states a lengthening step only where the vowel was lengthened', () => {
      const stemRules = (infinitive: string): string[] => {
        const [form] = conjugate({ language: 'nl', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms;
        const verb = form!.parts.find(part => part.role === 'lexicalVerb')!;
        return (verb.steps ?? []).map(s => s.rule).filter(rule => rule.startsWith('nl.stem.'));
      };
      expect(stemRules('ontnemen')).toContain('nl.stem.lengthen-vowel');
      expect(stemRules('ontnemen')).not.toContain('nl.stem.unstressed-e');
      expect(stemRules('verademen')).toContain('nl.stem.unstressed-e');
      expect(stemRules('verademen')).not.toContain('nl.stem.lengthen-vowel');
    });
  });

  describe('an unstressed prefix of an unlisted verb keeps ge- out of the participle', () => {
    check([
      ['vermoeien', 109247, 'vermoei', 'vermoeit', 'vermoeide', 'vermoeid', 'hebben/zijn'],
      ['verfoeien', 109037, 'verfoei', 'verfoeit', 'verfoeide', 'verfoeid', 'hebben'],
      ['vernieuwen', 109266, 'vernieuw', 'vernieuwt', 'vernieuwde', 'vernieuwd', 'hebben'],
      ['ontdooien', 107090, 'ontdooi', 'ontdooit', 'ontdooide', 'ontdooid', 'hebben/zijn'],
    ]);

    it('reads an unlisted verb with a prefix and a listed strong base as its derivative (verbreken: verbrak, verbroken)', () => {
      expect(engineRow('verbreken')).toMatchObject({ present1: ['ik verbreek'], past1: ['ik verbrak'], participle: ['verbroken'] });
    });

    it('lets a class hint keep the prefix-like start as part of the root (an invented verb)', () => {
      const participle = (query: object) => texts({ infinitive: 'bezorpelen', mood: 'participle', tense: 'past', ...query });
      expect(participle({})).toEqual(['bezorpeld']);
      expect(participle({ classHint: 'weak' })).toEqual(['gebezorpeld']);
    });

    it('lets a class hint with the separable prefix keep the rest of a separable verb whole', () => {
      const participle = (query: object) => texts({ infinitive: 'voorbereiden', separablePrefix: 'voor', mood: 'participle', tense: 'past', ...query });
      expect(participle({})).toEqual(['voorbereid']);
      expect(participle({ classHint: 'weak' })).toEqual(['voorgebereid']);
    });
  });

  describe('be- before a vowel is a prefix, unless e and the vowel are one sound (eu, ei, ee)', () => {
    check([
      ['beoefenen', 104366, 'beoefen', 'beoefent', 'beoefende', 'beoefend', 'hebben'],
      ['beamen', 104156, 'beaam', 'beaamt', 'beaamde', 'beaamd', 'hebben'],
      ['beogen', 104367, 'beoog', 'beoogt', 'beoogde', 'beoogd', 'hebben'],
      ['beoordelen', 104369, 'beoordeel', 'beoordeelt', 'beoordeelde', 'beoordeeld', 'hebben'],
      ['veroordelen', 109281, 'veroordeel', 'veroordeelt', 'veroordeelde', 'veroordeeld', 'hebben'],
      ['oordelen', 107256, 'oordeel', 'oordeelt', 'oordeelde', 'geoordeeld', 'hebben'],
      ['beëindigen', 104205, 'beëindig', 'beëindigt', 'beëindigde', 'beëindigd', 'hebben'],
      ['beïnvloeden', 104251, 'beïnvloed', 'beïnvloedt', 'beïnvloedde', 'beïnvloed', 'hebben'],
      ['beantwoorden', 104158, 'beantwoord', 'beantwoordt', 'beantwoordde', 'beantwoord', 'hebben'],
      ['beërven', 104209, 'beërf', 'beërft', 'beërfde', 'beërfd', 'hebben'],
      ['beuken', 104517, 'beuk', 'beukt', 'beukte', 'gebeukt', 'hebben'],
      ['beitelen', 104252, 'beitel', 'beitelt', 'beitelde', 'gebeiteld', 'hebben'],
      ['beieren', 104249, 'beier', 'beiert', 'beierde', 'gebeierd', 'hebben'],
    ]);
  });

  describe('verbs where be-/ge- is not a prefix: first syllable stressed, listed without a prefix', () => {
    check([
      ['bezemen', 104583, 'bezem', 'bezemt', 'bezemde', 'gebezemd', 'hebben'],
      ['geselen', 105620, 'gesel', 'geselt', 'geselde', 'gegeseld', 'hebben'],
      ['verbeteren', 108922, 'verbeter', 'verbetert', 'verbeterde', 'verbeterd', 'hebben/zijn'],
      ['genereren', 105609, 'genereer', 'genereert', 'genereerde', 'gegenereerd', 'hebben'],
      ['verwelkomen', 109539, 'verwelkom', 'verwelkomt', 'verwelkomde', 'verwelkomd', 'hebben'],
    ]);

    it('gives verwelkomen its stem from the lexicon, with a lexical step', () => {
      const [form] = conjugate({ language: 'nl', infinitive: 'verwelkomen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }).forms;
      const verb = form!.parts.find(part => part.role === 'lexicalVerb')!;
      expect((verb.steps ?? []).map(s => s.rule)).toContain('nl.stem.lexical');
    });

    // bedelen and beteren are two lemmas each on woordenlijst.org, one with be- and one without.
    it.each([
      ['bedelen', 'ik bedel', 'gebedeld', 'ik heb gebedeld', 'ik bedeel', 'bedeeld', 'ik heb bedeeld'],
      ['beteren', 'ik beter', 'gebeterd', 'ik ben gebeterd', 'ik beteer', 'beteerd', 'ik heb beteerd'],
    ])('%s has two readings', (infinitive, present, participle, perfect, presentPrefixed, participlePrefixed, perfectPrefixed) => {
      const forms = (query: object) => conjugate({ language: 'nl', infinitive, ...query } as DutchConjugationOptions).forms.map(form => [form.text, form.variant.pattern]);
      expect(forms({ mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([[present, 'unprefixed'], [presentPrefixed, 'inseparable']]);
      expect(forms({ mood: 'participle', tense: 'past' })).toEqual([[participle, 'unprefixed'], [participlePrefixed, 'inseparable']]);
      expect(forms({ mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual([[perfect, 'unprefixed'], [perfectPrefixed, 'inseparable']]);
    });

    it('lets a prefix hint choose the reading of bedelen', () => {
      expect(texts({ infinitive: 'bedelen', inseparablePrefix: 'be', mood: 'participle', tense: 'past' })).toEqual(['bedeeld']);
    });
  });

  describe('wezen is the other infinitive of zijn', () => {
    it('is conjugated like zijn, and the analysis says so', () => {
      expect(engineRow('wezen')).toEqual({
        present1: ['ik ben'], present3: ['hij is'], past1: ['ik was'], participle: ['geweest'], auxiliaries: 'zijn',
      });
      expect(texts({ infinitive: 'wezen', mood: 'imperative', tense: 'present', person: 2, number: 'singular' })).toEqual(['wees']);
      const result = conjugate({ language: 'nl', infinitive: 'wezen' });
      expect((result.analysis.steps ?? []).map(s => s.rule)).toContain('nl.classify.alternative-infinitive');
    });
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
