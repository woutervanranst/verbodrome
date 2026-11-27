import { describe, expect, it } from 'vitest';
import { conjugate, parseConjugationOptions } from '../../src/index.js';
import type { ConjugatedForm } from '../../src/index.js';

/** The forms of a target; finite moods default to the 3rd person singular unless `extra` sets the person or number. */
function all(infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}): readonly ConjugatedForm[] {
  const finite = mood !== 'participle' && mood !== 'infinitive';
  const person = finite && extra.person === undefined && extra.number === undefined ? { person: 3, number: 'singular' } : {};
  return conjugate(parseConjugationOptions({ language: 'en', infinitive, mood, tense, ...person, ...extra })).forms;
}
const texts = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  all(infinitive, mood, tense, extra).map(f => f.text);
const first = (infinitive: string, mood: string, tense: string, extra: Record<string, unknown> = {}) =>
  all(infinitive, mood, tense, extra).find(f => f.preferred)!;
const steps = (f: ConjugatedForm) => f.parts.flatMap(p => p.steps ?? []).map(s => s.rule);
const one = first; // the preferred 3sg form

describe('English simple forms', () => {
  it('records each spelling rule', () => {
    expect(steps(one('watch', 'indicative', 'present'))).toEqual(['en.end.third-s', 'en.orth.es-sibilant']);
    expect(steps(one('try', 'indicative', 'past'))).toEqual(['en.end.past-ed', 'en.orth.y-to-i']);
    expect(steps(one('hope', 'participle', 'present'))).toEqual(['en.end.ing', 'en.orth.drop-e']);
    expect(steps(one('panic', 'indicative', 'past'))).toEqual(['en.end.past-ed', 'en.orth.c-to-ck']);
    expect(steps(one('stop', 'indicative', 'past'))).toEqual(['en.end.past-ed', 'en.orth.double-consonant']);
    expect(steps(one('go', 'indicative', 'present'))).toEqual(['en.end.third-s', 'en.orth.es-o']);
    expect(steps(one('die', 'participle', 'present'))).toEqual(['en.end.ing', 'en.orth.ie-to-y']);
    expect(steps(one('hope', 'indicative', 'past'))).toEqual(['en.end.past-ed', 'en.orth.e-plus-ed']);
    expect(steps(one('walk', 'indicative', 'present', { person: 1, number: 'singular' }))).toEqual(['en.end.present-plain']);
    expect(steps(one('swim', 'indicative', 'past'))).toEqual(['en.cell.past-listed']);
    expect(steps(one('swim', 'participle', 'past'))).toEqual(['en.cell.participle-listed']);
    expect(one('stop', 'indicative', 'past').parts.at(-1)!.steps!.at(-1)).toMatchObject({ before: 'stoped', after: 'stopped', params: { consonant: 'p', reason: 'stressed' } });
    expect(one('kidnap', 'participle', 'past').parts[0]!.steps!.at(-1)!.params).toEqual({ consonant: 'p', reason: 'listed', ending: 'ed' });
    expect(one('walk', 'indicative', 'past').steps!.map(s => s.rule)).toEqual(['en.clause.subject']);
  });

  it('labels regional variants and prefers British', () => {
    const travel = all('travel', 'indicative', 'past'); // he travelled, he traveled
    expect(travel.map(f => [f.text, f.variant.region, f.preferred])).toEqual([['he travelled', 'GB', true], ['he traveled', 'US', false]]);
    expect(steps(travel[1]!)).toEqual(['en.end.past-ed', 'en.orth.single-l-american']);
    expect(all('travel', 'indicative', 'past', { region: 'US' }).map(f => [f.text, f.preferred])).toEqual([['he traveled', true]]);
    expect(texts('kidnap', 'participle', 'past')).toEqual(['kidnapped', 'kidnaped']);
    expect(all('kidnap', 'participle', 'past').map(f => [f.variant.region, f.variant.pattern])).toEqual([[null, null], ['US', 'variant']]);
    expect(steps(all('kidnap', 'participle', 'past')[1]!)).toEqual(['en.end.participle-ed', 'en.orth.single-consonant-american']);
    expect(texts('get', 'participle', 'past')).toEqual(['got', 'gotten']);
    expect(all('get', 'participle', 'past').map(f => f.variant.region)).toEqual([null, 'US']);
    expect(texts('learn', 'participle', 'past')).toEqual(['learned', 'learnt']);
    expect(texts('learn', 'participle', 'past', { region: 'US' })).toEqual(['learned']);
    expect(texts('parallel', 'participle', 'past')).toEqual(['paralleled', 'parallelled']); // LDOCE: also parallelled British English
    expect(texts('misspell', 'indicative', 'past')).toEqual(['he misspelt', 'he misspelled']);
    expect(texts('dive', 'indicative', 'past')).toEqual(['he dived', 'he dove']);
    expect(texts('bid', 'participle', 'past')).toEqual(['bid', 'bidden']);
    expect(all('bid', 'participle', 'past').map(f => f.variant.usage)).toEqual(['standard', 'literary']);
  });

  it('tags the listed and the regular form of a verb that has both', () => {
    expect(all('bet', 'indicative', 'past').map(f => [f.text, f.variant.pattern])).toEqual([['he bet', 'irregular'], ['he betted', 'regular']]);
    expect(steps(all('bet', 'indicative', 'past')[1]!)).toEqual(['en.end.past-ed', 'en.orth.double-consonant']);
    expect(texts('quit', 'indicative', 'past')).toEqual(['he quit', 'he quitted']);
    expect(texts('mow', 'participle', 'past')).toEqual(['mown', 'mowed']);
  });

  it('builds be, have and the subjunctive', () => {
    expect(texts('be', 'indicative', 'present', { number: 'singular' })).toEqual(['I am', 'you are', 'he is']);
    expect(texts('be', 'indicative', 'past', { number: 'plural' })).toEqual(['we were', 'you were', 'they were']);
    expect(texts('be', 'subjunctive', 'past', { person: 1, number: 'singular' })).toEqual(['I were']);
    expect(steps(one('be', 'subjunctive', 'past'))).toEqual(['en.cell.irrealis-were']);
    expect(texts('be', 'subjunctive', 'present', { person: 3, number: 'singular' })).toEqual(['he be']);
    expect(texts('walk', 'subjunctive', 'present', { person: 3, number: 'singular' })).toEqual(['he walk']);
    expect(steps(one('walk', 'subjunctive', 'past'))).toEqual(['en.end.irrealis-past', 'en.end.past-ed']);
    expect(steps(one('swim', 'subjunctive', 'past'))).toEqual(['en.end.irrealis-past', 'en.cell.past-listed']);
    expect(texts('have', 'indicative', 'present', { person: 3, number: 'singular' })).toEqual(['he has']);
    expect(texts('have', 'indicative', 'present', { person: 1, number: 'singular' })).toEqual(['I have']);
    expect(texts('be', 'participle', 'present')).toEqual(['being']);
    expect(texts('be', 'participle', 'past')).toEqual(['been']);
    expect(texts('walk', 'indicative', 'present', { subject: '3sg.f' })).toEqual(['she walks']);
  });

  it('keeps two paradigms apart', () => {
    expect(all('hang', 'indicative', 'past').map(f => [f.text, f.variant.pattern])).toEqual([['he hung', 'hung'], ['he hanged', 'hanged']]);
    expect(texts('hang', 'indicative', 'present')).toEqual(['he hangs', 'he hangs']); // one per paradigm (design R3)
    expect(texts('hang', 'indicative', 'past', { classHint: 'regular' })).toEqual(['he hanged']);
    expect(texts('lie', 'participle', 'past')).toEqual(['lain', 'lied']);
    expect(texts('lie', 'participle', 'present')).toEqual(['lying', 'lying']);
  });

  it('names the regular forms in the lexicon step', () => {
    const analysis = conjugate(parseConjugationOptions({ language: 'en', infinitive: 'bet', mood: 'participle', tense: 'past' })).analysis;
    expect(analysis.steps![0]).toMatchObject({ rule: 'en.classify.lexicon', params: { past: 'bet / betted', participle: 'bet / betted', source: 'both' } });
    const thrive = conjugate(parseConjugationOptions({ language: 'en', infinitive: 'thrive', mood: 'participle', tense: 'past' })).analysis;
    expect(thrive.steps![0]!.params).toEqual({ past: 'thrived / throve', participle: 'thrived / thriven', source: 'both' });
  });
});

describe('English regular verbs outside the corpus (design §8b)', () => {
  it.each([
    ['walk', 'he walks', ['he walked'], ['walking']],
    ['stop', 'he stops', ['he stopped'], ['stopping']],
    ['hope', 'he hopes', ['he hoped'], ['hoping']],
    ['hop', 'he hops', ['he hopped'], ['hopping']],
    ['try', 'he tries', ['he tried'], ['trying']],
    ['panic', 'he panics', ['he panicked'], ['panicking']],
    ['picnic', 'he picnics', ['he picnicked'], ['picnicking']],
    ['travel', 'he travels', ['he travelled', 'he traveled'], ['travelling', 'traveling']],
    ['cancel', 'he cancels', ['he cancelled', 'he canceled'], ['cancelling', 'canceling']],
    ['label', 'he labels', ['he labelled', 'he labeled'], ['labelling', 'labeling']],
    ['model', 'he models', ['he modelled', 'he modeled'], ['modelling', 'modeling']],
    ['equal', 'he equals', ['he equalled', 'he equaled'], ['equalling', 'equaling']],
    ['fuel', 'he fuels', ['he fuelled', 'he fueled'], ['fuelling', 'fueling']],
    ['dial', 'he dials', ['he dialled', 'he dialed'], ['dialling', 'dialing']],
    ['compel', 'he compels', ['he compelled'], ['compelling']],
    ['control', 'he controls', ['he controlled'], ['controlling']],
    ['patrol', 'he patrols', ['he patrolled'], ['patrolling']],
    ['excel', 'he excels', ['he excelled'], ['excelling']],
    ['prefer', 'he prefers', ['he preferred'], ['preferring']],
    ['occur', 'he occurs', ['he occurred'], ['occurring']],
    ['admit', 'he admits', ['he admitted'], ['admitting']],
    ['visit', 'he visits', ['he visited'], ['visiting']],
    ['benefit', 'he benefits', ['he benefited'], ['benefiting']],
    ['focus', 'he focuses', ['he focused'], ['focusing']],
    ['target', 'he targets', ['he targeted'], ['targeting']],
    ['combat', 'he combats', ['he combated'], ['combating']],
    ['enter', 'he enters', ['he entered'], ['entering']],
    ['conquer', 'he conquers', ['he conquered'], ['conquering']],
    ['profit', 'he profits', ['he profited'], ['profiting']],
    ['interpret', 'he interprets', ['he interpreted'], ['interpreting']],
    ['offer', 'he offers', ['he offered'], ['offering']],
    ['develop', 'he develops', ['he developed'], ['developing']],
    ['format', 'he formats', ['he formatted'], ['formatting']],
    ['handicap', 'he handicaps', ['he handicapped'], ['handicapping']],
    ['kidnap', 'he kidnaps', ['he kidnapped', 'he kidnaped'], ['kidnapping', 'kidnaping']],
    ['program', 'he programs', ['he programmed', 'he programed'], ['programming', 'programing']],
    ['worship', 'he worships', ['he worshipped', 'he worshiped'], ['worshipping', 'worshiping']],
    ['parallel', 'he parallels', ['he paralleled', 'he parallelled'], ['paralleling', 'parallelling']],
    ['quiz', 'he quizzes', ['he quizzed'], ['quizzing']],
    ['veto', 'he vetoes', ['he vetoed'], ['vetoing']],
    ['echo', 'he echoes', ['he echoed'], ['echoing']],
    ['die', 'he dies', ['he died'], ['dying']],
    ['tie', 'he ties', ['he tied'], ['tying']],
    ['dye', 'he dyes', ['he dyed'], ['dyeing']],
    ['hoe', 'he hoes', ['he hoed'], ['hoeing']],
    ['singe', 'he singes', ['he singed'], ['singeing']],
    ['agree', 'he agrees', ['he agreed'], ['agreeing']],
    ['argue', 'he argues', ['he argued'], ['arguing']],
    ['glue', 'he glues', ['he glued'], ['gluing']],
    ['queue', 'he queues', ['he queued'], ['queuing']],
    ['solo', 'he solos', ['he soloed'], ['soloing']],
    ['gas', 'he gases', ['he gassed'], ['gassing']],
    ['fulfil', 'he fulfils', ['he fulfilled'], ['fulfilling']],
    ['fulfill', 'he fulfills', ['he fulfilled'], ['fulfilling']],
  ])('%s', (verb, s3, past, ing) => {
    expect(texts(verb, 'indicative', 'present')).toEqual([s3]);
    expect(texts(verb, 'indicative', 'past')).toEqual(past);
    expect(texts(verb, 'participle', 'present')).toEqual(ing);
  });
});
