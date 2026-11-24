#!/usr/bin/env node
import { parseArgs } from 'node:util';
import type { ParseArgsOptionsConfig } from 'node:util';
import { conjugate, ConjugationError, explain, languages, parseConjugationOptions, renderParts } from './index.js';
import { agreementKeys } from './core/options.js';
import type { FieldSpec } from './core/options.js';
import { explanationLines } from './i18n/explain.js';
import { isLocale, locales } from './i18n/locales/index.js';
import { packs } from './languages/index.js';
import type { ConjugatedForm } from './types.js';
import { labelsFor, resolvedTargetKey } from './catalogue.js';
import { formLabel, targetLabel } from './cli-labels.js';

/** Short flag names for fields whose kebab-case spelling is not the one users know. */
const aliases: Readonly<Record<string, string>> = { classHint: 'class', preferredOrthography: 'orthography' };

const commonHelp = [
  ['--mood <id>', 'Grammatical mood (omit for all)'],
  ['--tense <id>', 'Tense (omit for all)'],
  ['--person <1|2|3>', 'Finite grammatical person'],
  ['--number <singular|plural>', ''],
  ['--subject <id>', 'Subject slot, for a language that declares them'],
  ['--json', 'Complete structured result'],
  ['--bare', 'Omit the finite subject and any conjunction such as the French subjunctive que'],
  ['--explain', 'Print the rule behind each step of a form, indented under it (JSON: an explanation per form)'],
  [`--locale <${Object.keys(locales).join('|')}>`, 'Language of --explain (default en)'],
  ['--help', ''],
] as const;

type FlagShape = 'boolean' | 'json' | 'text';

interface Flag {
  /** The option key in the conjugation query, for example `preferredOrthography`. */
  readonly field: string;
  /** The flag without dashes, for example `orthography`. */
  readonly name: string;
  readonly shape: FlagShape;
  readonly spec: FieldSpec;
}

function shapeOf(spec: FieldSpec): FlagShape {
  return spec.kind === 'boolean' ? 'boolean' : spec.kind === 'agreement' || spec.kind === 'stems' ? 'json' : 'text';
}

function flagFor(field: string, spec: FieldSpec): Flag {
  return { field, name: aliases[field] ?? field.replace(/[A-Z]/gu, letter => `-${letter.toLowerCase()}`), shape: shapeOf(spec), spec };
}

/** One flag per option field that any registered language declares; a field shared by languages is one flag. */
function unionFlags(): Flag[] {
  const flags = new Map<string, Flag>();
  for (const pack of Object.values(packs)) {
    for (const [field, spec] of Object.entries(pack.options.fields)) {
      const flag = flagFor(field, spec);
      const known = flags.get(field);
      if (known && known.shape !== flag.shape) throw new Error(`Option ${field} is declared with incompatible kinds by different languages.`);
      flags.set(field, known ?? flag);
    }
  }
  return [...flags.values()];
}

function flagUsage({ name, spec }: Flag): string {
  switch (spec.kind) {
    case 'boolean': return `--${name} / --no-${name}`;
    case 'enum': return `--${name} <${spec.values.join('|')}>`;
    case 'word': return `--${name} <word>`;
    case 'agreement': case 'stems': return `--${name} <JSON>`;
  }
}

function flagNote({ spec }: Flag): string {
  switch (spec.kind) {
    case 'agreement': return `keys: ${agreementKeys(spec).join(', ')}`;
    case 'stems': return `keys: ${[...spec.words, ...Object.keys(spec.enums)].join(', ')}`;
    default: return '';
  }
}

function section(heading: string, rows: readonly (readonly [string, string])[]): string {
  const width = Math.max(...rows.map(([usage]) => usage.length));
  return [heading, ...rows.map(([usage, note]) => `  ${usage.padEnd(width)}  ${note}`.trimEnd())].join('\n');
}

function helpText(): string {
  const sections = Object.values(packs).map(pack => section(
    `${pack.label} (${pack.language}):`,
    Object.entries(pack.options.fields).map(([field, spec]) => [flagUsage(flagFor(field, spec)), flagNote(flagFor(field, spec))] as const),
  ));
  return [
    `Usage: conjugation-engine <${languages.join('|')}> <infinitive> [options]`,
    'Quote multiword infinitives, for example: conjugation-engine fr "se laver"',
    section('Common options:', commonHelp),
    ...sections,
    'Example: conjugation-engine fr aimer --mood indicative --tense present --person 1 --number plural',
  ].join('\n\n');
}

/** The query value for a flag given on the command line; the engine validates it. */
function flagValue(flag: Flag, raw: string): unknown {
  if (flag.shape === 'json') return JSON.parse(raw);
  if (flag.spec.kind === 'enum') return flag.spec.values.find(value => String(value) === raw) ?? raw;
  return raw;
}

try {
  const flags = unionFlags();
  const declared: ParseArgsOptionsConfig = {
    mood: { type: 'string' }, tense: { type: 'string' }, person: { type: 'string' }, number: { type: 'string' },
    subject: { type: 'string' }, json: { type: 'boolean' }, bare: { type: 'boolean' }, help: { type: 'boolean' },
    explain: { type: 'boolean' }, locale: { type: 'string' },
  };
  for (const { name, shape } of flags) {
    declared[name] = { type: shape === 'boolean' ? 'boolean' : 'string' };
    if (shape === 'boolean') declared[`no-${name}`] = { type: 'boolean' };
  }
  const { values, positionals } = parseArgs({ allowPositionals: true, options: declared });
  if (values.help) {
    console.log(helpText());
  } else {
    if (positionals.length !== 2) throw new ConjugationError('INVALID_REQUEST', 'Expected language and infinitive. Use --help for usage.');
    const options: Record<string, unknown> = { language: positionals[0], infinitive: positionals[1] };
    for (const key of ['mood', 'tense', 'number', 'subject'] as const) if (values[key] !== undefined) options[key] = values[key];
    if (values.person !== undefined) options.person = Number(values.person);
    for (const flag of flags) {
      const given = values[flag.name];
      if (flag.shape === 'boolean') {
        const negated = values[`no-${flag.name}`];
        if (given && negated) throw new ConjugationError('INVALID_REQUEST', `--${flag.name} and --no-${flag.name} conflict.`);
        if (given) options[flag.field] = true;
        if (negated) options[flag.field] = false;
      } else if (typeof given === 'string') {
        options[flag.field] = flagValue(flag, given);
      }
    }
    const locale = typeof values.locale === 'string' ? values.locale : 'en';
    if (!isLocale(locale)) throw new ConjugationError('INVALID_REQUEST', `Locale must be one of: ${Object.keys(locales).join(', ')}.`);
    const result = conjugate(parseConjugationOptions(options));
    if (values.json) {
      const forms = values.explain ? result.forms.map(form => ({ ...form, explanation: explain(result.language, form, locale) })) : result.forms;
      console.log(JSON.stringify({ ...result, forms }, null, 2));
    } else {
      const steps = (form: ConjugatedForm): void => {
        if (values.explain) for (const line of explanationLines(explain(result.language, form, locale))) console.log(line);
      };
      const targets = new Set(result.forms.map(form => resolvedTargetKey(form.target)));
      const display = (form: ConjugatedForm): string => values.bare ? renderParts(result.language, form.parts, { bare: true }) : form.text;
      if (targets.size === 1 && !result.unavailableTargets.length) {
        const preferred = result.forms.find(form => form.preferred);
        if (!preferred) throw new ConjugationError('GENERATION_FAILURE', 'No preferred form for the resolved target.');
        console.log(display(preferred));
        steps(preferred);
      } else {
        for (const form of result.forms) {
          console.log(`${formLabel(form)}: ${display(form)}`);
          steps(form);
        }
      }
      for (const unavailable of result.unavailableTargets) {
        console.log(`${targetLabel(unavailable.target, labelsFor(result.language, unavailable.target))}: unavailable (${unavailable.explanation})`);
      }
    }
    if (result.status === 'unavailable') process.exitCode = 3;
  }
} catch (error) {
  if (error instanceof ConjugationError) {
    console.error(`${error.code}: ${error.message}`);
    process.exitCode = error.code === 'GENERATION_FAILURE' ? 2 : 1;
  } else {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
