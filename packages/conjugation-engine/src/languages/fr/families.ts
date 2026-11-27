/**
 * The French verb families: one entry per non-productive conjugation model, with its selectors and, per paradigm, the
 * principal parts the formation rules derive every simple cell from (GD §4.2, §5). Parts are in traditional spelling and
 * relative to the infinitive minus its last `strip` letters.
 *
 * `flags.verified` names the Académie conjugation table a family agrees with (see `FamilyFlags`); a family without it
 * disagrees with its table or has no 9th-edition entry, and is listed with what the table prints in `docs/grammar/fr.md`.
 * `flags.article` names the Académie entry whose remark states the forms the verb lacks.
 *
 * Generated once from `models.ts` at commit 1e3c0a6 by the one-off `scripts/fr/bootstrap-families.ts` (deleted at the switch), and maintained by hand from
 * now on.
 */
import type { FamilyEntry } from './family.js';

export const frenchFamilies: readonly FamilyEntry[] = [
  {
    id: 'être', lemmas: ['être'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sui', set: 's', P2: 'ét', F: 'ser', PS: 'f', theme: 'u', PP: 'été', SJ1: 'soi', SJ2: 'soy' }, gaps: [], cells: { 'pres.2s': ['es'], 'pres.3s': ['est'], 'pres.1p': ['sommes'], 'pres.2p': ['êtes'], 'pres.3p': ['sont'], 'subj.1s': ['sois'], 'subj.2s': ['sois'], 'subj.3s': ['soit'], 'subj.1p': ['soyons'], 'subj.2p': ['soyez'] }, spellings: {} },
    ],
    flags: { invariableParticiple: true, imperativeFromSubjunctive: true, verified: { academie: 'A9E2986', date: '2026-11-25' } },
  },
  {
    id: 'avoir', lemmas: ['avoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P2: 'av', F: 'aur', PS: 'e', theme: 'u', PP: 'eu', SJ1: 'ai', SJ2: 'ay' }, gaps: [], cells: { 'pres.1s': ['ai'], 'pres.2s': ['as'], 'pres.3s': ['a'], 'pres.3p': ['ont'], 'subj.3s': ['ait'], 'subj.1p': ['ayons'], 'subj.2p': ['ayez'] }, spellings: {} },
    ],
    flags: { imperativeFromSubjunctive: true, presentParticipleFromSubjunctive: true, verified: { academie: 'A9A3461', date: '2026-11-25' } },
  },
  {
    id: 'aller', lemmas: ['aller'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vai', set: 's', P2: 'all', F: 'ir', PS: 'all', theme: 'a', PP: 'allé', SJ1: 'aill' }, gaps: [], cells: { 'pres.2s': ['vas'], 'pres.3s': ['va'], 'pres.3p': ['vont'] }, spellings: {} },
    ],
    flags: { verified: { academie: 'A9A1226', date: '2026-11-25' } },
  },
  {
    id: 'falloir', lemmas: ['falloir'], suffixes: [],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fau', set: 'x', P2: 'fall', F: 'faudr', PS: 'fall', theme: 'u', PP: 'fallu', SJ1: 'faill' }, gaps: ['ppres'], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, impersonal: 'singular', noImperative: true, verified: { academie: 'A9F0145', date: '2026-11-25' } },
  },
  {
    id: 'pleuvoir', lemmas: [], suffixes: ['pleuvoir'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'pleu', set: 'x', P2: 'pleuv', F: 'pleuvr', PS: 'pl', theme: 'u', PP: 'plu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, impersonal: 'figurativePlural', noImperative: true, verified: { academie: 'A9P2886', date: '2026-11-25' } },
  },
  {
    id: 'pouvoir', lemmas: ['pouvoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'peu', set: 'x', P2: 'pouv', P3: 'peuv', F: 'pourr', PS: 'p', theme: 'u', PP: 'pu', SJ1: 'puiss', SJ2: 'puiss' }, gaps: [], cells: { 'pres.1s': ['peux', 'puis'] }, spellings: {} },
    ],
    flags: { invariableParticiple: true, noImperative: true, verified: { academie: 'A9P3829', date: '2026-11-25' } },
  },
  {
    id: 'savoir', lemmas: ['savoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sai', set: 's', P2: 'sav', F: 'saur', PS: 's', theme: 'u', PP: 'su', SJ1: 'sach', SJ2: 'sach' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { imperativeFromSubjunctive: true, presentParticipleFromSubjunctive: true, verified: { academie: 'A9S0657', date: '2026-11-25' } },
  },
  {
    id: 'gésir', lemmas: ['gésir'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'gi', set: 's', P2: 'gis' }, gaps: ['subj.1s', 'subj.2s', 'subj.3s', 'subj.1p', 'subj.2p', 'subj.3p', 'imp.2s', 'imp.1p', 'imp.2p'], cells: {}, spellings: {} },
    ],
    flags: { compounds: 'none', circumflexBeforeT: true, article: 'A9G0655' },
  },
  {
    id: 'seoir', lemmas: ['seoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sied', set: 's', P2: 'sey', P3: 'sié', F: 'siér', PP: 'sis' }, gaps: [], cells: { ppres: ['séant', 'seyant'] }, spellings: {} },
    ],
    flags: { invariableParticiple: true, thirdPersonOnly: true, compounds: 'none', article: 'A9S1259' },
  },
  {
    id: 'messeoir', lemmas: ['messeoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'messied', set: 's', P2: 'messey', P3: 'messié', F: 'messiér', PP: 'messis' }, gaps: [], cells: { ppres: ['messéant', 'messeyant'] }, spellings: {} },
    ],
    flags: { invariableParticiple: true, thirdPersonOnly: true, compounds: 'none', article: 'A9M1868' },
  },
  {
    id: 'ouïr', lemmas: ['ouïr'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: 'ouïs', usage: 'standard', parts: { P1: 'ouï', set: 's', P2: 'ouïss', F: 'ouïr', PS: 'ou', theme: 'ï', PP: 'ouï' }, gaps: [], cells: {}, spellings: {} },
      { pattern: 'ois', usage: 'dated', parts: { P1: 'oi', set: 's', P2: 'oy', P3: 'oi', F: ['ouïr', 'orr', 'oir'], PS: 'ou', theme: 'ï', PP: 'ouï' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'choir', lemmas: ['choir'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: 'choirai', usage: 'dated', parts: { P1: 'choi', set: 's', P2: 'choy', P3: 'choi', F: 'choir', PS: 'ch', theme: 'u', PP: 'chu' }, gaps: ['impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'subj.1s', 'subj.2s', 'subj.3s', 'subj.1p', 'subj.2p', 'subj.3p', 'subjimpf.1s', 'subjimpf.2s', 'subjimpf.1p', 'subjimpf.2p', 'subjimpf.3p', 'imp.2s', 'imp.1p', 'imp.2p', 'ppres'], cells: {}, spellings: {} },
      { pattern: 'cherrai', usage: 'dated', parts: { P1: 'choi', set: 's', P2: 'choy', P3: 'choi', F: 'cherr', PS: 'ch', theme: 'u', PP: 'chu' }, gaps: ['impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'subj.1s', 'subj.2s', 'subj.3s', 'subj.1p', 'subj.2p', 'subj.3p', 'subjimpf.1s', 'subjimpf.2s', 'subjimpf.1p', 'subjimpf.2p', 'subjimpf.3p', 'imp.2s', 'imp.1p', 'imp.2p', 'ppres'], cells: {}, spellings: {} },
    ],
    flags: { article: 'A9C2105' },
  },
  {
    id: 'échoir', lemmas: [], suffixes: ['échoir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: 'échoit', usage: 'standard', parts: { P1: 'échoi', set: 's', P2: 'échoy', P3: 'échoi', F: 'échoir', PS: 'éch', theme: 'u', PP: 'échu' }, gaps: [], cells: { ppres: ['échéant'] }, spellings: {} },
      { pattern: 'échet', usage: 'standard', parts: { P1: 'éche', set: 's', P2: 'échoy', P3: 'éché', F: 'écherr', PS: 'éch', theme: 'u', PP: 'échu' }, gaps: [], cells: { ppres: ['échéant'] }, spellings: {} },
    ],
    flags: { thirdPersonOnly: true, article: 'A9E0216' },
  },
  {
    id: 'déchoir', lemmas: [], suffixes: ['déchoir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'déchoi', set: 's', P2: 'déchoy', P3: 'déchoi', F: ['déchoir', 'décherr'], PS: 'déch', theme: 'u', PP: 'déchu' }, gaps: ['impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'imp.2s', 'imp.1p', 'imp.2p', 'ppres'], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'croître', lemmas: ['croître'], suffixes: [],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'croî', set: 's', P2: 'croiss', F: 'croîtr', PS: 'cr', theme: 'u', PP: 'crû' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C5057', date: '2026-11-25' } },
  },
  {
    id: 'accroître', lemmas: [], suffixes: ['accroître', 'décroître', 'recroître'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'croi', set: 's', P2: 'croiss', F: 'croîtr', PS: 'cr', theme: 'u', PP: 'cru' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { circumflexBeforeT: true, verified: { academie: 'A9A0327', date: '2026-11-25' } },
  },
  {
    id: 'naître', lemmas: ['naître', 'renaître'], suffixes: [],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'nai', set: 's', P2: 'naiss', F: 'naîtr', PS: 'naqu', theme: 'i', PP: 'né' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { circumflexBeforeT: true, verified: { academie: 'A9N0027', date: '2026-11-25' } },
  },
  {
    id: 'paître', lemmas: ['paître'], suffixes: [],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'pai', set: 's', P2: 'paiss', F: 'paîtr', PP: 'pu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { compounds: 'nonFinite', circumflexBeforeT: true, article: 'A9P0092' },
  },
  {
    id: 'repaître', lemmas: [], suffixes: ['repaître'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'repai', set: 's', P2: 'repaiss', F: 'repaîtr', PS: 'rep', theme: 'u', PP: 'repu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { circumflexBeforeT: true, verified: { academie: 'A9R1811', date: '2026-11-25' } },
  },
  {
    id: 'connaître', lemmas: [], suffixes: ['aître'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ai', set: 's', P2: 'aiss', F: 'aîtr', PS: '', theme: 'u', PP: 'u' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { circumflexBeforeT: true, verified: { academie: 'A9C3636', date: '2026-11-25' } },
  },
  {
    id: 'mouvoir', lemmas: ['mouvoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'meu', set: 's', P2: 'mouv', P3: 'meuv', F: 'mouvr', PS: 'm', theme: 'u', PP: 'mû' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9M3065', date: '2026-11-25' } },
  },
  {
    id: 'émouvoir', lemmas: [], suffixes: ['émouvoir', 'promouvoir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'meu', set: 's', P2: 'mouv', P3: 'meuv', F: 'mouvr', PS: 'm', theme: 'u', PP: 'mu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9E1108', date: '2026-11-25' } },
  },
  {
    id: 'dire', lemmas: ['dire', 'redire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'di', set: 's', P2: 'dis', F: 'dir', PS: 'd', theme: 'i', PP: 'dit' }, gaps: [], cells: { 'pres.2p': ['dites'] }, spellings: {} },
    ],
    flags: { verified: { academie: 'A9D2606', date: '2026-11-25' } },
  },
  {
    id: 'interdire', lemmas: [], suffixes: ['dire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'di', set: 's', P2: 'dis', F: 'dir', PS: 'd', theme: 'i', PP: 'dit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9I1668', date: '2026-11-25' } },
  },
  {
    id: 'écrire', lemmas: [], suffixes: ['crire'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'cri', set: 's', P2: 'criv', F: 'crir', PS: 'criv', theme: 'i', PP: 'crit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9E0358', date: '2026-11-25' } },
  },
  {
    id: 'lire', lemmas: [], suffixes: ['lire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'li', set: 's', P2: 'lis', F: 'lir', PS: 'l', theme: 'u', PP: 'lu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9L0973', date: '2026-11-25' } },
  },
  {
    id: 'rire', lemmas: [], suffixes: ['rire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ri', set: 's', P2: 'ri', F: 'rir', PS: 'r', theme: 'i', PP: 'ri' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, verified: { academie: 'A9R2696', date: '2026-11-25' } },
  },
  {
    id: 'cuire', lemmas: [], suffixes: ['uire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ui', set: 's', P2: 'uis', F: 'uir', PS: 'uis', theme: 'i', PP: 'uit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C5209', date: '2026-11-25' } },
  },
  {
    id: 'confire', lemmas: [], suffixes: ['confire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fi', set: 's', P2: 'fis', F: 'fir', PS: 'f', theme: 'i', PP: 'fit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C3514', date: '2026-11-25' } },
  },
  {
    id: 'conclure', lemmas: [], suffixes: ['clure'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'clu', set: 's', P2: 'clu', F: 'clur', PS: 'cl', theme: 'u', PP: 'clu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C3406', date: '2026-11-25' } },
  },
  {
    id: 'plaire', lemmas: [], suffixes: ['plaire'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'plai', set: 's', P2: 'plais', F: 'plair', PS: 'pl', theme: 'u', PP: 'plu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, circumflexBeforeT: true, verified: { academie: 'A9P2680', date: '2026-11-25' } },
  },
  {
    id: 'faire', lemmas: [], suffixes: ['faire'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fai', set: 's', P2: 'fais', F: 'fer', PS: 'f', theme: 'i', PP: 'fait', SJ1: 'fass', SJ2: 'fass' }, gaps: [], cells: { 'pres.2p': ['faites'], 'pres.3p': ['font'] }, spellings: {} },
    ],
    flags: { verified: { academie: 'A9F0112', date: '2026-11-25' } },
  },
  {
    id: 'traire', lemmas: ['raire'], suffixes: ['traire'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'rai', set: 's', P2: 'ray', P3: 'rai', F: 'rair', PP: 'rait' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'résoudre', lemmas: [], suffixes: ['résoudre'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'résou', set: 's', P2: 'résolv', F: 'résoudr', PS: 'résol', theme: 'u', PP: 'résolu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9R2080', date: '2026-11-25' } },
  },
  {
    id: 'absoudre', lemmas: [], suffixes: ['soudre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sou', set: 's', P2: 'solv', F: 'soudr', PP: 'sous', PPF: 'sout' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { article: 'A9A0175' },
  },
  {
    id: 'coudre', lemmas: [], suffixes: ['coudre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'coud', set: 's', P2: 'cous', F: 'coudr', PS: 'cous', theme: 'i', PP: 'cousu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C4513', date: '2026-11-25' } },
  },
  {
    id: 'moudre', lemmas: [], suffixes: ['moudre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'moud', set: 's', P2: 'moul', F: 'moudr', PS: 'moul', theme: 'u', PP: 'moulu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9M2975', date: '2026-11-25' } },
  },
  {
    id: 'craindre', lemmas: [], suffixes: ['aindre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ain', set: 's', P2: 'aign', F: 'aindr', PS: 'aign', theme: 'i', PP: 'aint' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C4767', date: '2026-11-25' } },
  },
  {
    id: 'peindre', lemmas: [], suffixes: ['eindre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ein', set: 's', P2: 'eign', F: 'eindr', PS: 'eign', theme: 'i', PP: 'eint' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9P1224', date: '2026-11-25' } },
  },
  {
    id: 'joindre', lemmas: [], suffixes: ['oindre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'oin', set: 's', P2: 'oign', F: 'oindr', PS: 'oign', theme: 'i', PP: 'oint' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9J0231', date: '2026-11-25' } },
  },
  {
    id: 'prendre', lemmas: [], suffixes: ['prendre'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'prend', set: 's', P2: 'pren', P3: 'prenn', F: 'prendr', PS: 'pr', theme: 'i', PP: 'pris' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9P4070', date: '2026-11-25' } },
  },
  {
    id: 'battre', lemmas: [], suffixes: ['battre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'bat', set: 's', P2: 'batt', F: 'battr', PS: 'batt', theme: 'i', PP: 'battu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9B0652', date: '2026-11-25' } },
  },
  {
    id: 'mettre', lemmas: [], suffixes: ['mettre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'met', set: 's', P2: 'mett', F: 'mettr', PS: 'm', theme: 'i', PP: 'mis' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9M1992', date: '2026-11-25' } },
  },
  {
    id: 'vaincre', lemmas: [], suffixes: ['vaincre'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vainc', set: 's', P2: 'vainqu', F: 'vaincr', PS: 'vainqu', theme: 'i', PP: 'vaincu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V0065', date: '2026-11-25' } },
  },
  {
    id: 'vivre', lemmas: [], suffixes: ['vivre'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vi', set: 's', P2: 'viv', F: 'vivr', PS: 'véc', theme: 'u', PP: 'vécu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V1049', date: '2026-11-25' } },
  },
  {
    id: 'suivre', lemmas: [], suffixes: ['suivre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sui', set: 's', P2: 'suiv', F: 'suivr', PS: 'suiv', theme: 'i', PP: 'suivi' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9S3347', date: '2026-11-25' } },
  },
  {
    id: 'boire', lemmas: [], suffixes: ['boire'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'boi', set: 's', P2: 'buv', P3: 'boiv', F: 'boir', PS: 'b', theme: 'u', PP: 'bu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9B1462', date: '2026-11-25' } },
  },
  {
    id: 'croire', lemmas: [], suffixes: ['croire'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'croi', set: 's', P2: 'croy', P3: 'croi', F: 'croir', PS: 'cr', theme: 'u', PP: 'cru' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C5041', date: '2026-11-25' } },
  },
  {
    id: 'clore', lemmas: [], suffixes: ['clore'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'clo', set: 's', P2: 'clos', F: 'clor', PP: 'clos' }, gaps: ['pres.1p', 'pres.2p', 'impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'imp.1p', 'imp.2p'], cells: {}, spellings: {} },
    ],
    flags: { circumflexBeforeT: true, article: 'A9C2658' },
  },
  {
    // clore's forms; the Académie's table (A9E0262) prints « éclôt ou éclot ».
    id: 'éclore', lemmas: ['éclore'], suffixes: [],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'clo', set: 's', P2: 'clos', F: 'clor', PP: 'clos' }, gaps: ['pres.1p', 'pres.2p', 'impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'imp.1p', 'imp.2p'], cells: {}, spellings: { 'pres.3s': ['clot'] } },
    ],
    flags: { circumflexBeforeT: true, article: 'A9E0262' },
  },
  {
    id: 'acquérir', lemmas: [], suffixes: ['quérir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'quier', set: 's', P2: 'quér', P3: 'quièr', F: 'querr', PS: 'qu', theme: 'i', PP: 'quis' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9A0424', date: '2026-11-25' } },
  },
  {
    id: 'assaillir', lemmas: [], suffixes: ['assaillir', 'tressaillir', 'défaillir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'aill', set: 'e', P2: 'aill', F: 'aillir', PS: 'aill', theme: 'i', PP: 'ailli' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9A2802', date: '2026-11-25' } },
  },
  {
    id: 'faillir', lemmas: [], suffixes: ['faillir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: 'faillis', usage: 'standard', parts: { P1: 'failli', set: 's', P2: 'failliss', F: 'faillir', PS: 'faill', theme: 'i', PP: 'failli' }, gaps: [], cells: {}, spellings: {} },
      { pattern: 'faudrai', usage: 'standard', parts: { P1: 'failli', set: 's', P2: 'failliss', F: 'faudr', PS: 'faill', theme: 'i', PP: 'failli' }, gaps: [], cells: {}, spellings: {} },
      { pattern: 'faille', usage: 'standard', parts: { P1: 'failli', set: 's', P2: 'failliss', F: 'faudr', PS: 'faill', theme: 'i', PP: 'failli', SJ1: 'faill', SJ2: 'faill' }, gaps: [], cells: {}, spellings: {} },
      { pattern: 'faux', usage: 'dated', parts: { P1: 'fau', set: 'x', P2: 'faill', F: 'faillir', PS: 'faill', theme: 'i', PP: 'failli', SJ1: 'failliss', SJ2: 'failliss' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, noImperative: true },
  },
  {
    id: 'bouillir', lemmas: [], suffixes: ['bouillir'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'bou', set: 's', P2: 'bouill', F: 'bouillir', PS: 'bouill', theme: 'i', PP: 'bouilli' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'cueillir', lemmas: [], suffixes: ['cueillir'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'cueill', set: 'e', P2: 'cueill', F: 'cueiller', PS: 'cueill', theme: 'i', PP: 'cueilli' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C5197', date: '2026-11-25' } },
  },
  {
    id: 'courir', lemmas: [], suffixes: ['courir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'cour', set: 's', P2: 'cour', F: 'courr', PS: 'cour', theme: 'u', PP: 'couru' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C4628', date: '2026-11-25' } },
  },
  {
    id: 'mourir', lemmas: [], suffixes: ['mourir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'meur', set: 's', P2: 'mour', P3: 'meur', F: 'mourr', PS: 'mour', theme: 'u', PP: 'mort' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9M3019', date: '2026-11-25' } },
  },
  {
    id: 'ouvrir', lemmas: [], suffixes: ['ouvrir', 'ffrir'],
    except: [], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'r', set: 'e', P2: 'r', F: 'rir', PS: 'r', theme: 'i', PP: 'ert' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9O1025', date: '2026-11-25' } },
  },
  {
    id: 'dormir', lemmas: [], suffixes: ['dormir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'dor', set: 's', P2: 'dorm', F: 'dormir', PS: 'dorm', theme: 'i', PP: 'dormi' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, verified: { academie: 'A9D3072', date: '2026-11-25' } },
  },
  {
    id: 'endormir', lemmas: [], suffixes: ['ndormir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'dor', set: 's', P2: 'dorm', F: 'dormir', PS: 'dorm', theme: 'i', PP: 'dormi' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9E1483', date: '2026-11-25' } },
  },
  {
    id: 'partir', lemmas: [], suffixes: ['partir', 'sortir', 'sentir', 'mentir', 'repentir'],
    except: ['impartir', 'répartir', 'assortir', 'désassortir', 'rassortir', 'réassortir'], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: '', set: 's', P2: 't', F: 'tir', PS: 't', theme: 'i', PP: 'ti' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9P0787', date: '2026-11-25' } },
  },
  {
    id: 'servir', lemmas: [], suffixes: ['servir'],
    except: ['asservir'], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ser', set: 's', P2: 'serv', F: 'servir', PS: 'serv', theme: 'i', PP: 'servi' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9S1433', date: '2026-11-25' } },
  },
  {
    id: 'fuir', lemmas: [], suffixes: ['fuir'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fui', set: 's', P2: 'fuy', P3: 'fui', F: 'fuir', PS: 'fu', theme: 'i', PP: 'fui' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9F1825', date: '2026-11-25' } },
  },
  {
    id: 'haïr', lemmas: [], suffixes: ['haïr'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'hai', set: 's', P2: 'haïss', F: 'haïr', PS: 'ha', theme: 'ï', PP: 'haï' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9H0071', date: '2026-11-25' } },
  },
  {
    id: 'tenir', lemmas: [], suffixes: ['tenir'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'tien', set: 's', P2: 'ten', P3: 'tienn', F: 'tiendr', PS: 't', theme: 'in', PP: 'tenu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9T0701', date: '2026-11-25' } },
  },
  {
    id: 'venir', lemmas: [], suffixes: ['venir'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vien', set: 's', P2: 'ven', P3: 'vienn', F: 'viendr', PS: 'v', theme: 'in', PP: 'venu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V0378', date: '2026-11-25' } },
  },
  {
    id: 'vêtir', lemmas: [], suffixes: ['vêtir'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vêt', set: 's', P2: 'vêt', F: 'vêtir', PS: 'vêt', theme: 'i', PP: 'vêtu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V0637', date: '2026-11-25' } },
  },
  {
    id: 'asseoir', lemmas: [], suffixes: ['asseoir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: 'assois', usage: 'standard', parts: { P1: 'assoi', set: 's', P2: 'assoy', P3: 'assoi', F: 'assoir', PS: 'ass', theme: 'i', PP: 'assis' }, gaps: [], cells: {}, spellings: {} },
      { pattern: 'assieds', usage: 'standard', parts: { P1: 'assied', set: 's', P2: 'assey', F: 'assiér', PS: 'ass', theme: 'i', PP: 'assis' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'surseoir', lemmas: [], suffixes: ['surseoir'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'sursoi', set: 's', P2: 'sursoy', P3: 'sursoi', F: 'surseoir', PS: 'surs', theme: 'i', PP: 'sursis' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'voir', lemmas: [], suffixes: ['voir'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'voi', set: 's', P2: 'voy', P3: 'voi', F: 'verr', PS: 'v', theme: 'i', PP: 'vu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V1094', date: '2026-11-25' } },
  },
  {
    id: 'prévoir', lemmas: [], suffixes: ['prévoir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'prévoi', set: 's', P2: 'prévoy', P3: 'prévoi', F: 'prévoir', PS: 'prév', theme: 'i', PP: 'prévu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9P4272', date: '2026-11-25' } },
  },
  {
    id: 'pourvoir', lemmas: [], suffixes: ['pourvoir'],
    except: [], exceptEndings: [], strip: 8,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'pourvoi', set: 's', P2: 'pourvoy', P3: 'pourvoi', F: 'pourvoir', PS: 'pourv', theme: 'u', PP: 'pourvu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9P3802', date: '2026-11-25' } },
  },
  {
    id: 'recevoir', lemmas: [], suffixes: ['cevoir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'çoi', set: 's', P2: 'cev', P3: 'çoiv', F: 'cevr', PS: 'ç', theme: 'u', PP: 'çu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9R0843', date: '2026-11-25' } },
  },
  {
    id: 'devoir', lemmas: [], suffixes: ['devoir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'doi', set: 's', P2: 'dev', P3: 'doiv', F: 'devr', PS: 'd', theme: 'u', PP: 'dû' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9D2262', date: '2026-11-25' } },
  },
  {
    id: 'valoir', lemmas: [], suffixes: ['valoir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vau', set: 'x', P2: 'val', F: 'vaudr', PS: 'val', theme: 'u', PP: 'valu', SJ1: 'vaill' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9V0113', date: '2026-11-25' } },
  },
  {
    id: 'vouloir', lemmas: [], suffixes: ['vouloir'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'veu', set: 'x', P2: 'voul', P3: 'veul', F: 'voudr', PS: 'voul', theme: 'u', PP: 'voulu', SJ1: 'veuill', SJ2: ['voul', 'veuill'] }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { imperativeFromSubjunctive: true },
  },
  {
    id: 'envoyer', lemmas: [], suffixes: ['envoyer'],
    except: [], exceptEndings: [], strip: 7,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'envoi', set: 'e', P2: 'envoy', P3: 'envoi', F: 'enverr', PS: 'envoy', theme: 'a', PP: 'envoyé' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9E2066', date: '2026-11-25' } },
  },
  {
    id: 'interpeller', lemmas: ['interpeller'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'll', set: 'e', P2: 'll', F: 'ller', PS: 'll', theme: 'a', PP: 'llé' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9I1744', date: '2026-11-25' } },
  },
  {
    id: 'taire', lemmas: ['taire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ai', set: 's', P2: 'ais', F: 'air', PS: '', theme: 'u', PP: 'u' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9T0129', date: '2026-11-25' } },
  },
  {
    id: 'suffire', lemmas: ['suffire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fi', set: 's', P2: 'fis', F: 'fir', PS: 'f', theme: 'i', PP: 'fi' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, verified: { academie: 'A9S3299', date: '2026-11-25' } },
  },
  {
    id: 'circoncire', lemmas: ['circoncire'], suffixes: [],
    except: [], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'i', set: 's', P2: 'is', F: 'ir', PS: '', theme: 'i', PP: 'is' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9C2355', date: '2026-11-25' } },
  },
  {
    id: 'frire', lemmas: ['frire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ri', set: 's', F: 'rir', PP: 'rit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { article: 'A9F1701' },
  },
  {
    id: 'maudire', lemmas: ['maudire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'di', set: 's', P2: 'diss', F: 'dir', PS: 'd', theme: 'i', PP: 'dit' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9M1401', date: '2026-11-25' } },
  },
  {
    id: 'nuire', lemmas: [], suffixes: ['nuire', 'luire'],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ui', set: 's', P2: 'uis', F: 'uir', PS: 'uis', theme: 'i', PP: 'ui' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, verified: { academie: 'A9N0800', date: '2026-11-25' } },
  },
  {
    id: 'bruire', lemmas: ['bruire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ui', set: 's', P2: 'uiss', F: 'uir', PP: 'uit' }, gaps: ['pres.1p', 'pres.2p', 'impf.1s', 'impf.2s', 'impf.1p', 'impf.2p', 'subj.1s', 'subj.2s', 'subj.1p', 'subj.2p', 'imp.2s', 'imp.1p', 'imp.2p'], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, article: 'A9B2326' },
  },
  {
    id: 'braire', lemmas: ['braire'], suffixes: [],
    except: [], exceptEndings: [], strip: 4,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'ai', set: 's', P2: 'ay', P3: 'ai', F: 'air', PP: 'ait' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { invariableParticiple: true, thirdPersonOnly: true, article: 'A9B1988' },
  },
  {
    id: 'foutre', lemmas: [], suffixes: ['foutre'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'fou', set: 's', P2: 'fout', F: 'foutr', PS: 'fout', theme: 'i', PP: 'foutu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9F1462', date: '2026-11-25' } },
  },
  {
    id: 'inclure', lemmas: [], suffixes: ['inclure', 'occlure', 'reclure'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'clu', set: 's', P2: 'clu', F: 'clur', PS: 'cl', theme: 'u', PP: 'clus' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9I0690', date: '2026-11-25' } },
  },
  {
    id: 'enclore', lemmas: [], suffixes: ['enclore'],
    except: [], exceptEndings: [], strip: 5,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'clo', set: 's', P2: 'clos', F: 'clor', PP: 'clos' }, gaps: ['impf.1s', 'impf.2s', 'impf.3s', 'impf.1p', 'impf.2p', 'impf.3p', 'imp.1p', 'imp.2p'], cells: {}, spellings: { 'pres.3s': ['clot'] } },
    ],
    flags: { circumflexBeforeT: true, article: 'A9E1359' },
  },
  {
    id: 'prévaloir', lemmas: [], suffixes: ['prévaloir'],
    except: [], exceptEndings: [], strip: 6,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { P1: 'vau', set: 'x', P2: 'val', F: 'vaudr', PS: 'val', theme: 'u', PP: 'valu' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'ester', lemmas: ['accroire', 'assavoir', 'bienvenir', 'courre', 'ester', 'malfaire', 'méfaire', 'quérir', 'ravoir'], suffixes: [],
    except: [], exceptEndings: [], strip: 0,
    paradigms: [
      { pattern: null, usage: 'standard', parts: {}, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9A0324', date: '2026-11-25' } },
  },
  {
    id: 'férir', lemmas: ['férir'], suffixes: [],
    except: [], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { PP: 'ru' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { article: 'A9F0482' },
  },
  {
    id: 'issir', lemmas: ['issir'], suffixes: [],
    except: [], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { PP: 'su' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'rassir', lemmas: ['rassir'], suffixes: [],
    except: [], exceptEndings: [], strip: 2,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { PP: 'is' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: {},
  },
  {
    id: 'occire', lemmas: ['occire'], suffixes: [],
    except: [], exceptEndings: [], strip: 3,
    paradigms: [
      { pattern: null, usage: 'standard', parts: { PP: 'is' }, gaps: [], cells: {}, spellings: {} },
    ],
    flags: { verified: { academie: 'A9O0126', date: '2026-11-25' } },
  },
];
