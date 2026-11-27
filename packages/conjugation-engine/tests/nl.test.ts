import { describe, expect, it } from 'vitest';
import { expandTargets, getSubjects } from '../src/catalogue.js';
import { conjugate } from '../src/index.js';
import { dualInseparableVerbs, dualPrefixes, dualReading, dutchExceptions, inferredPrefix, simplexVerbs, spelledPrefix } from '../src/languages/nl/lexicon.js';
import { dutchPack } from '../src/languages/nl/pack.js';
import { renderParts } from '../src/render.js';
import type { DutchConjugationOptions, ResolvedTarget } from '../src/types.js';

/** The subject slot a target names: the pack's engine is given it with the target. */
const slotOf = (target: ResolvedTarget) => target.subject === undefined ? null : getSubjects('nl').find(slot => slot.id === target.subject) ?? null;

function dutch(options: DutchConjugationOptions): string[] {
  const engine = dutchPack.engine(options);
  return [...new Set(expandTargets(options).flatMap(target => engine.generate(target, slotOf(target)).forms.map(form => renderParts('nl', form.parts))))];
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

  it('conjugates vertrekken as the strong inseparable derivative of trekken with zijn', () => {
    expect(dutch({ language: 'nl', infinitive: 'vertrekken', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik vertrok']);
    expect(dutch({ language: 'nl', infinitive: 'vertrekken', mood: 'indicative', tense: 'past', person: 1, number: 'plural' })).toEqual(['wij vertrokken']);
    expect(dutch({ language: 'nl', infinitive: 'vertrekken', mood: 'indicative', tense: 'perfect', person: 1, number: 'singular' })).toEqual(['ik ben vertrokken']);
  });

  it('does not inherit weather restrictions into personal freezing derivatives', () => {
    expect(dutch({ language: 'nl', infinitive: 'vriezen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual([]);
    expect(dutch({ language: 'nl', infinitive: 'invriezen', mood: 'indicative', tense: 'present', person: 1, number: 'singular' })).toEqual(['ik vries in']);
    expect(dutch({ language: 'nl', infinitive: 'bevriezen', mood: 'indicative', tense: 'present', person: 1, number: 'plural' })).toEqual(['wij bevriezen']);
    expect(dutch({ language: 'nl', infinitive: 'invriezen', mood: 'imperative', tense: 'present', person: 2, number: 'plural' })).toEqual(['vries in']);
  });

  it('splits an unknown verb that starts with a separable particle, and records the assumption', () => {
    const present = { mood: 'indicative', tense: 'present', person: 1, number: 'singular' } as const;
    expect(dutch({ language: 'nl', infinitive: 'opzorpen', ...present })).toEqual(['ik zorp op']);
    expect(dutch({ language: 'nl', infinitive: 'opzorpen', mood: 'participle', tense: 'past' })).toEqual(['opgezorpt']);
    expect(conjugate({ language: 'nl', infinitive: 'opzorpen' }).analysis.assumptions).toContain(
      'opzorpen is not in the lexicon and starts with the separable particle op, so it is conjugated as a separable verb; if op- stays on the verb here, give it as the inseparable prefix, and if the verb has no prefix, give its class (weak or strong).',
    );
    // A known base verb keeps its own forms: toe + geven.
    expect(dutch({ language: 'nl', infinitive: 'toegeven', ...present })).toEqual(['ik geef toe']);
    expect(dutch({ language: 'nl', infinitive: 'toegeven', mood: 'participle', tense: 'past' })).toEqual(['toegegeven']);
    // The overrides the assumption names: a class hint keeps the verb one word, a prefix hint decides.
    expect(dutch({ language: 'nl', infinitive: 'opzorpen', classHint: 'weak', ...present })).toEqual(['ik opzorp']);
    expect(dutch({ language: 'nl', infinitive: 'opzorpen', inseparablePrefix: 'op', ...present })).toEqual(['ik opzorp']);
  });

  describe('splits an unknown verb only when all four guards hold', () => {
    const present = { mood: 'indicative', tense: 'present', person: 1, number: 'singular' } as const;
    /** Whether the analysis records an assumed prefix (assume-separable or assume-inseparable). */
    const assumesPrefix = (infinitive: string) => conjugate({ language: 'nl', infinitive }).analysis.assumptions.some(text => text.startsWith(`${infinitive} is not in the lexicon and starts with`));

    it('1: a particle on the unambiguous list is split; a dual prefix gets the reading most verbs with it have', () => {
      expect(dutch({ language: 'nl', infinitive: 'uitzorpen', ...present })).toEqual(['ik zorp uit']);
      // aan, door, om, vol, voor, achter: most verbs with them are separable.
      expect(dutch({ language: 'nl', infinitive: 'aanzorpen', ...present })).toEqual(['ik zorp aan']);
      expect(dutch({ language: 'nl', infinitive: 'aanzorpen', mood: 'participle', tense: 'past' })).toEqual(['aangezorpt']);
      expect(dutch({ language: 'nl', infinitive: 'volzorpen', ...present })).toEqual(['ik zorp vol']);
      // mis, onder, weer: most keep the prefix; over: close to even, so the verb is kept whole.
      expect(dutch({ language: 'nl', infinitive: 'miszorpen', ...present })).toEqual(['ik miszorp']);
      expect(dutch({ language: 'nl', infinitive: 'overzorpen', ...present })).toEqual(['ik overzorp']);
      expect(dutch({ language: 'nl', infinitive: 'overzorpen', mood: 'participle', tense: 'past' })).toEqual(['overzorpt']);
      // The hint gives the other reading.
      expect(dutch({ language: 'nl', infinitive: 'aanzorpen', inseparablePrefix: 'aan', ...present })).toEqual(['ik aanzorp']);
      expect(dutch({ language: 'nl', infinitive: 'overzorpen', separablePrefix: 'over', ...present })).toEqual(['ik zorp over']);
      // A separable default whose rest begins with a vowel and is not a lexicon verb keeps the prefix (om + elpen).
      expect(dutch({ language: 'nl', infinitive: 'omelpen', mood: 'participle', tense: 'past' })).toEqual(['omelpt']);
    });

    it('records the counts behind each default reading, and why', () => {
      const readings = Object.fromEntries(dualPrefixes.map(prefix => [prefix, dualReading(prefix)]));
      expect(readings).toEqual({
        aan: { separable: true, why: 'most' }, achter: { separable: true, why: 'most' }, door: { separable: true, why: 'most' },
        mis: { separable: false, why: 'most' }, om: { separable: true, why: 'most' }, onder: { separable: false, why: 'most' },
        over: { separable: false, why: 'close' }, vol: { separable: true, why: 'most' }, voor: { separable: true, why: 'most' },
        weer: { separable: false, why: 'most' },
      });
      const assumptions = (infinitive: string) => conjugate({ language: 'nl', infinitive }).analysis.assumptions.filter(text => text.includes('not in the lexicon and starts with'));
      expect(assumptions('aanzorpen')).toEqual(['aanzorpen is not in the lexicon and starts with aan, a separable particle in most verbs with it but an unstressed prefix in some, so it is conjugated as a separable verb; if aan- stays on the verb here, give it as the inseparable prefix, and if the verb has no prefix, give its class (weak or strong).']);
      expect(assumptions('miszorpen')[0]).toContain('it is taken as a prefix that stays on the verb because most verbs with mis- keep it;');
      expect(assumptions('overzorpen')[0]).toContain('because about as many verbs with over- are separable as keep it, and keeping the verb whole is the safer guess;');
      expect(assumptions('omelpen')[0]).toContain('because what follows om here starts with a vowel and is not a verb in the lexicon, although most verbs with om are separable;');
    });

    it('keeps the verbs woordenlijst.org lists with the other reading of a separable-default prefix inseparable', () => {
      const past = { mood: 'indicative', tense: 'past', person: 3, number: 'singular' } as const;
      expect(dutch({ language: 'nl', infinitive: 'voorzien', ...past })).toEqual(['hij voorzag']);
      expect(dutch({ language: 'nl', infinitive: 'omhelzen', mood: 'participle', tense: 'past' })).toEqual(['omhelsd']);
      expect(dutch({ language: 'nl', infinitive: 'aanbidden', mood: 'participle', tense: 'past' })).toEqual(['aanbeden']);
      expect(dutch({ language: 'nl', infinitive: 'voldoen', ...past })).toEqual(['hij voldeed']);
      expect(conjugate({ language: 'nl', infinitive: 'voorzien' }).analysis.classificationSource).toBe('lexicon');
      for (const [lemma, { prefix }] of Object.entries(dualInseparableVerbs)) expect(dualReading(prefix).separable, lemma).toBe(true);
    });

    it('2: the rest is a verb in the lexicon, or starts with a consonant and has a root with a vowel before -en', () => {
      // A vowel-initial rest is split only when it is a lexicon verb: op + eten, not op + enen or op + ereren.
      expect(dutch({ language: 'nl', infinitive: 'opeten', ...present })).toEqual(['ik eet op']);
      expect(dutch({ language: 'nl', infinitive: 'opeten', mood: 'participle', tense: 'past' })).toEqual(['opgegeten']);
      expect(dutch({ language: 'nl', infinitive: 'openen', ...present })).toEqual(['ik open']);
      expect(dutch({ language: 'nl', infinitive: 'openen', mood: 'participle', tense: 'past' })).toEqual(['geopend']);
      // (A stress hint gives the stressed -eer- of these French loans; the guards do not depend on it.)
      const stressed = { stems: { unstressedFinalSyllable: false } } as const;
      expect(dutch({ language: 'nl', infinitive: 'opereren', ...stressed, ...present })).toEqual(['ik opereer']);
      // A root of one letter, or without a vowel, is no verb: bij + zen, op + sten.
      expect(dutch({ language: 'nl', infinitive: 'bijzen', ...present })).toEqual(['ik bijs']);
      expect(dutch({ language: 'nl', infinitive: 'opsten', ...present })).toEqual(['ik opst']);
      for (const infinitive of ['openen', 'opereren', 'bijzen', 'opsten']) expect(assumesPrefix(infinitive), infinitive).toBe(false);
      expect(assumesPrefix('opeten')).toBe(true);
    });

    it('3: a particle that ends in a vowel does not meet a vowel (naaien is not na + aien)', () => {
      expect(dutch({ language: 'nl', infinitive: 'naaien', ...present })).toEqual(['ik naai']);
      expect(assumesPrefix('naaien')).toBe(false);
    });

    it('4: a verb on the no-split list is read whole, with no assumed prefix', () => {
      expect(dutch({ language: 'nl', infinitive: 'naderen', ...present })).toEqual(['ik nader']);
      expect(dutch({ language: 'nl', infinitive: 'naderen', mood: 'participle', tense: 'past' })).toEqual(['genaderd']);
      const stressed = { stems: { unstressedFinalSyllable: false } } as const;
      expect(dutch({ language: 'nl', infinitive: 'informeren', ...stressed, ...present })).toEqual(['ik informeer']);
      expect(dutch({ language: 'nl', infinitive: 'informeren', ...stressed, mood: 'participle', tense: 'past' })).toEqual(['geïnformeerd']);
      expect(dutch({ language: 'nl', infinitive: 'missioneren', ...stressed, mood: 'participle', tense: 'past' })).toEqual(['gemissioneerd']);
      for (const infinitive of ['naderen', 'informeren', 'missioneren']) expect(assumesPrefix(infinitive), infinitive).toBe(false);
    });

    it('gives every participle the lexicon data records as its check (N4)', () => {
      const recorded = [...Object.entries(simplexVerbs), ...Object.entries(dualInseparableVerbs)]
        .flatMap(([lemma, { participle }]) => participle === null ? [] : [[lemma, participle] as const]);
      expect(recorded.length).toBeGreaterThan(150);
      const wrong = recorded.flatMap(([lemma, participle]) => {
        const generated = conjugate({ language: 'nl', infinitive: lemma, mood: 'participle', tense: 'past' }).forms.map(form => form.text);
        return generated.join() === participle ? [] : [`${lemma}: ${participle}, not ${generated.join()}`];
      });
      expect(wrong).toEqual([]);
    });

    it('keeps the no-split list to verbs the other guards would read with a prefix, none of them in the lexicon', () => {
      const listed = Object.keys(simplexVerbs);
      expect(listed.length).toBeGreaterThan(100);
      expect(listed.filter(lemma => spelledPrefix(lemma) === null)).toEqual([]);
      expect(listed.filter(lemma => inferredPrefix(lemma) !== null)).toEqual([]);
      expect(listed.filter(lemma => conjugate({ language: 'nl', infinitive: lemma }).analysis.classificationSource !== 'regularRule')).toEqual([]);
    });
  });

  it('takes an unknown verb whose prefix can also be unstressed as inseparable, and records the assumption', () => {
    expect(dutch({ language: 'nl', infinitive: 'overwinnen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik overwon']);
    expect(dutch({ language: 'nl', infinitive: 'overwinnen', mood: 'participle', tense: 'past' })).toEqual(['overwonnen']);
    expect(conjugate({ language: 'nl', infinitive: 'overwinnen' }).analysis.assumptions).toContain(
      'overwinnen is not in the lexicon and starts with over-, which can be a separable particle or an unstressed prefix, and it is taken as a prefix that stays on the verb because about as many verbs with over- are separable as keep it, and keeping the verb whole is the safer guess; if over is separable here, give it as the separable prefix, and if the verb has no prefix, give its class (weak or strong).',
    );
    expect(dutch({ language: 'nl', infinitive: 'overwinnen', separablePrefix: 'over', mood: 'participle', tense: 'past' })).toEqual(['overgewonnen']);
  });

  it('conjugates common verbs with an unstressed prefix as woordenlijst.org gives them, without hints', () => {
    const past = { mood: 'indicative', tense: 'past', person: 3, number: 'singular' } as const;
    const participle = (infinitive: string) => dutch({ language: 'nl', infinitive, mood: 'participle', tense: 'past' });
    expect(participle('verhuizen')).toEqual(['verhuisd']);
    expect(conjugate({ language: 'nl', infinitive: 'verhuizen' }).analysis.auxiliaries).toEqual(['hebben', 'zijn']);
    expect(participle('bedekken')).toEqual(['bedekt']);
    expect(participle('zich bemoeien')).toEqual(['bemoeid']);
    expect(dutch({ language: 'nl', infinitive: 'besluiten', ...past })).toEqual(['hij besloot']);
    expect(participle('besluiten')).toEqual(['besloten']);
    expect(dutch({ language: 'nl', infinitive: 'vervallen', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' })).toEqual(['hij is vervallen']);
    expect(dutch({ language: 'nl', infinitive: 'vergelijken', ...past })).toEqual(['hij vergeleek']);
    // ontmoeten is ont + the whole verb, not a derivative of moeten.
    expect(dutch({ language: 'nl', infinitive: 'ontmoeten', ...past })).toEqual(['hij ontmoette']);
    expect(dutch({ language: 'nl', infinitive: 'ervaren', ...past })).toEqual(['hij ervoer', 'hij ervaarde']);
  });

  describe('x stands for /ks/: it closes the syllable and is voiceless', () => {
    const forms = (infinitive: string) => [
      ...dutch({ language: 'nl', infinitive, mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      ...dutch({ language: 'nl', infinitive, mood: 'indicative', tense: 'past', person: 1, number: 'singular' }),
      ...dutch({ language: 'nl', infinitive, mood: 'participle', tense: 'past' }),
    ];
    /** The rule ids of the past tense form, in order. */
    const pastRules = (infinitive: string) => conjugate({ language: 'nl', infinitive, mood: 'indicative', tense: 'past', person: 1, number: 'singular' }).forms[0]!.ruleIds;

    it('keeps the vowel before x short and takes t, in real verbs and an invented one', () => {
      // woordenlijst.org: faxen, mixen, relaxen; faxen is in the loan table, the others follow from the rules.
      expect(forms('faxen')).toEqual(['ik fax', 'ik faxte', 'gefaxt']);
      expect(forms('mixen')).toEqual(['ik mix', 'ik mixte', 'gemixt']);
      expect(forms('relaxen')).toEqual(['ik relax', 'ik relaxte', 'gerelaxt']);
      expect(forms('unboxen')).toEqual(['ik unbox', 'ik unboxte', 'geünboxt']);
      expect(forms('zoxen')).toEqual(['ik zox', 'ik zoxte', 'gezoxt']);
      // Contrast: boksen writes the same sounds as ks, a closed syllable too.
      expect(forms('boksen')).toEqual(['ik boks', 'ik bokste', 'gebokst']);
    });

    it('takes d after h, which is no sound of \'t kofschip and usually voiced', () => {
      expect(dutch({ language: 'nl', infinitive: 'zorhen', mood: 'indicative', tense: 'past', person: 1, number: 'singular' })).toEqual(['ik zorhde']);
      expect(pastRules('zorhen')).toContain('nl.orth.dental-kofschip');
    });

    it('gives zullen the present participle zullend, which woordenlijst.org lists (lemma 109960)', () => {
      expect(dutch({ language: 'nl', infinitive: 'zullen', mood: 'participle', tense: 'present' })).toEqual(['zullend']);
    });

    it('records no lengthened vowel before x, and the voiceless x for the t', () => {
      expect(pastRules('relaxen')).not.toContain('nl.stem.lengthen-vowel');
      expect(pastRules('relaxen')).toContain('nl.orth.dental-voiceless');
      expect(pastRules('zoxen')).toEqual(pastRules('relaxen'));
      // A single consonant other than x still opens the syllable: lopen, loop.
      expect(pastRules('zoken')).toContain('nl.stem.lengthen-vowel');
    });
  });

  it('gives a verb that is separable in one sense and inseparable in another both paradigms', () => {
    const result = conjugate({ language: 'nl', infinitive: 'voorkomen', mood: 'indicative', tense: 'present', person: 3, number: 'singular' });
    expect(result.forms.map(form => [form.text, form.variant.pattern, form.variant.condition])).toEqual([
      ['hij komt voor', 'separable', 'vóórkomen: to occur, to appear, to seem'],
      ['hij voorkomt', 'inseparable', 'voorkómen: to prevent'],
    ]);
    // Each reading has its own auxiliary (woordenlijst.org): het is voorgekomen, ik heb het voorkomen.
    const perfect = conjugate({ language: 'nl', infinitive: 'voorkomen', mood: 'indicative', tense: 'perfect', person: 3, number: 'singular' });
    expect(perfect.forms.map(form => form.text)).toEqual(['hij is voorgekomen', 'hij heeft voorkomen']);
    expect(result.analysis).toMatchObject({ pattern: 'separable', alternatives: [{ pattern: 'inseparable' }] });
    // A prefix hint keeps one paradigm, untagged, as before.
    const hinted = conjugate({ language: 'nl', infinitive: 'voorkomen', separablePrefix: 'voor', mood: 'indicative', tense: 'present', person: 3, number: 'singular' });
    expect(hinted.forms.map(form => [form.text, form.variant.pattern, form.variant.condition])).toEqual([['hij komt voor', null, null]]);
    expect(hinted.analysis).not.toHaveProperty('alternatives');
  });
});
