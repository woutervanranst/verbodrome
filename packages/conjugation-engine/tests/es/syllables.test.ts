import { describe, expect, it } from 'vitest';
import { endingStress, nuclei, rootStress, vowelIndices, writeAccent } from '../../src/languages/es/syllables.js';

describe('Spanish vowel letters', () => {
  it('skips the silent u of gu/qu and counts a final y after a vowel', () => {
    expect(vowelIndices('guiais')).toEqual([2, 3, 4]);
    expect(vowelIndices('saque')).toEqual([1, 4]);
    expect(vowelIndices('averiguo')).toEqual([0, 2, 4, 6, 7]);
    expect(vowelIndices('averigüe')).toEqual([0, 2, 4, 6, 7]);
    expect(vowelIndices('estoy')).toEqual([0, 3, 4]);
    expect(vowelIndices('leyo')).toEqual([1, 3]);
  });

  it('counts the stressed vowel of an ending from the end of the word', () => {
    expect(endingStress('amabais', 3)).toBe(2);
    expect(endingStress('construyo', 1)).toBe(8);
    expect(endingStress('siguio', 1)).toBe(5);
  });

  it('groups vowels into syllable nuclei', () => {
    expect(nuclei('averiguais', 7)).toEqual([[0], [2], [4], [6, 7, 8]]);
    expect(nuclei('envio', 3)).toEqual([[0], [3], [4]]);
    expect(nuclei('prohibir', 6)).toEqual([[2, 4], [6]]);
    expect(nuclei('construi', 7)).toEqual([[1], [6, 7]]);
    expect(nuclei('leer', 2)).toEqual([[1], [2]]);
    expect(nuclei('rehui', 4)).toEqual([[1], [3, 4]]);
    expect(nuclei('rehuid', 4)).toEqual([[1], [3, 4]]);
    expect(nuclei('averiguais', 7)).toEqual([[0], [2], [4], [6, 7, 8]]);
  });
});

describe('Spanish written accent', () => {
  it.each([
    ['amabamos', 2, 'amábamos'], ['envio', 3, 'envío'], ['actuo', 3, 'actúo'], ['aislo', 1, 'aíslo'], ['prohibo', 4, 'prohíbo'],
    ['construi', 7, 'construí'], ['hui', 2, 'hui'], ['huis', 2, 'huis'], ['huido', 2, 'huido'], ['construia', 7, 'construía'],
    ['guio', 3, 'guio'], ['guiais', 3, 'guiais'], ['rio', 2, 'rio'], ['sonrio', 5, 'sonrió'], ['dio', 2, 'dio'],
    ['averiguais', 7, 'averiguáis'], ['estas', 3, 'estás'], ['levantate', 3, 'levántate'], ['levantaos', 6, 'levantaos'],
    ['reios', 2, 'reíos'], ['estoy', 3, 'estoy'], ['preves', 4, 'prevés'],
    // grammar design §4.5, the checks the implementation must pass
    ['reuno', 2, 'reúno'], ['rehuso', 3, 'rehúso'], ['ahinco', 2, 'ahínco'], ['enraizo', 4, 'enraízo'], ['huimos', 2, 'huimos'],
    ['ois', 1, 'oís'], ['reis', 2, 'reís'], ['reimos', 2, 'reímos'], ['leiste', 2, 'leíste'], ['cayo', 3, 'cayó'], ['guie', 3, 'guie'],
    ['riais', 2, 'riais'], ['frio', 3, 'frio'], ['vio', 2, 'vio'], ['fue', 2, 'fue'], ['averigue', 7, 'averigué'],
    ['estudieis', 6, 'estudiéis'], ['levantemonos', 6, 'levantémonos'], ['vestios', 4, 'vestíos'], ['vamonos', 1, 'vámonos'],
    ['deten', 3, 'detén'], ['rehice', 3, 'rehíce'], ['deshice', 4, 'deshice'], ['amo', 0, 'amo'], ['comio', 4, 'comió'],
    ['tuvieramos', 4, 'tuviéramos'], ['siguio', 5, 'siguió'], ['oimos', 1, 'oímos'], ['leido', 2, 'leído'], ['reir', 2, 'reír'],
    // review C3: an open vowel before ui / iu does not join them (re-huí is two syllables)
    ['rehui', 4, 'rehuí'], ['rehuis', 4, 'rehuís'], ['rehuid', 4, 'rehuid'], ['rehuyo', 3, 'rehúyo'], ['reuno', 2, 'reúno'],
  ] as const)('%s with stress at %i → %s', (word, stressed, written) => expect(writeAccent(word, stressed).written).toBe(written));

  it('keeps the diaeresis and re-writes a word that already has a tilde', () => {
    expect(writeAccent('averigüe', 7).written).toBe('averigüé');
    expect(writeAccent('reíos', 2).written).toBe('reíos');
    expect(writeAccent('levántate', 3).written).toBe('levántate');
  });

  it('names the rule that decides the tilde and the stressed syllable', () => {
    expect(writeAccent('envio', 3)).toEqual({ kind: 'hiatus', stress: 'penultimate', written: 'envío' });
    expect(writeAccent('amabamos', 2)).toEqual({ kind: 'general', stress: 'antepenultimate', written: 'amábamos' });
    expect(writeAccent('guio', 3)).toEqual({ kind: 'monosyllable', stress: 'final', written: 'guio' });
    expect(writeAccent('amo', 0)).toEqual({ kind: 'none', stress: 'penultimate', written: 'amo' });
    expect(writeAccent('da', 1)).toEqual({ kind: 'none', stress: 'final', written: 'da' });
  });

  it('finds root stress with glides, hiatus and stored stems', () => {
    expect(rootStress('cambi', { prefixLength: 0, hiatus: false, stored: false })).toBe(1);
    expect(rootStress('envi', { prefixLength: 0, hiatus: true, stored: false })).toBe(3);
    expect(rootStress('gui', { prefixLength: 0, hiatus: false, stored: false })).toBe(2);
    expect(rootStress('oig', { prefixLength: 0, hiatus: true, stored: true })).toBe(0);
    expect(rootStress('prev', { prefixLength: 3, hiatus: false, stored: false })).toBeNull();
    expect(rootStress('aisl', { prefixLength: 0, hiatus: true, stored: false })).toBe(1);
    expect(rootStress('caus', { prefixLength: 0, hiatus: false, stored: false })).toBe(1);
    expect(rootStress('piens', { prefixLength: 0, hiatus: false, stored: false })).toBe(2);
    expect(rootStress('prohib', { prefixLength: 0, hiatus: true, stored: false })).toBe(4);
    expect(rootStress('averigu', { prefixLength: 0, hiatus: false, stored: false })).toBe(4);
    expect(rootStress('actu', { prefixLength: 0, hiatus: true, stored: false })).toBe(3);
    expect(rootStress('compon', { prefixLength: 3, hiatus: false, stored: false })).toBe(4);
    expect(rootStress('sonri', { prefixLength: 0, hiatus: true, stored: false })).toBe(4);
    expect(rootStress('acaec', { prefixLength: 0, hiatus: false, stored: false })).toBe(3);   // a-e: two syllables
  });
});
