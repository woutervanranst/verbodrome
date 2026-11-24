/**
 * The gate every language pack passes: each rule it declares has a message in every locale and a citation, and each
 * message is well formed. A language registers its pack in `src/languages/index.ts` and its messages in
 * `src/i18n/locales/<locale>/index.ts`; this test then checks it with no further change.
 */
import { describe, expect, it } from 'vitest';
import type { LanguagePack } from '../../src/core/pack.js';
import type { Citation } from '../../src/core/sources.js';
import type { Catalog } from '../../src/i18n/catalog.js';
import { formatMessage, placeholders } from '../../src/i18n/format.js';
import type { MessageArg } from '../../src/i18n/format.js';
import { locales } from '../../src/i18n/locales/index.js';
import { packs } from '../../src/languages/index.js';
import { en as toyEn, nl as toyNl } from '../toy/messages.js';
import { toyPack } from '../toy/pack.js';

type Catalogs = Readonly<Record<string, Catalog>>;

/** The default locales with the toy's messages merged in, the way a test engine for the toy is built. */
const toyCatalogs = { en: { ...locales.en, ...toyEn }, nl: { ...locales.nl, ...toyNl } };

const subjects: readonly { readonly pack: LanguagePack; readonly catalogs: Catalogs }[] = [
  ...Object.values(packs).map(pack => ({ pack, catalogs: locales as Catalogs })),
  { pack: toyPack, catalogs: toyCatalogs },
];

const apostropheBeforePlaceholder = /(?<!')(?:'')*'\{[A-Za-z_]\w*\}/u;
const literalPlaceholder = /\{[A-Za-z_]\w*\}/u;

/** What is wrong with one message of a rule, if anything. */
function messageProblems(source: string, params: Readonly<Record<string, string>>, format: typeof formatMessage): string[] {
  let found: ReadonlyMap<string, string>;
  try {
    found = placeholders(source);
  } catch (error) {
    return [`does not parse (${error instanceof Error ? error.message : String(error)})`];
  }
  const problems: string[] = [];
  const allowed = new Set([...Object.keys(params), 'before', 'after']);
  for (const [name, kind] of found) {
    if (!allowed.has(name)) problems.push(`uses {${name}}, which the rule does not declare`);
    else if (kind === 'number' && params[name] !== 'number') problems.push(`uses {${name}} as a number, but the rule declares it ${params[name] ?? 'as neither a param nor before/after'}`);
  }
  // An apostrophe directly before a placeholder opens a quoted literal: `l'{noun} et l'{other}` loses {noun}. Write `l''{noun}`.
  const args: Record<string, MessageArg> = Object.fromEntries([...found].map(([name, kind]) => [name, kind === 'number' ? 1 : 'x']));
  let rendered: string;
  try {
    rendered = format(source, args, 'en');
  } catch (error) {
    return [...problems, `cannot be formatted (${error instanceof Error ? error.message : String(error)})`];
  }
  if (apostropheBeforePlaceholder.test(source) || literalPlaceholder.test(rendered)) {
    problems.push('has an apostrophe directly before a placeholder, which quotes it (write two apostrophes)');
  }
  return problems;
}

/** Everything the completeness gate finds wrong with a pack and its catalogs; `[]` for a pack without rules. */
function problemsWith(pack: LanguagePack, catalogs: Catalogs, format: typeof formatMessage = formatMessage): string[] {
  const problems: string[] = [];
  const keySets = Object.entries(catalogs).map(([locale, catalog]) => [locale, new Set(Object.keys(catalog))] as const);
  for (const [locale, keys] of keySets) {
    for (const [other, otherKeys] of keySets) {
      for (const key of keys) if (!otherKeys.has(key)) problems.push(`${key} is in ${locale} but not in ${other}`);
    }
  }
  for (const [id, work] of Object.entries(pack.works ?? {})) {
    if (work.id !== id) problems.push(`work ${id} has the id ${work.id}`);
    if (work.url !== undefined && !work.url.startsWith('https://')) problems.push(`work ${id} has a url that is not https`);
  }
  if (!pack.rules) return problems;
  for (const [id, rule] of Object.entries(pack.rules)) {
    for (const reserved of ['before', 'after']) {
      if (Object.hasOwn(rule.params, reserved)) problems.push(`${id} declares a param named ${reserved}, which every message already has`);
    }
    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (!Object.hasOwn(catalog, id)) problems.push(`${id} has no ${locale} message`);
      else problems.push(...messageProblems(catalog[id]!, rule.params, format).map(problem => `${id} (${locale}) ${problem}`));
    }
    const cited = pack.citations !== undefined && Object.hasOwn(pack.citations, id) ? pack.citations[id]! : [];
    const citations: readonly Citation[] = Array.isArray(cited) ? cited : [cited as Citation];
    if (!citations.length) problems.push(`${id} has no citation`);
    for (const citation of citations) {
      if (!Object.hasOwn(pack.works ?? {}, citation.work)) problems.push(`${id} cites the work ${citation.work}, which the pack does not list`);
      if (citation.url !== undefined && !citation.url.startsWith('https://')) problems.push(`${id} has a citation url that is not https`);
    }
  }
  return problems;
}

describe('rule catalogs are complete', () => {
  it('checks at least the toy pack', () => {
    expect(subjects.filter(({ pack }) => pack.rules !== undefined).map(({ pack }) => pack.language)).toContain('xx');
  });

  it.each(subjects.map(subject => [subject.pack.language, subject] as const))('%s: every rule has a message, a citation and well-formed text', (_, { pack, catalogs }) => {
    expect(problemsWith(pack, catalogs)).toEqual([]);
  });

  it('keeps the toy messages out of the core catalogs', () => {
    for (const [locale, messages] of [['en', toyEn], ['nl', toyNl]] as const) {
      expect(Object.keys(messages).filter(key => Object.hasOwn(locales[locale], key))).toEqual([]);
    }
  });

  it('finds what is missing or malformed', () => {
    const { en, nl } = toyCatalogs;
    const rules = toyPack.rules!;
    const check = (catalogs: Catalogs, pack: LanguagePack = toyPack) => problemsWith(pack, catalogs);
    const withEn = (messages: Record<string, string>): Catalogs => ({ en: { ...en, ...messages }, nl });

    expect(check(toyCatalogs)).toEqual([]);
    const { 'xx.stem.drop-a': _, ...withoutMessage } = en;
    expect(check({ en: withoutMessage, nl })).toContain('xx.stem.drop-a has no en message');
    expect(check({ en: {}, nl: {} }).length).toBeGreaterThan(Object.keys(rules).length);
    expect(check(withEn({ 'xx.stem.drop-a': 'Drop {unknown}' }))).toEqual(expect.arrayContaining([expect.stringContaining('{unknown}')]));
    expect(check(withEn({ 'xx.stem.drop-a': 'Drop {before' }))).toEqual(expect.arrayContaining([expect.stringContaining('does not parse')]));
    expect(check(withEn({ 'xx.end.present': '{ending, plural, one {# end} other {# ends}}' })))
      .toEqual(expect.arrayContaining([expect.stringContaining('as a number')]));
    expect(check(withEn({ 'xx.stem.drop-a': 'Drop l\'{before} et l\'{after}' }))).toEqual(expect.arrayContaining([expect.stringContaining('apostrophe')]));
    expect(check(withEn({ 'xx.stem.drop-a': 'Drop l\'\'{before} et l\'\'{after}' }))).toEqual([]);
    // A message that parses but cannot be formatted is a problem line, not an exception.
    const failing = (): string => { throw new RangeError('boom'); };
    expect(problemsWith(toyPack, toyCatalogs, failing)).toEqual(expect.arrayContaining([
      'xx.stem.drop-a (en) cannot be formatted (boom)', 'xx.stem.drop-a (nl) cannot be formatted (boom)',
    ]));
    expect(check({ en, nl: { ...nl, 'xx.extra': 'x' } })).toContain('xx.extra is in nl but not in en');
  });

  it('finds missing and malformed citations', () => {
    const { citations: _, ...uncited } = toyPack;
    expect(problemsWith(uncited, toyCatalogs)).toContain('xx.stem.drop-a has no citation');
    const wrongWork = { ...toyPack, citations: { ...toyPack.citations, 'xx.stem.drop-a': { work: 'nowhere', locator: '§1' } } };
    expect(problemsWith(wrongWork, toyCatalogs)).toContain('xx.stem.drop-a cites the work nowhere, which the pack does not list');
    const insecure = { ...toyPack, citations: { ...toyPack.citations, 'xx.stem.drop-a': { work: 'toy', locator: '§1', url: 'http://example.org' } } };
    expect(problemsWith(insecure as unknown as LanguagePack, toyCatalogs)).toContain('xx.stem.drop-a has a citation url that is not https');
    const insecureWork = { ...toyPack, works: { ...toyPack.works, toy: { id: 'toy', title: 'T', url: 'http://example.org' } } };
    expect(problemsWith(insecureWork as unknown as LanguagePack, toyCatalogs)).toContain('work toy has a url that is not https');
    const noMessages = problemsWith(toyPack, { en: locales.en, nl: locales.nl });
    expect(noMessages).toContain('xx.stem.drop-a has no en message');
  });
});
