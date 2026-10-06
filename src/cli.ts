#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { conjugate, ConjugationError, parseConjugationOptions, renderParts } from './index.js';
import type { ConjugatedForm, ResolvedTarget } from './types.js';
import { labelsFor, resolvedTargetKey } from './catalogue.js';

const help = `Usage: verbodrome <fr|nl> <infinitive> [options]

  --mood <id>       Grammatical mood (omit for all)
  --tense <id>      Tense (omit for all)
  --person <1|2|3>  Finite grammatical person
  --number <singular|plural>
  --json           Complete structured result
  --bare           Omit finite subject and French subjunctive que
  --gender <masculine|feminine>  French subject/participle context
  --agreement <JSON>            French participle agreement filters
  --preceding-direct-object <JSON>  French preceding object agreement
  --reflexive-object <direct|indirect>
  --auxiliary <avoir|être|hebben|zijn>
  --class <er|ir|re|weak|strong|loan>
  --model <infinitive>          French conjugation model
  --stems <JSON>               Language-specific principal-part hints
  --aspirated-h                French aspirated h
  --orthography <rectified|traditional>
  --pronoun <id>               Dutch subject pronoun
  --inversion                  Dutch verb-before-subject order
  --reflexive / --no-reflexive  Dutch reflexivity
  --separable-prefix <prefix> / --inseparable-prefix <prefix>
  --help

Example: verbodrome fr aimer --mood indicative --tense present --person 1 --number plural
`;

function targetLabel(target: ResolvedTarget, labels: { mood: string; tense: string }): string {
  return [
    labels.mood, labels.tense, ...(target.person ? [`${target.person} ${target.number}`] : []),
    ...(target.gender ? [target.gender] : []),
    ...(target.agreement ? [`participle ${target.agreement.gender} ${target.agreement.number}`] : []),
  ].join(' / ');
}

function formLabel(form: ConjugatedForm): string {
  return [
    targetLabel(form.target, form.labels),
    ...(form.variant.orthography !== 'both' ? [form.variant.orthography] : []),
    ...(form.variant.pattern ? [form.variant.pattern] : []),
    ...(form.variant.usage !== 'standard' ? [form.variant.usage] : []),
    ...(form.variant.condition ? [form.variant.condition] : []),
  ].join(' / ');
}

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      mood: { type: 'string' }, tense: { type: 'string' }, person: { type: 'string' }, number: { type: 'string' },
      json: { type: 'boolean' }, bare: { type: 'boolean' }, help: { type: 'boolean' },
      gender: { type: 'string' }, agreement: { type: 'string' }, auxiliary: { type: 'string' },
      class: { type: 'string' }, model: { type: 'string' }, stems: { type: 'string' },
      'preceding-direct-object': { type: 'string' }, 'reflexive-object': { type: 'string' },
      'aspirated-h': { type: 'boolean' }, orthography: { type: 'string' },
      pronoun: { type: 'string' }, inversion: { type: 'boolean' }, reflexive: { type: 'boolean' },
      'no-reflexive': { type: 'boolean' }, 'separable-prefix': { type: 'string' }, 'inseparable-prefix': { type: 'string' },
    },
  });
  if (values.help) {
    console.log(help);
  } else {
    if (positionals.length !== 2) throw new ConjugationError('INVALID_REQUEST', 'Expected language and infinitive. Use --help for usage.');
    if (values.reflexive && values['no-reflexive']) throw new ConjugationError('INVALID_REQUEST', '--reflexive and --no-reflexive conflict.');
    const options: Record<string, unknown> = { language: positionals[0], infinitive: positionals[1] };
    const names: Readonly<Record<string, string>> = {
      class: 'classHint', 'preceding-direct-object': 'precedingDirectObject', 'reflexive-object': 'reflexiveObject',
      'aspirated-h': 'aspiratedH', orthography: 'preferredOrthography',
      'separable-prefix': 'separablePrefix', 'inseparable-prefix': 'inseparablePrefix',
    };
    for (const [key, value] of Object.entries(values)) {
      if (['json', 'bare', 'help', 'no-reflexive'].includes(key)) continue;
      options[names[key] ?? key] = ['stems', 'agreement', 'preceding-direct-object'].includes(key) && typeof value === 'string'
        ? JSON.parse(value) : key === 'person' ? Number(value) : value;
    }
    if (values['no-reflexive']) options.reflexive = false;
    const result = conjugate(parseConjugationOptions(options));
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const targets = new Set(result.forms.map(form => resolvedTargetKey(form.target)));
      const display = (form: ConjugatedForm): string => values.bare ? renderParts(result.language, form.parts, { bare: true }) : form.text;
      if (targets.size === 1 && !result.unavailableTargets.length) {
        const preferred = result.forms.find(form => form.preferred);
        if (!preferred) throw new ConjugationError('GENERATION_FAILURE', 'No preferred form for the resolved target.');
        console.log(display(preferred));
      } else {
        for (const form of result.forms) console.log(`${formLabel(form)}: ${display(form)}`);
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
