import { french } from './fr.ts';
import { dutch } from './nl.ts';
import { english } from './en.ts';
import { german } from './de.ts';
import { spanish } from './es.ts';
import { italian } from './it.ts';
import type { CorpusLanguage } from '../model.ts';

/** Languages with corpus data, in fixture and manifest order. A new language is one module plus one entry here. */
export const corpusLanguages: readonly CorpusLanguage[] = [french, dutch, english, german, spanish, italian];
