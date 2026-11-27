/**
 * The regular ending sets (grammar design §4.6), person by person: singular 1-2-3, then plural 1-2-3. Accents are part
 * of the data. `ere` also serves the shortened infinitives (fare, dire, porre...), which are conjugated on their long stem.
 */
type Six = readonly [string, string, string, string, string, string];
type ByConjugation = Readonly<Record<'are' | 'ere' | 'ire', Six>>;

export const presentEndings: ByConjugation = {
  are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
  ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
  ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'],
};

export const imperfectEndings: ByConjugation = {
  are: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'],
  ere: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'],
  ire: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'],
};

/** The weak passato remoto; for -ere the -ei series (credei, credé, crederono). */
export const pastEndings: ByConjugation = {
  are: ['ai', 'asti', 'ò', 'ammo', 'aste', 'arono'],
  ere: ['ei', 'esti', 'é', 'emmo', 'este', 'erono'],
  ire: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'],
};

/** The -etti series of -ere verbs, in the persons stressed on the stem (io, lui/lei, loro). */
export const pastEttiEndings: Readonly<Record<'1sg' | '3sg' | '3pl', string>> = { '1sg': 'etti', '3sg': 'ette', '3pl': 'ettero' };

/** The strong passato remoto, added to the strong stem (pres-i, pres-e, pres-ero). */
export const pastStrongEndings: Readonly<Record<'1sg' | '3sg' | '3pl', string>> = { '1sg': 'i', '3sg': 'e', '3pl': 'ero' };

/** Future and conditional of a regular -are verb, which take -er- instead of -ar- (amerò). */
export const futureAreEndings: Six = ['erò', 'erai', 'erà', 'eremo', 'erete', 'eranno'];
export const conditionalAreEndings: Six = ['erei', 'eresti', 'erebbe', 'eremmo', 'ereste', 'erebbero'];

/** The personal endings of the future and conditional, added to a stem ending in r (crederò, vedrò, finirei). */
export const futureEndings: Six = ['ò', 'ai', 'à', 'emo', 'ete', 'anno'];
export const conditionalEndings: Six = ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'];

/** The present subjunctive; a lexical subjunctive stem of an -are verb takes the -a endings (vada, dia, stia). */
export const subjunctiveEndings: Readonly<Record<'are' | 'other', Six>> = {
  are: ['i', 'i', 'i', 'iamo', 'iate', 'ino'],
  other: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
};

export const subjunctiveImperfectEndings: ByConjugation = {
  are: ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero'],
  ere: ['essi', 'essi', 'esse', 'essimo', 'este', 'essero'],
  ire: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'],
};

/** The imperative of tu and voi. */
export const imperativeEndings: Readonly<Record<'are' | 'ere' | 'ire', { readonly '2sg': string; readonly '2pl': string }>> = {
  are: { '2sg': 'a', '2pl': 'ate' },
  ere: { '2sg': 'i', '2pl': 'ete' },
  ire: { '2sg': 'i', '2pl': 'ite' },
};

export const gerundEndings: Readonly<Record<'are' | 'ere' | 'ire', string>> = { are: 'ando', ere: 'endo', ire: 'endo' };
export const presentParticipleEndings: Readonly<Record<'are' | 'ere' | 'ire', string>> = { are: 'ante', ere: 'ente', ire: 'ente' };
/** The past participle without its agreement vowel (parlat-o). */
export const participleStems: Readonly<Record<'are' | 'ere' | 'ire', string>> = { are: 'at', ere: 'ut', ire: 'it' };

/** The final vowel of an agreeing past participle. */
export const agreementVowels = {
  masculine: { singular: 'o', plural: 'i' },
  feminine: { singular: 'a', plural: 'e' },
} as const;
