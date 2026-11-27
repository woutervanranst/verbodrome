/**
 * Source errors in the English corpus (design §9.5, C1–C14), each against the dictionary page or the spelling rule that
 * gives the correct form. A region tag the page prints but neither dictionary marks is removed (controller ruling:
 * a form is US or GB only where a dictionary labels it so).
 */
import { startCorrection } from '../model.ts';
import type { CorpusCell, CorpusCorrection, CorpusFile } from '../model.ts';

const dfe = 'https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf';
const ldoce = (lemma: string): string => `https://www.ldoceonline.com/dictionary/${lemma}`;
const ahd = (lemma: string): string => `https://www.ahdictionary.com/word/search.html?q=${lemma}`;

/** The expected texts without the one alternate `form` (the last word of a text), recorded only when one was there. */
function drop(draft: ReturnType<typeof startCorrection>, form: string, reason: string, url: string): void {
  const kept = draft.expected.filter(text => text.split(' ').at(-1) !== form);
  if (kept.length === draft.expected.length) return;
  draft.expected = kept;
  draft.note(reason, url);
}

export function englishCorrection(file: CorpusFile, cell: CorpusCell, index: number): CorpusCorrection | null {
  const draft = startCorrection(file, cell, index);
  const verb = file.infinitive;
  if (verb === 'dig') {
    draft.change('A one-syllable verb ending in one vowel and one consonant doubles it before -ing: digging, not diging.',
      ldoce('dig'), text => text.replace(/\bdiging\b/gu, 'digging'));
  }
  if (verb === 'fly') {
    draft.change('After a consonant, y becomes i before -es: the 3rd person singular is flies, not flys.', dfe, text => text.replace(/\bflys\b/gu, 'flies'));
  }
  if (verb === 'teach') {
    draft.change('After ch the 3rd person singular ending -s is written -es: teaches, not teachs.', dfe, text => text.replace(/\bteachs\b/gu, 'teaches'));
  }
  if (verb === 'shake') {
    draft.change('The past of shake is shook (LDOCE, AHD); shaked is not a form of the verb.', ldoce('shake'), text => text.replace(/\bshaked\b/gu, 'shook'));
  }
  if (verb === 'strike') {
    drop(draft, 'striked', 'The past and past participle of strike are struck (LDOCE, AHD); striked is not a form of the verb.', ldoce('strike'));
    draft.change('Neither dictionary labels stricken American: AHD prints "struck or stricken" and LDOCE does not print it.',
      ahd('strike'), text => text.replace(/ \(US\)$/u, ''));
  }
  if (verb === 'shut') drop(draft, 'shutted', 'The past and past participle of shut are shut (LDOCE, AHD); shutted is not a form.', ldoce('shut'));
  if (verb === 'cast') drop(draft, 'casted', 'The past and past participle of cast are cast (LDOCE, AHD); casted is not a form.', ldoce('cast'));
  if (verb === 'spit') {
    drop(draft, 'spitted', 'Spitted is the past of the other verb spit (to put meat on a spit); the verb of this page has spat, or spit.', ldoce('spit'));
  }
  if (verb === 'slide') drop(draft, 'slidden', 'The past participle of slide is slid (LDOCE, AHD); slidden is not a form.', ldoce('slide'));
  if (verb === 'bend') drop(draft, 'bended', 'The past participle of bend is bent (LDOCE, AHD); bended survives only in fixed phrases.', ldoce('bend'));
  if (verb === 'bear') {
    drop(draft, 'born', 'AHD restricts born to passive constructions about birth; the active perfect of bear has borne only.', ahd('bear'));
  }
  if (verb === 'spin') drop(draft, 'span', 'The past of spin is spun: the LDOCE header and AHD print spun only.', ahd('spin'));
  if (verb === 'rid') {
    draft.change('Neither ridded nor rid is regional: AHD prints "rid or ridded" and LDOCE rid with ridded unlabelled.',
      ahd('rid'), text => text.replace(/ \((?:GB|US)\)$/u, ''));
  }
  if (verb === 'strive') {
    draft.change('Neither dictionary marks strove, striven or strived as British or American: LDOCE prints strove, striven unlabelled.',
      ldoce('strive'), text => text.replace(/ \((?:GB|US)\)$/u, ''));
  }
  return draft.finish();
}
