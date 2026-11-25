/**
 * The Dutch pack as it will be once the staged grammar serves it: the registered pack with the subject slots and the
 * staged engine. The registered pack keeps the legacy resolver until Dutch switches; the tests in this directory run the
 * staged grammar through this engine.
 */
import { createEngine } from '../../src/core/engine.js';
import type { LanguagePack } from '../../src/core/pack.js';
import { stagedEngine } from '../../src/core/staged.js';
import { locales } from '../../src/i18n/locales/index.js';
import { dutchSubjects, dutchSubjectsFor } from '../../src/languages/nl/catalogue.js';
import { dutchGrammar } from '../../src/languages/nl/grammar.js';
import { dutchPack } from '../../src/languages/nl/pack.js';

export const shadowPack: LanguagePack<'nl'> = {
  ...dutchPack,
  subjects: dutchSubjects,
  subjectsFor: dutchSubjectsFor,
  engine: query => stagedEngine(dutchGrammar, dutchPack.rendering, query),
};

export const shadowDutch = createEngine({ nl: shadowPack }, locales);
