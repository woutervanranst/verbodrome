/**
 * The en.wiktionary second oracle for Latin (grammar design §8.4). Pins the page and module revisions, fetches each
 * pinned page through the MediaWiki API (`action=parse&oldid=`) one request at a time at least 20 seconds apart,
 * honouring Retry-After and maxlag, keeps the raw responses in a cache outside the repository, and parses the Latin
 * conjugation table of each page into `tests/fixtures/wiktionary-la.json`.
 *
 *   node --experimental-strip-types scripts/corpus/sources/wiktionary-la.ts --cache <dir> [--accept-modules]
 *
 * Wiktionary text is CC BY-SA 4.0: the fixture records the licence, the attribution and each page's title, revision,
 * URL and history URL. The tables are another engine's output (Module:la-verb), compared through a corrections ledger.
 */
import { load } from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Agreement, Case, Mood, Tense, Voice } from '../../../src/types.js';
import { corpusCell, normalizeText } from '../model.ts';
import type { CorpusCell } from '../model.ts';

const page = (title: string, lemma: string, revid: number): { readonly title: string; readonly lemma: string; readonly revid: number } => ({ title, lemma, revid });

export const wiktionaryPins = {
  pages: [
    page('laudo', 'laudō', 91253289), page('voco', 'vocō', 92157931), page('do', 'dō', 95738857), page('sto', 'stō', 95667056),
    page('iuvo', 'iuvō', 95812981), page('lavo', 'lavō', 93022497), page('domo', 'domō', 93027338),
    page('habeo', 'habeō', 95435211), page('video', 'videō', 95651802), page('doceo', 'doceō', 92132826), page('teneo', 'teneō', 95487886),
    page('maneo', 'maneō', 92135207), page('moveo', 'moveō', 93757459), page('sedeo', 'sedeō', 95661542), page('iubeo', 'iubeō', 95373048),
    page('deleo', 'dēleō', 92898473),
    page('rego', 'regō', 95630481), page('duco', 'dūcō', 93525620), page('dico', 'dīcō', 93571430), page('mitto', 'mittō', 92143833),
    page('scribo', 'scrībō', 93430203), page('ago', 'agō', 95833994), page('lego', 'legō', 95663605), page('vinco', 'vincō', 93022134),
    page('curro', 'currō', 92497249), page('cado', 'cadō', 93529776), page('pello', 'pellō', 95116778), page('pono', 'pōnō', 95558372),
    page('peto', 'petō', 95747588), page('tollo', 'tollō', 92694110),
    page('facio', 'faciō', 95536661), page('fugio', 'fugiō', 95807224), page('iacio', 'iaciō', 92164638), page('cupio', 'cupiō', 91189872),
    page('accipio', 'accipiō', 90523009),
    page('venio', 'veniō', 95454082), page('sentio', 'sentiō', 91682652), page('aperio', 'aperiō', 92131087), page('scio', 'sciō', 93764232),
    page('reperio', 'reperiō', 95611116),
    page('conor', 'cōnor', 93741446), page('miror', 'mīror', 92504693), page('loquor', 'loquor', 91218125), page('utor', 'ūtor', 92157735),
    page('nascor', 'nāscor', 92691944), page('morior', 'morior', 95814849), page('gradior', 'gradior', 92533011),
    page('experior', 'experior', 93157442), page('fateor', 'fateor', 92133351),
    page('audeo', 'audeō', 93011657), page('gaudeo', 'gaudeō', 92133693),
    page('edo', 'edō', 95827258), page('prosum', 'prōsum', 95315740), page('absum', 'absum', 90534852), page('adeo', 'adeō', 92771498),
    page('redeo', 'redeō', 90538779), page('aufero', 'auferō', 89352052), page('queo', 'queō', 90134691),
    page('coepi', 'coepī', 92552567), page('memini', 'meminī', 88835284), page('odi', 'ōdī', 93635383), page('oportet', 'oportet', 90779502),
    page('pluit', 'pluit', 95632538),
  ],
  /** Templates and modules render at fetch time, so their revisions are pinned with the pages (design §8.4). */
  modules: { 'Module:la-verb': 93344416, 'Module:la-verb/data': 87385254, 'Template:la-conj': 79053314 } as Readonly<Record<string, number>>,
} as const;

export interface WiktionaryPage {
  readonly title: string;
  readonly lemma: string;
  readonly revid: number;
  readonly url: string;
  readonly history: string;
  /** The infinitive the engine is asked for: the table's present active infinitive (its perfect one for coepī, meminī, ōdī). */
  readonly infinitive: string;
  /** The table's footnotes by number; a form's marks are written `[n]` after it in the cell's `original`. */
  readonly notes: Readonly<Record<string, string>>;
  readonly cells: readonly CorpusCell[];
}

export interface WiktionaryFixture {
  readonly licence: 'CC BY-SA 4.0';
  readonly licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/';
  readonly attribution: string;
  readonly retrieved: string;
  readonly modules: Readonly<Record<string, number>>;
  readonly pages: readonly WiktionaryPage[];
}

/** CC BY-SA 4.0 §3(a)(1)(B): the authors, and that the tables were modified. */
export const attribution = 'English Wiktionary contributors; adapted: the Latin conjugation tables were parsed into cells';

/** What the tables show that the engine does not model (design §8.4). */
export const wiktionaryUnmodelled: Readonly<Record<string, string>> = {
  'archaic-sigmatic': 'The Old Latin sigmatic future and aorist (faxō, faxim; A&G §183.3) are archaic forms outside the catalogue.',
  'not-in-catalogue': 'The future perfect infinitive (amātum fore) and the perfect potential infinitive (amātūrum fuisse) are periphrases outside the catalogue.',
};

const tenseCodes: Readonly<Record<string, Tense>> = {
  pres: 'present', impf: 'imperfect', fut: 'future', perf: 'perfect', plup: 'pluperfect', futp: 'future_perfect',
};
const tenseLabels: Readonly<Record<string, Tense>> = {
  present: 'present', imperfect: 'imperfect', future: 'future', perfect: 'perfect', pluperfect: 'pluperfect', 'future perfect': 'future_perfect',
};
const moodCodes: Readonly<Record<string, string>> = { indicative: 'ind', subjunctive: 'sub', imperative: 'imp' };
const slots = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
/** The imperative slots the catalogue has (A&G §163): the others are the table's structural dashes. */
const imperativeSlots: Readonly<Record<string, readonly number[]>> = { present: [1, 4], future: [1, 2, 4, 5] };
const masculine = (grammaticalCase: Case): Agreement => ({ gender: 'masculine', number: 'singular', case: grammaticalCase });

interface Form { readonly text: string; readonly tags: string | null; readonly notes: readonly string[] }

/** A cell's forms: its `span.form-of` (with their tag sets and footnote marks), or its plain text split at commas. */
function formsOf($: ReturnType<typeof load>, td: Cheerio<AnyNode>): Form[] {
  const spans = td.find('span.form-of');
  if (spans.length) {
    return spans.toArray().map(span => {
      const tags = ($(span).attr('class') ?? '').split(/\s+/u).find(token => token.endsWith('-form-of') && token !== 'form-of')?.slice(0, -'-form-of'.length) ?? null;
      const notes: string[] = [];
      for (let next = $(span).next(); next.length && next.is('sup.roa-red-superscript'); next = next.next()) notes.push(normalizeText(next.text()));
      return { text: normalizeText($(span).text()), tags, notes };
    });
  }
  const copy = td.clone();
  const notes = copy.find('sup').toArray().map(sup => normalizeText($(sup).text()));
  copy.find('sup').remove();
  const text = normalizeText(copy.text());
  if (text === '—' || text === '') return [];
  return text.split(/,\s*/u).map(item => ({ text: item, tags: null, notes }));
}

const originalOf = (forms: readonly Form[]): string =>
  forms.length ? forms.map(form => form.text + form.notes.map(note => `[${note}]`).join('')).join(', ') : '-';

/** The row label without its footnote marks. */
function labelOf(th: Cheerio<AnyNode>): string {
  const copy = th.clone();
  copy.find('sup').remove();
  return normalizeText(copy.text());
}

function check(lemma: string, form: Form, wanted: string): void {
  if (form.tags !== null && form.tags !== wanted) throw new Error(`${lemma}: ${form.text} is tagged ${form.tags}, its place says ${wanted}.`);
}

/** The conjugation `NavFrame` of `lemma`: its `NavHead` reads "Conjugation of" and names the lemma (design §8.4). */
function frameOf($: ReturnType<typeof load>, lemma: string): Cheerio<AnyNode> {
  const frame = $('div.NavFrame').filter((_, element) => {
    const head = $(element).children('.NavHead');
    return /Conjugation of/u.test(head.text()) && normalizeText(head.find('i.mention').first().text()) === lemma.normalize('NFC');
  }).first();
  if (!frame.length) throw new Error(`No Latin conjugation table for ${lemma}.`);
  return frame;
}

/** The footnotes printed after the table, by number. */
export function parseWiktionaryLatinNotes(html: string, lemma: string): Record<string, string> {
  const $ = load(html);
  const notes: Record<string, string> = {};
  const paragraph = frameOf($, lemma).next('p');
  const parts = (paragraph.html() ?? '').split(/<br\s*\/?>/u);
  for (const part of parts) {
    const fragment = load(`<p>${part}</p>`);
    const number = normalizeText(fragment('sup.roa-red-superscript').first().text());
    fragment('sup').remove();
    if (number) notes[number] = normalizeText(fragment.text());
  }
  return notes;
}

/** The cells of the Latin conjugation table of `lemma` on a rendered page, in the shared corpus cell shape (design §8.4). */
export function parseWiktionaryLatin(html: string, lemma: string): CorpusCell[] {
  const $ = load(html);
  const table = frameOf($, lemma).find('table.roa-inflection-table').first();
  const cells: CorpusCell[] = [];
  let block = '';
  let voice: Voice = 'active';
  for (const row of table.find('tr').toArray()) {
    const headers = $(row).children('th').toArray().map(th => $(th));
    const data = $(row).children('td').toArray().map(td => $(td));
    const first = headers[0] ? labelOf(headers[0]) : '';
    if (data.length === 0) {
      if (['indicative', 'subjunctive', 'imperative', 'non-finite forms', 'verbal nouns'].includes(first) && headers[0]!.attr('colspan') === '2') block = first;
      continue;
    }
    if (block in moodCodes) {
      const labels = headers.map(th => labelOf(th));
      if (labels[0] === 'active' || labels[0] === 'passive') voice = labels[0];
      const label = labels[labels.length - 1]!;
      if (headers.some(th => th.attr('colspan') === '12')) continue;
      if (data.length !== 6) throw new Error(`${lemma}: ${block} ${label} has ${data.length} cells.`);
      const mood = block as Mood;
      const sigmatic = /^sigmatic /u.test(label);
      const tense = sigmatic ? null : tenseLabels[label];
      if (!sigmatic && tense === undefined) throw new Error(`${lemma}: unknown ${block} row ${label}.`);
      data.forEach((td, index) => {
        const forms = formsOf($, td);
        if (mood === 'imperative' && !imperativeSlots[tense!]?.includes(index)) {
          if (forms.length) throw new Error(`${lemma}: a form in the structural imperative slot ${label} ${slots[index]}.`);
          return;
        }
        if (sigmatic) {
          if (forms.length) cells.push(corpusCell({ mood, tense: 'future', original: originalOf(forms), index, voice, subject: `${slots[index]}.m`, expected: forms.map(f => f.text), scope: 'unmodelled', reason: 'archaic-sigmatic', heading: label }));
          return;
        }
        const code = Object.entries(tenseCodes).find(([, name]) => name === tense)![0];
        for (const form of forms) check(lemma, form, `${slots[index]![0]}|${slots[index]![1]}|${code}|${voice === 'active' ? 'act' : 'pass'}|${moodCodes[mood]}`);
        cells.push(corpusCell({ mood, tense: tense!, original: originalOf(forms), index, voice, subject: `${slots[index]}.m`, expected: forms.map(f => f.text) }));
      });
      continue;
    }
    if (block === 'non-finite forms') {
      const label = first;
      if (data.length !== 4) throw new Error(`${lemma}: non-finite ${label} has ${data.length} cells.`);
      const [activeInfinitive, passiveInfinitive, activeParticiple, passiveParticiple] = data.map(td => formsOf($, td));
      if (label === 'future perfect' || label === 'perfect potential') {
        for (const [forms, column] of [[activeInfinitive, 'active'], [passiveInfinitive, 'passive']] as const) {
          if (forms!.length) cells.push(corpusCell({ mood: 'infinitive', tense: 'future', original: originalOf(forms!), index: 0, voice: column, expected: forms!.map(f => f.text), scope: 'unmodelled', reason: 'not-in-catalogue', heading: label }));
        }
        continue;
      }
      const tense = tenseLabels[label];
      if (tense === undefined || !['present', 'future', 'perfect'].includes(tense)) throw new Error(`${lemma}: unknown non-finite row ${label}.`);
      const code = Object.entries(tenseCodes).find(([, name]) => name === tense)![0];
      for (const [forms, column] of [[activeInfinitive!, 'active'], [passiveInfinitive!, 'passive']] as const) {
        for (const form of forms) check(lemma, form, `${code}|${column === 'active' ? 'act' : 'pass'}|inf`);
        // A participle with esse or fuisse is printed in the accusative (amātūrum esse); -um īrī and one word agree with nothing.
        const agrees = forms.some(form => form.text.includes(' ') && !/ īrī$/u.test(form.text));
        cells.push(corpusCell({ mood: 'infinitive', tense, original: originalOf(forms), index: 0, voice: column, agreement: agrees ? masculine('accusative') : null, expected: forms.map(f => f.text) }));
      }
      const participle = (forms: readonly Form[], participleTense: Tense, tags: string): void => {
        for (const form of forms) check(lemma, form, tags);
        cells.push(corpusCell({ mood: 'participle', tense: participleTense, original: originalOf(forms), index: 0, agreement: masculine('nominative'), expected: forms.map(f => f.text) }));
      };
      if (tense === 'present') {
        participle(activeParticiple!, 'present', 'pres|act|part');
        if (passiveParticiple!.length) throw new Error(`${lemma}: a present passive participle.`);
      } else if (tense === 'future') {
        participle(activeParticiple!, 'future', 'fut|act|part');
        participle(passiveParticiple!, 'gerundive', 'fut|pass|part');
      } else {
        // A deponent's perfect participle stands in the active column (tagged perf|act|part), any other's in the passive.
        if (activeParticiple!.length > 0) {
          participle(activeParticiple!, 'perfect', 'perf|act|part');
          if (passiveParticiple!.length) throw new Error(`${lemma}: two perfect participles.`);
        } else participle(passiveParticiple!, 'perfect', 'perf|pass|part');
      }
      continue;
    }
    if (block === 'verbal nouns') {
      if (data.length !== 6) throw new Error(`${lemma}: the verbal nouns have ${data.length} cells.`);
      const cases: Case[] = ['genitive', 'dative', 'accusative', 'ablative', 'accusative', 'ablative'];
      data.forEach((td, index) => {
        const forms = formsOf($, td);
        const gerund = index < 4;
        for (const form of forms) check(lemma, form, `${cases[index]!.slice(0, 3)}|${gerund ? 'ger' : 'sup'}`);
        const cell = corpusCell({
          mood: gerund ? 'gerund' : 'supine' as Mood, tense: 'present', original: originalOf(forms), index,
          agreement: gerund ? { gender: 'neuter', number: 'singular', case: cases[index]! } : masculine(cases[index]!), expected: forms.map(f => f.text),
        });
        // The supine is a mood without persons; the shared cell builder reads moods it does not know as finite.
        cells.push(gerund ? cell : { ...cell, target: { ...cell.target, person: null, number: null } });
      });
      continue;
    }
    throw new Error(`${lemma}: a row outside any block.`);
  }
  if (!cells.length) throw new Error(`No Latin conjugation table for ${lemma}.`);
  return cells;
}

/** The infinitive to ask the engine for: the present active infinitive, else the perfect one (coepisse). */
export function infinitiveOf(cells: readonly CorpusCell[], lemma: string): string {
  const of = (tense: Tense) => cells.find(cell => cell.target.mood === 'infinitive' && cell.target.tense === tense && cell.voice === 'active' && !cell.scope)?.expected[0];
  const infinitive = of('present') ?? of('perfect');
  if (!infinitive) throw new Error(`${lemma}: no infinitive.`);
  return infinitive;
}

async function main(): Promise<void> {
  const { existsSync, mkdirSync, readFileSync, writeFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const cacheIndex = process.argv.indexOf('--cache');
  if (cacheIndex < 0) throw new Error('Give --cache <dir>, a directory outside the repository for the raw responses.');
  const { resolve, sep } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const cache = resolve(process.argv[cacheIndex + 1]!);
  // The raw responses are another site's pages: they stay out of the repository (only the parsed fixture is committed).
  const repository = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
  if (cache === repository || cache.startsWith(repository + sep)) throw new Error(`The cache ${cache} lies inside the repository ${repository}; give a directory outside it.`);
  mkdirSync(cache, { recursive: true });
  const api = 'https://en.wiktionary.org/w/api.php';
  const userAgent = 'generic-oracle-client/1.0';
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let last = 0;
  async function get(params: Record<string, string>): Promise<unknown> {
    for (let attempt = 0; attempt < 6; attempt++) {
      const wait = Math.max(0, last + 20_000 - Date.now());
      if (wait) await pause(wait);
      last = Date.now();
      const response = await fetch(`${api}?${new URLSearchParams({ ...params, format: 'json', formatversion: '2', maxlag: '5' })}`, { headers: { 'User-Agent': userAgent } });
      if (response.status === 429 || response.status === 503) {
        await pause(1000 * Number(response.headers.get('retry-after') ?? '60'));
        continue;
      }
      const body = await response.json() as { error?: { code: string; info: string } };
      if (body.error?.code === 'maxlag') { await pause(1000 * Number(response.headers.get('retry-after') ?? '5')); continue; }
      if (body.error) throw new Error(`${body.error.code}: ${body.error.info}`);
      return body;
    }
    throw new Error('Too many retries.');
  }
  const modulesFile = join(cache, 'modules.json');
  if (!existsSync(modulesFile)) {
    const modules = await get({ action: 'query', prop: 'revisions', titles: Object.keys(wiktionaryPins.modules).join('|'), rvprop: 'ids|timestamp' });
    writeFileSync(modulesFile, JSON.stringify(modules));
  }
  const modules = JSON.parse(readFileSync(modulesFile, 'utf8')) as { query: { pages: { title: string; revisions: { revid: number }[] }[] } };
  const current = Object.fromEntries(modules.query.pages.map(page => [page.title, page.revisions[0]!.revid]));
  const changed = Object.entries(wiktionaryPins.modules).filter(([name, revid]) => current[name] !== revid);
  if (changed.length && !process.argv.includes('--accept-modules')) {
    throw new Error(`Module revisions changed: ${changed.map(([name]) => `${name} ${current[name]}`).join(', ')}; compare and re-run with --accept-modules.`);
  }
  const pages: WiktionaryPage[] = [];
  for (const { title, lemma, revid } of wiktionaryPins.pages) {
    const file = join(cache, `${title}-${revid}.json`);
    if (!existsSync(file)) {
      const fetched = await get({ action: 'parse', oldid: String(revid), prop: 'text|revid' }) as { parse: { revid: number } };
      writeFileSync(file, JSON.stringify(fetched));
      process.stdout.write(`${title} `);
    }
    const body = JSON.parse(readFileSync(file, 'utf8')) as { parse: { text: string; revid: number } };
    if (body.parse.revid !== revid) throw new Error(`${title}: got revision ${body.parse.revid}, pinned ${revid}.`);
    const cells = parseWiktionaryLatin(body.parse.text, lemma);
    pages.push({
      title, lemma, revid,
      url: `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${revid}`,
      history: `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&action=history`,
      infinitive: infinitiveOf(cells, lemma), notes: parseWiktionaryLatinNotes(body.parse.text, lemma), cells,
    });
  }
  const fixture: WiktionaryFixture = {
    licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', attribution,
    retrieved: new Date().toISOString().slice(0, 10), modules: Object.fromEntries(Object.keys(wiktionaryPins.modules).map(name => [name, current[name]!])), pages,
  };
  writeFileSync(new URL('../../../tests/fixtures/wiktionary-la.json', import.meta.url), `${JSON.stringify(fixture, null, 1)}\n`);
  process.stdout.write(`\n${pages.length} pages, ${pages.reduce((sum, page) => sum + page.cells.length, 0)} cells\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
