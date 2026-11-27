import { describe, expect, it } from 'vitest';
import { applyRemaps } from '../../scripts/corpus/model.ts';
import { english } from '../../scripts/corpus/languages/en.ts';
import { englishCellsPerFile, parseEnglish } from '../../scripts/corpus/parsers/en.ts';

const pronouns = ['I', 'you', 'he', 'we', 'you', 'they'];
const row = (pronoun: string, value: string) =>
  `<font color=#007F00 face=Courier><span class="normal">${pronoun}</span>&nbsp;&nbsp;</font><span class="normal">${value}</span><br>\n`;
const block = (label: string, value: string, first = false) =>
  `<td width="50%"> <p><b>${first ? '' : '<br> \n'}${label}</b><br>\n${pronouns.map(p => row(p, value)).join('')}</p></td>\n`;

/** A page in the corpus layout: 22 blocks, with the given rows replacing the defaults (value HTML between the spans). */
function page(rows: { perfect?: string; participle?: string } = {}): string {
  const indicative = (prefix = '') => [
    block('Present', `${prefix}x`, true), block('Perfect', rows.perfect ?? `${prefix}have arisen`), block('Past', 'arose'),
    block('Pluperfect', 'had arisen'), block('Future', 'will arise'), block('Future perfect', 'will have arisen'),
  ].join('');
  return `<html><body><h1>arise</h1>
<!-- #BeginEditable "Full_width_text" -->
<div class="column"><h3>Nominal Forms</h3><table><tr><td><p><b>Infinitive: </b>
<span class="normal">to arise</span><br><b>Participle:</b> <span class="irregular">${rows.participle ?? 'arisen'}</span><br>
<b>Gerund:</b> <span class="normal">arising</span><br></p></td></tr></table></div>
<div class="column"><h3>Indicative</h3><table><tr>${indicative()}</tr></table></div>
<div class="column"><h3>Subjunctive</h3><table><tr>${block('Present', 'arise', true)}${block('Present', 'have arisen')}${block('Imperfect', 'arose')}${block('Pluperfect', 'had arisen')}</tr></table></div>
<div class="column"><h3>Conditional</h3><table><tr>${block('Present', 'would arise', true)}${block('Perfect', 'would have arisen')}</tr></table></div>
<div class="column"><h3>Imperative</h3><p>
<span class="normal"> </span><br>
<font color=#007F00 face=Courier><span class="normal">you</span>&nbsp;&nbsp;</font><span class="normal">arise</span><br>
<span class="normal"> </span><br>
<font color=#007F00 face=Courier><span class="normal">we</span>&nbsp;&nbsp;&nbsp;</font><span class="normal">Let&#180;s arise</span><br>
<font color=#007F00 face=Courier><span class="normal">you</span>&nbsp;&nbsp;</font><span class="normal">arise</span><br>
<span class="normal"> </span><br>
</p></div>
<h2>Progressive (Continuous) Forms</h2>
<div class="column"><h3>Indicative</h3><table><tr>${indicative('am ')}</tr></table></div>
<div class="column"><h3>Conditional</h3><table><tr>${block('Present', 'would be arising', true)}${block('Perfect', 'would have been arising')}</tr></table></div>
<!-- #EndEditable -->
<p>Verbs conjugated like arise</p></body></html>`;
}

describe('English corpus parser', () => {
  it('expands alternates and keeps region tags per alternate', () => {
    const cells = parseEnglish(page({ perfect: 'have betted</span>; <span class="normal">bet' }), 'bet.html').cells;
    expect(cells.find(c => c.target.tense === 'perfect' && c.target.person === 1)!.expected).toEqual(['I have betted', 'I have bet']);
    expect(cells.find(c => c.target.tense === 'perfect' && c.target.person === 1)!.original).toBe('I have betted; bet');
    expect(parseEnglish(page({ participle: 'got</span>; <span class="irregular">gotten (U)' }), 'get.html').cells[1]!.expected).toEqual(['got', 'gotten (US)']);
    expect(parseEnglish(page({ participle: 'ridded (E)</span>; <span class="irregular">rid (U)' }), 'rid.html').cells[1]!.expected).toEqual(['ridded (GB)', 'rid (US)']);
  });

  it('reads the imperative and normalises let´s', () => {
    const parsed = parseEnglish(page(), 'arise.html');
    const imperative = parsed.cells.filter(c => c.target.mood === 'imperative');
    expect(imperative.map(c => c.expected[0])).toEqual(['arise', "let's arise", 'arise']);
    expect(imperative.map(c => [c.subject, c.target.person, c.target.number])).toEqual([['2sg', 2, 'singular'], ['1pl', 1, 'plural'], ['2pl', 2, 'plural']]);
    expect(parsed.templatePlaceholders).toBe(3);
    expect(parsed.cells).toHaveLength(englishCellsPerFile);
    expect(englishCellsPerFile).toBe(126);
    expect(parsed.cells.find(c => c.target.mood === 'indicative')).toMatchObject({ subject: '1sg', expected: ['I x'], heading: 'Indicative › Present' });
  });

  it('keeps the page labels of the mislabelled blocks, which the language remaps', () => {
    const parsed = parseEnglish(page(), 'arise.html').cells;
    expect(parsed.filter(c => c.heading === 'Subjunctive › Present #2').map(c => `${c.target.mood}.${c.target.tense}`)).toEqual(Array(6).fill('subjunctive.present'));
    expect(parsed.filter(c => c.heading === 'Subjunctive › Imperfect')).toHaveLength(6);
    expect(parsed.find(c => c.heading === 'Nominal Forms › Gerund')!.target.mood).toBe('gerund');
    expect(parsed.find(c => c.heading === 'Progressive (Continuous) Forms › Indicative › Perfect')!.target.tense).toBe('perfect_progressive');
    const { cells, matched } = applyRemaps(parsed, english.remaps ?? []);
    expect(matched).toEqual([true, true, true]);
    const tenses = cells.map(c => `${c.target.mood}.${c.target.tense}`);
    expect(tenses.filter(t => t === 'subjunctive.perfect')).toHaveLength(6);
    expect(tenses.filter(t => t === 'subjunctive.past')).toHaveLength(6);
    expect(tenses).toContain('participle.present');
    expect(tenses.filter(t => t.startsWith('gerund') || t.endsWith('imperfect'))).toEqual([]);
  });

  it('fails loudly on an unexpected page', () => {
    expect(() => parseEnglish('<html></html>', 'bad.html')).toThrow('en: bad.html');
    expect(() => parseEnglish(page().replace('Imperfect', 'Past'), 'bad.html')).toThrow('en: bad.html: block 9');
    expect(() => parseEnglish(page().replace('Let&#180;s arise', 'arise</span> and <span class="normal">arise'), 'bad.html')).toThrow('en: bad.html');
  });
});
