/**
 * A formatter for the subset of ICU MessageFormat used by the explanation catalogs:
 * literal text, `{name}`, `{name, plural, =N {…} one {…} other {…}}` with `#`,
 * `{name, select, key {…} other {…}}`, nesting and ICU apostrophe escaping.
 * Anything else (`number`, `date`, `selectordinal`, plural offsets) is a SyntaxError.
 * The only platform API used is `Intl`.
 */

export type MessageArg = string | number;
export type PlaceholderKind = 'any' | 'number' | 'select';

type Node =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'arg'; readonly name: string }
  | { readonly type: 'hash' }
  | { readonly type: 'plural'; readonly name: string; readonly exact: ReadonlyMap<number, Branch>; readonly categories: ReadonlyMap<string, Branch>; readonly other: Branch; readonly inSourceOrder: readonly Branch[] }
  | { readonly type: 'select'; readonly name: string; readonly cases: ReadonlyMap<string, Branch>; readonly other: Branch; readonly inSourceOrder: readonly Branch[] };
type Branch = readonly Node[];

const PLURAL_CATEGORIES: ReadonlySet<string> = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const KIND_STRENGTH: Record<PlaceholderKind, number> = { any: 0, select: 1, number: 2 };

const parseCache = new Map<string, Branch>();

function parse(source: string): Branch {
  let tree = parseCache.get(source);
  if (!tree) {
    tree = new Parser(source).parseMessage();
    parseCache.set(source, tree);
  }
  return tree;
}

class Parser {
  private pos = 0;
  private readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  parseMessage(): Branch {
    const nodes = this.parseNodes(false, false);
    if (this.pos < this.src.length) this.fail('Unmatched "}"');
    return nodes;
  }

  private fail(message: string, at = this.pos): never {
    throw new SyntaxError(`Invalid message: ${message} at offset ${at}`);
  }

  /** Reads literal text and placeholders up to an unquoted `}` (left unconsumed) or the end of the source. */
  private parseNodes(nested: boolean, inPlural: boolean): Branch {
    const nodes: Node[] = [];
    let text = '';
    const flush = (): void => {
      if (text) nodes.push({ type: 'text', value: text });
      text = '';
    };
    while (this.pos < this.src.length) {
      const ch = this.src.charAt(this.pos);
      if (ch === '}') break;
      if (ch === '{') {
        flush();
        nodes.push(this.parseArgument(inPlural));
      } else if (ch === '#' && inPlural) {
        flush();
        nodes.push({ type: 'hash' });
        this.pos++;
      } else if (ch === "'") {
        text += this.parseApostrophe(inPlural);
      } else {
        text += ch;
        this.pos++;
      }
    }
    if (nested && this.pos >= this.src.length) this.fail('Unclosed "{"');
    flush();
    return nodes;
  }

  /** `''` is an apostrophe; `'` before `{`, `}` (or `#` in a plural) quotes up to the next single `'`; any other `'` is literal. */
  private parseApostrophe(inPlural: boolean): string {
    const next = this.src.charAt(this.pos + 1);
    if (next === "'") {
      this.pos += 2;
      return "'";
    }
    if (next !== '{' && next !== '}' && !(inPlural && next === '#')) {
      this.pos++;
      return "'";
    }
    const opened = this.pos;
    this.pos++;
    let quoted = '';
    let closed = false;
    while (this.pos < this.src.length) {
      const ch = this.src.charAt(this.pos);
      if (ch === "'") {
        if (this.src.charAt(this.pos + 1) === "'") {
          quoted += "'";
          this.pos += 2;
          continue;
        }
        this.pos++;
        closed = true;
        break;
      }
      quoted += ch;
      this.pos++;
    }
    if (!closed) this.fail("Unterminated quote; write '' for a literal apostrophe before a brace", opened);
    return quoted;
  }

  private skipSpace(): void {
    while (this.pos < this.src.length && /\s/u.test(this.src.charAt(this.pos))) this.pos++;
  }

  private token(what: string): string {
    const start = this.pos;
    while (this.pos < this.src.length && !/[\s{},]/u.test(this.src.charAt(this.pos))) this.pos++;
    if (this.pos === start) this.fail(`Expected ${what}`);
    return this.src.slice(start, this.pos);
  }

  private expect(ch: string, what = `"${ch}"`): void {
    if (this.src.charAt(this.pos) !== ch) this.fail(`Expected ${what}`);
    this.pos++;
  }

  private parseArgument(inPlural: boolean): Node {
    this.expect('{');
    this.skipSpace();
    const name = this.token('an argument name');
    this.skipSpace();
    if (this.src.charAt(this.pos) === '}') {
      this.pos++;
      return { type: 'arg', name };
    }
    this.expect(',', '"," or "}"');
    this.skipSpace();
    const typeAt = this.pos;
    const type = this.token('an argument type');
    if (type !== 'plural' && type !== 'select') this.fail(`Unsupported argument type "${type}"`, typeAt);
    this.skipSpace();
    this.expect(',');
    return type === 'plural' ? this.parsePlural(name) : this.parseSelect(name, inPlural);
  }

  /** Reads `key {body}` pairs up to the closing `}` of the argument. */
  private parseBranches(parseKey: (key: string, at: number) => void, bodyInPlural: boolean, setBranch: (key: string, body: Branch, at: number) => void): void {
    for (;;) {
      this.skipSpace();
      if (this.src.charAt(this.pos) === '}') {
        this.pos++;
        return;
      }
      const keyAt = this.pos;
      const key = this.token('a branch key');
      parseKey(key, keyAt);
      this.skipSpace();
      this.expect('{');
      const body = this.parseNodes(true, bodyInPlural);
      this.expect('}');
      setBranch(key, body, keyAt);
    }
  }

  private parsePlural(name: string): Node {
    const exact = new Map<number, Branch>();
    const categories = new Map<string, Branch>();
    const inSourceOrder: Branch[] = [];
    this.parseBranches((key, at) => {
      if (key.startsWith('offset:')) this.fail('Plural offsets are not supported', at);
      if (!PLURAL_CATEGORIES.has(key) && !/^=-?\d+(\.\d+)?$/u.test(key)) this.fail(`Invalid plural key "${key}"`, at);
    }, true, (key, body, at) => {
      inSourceOrder.push(body);
      if (key.startsWith('=')) {
        const value = Number(key.slice(1));
        if (exact.has(value)) this.fail(`Duplicate plural key "${key}"`, at);
        exact.set(value, body);
      } else {
        if (categories.has(key)) this.fail(`Duplicate plural key "${key}"`, at);
        categories.set(key, body);
      }
    });
    const other = categories.get('other');
    if (!other) this.fail(`Plural "${name}" requires an "other" branch`);
    categories.delete('other');
    return { type: 'plural', name, exact, categories, other, inSourceOrder };
  }

  private parseSelect(name: string, inPlural: boolean): Node {
    const cases = new Map<string, Branch>();
    const inSourceOrder: Branch[] = [];
    this.parseBranches(() => undefined, inPlural, (key, body, at) => {
      inSourceOrder.push(body);
      if (cases.has(key)) this.fail(`Duplicate select key "${key}"`, at);
      cases.set(key, body);
    });
    const other = cases.get('other');
    if (!other) this.fail(`Select "${name}" requires an "other" branch`);
    cases.delete('other');
    return { type: 'select', name, cases, other, inSourceOrder };
  }
}

function collectPlaceholders(nodes: Branch, found: Map<string, PlaceholderKind>): void {
  const note = (name: string, kind: PlaceholderKind): void => {
    const current = found.get(name);
    if (current === undefined || KIND_STRENGTH[kind] > KIND_STRENGTH[current]) found.set(name, kind);
  };
  for (const node of nodes) {
    if (node.type === 'arg') note(node.name, 'any');
    else if (node.type === 'plural') {
      note(node.name, 'number');
      for (const branch of node.inSourceOrder) collectPlaceholders(branch, found);
    } else if (node.type === 'select') {
      note(node.name, 'select');
      for (const branch of node.inSourceOrder) collectPlaceholders(branch, found);
    }
  }
}

/** Placeholder names, in order of first appearance, with the strongest kind the message uses each with. Throws SyntaxError with the offset on anything outside the subset. */
export function placeholders(source: string): ReadonlyMap<string, PlaceholderKind> {
  const found = new Map<string, PlaceholderKind>();
  collectPlaceholders(parse(source), found);
  return found;
}

const pluralRulesByLocale = new Map<string, Intl.PluralRules>();
const numberFormatByLocale = new Map<string, Intl.NumberFormat>();

function cached<T>(cache: Map<string, T>, locale: string, create: () => T): T {
  let value = cache.get(locale);
  if (!value) {
    value = create();
    cache.set(locale, value);
  }
  return value;
}

function numberFormat(locale: string): Intl.NumberFormat {
  return cached(numberFormatByLocale, locale, () => new Intl.NumberFormat(locale));
}

function render(nodes: Branch, args: Readonly<Record<string, MessageArg>>, locale: string, hash: string | undefined): string {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out += node.value;
        break;
      case 'hash':
        out += hash ?? '#';
        break;
      case 'arg': {
        const value = argument(args, node.name);
        out += typeof value === 'number' ? numberFormat(locale).format(value) : value;
        break;
      }
      case 'select': {
        const branch = node.cases.get(String(argument(args, node.name))) ?? node.other;
        out += render(branch, args, locale, hash);
        break;
      }
      case 'plural': {
        const value = argument(args, node.name);
        if (typeof value !== 'number') throw new RangeError(`Plural argument "${node.name}" must be a number, got ${typeof value}`);
        const branch = node.exact.get(value)
          ?? node.categories.get(cached(pluralRulesByLocale, locale, () => new Intl.PluralRules(locale)).select(value))
          ?? node.other;
        out += render(branch, args, locale, numberFormat(locale).format(value));
        break;
      }
    }
  }
  return out;
}

function argument(args: Readonly<Record<string, MessageArg>>, name: string): MessageArg {
  const value = Object.hasOwn(args, name) ? args[name] : undefined;
  if (value === undefined) throw new RangeError(`Missing argument "${name}"`);
  return value;
}

/**
 * Formats `source` with `args`; plural categories and number formatting (`#` and a number in a plain `{name}`) follow `locale`.
 * Quoting follows ICU: `''` is an apostrophe, and `'` directly before `{` or `}` (or `#` in a plural branch) opens a quoted
 * literal that must be closed by another `'`, so `'{x}'` is the text `{x}`. An unterminated quote is a SyntaxError:
 * write `l''{noun}`, not `l'{noun}`. Any other apostrophe (`'t kofschip`, `verb's`) is literal. Throws RangeError for a missing argument or a non-number plural argument. */
export function formatMessage(source: string, args: Readonly<Record<string, MessageArg>>, locale: string): string {
  return render(parse(source), args, locale, undefined);
}
