/**
 * Builds a page in the markup of the Italian corpus source (grammar design §9.1), from hand-written rows, so that the
 * parser is tested without reading the source files.
 */
export interface PageSpec {
  readonly infinitive: string;
  /** Infinito, Participio presente, Gerundio, Participio passato: each line's forms. */
  readonly nominal: readonly (readonly string[])[];
  readonly compound: readonly [string, string, string];
  readonly finite: Readonly<Record<'Indicativo' | 'Congiuntivo' | 'Condizionale', readonly (readonly [label: string, rows: readonly (readonly string[])[]])[]>>;
  /** tu, lui, noi, voi, loro. */
  readonly imperative: readonly (readonly string[])[];
  readonly notused?: boolean;
}

const pronouns = ['io', 'tu', 'lui', 'noi', 'voi', 'loro'];
const entities = (text: string): string => text.replace(/è/gu, '&egrave;').replace(/ò/gu, '&ograve;').replace(/à/gu, '&agrave;').replace(/ì/gu, '&igrave;');
const spans = (forms: readonly string[], cls = 'normal'): string => forms.map(form => `<span class="${cls}">${entities(form)}</span>`).join('; ');
const row = (pronoun: string, forms: readonly string[], cls = 'normal'): string =>
  `<font color=#007F00 face=Courier><span class="normal">${pronoun}</span>&nbsp;&nbsp;</font>${spans(forms, cls)}<br>\n`;
const labels = ['Infinito: ', 'Participio presente:', 'Gerundio:', 'Participio passato:'];

export function verbixPage(spec: PageSpec): string {
  const nominal = `<div class="column"><h3>Nominal Forms</h3><table class="verbtable"><tr><td valign="top" class="verbtable"> <p>${
    spec.nominal.map((forms, index) => `<b>${labels[index]}</b> ${spans(forms)}<br>\n`).join('')
  }</p></td><td valign="top" class="verbtable"> <p>${spec.compound.map(line => `${spans([line])}<br>\n`).join('')}</p></td></tr></table></div>`;
  const block = (heading: 'Indicativo' | 'Congiuntivo' | 'Condizionale'): string => `<div class="column"><h3>${heading}</h3><table><tr>${
    spec.finite[heading].map(([label, rows], index) => `<td width="50%"> <p><b>${index > 1 ? '<br> ' : ''}${label}</b><br> ${
      rows.map((forms, line) => row(pronouns[line]!, forms)).join('')}</p></td>`).join('')
  }</tr></table></div>`;
  const cls = spec.notused ? 'notused' : 'normal';
  const imperative = `<div class="column"><h3>Imperativo</h3><tr><td valign="top" class="verbtable"> <p class="verbtable"> ${
    spec.notused ? '<font color=#007F00 face=Courier><span class="normal">io</span>&nbsp;</font><span class="notused"></span><br>\n' : '<span class="normal"> </span><br>\n'
  }${spec.imperative.map((forms, line) => row(pronouns[line + 1]!, forms, cls)).join('')}</p></td></tr></table></div>`;
  return `<html><body><!-- #BeginEditable "Full_width_text" -->${nominal}${block('Indicativo')}${block('Congiuntivo')}${block('Condizionale')}${imperative}<!-- #EndEditable --></body></html>`;
}
