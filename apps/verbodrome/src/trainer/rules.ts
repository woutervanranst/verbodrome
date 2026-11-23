import type { TenseDef } from '../config/tenses';
import type { VerbDef } from '../config/verbs';
import { formAt, verbForms } from './forms';
import type { VerbForms } from './forms';

const IMPERFECT = '-ais, -ais, -ait, -ions, -iez, -aient';
const FUTURE = '-ai, -as, -a, -ons, -ez, -ont';
const SUBJUNCTIVE = '-e, -es, -e, -ions, -iez, -ent';
/** Present endings of the regular classes, keyed by infinitive ending. */
const PRESENT: Readonly<Record<string, string>> = {
  er: '-e, -es, -e, -ons, -ez, -ent',
  ir: '-is, -is, -it, -issons, -issez, -issent',
  re: '-s, -s, –, -ons, -ez, -ent',
};
const SIMPLE_PAST: readonly (readonly [string, string])[] = [
  ['ai', '-ai, -as, -a, -âmes, -âtes, -èrent'],
  ['ins', '-ins, -ins, -int, -înmes, -întes, -inrent'],
  ['is', '-is, -is, -it, -îmes, -îtes, -irent'],
  ['us', '-us, -us, -ut, -ûmes, -ûtes, -urent'],
];

/** The conjugated verb word of a form (last lexical part), or null. */
function word(forms: VerbForms, tenseId: string, slot: string): string | null {
  const parts = formAt(forms, tenseId, slot)?.form.parts;
  return parts?.findLast(part => part.role === 'lexicalVerb')?.text ?? null;
}

const cut = (text: string | null, ending: string): string | null =>
  text && text.endsWith(ending) ? text.slice(0, -ending.length) : null;

/**
 * A one- or two-sentence Dutch explanation of how a tense is formed for this
 * verb. Stems, participles and auxiliaries are read from the engine's forms.
 */
export function rule(verb: VerbDef, tense: TenseDef): string {
  const forms = verbForms(verb.fr);
  const inf = forms.analysis.lemma;
  const regular = forms.analysis.classificationSource === 'regularRule';
  // A regular verb's class follows from its infinitive (-er, -ir/-ïr, -re).
  const regularClass = regular ? inf.slice(-2).replace('ï', 'i') : null;
  const participle = word(forms, 'participle.past', '-');
  const auxiliary = forms.analysis.auxiliaries.includes('être') && !forms.analysis.auxiliaries.includes('avoir') ? 'être' : 'avoir';
  const pp = participle ? ` + voltooid deelwoord ${participle}` : ' + voltooid deelwoord';
  const agreement = auxiliary === 'être' ? ' Met être past het deelwoord zich aan het onderwerp aan.' : '';
  const compound = (auxTense: string, note = ''): string =>
    `Hulpwerkwoord ${auxiliary} in ${auxTense}${pp}.${agreement}${note}`;

  const nous = word(forms, 'indicative.present', '1p');
  const ils = word(forms, 'indicative.present', '3p');
  const futureStem = cut(word(forms, 'indicative.future', '1s'), 'ai') ?? cut(word(forms, 'indicative.future', '3s'), 'a');
  const regularFuture = futureStem !== null && futureStem === (inf.endsWith('e') ? inf.slice(0, -1) : inf);

  switch (tense.id) {
    case 'indicative.present': {
      const endings = regularClass ? PRESENT[regularClass] : undefined;
      if (endings) {
        const stem = inf.slice(0, -2);
        return `Regelmatig werkwoord op -${inf.slice(-2)}: stam ${stem}- + ${endings}. Let op de schrijfwijze van de stam.`;
      }
      return `Présent van ${inf}. Een onregelmatig werkwoord: deze rij leer je best uit het hoofd.`;
    }
    case 'indicative.perfect': return compound('de présent');
    case 'indicative.pluperfect': return compound('de imparfait');
    case 'indicative.past_anterior': return compound('de passé simple', ' Een tijd uit de schrijftaal.');
    case 'indicative.future_perfect': return compound('de futur simple');
    case 'conditional.past': return compound('de conditionnel présent');
    case 'subjunctive.past': return compound('de subjonctif présent');
    case 'subjunctive.pluperfect': return compound('de subjonctif imparfait', ' Een literaire tijd.');
    case 'imperative.past': return compound('de impératif', ' Komt zelden voor.');
    case 'infinitive.past': return compound('de infinitief');
    case 'participle.perfect': return compound('het participe présent');
    case 'gerund.past': return `en + ${compound('het participe présent')}`;

    case 'indicative.imperfect': {
      const stem = cut(word(forms, 'indicative.imperfect', '1s'), 'ais') ?? cut(word(forms, 'indicative.imperfect', '3s'), 'ait');
      const fromNous = cut(nous, 'ons');
      if (stem && fromNous === stem) return `Neem de nous-vorm van de présent (nous ${nous}), schrap -ons: ${stem}- + ${IMPERFECT}.`;
      return stem ? `Uitzondering: stam ${stem}- + ${IMPERFECT}.` : `Stam van de nous-vorm van de présent + ${IMPERFECT}.`;
    }
    case 'indicative.simple_past': {
      const first = word(forms, 'indicative.simple_past', '1s');
      const match = first ? SIMPLE_PAST.find(([ending]) => first.endsWith(ending)) : undefined;
      return match && first
        ? `Passé simple, een tijd uit de schrijftaal: stam ${first.slice(0, -match[0].length)}- + ${match[1]}.`
        : 'Passé simple, een tijd uit de schrijftaal. Je moet hem vooral kunnen herkennen bij het lezen.';
    }
    case 'indicative.future':
      if (!futureStem) return `De futur simple: stam + ${FUTURE}.`;
      return regularFuture
        ? `Neem de infinitief (${inf}${inf.endsWith('e') ? ', zonder de slot-e' : ''}) + ${FUTURE}.`
        : `Onregelmatige stam ${futureStem}- + ${FUTURE}.`;
    case 'conditional.present':
      return futureStem
        ? `Stam van de futur (${futureStem}-) + uitgangen van de imparfait: ${IMPERFECT}.`
        : `Stam van de futur + uitgangen van de imparfait: ${IMPERFECT}.`;
    case 'indicative.near_future':
      return `aller in de présent + infinitief (${inf}), net als „gaan + infinitief” in het Nederlands.`;
    case 'indicative.recent_past':
      return `venir in de présent + de + infinitief (${inf}): iets is net gebeurd.`;
    case 'subjunctive.present': {
      const stem = cut(word(forms, 'subjunctive.present', '1s'), 'e') ?? cut(word(forms, 'subjunctive.present', '3s'), 'e');
      const fromIls = cut(ils, 'ent');
      const intro = 'Na uitdrukkingen als „il faut que”.';
      if (stem && fromIls === stem) return `${intro} Neem de ils-vorm van de présent (ils ${ils}), schrap -ent: ${stem}- + ${SUBJUNCTIVE}.`;
      return `${intro} ${inf} heeft een onregelmatige subjonctif: leer de vormen uit het hoofd.`;
    }
    case 'subjunctive.imperfect':
      return 'Subjonctif imparfait, een literaire tijd afgeleid van de passé simple. Je moet hem vooral kunnen herkennen.';
    case 'imperative.present':
      return 'Gebiedende wijs, zonder onderwerp. Er zijn drie vormen: tu, nous en vous.'
        + (regularClass === 'er' ? ' Bij werkwoorden op -er valt de -s van de tu-vorm weg.' : '');
    case 'infinitive.present':
      return `De infinitief is de onvervoegde vorm die je in het woordenboek vindt: ${inf}.`;
    case 'participle.present':
    case 'gerund.present': {
      const present = word(forms, 'participle.present', '-');
      const fromNous = cut(nous, 'ons');
      const lead = tense.id === 'gerund.present' ? 'Gérondif: en + participe présent. ' : '';
      if (present && fromNous && present === `${fromNous}ant`) return `${lead}Neem de nous-vorm van de présent (nous ${nous}), schrap -ons en voeg -ant toe: ${present}.`;
      return present ? `${lead}Onregelmatig participe présent: ${present}.` : `${lead}Stam van de nous-vorm + -ant.`;
    }
    case 'participle.past':
      return participle ? `Het voltooid deelwoord van ${inf} is ${participle}.` : `Het voltooid deelwoord van ${inf}.`;
  }
  return `${tense.label} van ${inf}.`;
}
