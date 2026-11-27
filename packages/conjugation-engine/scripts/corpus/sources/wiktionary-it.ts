/**
 * The en.wiktionary second oracle for Italian (grammar design §8.4). Pins the page and module revisions, fetches each
 * pinned page through the MediaWiki API (`action=parse&oldid=`) one request at a time at least 20 seconds apart, parses
 * the first conjugation table of its Italian section and writes `tests/fixtures/wiktionary-it.json`.
 *
 *   node --experimental-strip-types scripts/corpus/sources/wiktionary-it.ts [--accept-modules] [--only title,title]
 *
 * Wiktionary text is CC BY-SA 4.0: the fixture records the licence, the attribution and each page's title, revision,
 * URL and history URL. The tables are another engine's output (Module:it-verb), compared through a corrections ledger.
 */
import { load } from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';

export const wiktionaryPins = {
  pages: [
    ['parlare', 95361365], ['arrivare', 89824946], ['cercare', 93064583], ['pagare', 92967541], ['cominciare', 90563718],
    ['viaggiare', 91807455], ['lasciare', 90560226], ['studiare', 89347598], ['inviare', 92164839], ['sciare', 92185768],
    ['tagliare', 91081103], ['sognare', 71374081], ['credere', 93068412], ['temere', 95591318], ['leggere', 90560159],
    ['scrivere', 90560296], ['prendere', 83543888], ['mettere', 92930158], ['chiudere', 80611967], ['rispondere', 88485717],
    ['rompere', 89607184], ['conoscere', 89542567], ['correre', 92710863], ['vedere', 89962297], ['vivere', 92965713],
    ['rimanere', 71257969], ['tenere', 90986711], ['valere', 91977481], ['parere', 91220143], ['morire', 90560311],
    ['udire', 83407020], ['scegliere', 88487566], ['sedere', 88180102], ['piacere', 90660573], ['tacere', 93763510],
    ['cuocere', 88492138], ['muovere', 93740130], ['apparire', 91401087], ['porre', 93588648], ['comporre', 90563367],
    ['condurre', 87608980], ['produrre', 93134352], ['trarre', 89195317], ['rifare', 90563591], ['predire', 83047409],
    ['nascere', 92729603], ['partire', 89923410], ['finire', 89794925], ['capire', 95433745], ['preferire', 71374093],
    ['dormire', 88348335], ['sentire', 92117564], ['seguire', 93623641], ['offrire', 88489221], ['cucire', 88481418],
    ['lavarsi', 77623237], ['vestirsi', 77623251], ['accorgersi', 91568522], ['piovere', 91071642], ['solere', 91569586],
    ['andare', 95823997], ['essere', 95493711], ['dovere', 95603598],
  ].map(([title, revid]) => ({ title: title as string, revid: revid as number })),
  modules: {
    'Module:it-verb': 88555991, 'Module:it-common': 79032535, 'Template:it-conj': 67345439, 'Module:romance utilities': 93472717,
    'Module:inflection utilities': 93431792,
  } as Readonly<Record<string, number>>,
} as const;

export interface WiktionaryForm { readonly text: string; readonly notes: readonly string[] }
export interface WiktionaryCell {
  /** `mood.tense` or `mood.tense.slot` (slot 1sg … 3pl; the imperative's 3sg and 3pl are Lei and Loro). */
  readonly key: string; readonly mood: string; readonly tense: string; readonly subject: string | null;
  readonly forms: readonly WiktionaryForm[]; readonly unavailable: boolean; readonly scope?: 'unmodelled'; readonly reason?: string;
}
export interface WiktionaryPage {
  readonly title: string; readonly revid: number; readonly url: string; readonly history: string;
  readonly auxiliaries: readonly { readonly lemma: string; readonly notes: readonly string[] }[]; readonly cells: readonly WiktionaryCell[];
}
export interface WiktionaryFixture {
  readonly licence: 'CC BY-SA 4.0'; readonly attribution: string; readonly retrieved: string;
  readonly modules: Readonly<Record<string, number>>; readonly pages: readonly WiktionaryPage[];
}

const slots = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const finiteTags: Readonly<Record<string, readonly [string, string]>> = {
  'pres|ind': ['indicative', 'present'], 'impf|ind': ['indicative', 'imperfect'], phis: ['indicative', 'simple_past'],
  fut: ['indicative', 'future'], cond: ['conditional', 'present'], 'pres|sub': ['subjunctive', 'present'],
  'impf|sub': ['subjunctive', 'imperfect'], imp: ['imperative', 'present'],
};
const nonFiniteTags: Readonly<Record<string, readonly [string, string]>> = {
  inf: ['infinitive', 'present'], ger: ['gerund', 'present'], 'pres|part': ['participle', 'present'], 'past|part': ['participle', 'past'],
};

/** A written form without the stress marks the table shows: accents stay only on a final vowel. */
function orthographic(text: string): string {
  const plain = text.normalize('NFC').trim().replace(/\s+/gu, ' ');
  return plain.split(' ').map(word => {
    const last = word.length - 1;
    return [...word].map((char, index) => index === last ? char : char.normalize('NFD').replace(/[̀́̈]/gu, '').normalize('NFC')).join('');
  }).join(' ');
}

/** The text of one alternative: its links' titles and the page's own form, space-separated. */
function alternativeText($: CheerioAPI, span: Cheerio<AnyNode>, title: string): string {
  const words: string[] = [];
  span.contents().each((_, node) => {
    const element = $(node);
    if (node.type === 'text') words.push(...element.text().trim().split(/\s+/u).filter(word => word && word !== ','));
    else if (element.is('a[title]')) words.push(element.attr('title')!.replace(/ \(page does not exist\)$/u, ''));
    else if (element.is('strong.selflink')) words.push(title);
    else if (!element.is('sup')) words.push(...element.text().trim().split(/\s+/u).filter(Boolean));
  });
  return orthographic(words.join(' '));
}

const notesOf = (span: Cheerio<AnyNode>): string[] => {
  const after = span.next('sup');
  return (after.length ? after.text() : span.find('sup').text()).split(/[,\s]+/u).filter(Boolean);
};

/** Parses the first conjugation table of the Italian section of a rendered page. */
export function parseWiktionaryItalian(html: string, title: string): Omit<WiktionaryPage, 'revid' | 'url' | 'history'> {
  const $ = load(html);
  const heading = $('h2#Italian').first();
  if (!heading.length) throw new Error(`${title}: no Italian section.`);
  const sectionStart = heading.closest('.mw-heading2').length ? heading.closest('.mw-heading2') : heading;
  const section = sectionStart.nextUntil('.mw-heading2');
  const table = section.find('table.roa-inflection-table').add(section.filter('table.roa-inflection-table')).first();
  if (!table.length) throw new Error(`${title}: no conjugation table.`);
  const footnotes = new Map<string, string>();
  table.closest('.NavContent').find('.roa-footnote-inner-div').first().find('sup').each((_, sup) => {
    const number = $(sup).text().trim();
    const note = $(sup.next as AnyNode).text?.() ?? '';
    footnotes.set(number, String(note).trim());
  });
  const cells = new Map<string, { mood: string; tense: string; subject: string | null; forms: WiktionaryForm[]; unavailable: boolean }>();
  const add = (mood: string, tense: string, subject: string | null, form: WiktionaryForm | null) => {
    const key = subject === null ? `${mood}.${tense}` : `${mood}.${tense}.${subject}`;
    const cell = cells.get(key) ?? { mood, tense, subject, forms: [], unavailable: false };
    if (form === null) cell.unavailable = true;
    else if (!cell.forms.some(known => known.text === form.text)) cell.forms.push(form);
    cells.set(key, cell);
  };
  table.find('span.form-of').each((_, node) => {
    const span = $(node);
    const tags = /form-of lang-it (\S+)-form-of/u.exec(span.attr('class') ?? '')?.[1];
    if (tags === undefined) return;
    const form = { text: alternativeText($, span, title), notes: notesOf(span).map(n => footnotes.get(n) ?? n) };
    if (Object.hasOwn(nonFiniteTags, tags)) {
      const [mood, tense] = nonFiniteTags[tags]!;
      add(mood, tense, null, form);
      return;
    }
    const match = /^([123])\|([sp])\|(.+)$/u.exec(tags);
    const mapped = match ? finiteTags[match[3]!] : undefined;
    if (!match || !mapped) throw new Error(`${title}: unknown tags ${tags}.`);
    add(mapped[0], mapped[1], `${match[1]}${match[2] === 's' ? 'sg' : 'pl'}`, form);
  });
  // The negative imperative's forms carry no tags: read its row (an empty first cell, then tu, Lei, noi, voi, Loro).
  const negative = table.find('th span[title="imperativo negativo"]').closest('tr');
  negative.children('td').each((index, td) => {
    if (index === 0) return;
    for (const node of $(td).children('span.Latn').toArray()) add('imperative', 'negative', slots[index]!, { text: alternativeText($, $(node), title), notes: notesOf($(node)) });
    if (/^[—-]$/u.test($(td).text().trim())) add('imperative', 'negative', slots[index]!, null);
  });
  const auxiliaries = table.find('th span[title="verbo ausiliare"]').closest('th').next('td').find('a[title]').toArray()
    .map(node => ({ lemma: $(node).attr('title')!, notes: notesOf($(node).closest('span')).map(n => footnotes.get(n) ?? n) }));
  const reflexive = title.endsWith('rsi');
  return {
    title,
    auxiliaries,
    cells: [...cells.entries()].map(([key, cell]) => ({
      key, ...cell,
      ...(reflexive && cell.mood === 'participle' ? { scope: 'unmodelled' as const, reason: 'participle-enclitic' } : {}),
    })),
  };
}

/** CC BY-SA 4.0 §3(a)(1)(B): the authors, and that the tables were modified. */
export const attribution = 'English Wiktionary contributors; adapted: the conjugation tables were parsed into cells and their stress marks removed';

// The fetching CLI: only when run directly.
async function main(): Promise<void> {
  const { writeFileSync } = await import('node:fs');
  const api = 'https://en.wiktionary.org/w/api.php';
  const userAgent = 'generic-oracle-client/1.0';
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let last = 0;
  async function get(params: Record<string, string>): Promise<unknown> {
    for (let attempt = 0; attempt < 5; attempt++) {
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
  const fixtureUrl = new URL('../../../tests/fixtures/wiktionary-it.json', import.meta.url);
  // Rewrites the fixture's header (licence and attribution) without fetching anything.
  if (process.argv.includes('--rewrite-attribution')) {
    const { readFileSync } = await import('node:fs');
    const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as WiktionaryFixture;
    writeFileSync(fixtureUrl, `${JSON.stringify({ ...fixture, attribution }, null, 1)}\n`);
    return;
  }
  const accept = process.argv.includes('--accept-modules');
  const onlyIndex = process.argv.indexOf('--only');
  const only = onlyIndex > 0 ? new Set(process.argv[onlyIndex + 1]!.split(',')) : null;
  const modules = await get({ action: 'query', prop: 'revisions', titles: Object.keys(wiktionaryPins.modules).join('|'), rvprop: 'ids' }) as
    { query: { pages: { title: string; revisions: { revid: number }[] }[] } };
  const current = Object.fromEntries(modules.query.pages.map(page => [page.title, page.revisions[0]!.revid]));
  const changed = Object.entries(wiktionaryPins.modules).filter(([name, revid]) => current[name] !== revid);
  if (changed.length && !accept) throw new Error(`Module revisions changed: ${changed.map(([name]) => `${name} ${current[name]}`).join(', ')}; compare and re-run with --accept-modules.`);
  const pages: WiktionaryPage[] = [];
  for (const { title, revid } of wiktionaryPins.pages) {
    if (only !== null && !only.has(title)) continue;
    const body = await get({ action: 'parse', oldid: String(revid), prop: 'text|revid' }) as { parse: { text: string; revid: number } };
    if (body.parse.revid !== revid) throw new Error(`${title}: got revision ${body.parse.revid}, pinned ${revid}.`);
    pages.push({
      ...parseWiktionaryItalian(body.parse.text, title), revid,
      url: `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${revid}`,
      history: `https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&action=history`,
    } as WiktionaryPage);
    process.stdout.write(`${title} `);
    const fixture: WiktionaryFixture = {
      licence: 'CC BY-SA 4.0', attribution, retrieved: new Date().toISOString().slice(0, 10),
      modules: Object.fromEntries(Object.keys(wiktionaryPins.modules).map(name => [name, current[name]!])), pages,
    };
    writeFileSync(fixtureUrl, `${JSON.stringify(fixture, null, 1)}\n`);
  }
  process.stdout.write('\ndone\n');
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
