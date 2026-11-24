import { describe, expect, it } from 'vitest';
import { formatMessage, placeholders } from '../../src/i18n/format.js';

describe('formatMessage', () => {
  it.each([
    ['Drop {ending} → {stem}-', { ending: '-er', stem: 'plac' }, 'en', 'Drop -er → plac-'],
    ['{n, plural, one {# letter} other {# letters}}', { n: 1 }, 'en', '1 letter'],
    ['{n, plural, one {# letter} other {# letters}}', { n: 2 }, 'nl', '2 letters'],
    ['{aux, select, être {agrees} other {invariable}}', { aux: 'être' }, 'en', 'agrees'],
    ["It''s '{literal}' {x}", { x: 'ok' }, 'en', "It's {literal} ok"],
    ['{g, select, f {{n, plural, one {une} other {des}}} other {x}}', { g: 'f', n: 2 }, 'en', 'des'],
  ])('formats %s', (source, args, locale, expected) => expect(formatMessage(source, args, locale)).toBe(expected));

  it('lets an exact =N branch win over the plural category', () => {
    const source = '{n, plural, =0 {none} =1 {exactly one} one {one} other {many}}';
    expect(formatMessage(source, { n: 0 }, 'en')).toBe('none');
    expect(formatMessage(source, { n: 1 }, 'en')).toBe('exactly one');
    expect(formatMessage(source, { n: 5 }, 'en')).toBe('many');
  });

  it('picks categories from the locale plural rules', () => {
    const source = '{n, plural, zero {z} one {o} two {t} few {f} many {m} other {x}}';
    expect(formatMessage(source, { n: 0 }, 'en')).toBe('x');
    expect(formatMessage(source, { n: 0 }, 'fr')).toBe('o');
    expect(formatMessage(source, { n: 2 }, 'ar')).toBe('t');
    expect(formatMessage(source, { n: 3 }, 'ar')).toBe('f');
    expect(formatMessage(source, { n: 11 }, 'ar')).toBe('m');
  });

  it('formats # with the locale number format and treats it as a literal outside plurals', () => {
    expect(formatMessage('{n, plural, other {#}}', { n: 1234.5 }, 'en')).toBe('1,234.5');
    expect(formatMessage('{n, plural, other {#}}', { n: 1234.5 }, 'nl')).toBe('1.234,5');
    expect(formatMessage('item # of {s}', { s: 'x' }, 'en')).toBe('item # of x');
    expect(formatMessage("{n, plural, other {'#' is # }}", { n: 2 }, 'en')).toBe('# is 2 ');
  });

  it('refers # to the innermost plural, also through a select', () => {
    const source = '{a, plural, other {{s, select, other {{b, plural, other {# in}}}} # out}}';
    expect(formatMessage(source, { a: 1, s: 'x', b: 2 }, 'en')).toBe('2 in 1 out');
  });

  it('matches select keys as strings, stringifying numbers, and falls back to other', () => {
    const source = '{k, select, 1 {one} other {else}}';
    expect(formatMessage(source, { k: 1 }, 'en')).toBe('one');
    expect(formatMessage(source, { k: '1' }, 'en')).toBe('one');
    expect(formatMessage(source, { k: 'zz' }, 'en')).toBe('else');
  });

  it('ignores whitespace inside braces but preserves it in branch bodies', () => {
    expect(formatMessage('{ n , plural ,  one { # x }  other {# xs} }', { n: 1 }, 'en')).toBe(' 1 x ');
    expect(formatMessage('{ a }', { a: 'v' }, 'en')).toBe('v');
    expect(formatMessage('{s, select, other {  a  b }}', { s: 'q' }, 'en')).toBe('  a  b ');
  });

  it('handles apostrophes as ICU does', () => {
    expect(formatMessage("l'arbre", {}, 'fr')).toBe("l'arbre");
    expect(formatMessage("a '' b", {}, 'en')).toBe("a ' b");
    expect(formatMessage("'{a}' and '}' and '{it''s}'", {}, 'en')).toBe("{a} and } and {it's}");
    expect(formatMessage("'{unterminated", {}, 'en')).toBe('{unterminated');
  });

  it('passes literal text without placeholders through unchanged', () => {
    expect(formatMessage('', {}, 'en')).toBe('');
    expect(formatMessage('plain text', {}, 'en')).toBe('plain text');
  });

  it('formats a number argument in a simple placeholder', () => {
    expect(formatMessage('{n}', { n: 3 }, 'en')).toBe('3');
  });

  it('is repeatable for the same source (parse cache)', () => {
    const source = '{n, plural, one {# a} other {# b}}';
    expect(formatMessage(source, { n: 1 }, 'en')).toBe('1 a');
    expect(formatMessage(source, { n: 2 }, 'en')).toBe('2 b');
    expect(formatMessage(source, { n: 1 }, 'en')).toBe('1 a');
  });

  it('names a missing argument', () => {
    expect(() => formatMessage('{a}', {}, 'en')).toThrow(RangeError);
    expect(() => formatMessage('{a}', {}, 'en')).toThrow(/\ba\b/);
    expect(() => formatMessage('{x, select, other {{deep}}}', { x: 'q' }, 'en')).toThrow(/\bdeep\b/);
    expect(() => formatMessage('{n, plural, other {#}}', {}, 'en')).toThrow(/\bn\b/);
  });

  it('rejects a non-number plural argument, naming the placeholder', () => {
    expect(() => formatMessage('{n, plural, other {#}}', { n: 'two' }, 'en')).toThrow(RangeError);
    expect(() => formatMessage('{n, plural, other {#}}', { n: 'two' }, 'en')).toThrow(/\bn\b/);
  });
});

describe('placeholders', () => {
  it.each([
    '{a', '{a, number}', '{a, plural, one {x}}', '{a, select, x {y}}', 'x } y',
    '{}', '{a,}', '{a, date, short}', '{a, selectordinal, other {x}}',
    '{a, plural, offset:1 other {x}}', '{a, plural, bogus {x} other {y}}', '{a, plural, one {x} one {y} other {z}}',
    '{a, select, other {x} other {y}}', '{a, plural, other x}', '{a, plural, other {x}', '{a, select, other {{b}}',
  ])('rejects %s', source => expect(() => placeholders(source)).toThrow(SyntaxError));

  it('reports the character offset in the error message', () => {
    expect(() => placeholders('ab } y')).toThrow(/offset 3\b/);
    expect(() => placeholders('{a')).toThrow(/offset 2\b/);
  });

  it('reports placeholder kinds', () =>
    expect([...placeholders('{a} {n, plural, other {#}} {s, select, other {{b}}}')])
      .toEqual([['a', 'any'], ['n', 'number'], ['s', 'select'], ['b', 'any']]));

  it('reports each name once, in first-appearance order, with the strongest kind', () => {
    expect([...placeholders('{n} {s, select, other {x}} {s} {n, plural, other {#}} {s, select, other {y}} {n}')])
      .toEqual([['n', 'number'], ['s', 'select']]);
    expect([...placeholders('{x} {x, select, other {z}}')]).toEqual([['x', 'select']]);
  });

  it('is empty for plain text', () => expect(placeholders('just text').size).toBe(0));
});
