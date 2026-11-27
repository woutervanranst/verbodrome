import { createEngine } from '../../src/core/engine.js';
import type { Engine, TypedEngine } from '../../src/core/engine.js';
import { germanPack } from '../../src/languages/de/index.js';
import { toyPack } from '../toy/pack.js';

// An engine built from packs types its query by the languages it has.
const german = createEngine({ de: germanPack });
export const typed: TypedEngine<'de'> = german;
export const plain: Engine = german;
german.conjugate({ language: 'de', infinitive: 'machen', mood: 'indicative', tense: 'past', subject: '2.formal' });
// @ts-expect-error The German engine has no Dutch.
german.conjugate({ language: 'nl', infinitive: 'werken' });
// @ts-expect-error A tense German does not have.
german.conjugate({ language: 'de', infinitive: 'machen', mood: 'indicative', tense: 'simple_past' });
// @ts-expect-error A subject slot German does not have.
german.conjugate({ language: 'de', infinitive: 'machen', subject: '2sg.u' });
// A pack that is not registered (the toy) takes any query; it is validated at run time.
createEngine({ xx: toyPack }).conjugate({ language: 'xx', infinitive: 'placa', anything: true });
