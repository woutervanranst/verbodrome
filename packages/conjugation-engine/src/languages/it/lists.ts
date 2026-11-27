import type { Auxiliary } from './lexicon.js';

/**
 * Lexical side lists (grammar design §5.4): what the Vocabolario says about verbs that are otherwise regular. Each lemma
 * was checked against its Vocabolario header (`sources.ts`, `lexiconVerification`); derived verbs that inherit the
 * information from their family (riaprire from aprire, riuscire from uscire) are not repeated here.
 */

/** -ire verbs without -isc- (io dormo). */
export const nonIscVerbs: ReadonlySet<string> = new Set([
  'avvertire', 'convertire', 'divertire', 'invertire', 'pervertire', 'sovvertire', 'bollire', 'ribollire', 'cucire', 'scucire', 'ricucire',
  'dormire', 'fuggire', 'rifuggire', 'sfuggire', 'partire', 'pentire', 'seguire', 'conseguire', 'inseguire', 'perseguire', 'proseguire',
  'riempire', 'sentire', 'acconsentire', 'assentire', 'consentire', 'dissentire', 'risentire', 'servire', 'vestire', 'investire', 'rivestire', 'travestire',
]);

/** -ire verbs with -isc- (io finisco). */
export const iscVerbs: ReadonlySet<string> = new Set([
  'finire', 'capire', 'preferire', 'contribuire', 'definire', 'favorire', 'obbedire', 'inserire', 'guarire', 'agire', 'reagire', 'impazzire',
  'arrossire', 'impallidire', 'dimagrire', 'svanire', 'appassire', 'diminuire', 'colpire', 'pulire', 'spedire', 'sparire', 'smentire',
  'ardire', 'asservire', 'insignire', 'trasalire', 'tradire', 'unire', 'suggerire', 'sostituire', 'stabilire', 'fornire', 'punire', 'restituire',
  'istruire', 'chiarire', 'tossire', 'muggire', 'ruggire', 'starnutire', 'sdrucire', 'ripartire',
]);

/** -ire verbs with both paradigms, and which the Vocabolario prints first (io mento o mentisco). */
export const iscBothVerbs: Readonly<Record<string, 'isc' | 'plain'>> = {
  applaudire: 'plain', assorbire: 'isc', inghiottire: 'plain', mentire: 'plain', nutrire: 'plain', aborrire: 'isc', languire: 'isc',
  eseguire: 'isc', presentire: 'plain',
};

/** Verbs whose compound tenses take avere, where the Vocabolario says so and a base or model would suggest essere. */
export const avereVerbs: ReadonlySet<string> = new Set(['insistere', 'resistere', 'persistere', 'desistere', 'soprassedere', 'alludere', 'incidere', 'coincidere']);

/** Verbs whose compound tenses take essere. */
export const essereVerbs: ReadonlySet<string> = new Set([
  'arrivare', 'entrare', 'tornare', 'ritornare', 'restare', 'diventare', 'accadere', 'scadere', 'capitare', 'sembrare', 'costare', 'bastare',
  'dispiacere', 'occorrere', 'accorrere', 'risorgere', 'scappare', 'ingrassare', 'invecchiare', 'esistere', 'consistere', 'sussistere',
  'derivare', 'risultare', 'decrescere', 'sbocciare', 'tramontare', 'avvenire', 'divenire', 'intervenire', 'pervenire', 'provenire', 'svenire',
  'sopravvenire', 'sopravvivere', 'rifuggire', 'impazzire', 'arrossire', 'impallidire', 'dimagrire', 'svanire', 'appassire', 'sparire',
  'scomparire', 'riuscire', 'partire', 'fuggire', 'sfuggire', 'putrefare', 'sottostare', 'ammalare', 'coesistere', 'preesistere',
  'riandare', 'ristare',
]);

const tr = { lemma: 'avere', condition: 'transitive use, with a direct object' } as const;
const intr = { lemma: 'essere', condition: 'intransitive use' } as const;
const intrFirst = { lemma: 'essere', condition: 'intransitive use' } as const;
const weather = [{ lemma: 'essere' }, { lemma: 'avere' }] as const;

/** Verbs with two auxiliaries, in the Vocabolario's order, each with when it applies. */
export const dualVerbs: Readonly<Record<string, readonly Auxiliary[]>> = {
  cominciare: [tr, intr], iniziare: [tr, intr], finire: [tr, intr], terminare: [tr, intr], continuare: [tr, intr], cambiare: [tr, intr],
  aumentare: [tr, intr], migliorare: [tr, intr], peggiorare: [tr, intr], bruciare: [tr, intr], affondare: [tr, intr], guarire: [tr, intr],
  diminuire: [tr, intr], seguire: [tr, intr], gelare: [intrFirst, tr], passare: [intrFirst, tr], risalire: [intrFirst, tr], mancare: [
    { lemma: 'essere', condition: 'to be lacking, to be missing' }, { lemma: 'avere', condition: 'to fail in something, to fall short' },
  ],
  servire: [{ lemma: 'avere', condition: 'most senses' }, { lemma: 'essere', condition: 'to be of use, to be needed' }],
  convenire: [{ lemma: 'essere', condition: 'to gather, to agree, to suit' }, { lemma: 'avere', condition: 'to admit, to concede' }],
  saltare: [{ lemma: 'avere', condition: 'the jump itself' }, { lemma: 'essere', condition: 'jumping onto, off or into a place' }],
  volare: [{ lemma: 'avere', condition: 'the usual auxiliary' }, { lemma: 'essere', condition: 'with a place flown to or from' }],
  atterrare: [{ lemma: 'avere' }, { lemma: 'essere' }],
  emigrare: [{ lemma: 'essere', condition: 'the usual auxiliary' }, { lemma: 'avere', condition: 'when no destination is named' }],
  durare: [{ lemma: 'essere' }, { lemma: 'avere' }],
  avanzare: [{ lemma: 'avere' }, { lemma: 'essere' }],
  convivere: [{ lemma: 'avere', condition: 'the usual auxiliary' }, { lemma: 'essere', condition: 'rarely' }],
  ricorrere: [{ lemma: 'essere', condition: 'the usual auxiliary' }, { lemma: 'avere', condition: 'rarely' }],
  nevicare: weather, grandinare: weather, piovigginare: weather,
  trasalire: [{ lemma: 'avere' }, { lemma: 'essere' }], appartenere: [{ lemma: 'essere' }, { lemma: 'avere' }],
  equivalere: [{ lemma: 'avere' }, { lemma: 'essere' }], eccellere: [{ lemma: 'essere' }, { lemma: 'avere' }],
};

/** -iare verbs whose i is stressed (io invìo), so it is kept before the i of an ending. */
export const stressedIVerbs: ReadonlySet<string> = new Set([
  'inviare', 'rinviare', 'avviare', 'riavviare', 'deviare', 'sviare', 'traviare', 'fuorviare', 'ovviare', 'obliare', 'spiare', 'espiare',
  'desiare', 'ravviare', 'disviare', 'sciare',
]);

/** Verbs whose stem-final c stays soft before a and o, written ci (io cucio). */
export const palatalVerbs: ReadonlySet<string> = new Set(['cucire', 'scucire', 'ricucire']);

/** Weather verbs used only in the third person (piovere is in the lexicon). */
export const impersonalVerbs: ReadonlySet<string> = new Set(['nevicare', 'grandinare', 'piovigginare']);
