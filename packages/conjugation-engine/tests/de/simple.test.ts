import { describe, expect, it } from 'vitest';
import { synthesize } from '../../src/core/staged.js';
import type { Cell } from '../../src/core/staged.js';
import type { GrammaticalNumber, Person } from '../../src/core/grammar.js';
import { classifyGerman } from '../../src/languages/de/classify.js';
import { germanGrammar } from '../../src/languages/de/grammar.js';
import { germanRules } from '../../src/languages/de/rules.js';

const finite = (mood: string, tense: string) => (person: Person, number: GrammaticalNumber): Cell => ({ kind: 'finite', mood, tense, person, number });
const present = finite('indicative', 'present');
const past = finite('indicative', 'past');
const subjunctiveI = finite('subjunctive', 'present');
const subjunctiveII = finite('subjunctive', 'past');
const imperative = finite('imperative', 'present');
const nonFinite = (form: string): Cell => ({ kind: 'nonFinite', form });

const lexeme = (lemma: string, classHint?: string) => classifyGerman({ infinitive: lemma, ...(classHint === undefined ? {} : { classHint }) })[0]!.value;
const outcomes = (lemma: string, cell: Cell, classHint?: string) => synthesize(germanGrammar, lexeme(lemma, classHint), cell);
const words = (lemma: string, cell: Cell, classHint?: string) => outcomes(lemma, cell, classHint).map(o => o.value);

/** Every rule id an `ids` call has seen, to check that each stem, ending and spelling rule is exercised. */
const seen = new Set<string>();
const ids = (lemma: string, cell: Cell, index = 0) => {
  const rules = outcomes(lemma, cell)[index]!.steps.map(s => s.rule);
  for (const rule of rules) seen.add(rule);
  return rules;
};
const tagsOf = (lemma: string, cell: Cell, classHint?: string) => Object.fromEntries(outcomes(lemma, cell, classHint).map(o => [o.value, o.tags]));
const usageOf = (lemma: string, cell: Cell, classHint?: string) =>
  Object.fromEntries(outcomes(lemma, cell, classHint).map(o => [o.value, o.tags.usage ?? 'standard']));

describe('German simple tenses', () => {
  it('builds the Präsens with schwa, vowel change, t-merge and the sibilant rule', () => {
    expect(words('arbeiten', present(2, 'singular'))).toEqual(['arbeitest']);
    expect(ids('arbeiten', present(2, 'singular'))).toEqual(['de.stem.present', 'de.end.present', 'de.orth.schwa-dental']);
    expect(ids('fahren', present(3, 'singular'))).toEqual(['de.stem.present', 'de.stem.present2', 'de.end.present']);
    expect(words('fahren', present(3, 'singular'))).toEqual(['fährt']);
    expect(words('halten', present(3, 'singular'))).toEqual(['hält']);
    expect(ids('halten', present(3, 'singular'))).toContain('de.orth.t-merge');
    expect(words('halten', present(2, 'singular'))).toEqual(['hältst']);
    expect(words('halten', present(2, 'plural'))).toEqual(['haltet']);
    expect(words('reisen', present(2, 'singular'))).toEqual(['reist']);
    expect(ids('reisen', present(2, 'singular'))).toContain('de.orth.sibilant-2sg');
    expect(words('sammeln', present(1, 'singular'))).toEqual(['sammele', 'sammle']);
    expect(ids('sammeln', present(1, 'singular'), 1)).toContain('de.orth.el-elision');
    expect(tagsOf('sammeln', present(1, 'singular')).sammle).toEqual({ pattern: 'elided' });
    expect(words('sammeln', present(1, 'plural'))).toEqual(['sammeln']);
    expect(ids('sammeln', present(1, 'plural'))).toContain('de.orth.el-er-schwa');
    expect(words('wandern', present(1, 'singular'))).toEqual(['wandere', 'wandre']);
    expect(words('feiern', present(3, 'plural'))).toEqual(['feiern']);
    expect(words('atmen', present(3, 'singular'))).toEqual(['atmet']);
    expect(ids('atmen', present(3, 'singular'))).toContain('de.orth.schwa-nasal');
    expect(words('lernen', present(3, 'singular'))).toEqual(['lernt']);
    expect(words('lesen', present(2, 'singular'))).toEqual(['liest']);
    expect(words('laden', present(3, 'singular'))).toEqual(['lädt']);
    expect(words('senden', present(3, 'singular'))).toEqual(['sendet']);
    expect(words('können', present(1, 'singular'))).toEqual(['kann']);
    expect(ids('können', present(2, 'singular'))).toEqual(['de.stem.present', 'de.stem.present-singular', 'de.end.preterite-present']);
    expect(words('müssen', present(2, 'singular'))).toEqual(['musst']);
    expect(words('wissen', present(2, 'singular'))).toEqual(['weißt']);
    expect(words('tun', present(1, 'singular'))).toEqual(['tue']);
    expect(words('knien', present(1, 'singular'))).toEqual(['knie']);
  });

  it('builds the Präteritum, weak and strong', () => {
    expect(words('machen', past(2, 'plural'))).toEqual(['machtet']);
    expect(ids('machen', past(1, 'singular'))).toEqual(['de.stem.present', 'de.end.preterite-weak']);
    expect(words('arbeiten', past(1, 'singular'))).toEqual(['arbeitete']);
    expect(words('fahren', past(1, 'plural'))).toEqual(['fuhren']);
    expect(ids('fahren', past(1, 'plural'))).toEqual(['de.stem.preterite', 'de.end.preterite-strong']);
    expect(words('schreien', past(1, 'plural'))).toEqual(['schrien']);
    expect(ids('schreien', past(1, 'plural'))).toContain('de.orth.ie-contraction');
    // DWDS and Duden print the -est form first after d and t (fandest, fandst), as after s, ß, z and x.
    expect(words('finden', past(2, 'singular'))).toEqual(['fandest', 'fandst']);
    expect(ids('finden', past(2, 'singular'))).toEqual(['de.stem.preterite', 'de.end.preterite-2sg']);
    expect(tagsOf('finden', past(2, 'singular')).fandst).toEqual({ pattern: 'short' });
    expect(words('lesen', past(2, 'singular'))).toEqual(['lasest', 'last']);
    expect(words('waschen', past(2, 'singular'))).toEqual(['wuschst']);
    expect(words('finden', past(2, 'plural'))).toEqual(['fandet']);
    expect(words('tun', past(2, 'singular'))).toEqual(['tatest', 'tatst']);
    expect(words('senden', past(1, 'singular'))).toEqual(['sandte']);
    expect(words('senden', past(1, 'singular'), 'weak')).toEqual(['sendete']);
    expect(words('brennen', past(2, 'singular'))).toEqual(['branntest']);
    expect(words('haben', past(3, 'singular'))).toEqual(['hatte']);
    expect(words('können', past(1, 'plural'))).toEqual(['konnten']);
    expect(words('spalten', past(1, 'singular'))).toEqual(['spaltete']);
    expect(words('werden', past(1, 'singular'))).toEqual(['wurde', 'ward']);
    expect(usageOf('werden', past(1, 'singular'))).toEqual({ wurde: 'standard', ward: 'dated' });
    expect(words('backen', past(1, 'singular'), 'weak')).toEqual(['backte']);
    expect(usageOf('backen', past(1, 'singular'), 'strong')).toEqual({ buk: 'dated' });
    expect(words('verschlafen', past(1, 'singular'))).toEqual(['verschlief']);
  });

  it('builds Konjunktiv I and II', () => {
    expect(words('fahren', subjunctiveI(2, 'singular'))).toEqual(['fahrest']);
    expect(ids('fahren', subjunctiveI(2, 'singular'))).toEqual(['de.stem.present', 'de.end.subjunctive-i']);
    expect(words('sammeln', subjunctiveI(2, 'singular'))).toEqual(['sammelst', 'sammlest']);
    expect(words('sammeln', subjunctiveI(2, 'plural'))).toEqual(['sammelt', 'sammlet']);
    expect(words('wandern', subjunctiveI(2, 'singular'))).toEqual(['wanderst']);
    expect(words('sein', subjunctiveI(2, 'singular'))).toEqual(['seiest', 'seist']);
    expect(words('fahren', subjunctiveII(1, 'singular'))).toEqual(['führe']);
    expect(ids('fahren', subjunctiveII(1, 'singular'))).toEqual(['de.stem.preterite', 'de.stem.subjunctive-umlaut', 'de.end.subjunctive-ii']);
    expect(words('kommen', subjunctiveII(2, 'singular'))).toEqual(['kämest', 'kämst']);
    expect(ids('kommen', subjunctiveII(2, 'singular'), 1)).toContain('de.end.subjunctive-ii-short');
    expect(words('gehen', subjunctiveII(2, 'singular'))).toEqual(['gingest']);
    expect(ids('gehen', subjunctiveII(2, 'singular'))).toContain('de.stem.subjunctive-plain');
    expect(words('helfen', subjunctiveII(1, 'singular'))).toEqual(['hälfe', 'hülfe']);
    expect(ids('helfen', subjunctiveII(1, 'singular'))).toContain('de.stem.subjunctive-lexical');
    expect(words('brennen', subjunctiveII(1, 'singular'))).toEqual(['brennte']);
    expect(words('machen', subjunctiveII(1, 'singular'))).toEqual(['machte']);
    expect(ids('machen', subjunctiveII(1, 'singular'))).toContain('de.stem.subjunctive-weak');
    expect(words('können', subjunctiveII(1, 'singular'))).toEqual(['könnte']);
    expect(words('schreien', subjunctiveII(1, 'singular'))).toEqual(['schrie']);
    expect(words('schreien', subjunctiveII(2, 'singular'))).toEqual(['schriest']);
    expect(words('sein', subjunctiveII(2, 'plural'))).toEqual(['wäret', 'wärt']);
    expect(words('schwören', subjunctiveII(1, 'singular'))).toEqual(['schwöre', 'schwüre']);
    expect(usageOf('schwören', subjunctiveII(1, 'singular')).schwüre).toBe('dated');
    expect(words('stehen', subjunctiveII(2, 'singular'))).toEqual(['ständest', 'stündest']);
    expect(words('mahlen', subjunctiveII(1, 'singular'))).toEqual(['mahlte']);
  });

  it('takes whole words from the lexicon', () => {
    expect(words('sein', present(1, 'singular'))).toEqual(['bin']);
    expect(ids('sein', present(1, 'singular'))).toEqual(['de.stem.lexical-cell']);
    expect(words('werden', present(3, 'singular'))).toEqual(['wird']);
    expect(words('haben', present(2, 'singular'))).toEqual(['hast']);
    expect(words('haben', present(1, 'singular'))).toEqual(['habe']);
    expect(words('tun', present(1, 'plural'))).toEqual(['tun']);
    expect(words('bersten', present(3, 'singular'))).toEqual(['birst']);
  });

  it('builds the imperative', () => {
    expect(words('geben', imperative(2, 'singular'))).toEqual(['gib']);
    expect(ids('geben', imperative(2, 'singular'))).toEqual(['de.stem.present', 'de.stem.imperative-i', 'de.end.imperative-singular']);
    expect(words('kommen', imperative(2, 'singular'))).toEqual(['komm', 'komme']);
    expect(tagsOf('kommen', imperative(2, 'singular')).komme).toEqual({ pattern: 'long' });
    expect(words('finden', imperative(2, 'singular'))).toEqual(['finde']);
    expect(words('atmen', imperative(2, 'singular'))).toEqual(['atme']);
    expect(words('sammeln', imperative(2, 'singular'))).toEqual(['sammele', 'sammle']);
    expect(words('tun', imperative(2, 'singular'))).toEqual(['tu', 'tue']);
    expect(words('sehen', imperative(2, 'singular'))).toEqual(['sieh', 'siehe']);
    expect(words('treten', imperative(2, 'singular'))).toEqual(['tritt']);
    expect(words('fahren', imperative(2, 'singular'))).toEqual(['fahr', 'fahre']);
    expect(words('fahren', imperative(2, 'plural'))).toEqual(['fahrt']);
    expect(ids('fahren', imperative(2, 'plural'))).toEqual(['de.stem.present', 'de.end.imperative-plural']);
    expect(words('arbeiten', imperative(2, 'plural'))).toEqual(['arbeitet']);
    expect(words('fahren', imperative(1, 'plural'))).toEqual(['fahren']);
    expect(ids('fahren', imperative(3, 'plural'))).toEqual(['de.stem.present', 'de.end.imperative-polite']);
    expect(words('sein', imperative(3, 'plural'))).toEqual(['seien']);
    expect(words('sein', imperative(2, 'plural'))).toEqual(['seid']);
    expect(words('wissen', imperative(2, 'singular'))).toEqual(['wisse']);
  });

  it('builds the infinitive and the participles', () => {
    expect(words('fahren', nonFinite('infinitive'))).toEqual(['fahren']);
    expect(ids('fahren', nonFinite('infinitive'))).toEqual(['de.stem.present', 'de.end.infinitive']);
    expect(words('sammeln', nonFinite('infinitive'))).toEqual(['sammeln']);
    expect(words('tun', nonFinite('infinitive'))).toEqual(['tun']);
    expect(words('sein', nonFinite('infinitive'))).toEqual(['sein']);
    expect(words('sammeln', nonFinite('presentParticiple'))).toEqual(['sammelnd']);
    expect(ids('sammeln', nonFinite('presentParticiple'))).toContain('de.end.present-participle');
    expect(words('tun', nonFinite('presentParticiple'))).toEqual(['tuend']);
    expect(words('sein', nonFinite('presentParticiple'))).toEqual(['seiend']);
    expect(words('fahren', nonFinite('pastParticiple'))).toEqual(['gefahren']);
    expect(ids('fahren', nonFinite('pastParticiple'))).toEqual(['de.stem.participle', 'de.stem.ge-prefix', 'de.end.participle-strong']);
    expect(words('machen', nonFinite('pastParticiple'))).toEqual(['gemacht']);
    expect(ids('machen', nonFinite('pastParticiple'))).toEqual(['de.stem.present', 'de.stem.ge-prefix', 'de.end.participle-weak']);
    expect(words('arbeiten', nonFinite('pastParticiple'))).toEqual(['gearbeitet']);
    expect(words('studieren', nonFinite('pastParticiple'))).toEqual(['studiert']);
    expect(ids('studieren', nonFinite('pastParticiple'))).toContain('de.stem.ge-blocked-stress');
    expect(words('verschlafen', nonFinite('pastParticiple'))).toEqual(['verschlafen']);
    expect(ids('verschlafen', nonFinite('pastParticiple'))).toContain('de.stem.ge-blocked-prefix');
    expect(words('schreien', nonFinite('pastParticiple'))).toEqual(['geschrien']);
    expect(words('senden', nonFinite('pastParticiple'))).toEqual(['gesandt']);
    expect(words('tun', nonFinite('pastParticiple'))).toEqual(['getan']);
    expect(words('befehlen', nonFinite('pastParticiple'))).toEqual(['befohlen']);
    expect(words('gelten', nonFinite('pastParticiple'))).toEqual(['gegolten']);
    expect(words('essen', nonFinite('pastParticiple'))).toEqual(['gegessen']);
    expect(words('salzen', nonFinite('pastParticiple'))).toEqual(['gesalzen', 'gesalzt']);
    expect(words('benedeien', nonFinite('pastParticiple'))).toEqual(['benedeit', 'gebenedeit']);
    expect(words('bewegen', nonFinite('pastParticiple'))).toEqual(['bewegt']);
    expect(words('erwachen', nonFinite('pastParticiple'))).toEqual(['erwacht']);
  });

  it('exercises every stem, ending and spelling rule', () => {
    const stages = new Set(['stem', 'ending', 'orthography']);
    const declared: string[] = Object.values(germanRules).filter(rule => stages.has(rule.stage)).map(rule => rule.id).sort();
    expect([...seen].filter(rule => declared.includes(rule)).sort()).toEqual(declared);
  });
});
