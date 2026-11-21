import type { DutchConjugationOptions } from 'conjugation-engine';
import type { Level } from './levels';

export type VerbGroup = 'er' | 'ir' | 're' | 'onregelmatig' | 'zeldzaam';

/** Lexical hints passed straight to conjugation-engine for the Dutch counterpart. */
export type DutchHints = Pick<DutchConjugationOptions,
  'separablePrefix' | 'inseparablePrefix' | 'auxiliary' | 'classHint' | 'stems' | 'reflexive'>;

export interface DutchCounterpart extends DutchHints {
  readonly infinitive: string;
  /** Fixed word that completes the meaning, e.g. "geboren" in "geboren worden". */
  readonly complement?: string;
}

export interface VerbDef {
  /** French infinitive, exactly as conjugation-engine expects it. */
  readonly fr: string;
  /** Dutch verb used for the prompt. */
  readonly nl: DutchCounterpart;
  readonly group: VerbGroup;
  readonly level: Level;
}

const v = (fr: string, nl: string | DutchCounterpart, group: VerbGroup, level: Level): VerbDef =>
  ({ fr, nl: typeof nl === 'string' ? { infinitive: nl } : nl, group, level });

/**
 * CONFIGURATION — the verbs offered by the trainer.
 *
 * conjugation-engine conjugates any verb, so adding one is a single line here:
 * the French infinitive, its Dutch counterpart, a group for the picker and the
 * level at which it is introduced. No conjugation tables live in this app.
 *
 * The list is the VerbodromeX French corpus plus a few school staples it lacks
 * (parler, venir, partir, sortir, attendre, comprendre). The Dutch counterparts
 * are a first pass and deserve a review by a teacher.
 */
export const VERBS: readonly VerbDef[] = [
  // Lager onderwijs
  v('être', 'zijn', 'onregelmatig', 'lager'),
  v('avoir', 'hebben', 'onregelmatig', 'lager'),
  v('aller', 'gaan', 'onregelmatig', 'lager'),
  v('faire', 'doen', 'onregelmatig', 'lager'),
  v('aimer', { infinitive: 'beminnen', inseparablePrefix: 'be' }, 'er', 'lager'),
  v('parler', 'spreken', 'er', 'lager'),
  v('manger', 'eten', 'er', 'lager'),

  // 1e graad
  v('finir', 'eindigen', 'ir', 'g1'),
  v('rendre', { infinitive: 'teruggeven', separablePrefix: 'terug' }, 're', 'g1'),
  v('attendre', 'wachten', 're', 'g1'),
  v('prendre', 'nemen', 'onregelmatig', 'g1'),
  v('comprendre', 'begrijpen', 'onregelmatig', 'g1'),
  v('mettre', 'zetten', 'onregelmatig', 'g1'),
  v('dire', 'zeggen', 'onregelmatig', 'g1'),
  v('lire', 'lezen', 'onregelmatig', 'g1'),
  v('écrire', 'schrijven', 'onregelmatig', 'g1'),
  v('voir', 'zien', 'onregelmatig', 'g1'),
  v('boire', 'drinken', 'onregelmatig', 'g1'),
  v('venir', 'komen', 'onregelmatig', 'g1'),
  v('partir', 'vertrekken', 'onregelmatig', 'g1'),
  v('sortir', 'uitgaan', 'onregelmatig', 'g1'),
  v('dormir', 'slapen', 'onregelmatig', 'g1'),
  v('pouvoir', 'kunnen', 'onregelmatig', 'g1'),
  v('vouloir', { infinitive: 'willen', stems: { pastSingular: 'wilde', pastPlural: 'wilden' } }, 'onregelmatig', 'g1'),
  v('devoir', 'moeten', 'onregelmatig', 'g1'),
  v('savoir', 'weten', 'onregelmatig', 'g1'),
  v('payer', 'betalen', 'er', 'g1'),
  v('placer', 'plaatsen', 'er', 'g1'),
  v('jeter', 'gooien', 'er', 'g1'),
  v('envoyer', 'sturen', 'er', 'g1'),
  v('céder', { infinitive: 'toegeven', separablePrefix: 'toe' }, 'er', 'g1'),
  v('peser', 'wegen', 'er', 'g1'),

  // 2e graad
  v('connaître', 'kennen', 'onregelmatig', 'g2'),
  v('croire', 'geloven', 'onregelmatig', 'g2'),
  v('recevoir', 'ontvangen', 'onregelmatig', 'g2'),
  v('tenir', 'houden', 'onregelmatig', 'g2'),
  v('sentir', 'voelen', 'onregelmatig', 'g2'),
  v('servir', 'dienen', 'onregelmatig', 'g2'),
  v('suivre', 'volgen', 'onregelmatig', 'g2'),
  v('vivre', 'leven', 'onregelmatig', 'g2'),
  v('courir', 'rennen', 'onregelmatig', 'g2'),
  v('couvrir', { infinitive: 'bedekken', inseparablePrefix: 'be' }, 'onregelmatig', 'g2'),
  v('rire', 'lachen', 'onregelmatig', 'g2'),
  v('plaire', { infinitive: 'behagen', inseparablePrefix: 'be' }, 'onregelmatig', 'g2'),
  v('craindre', 'vrezen', 'onregelmatig', 'g2'),
  v('peindre', 'schilderen', 'onregelmatig', 'g2'),
  v('joindre', { infinitive: 'verbinden', inseparablePrefix: 'ver' }, 'onregelmatig', 'g2'),
  v('battre', 'slaan', 'onregelmatig', 'g2'),
  v('mourir', 'sterven', 'onregelmatig', 'g2'),
  v('naître', { infinitive: 'worden', complement: 'geboren' }, 'onregelmatig', 'g2'),
  v('falloir', 'moeten', 'onregelmatig', 'g2'),
  v('pleuvoir', 'regenen', 'onregelmatig', 'g2'),
  v('valoir', { infinitive: 'zijn', complement: 'waard' }, 'onregelmatig', 'g2'),
  v('créer', 'scheppen', 'er', 'g2'),
  v('apprécier', { infinitive: 'waarderen', stems: { unstressedFinalSyllable: false } }, 'er', 'g2'),
  v('se méfier', 'wantrouwen', 'er', 'g2'),

  // 3e graad
  v('conclure', { infinitive: 'besluiten', inseparablePrefix: 'be' }, 'onregelmatig', 'g3'),
  v('cuire', 'bakken', 'onregelmatig', 'g3'),
  v('coudre', 'naaien', 'onregelmatig', 'g3'),
  v('cueillir', 'plukken', 'onregelmatig', 'g3'),
  v('fuir', 'vluchten', 'onregelmatig', 'g3'),
  v('haïr', 'haten', 'ir', 'g3'),
  v('acquérir', { infinitive: 'verwerven', inseparablePrefix: 'ver' }, 'onregelmatig', 'g3'),
  v('vaincre', { infinitive: 'overwinnen', inseparablePrefix: 'over' }, 'onregelmatig', 'g3'),
  v('bouillir', 'koken', 'onregelmatig', 'g3'),
  v('croître', 'groeien', 'onregelmatig', 'g3'),
  v('modeler', { infinitive: 'boetseren', stems: { unstressedFinalSyllable: false } }, 'er', 'g3'),
  v('broyer', 'pletten', 'er', 'g3'),
  v('assiéger', { infinitive: 'belegeren', inseparablePrefix: 'be' }, 'er', 'g3'),
  v('asseoir', { infinitive: 'neerzetten', separablePrefix: 'neer' }, 'onregelmatig', 'g3'),
  v('mouvoir', { infinitive: 'bewegen', inseparablePrefix: 'be' }, 'onregelmatig', 'g3'),
  v('pourvoir', { infinitive: 'voorzien', inseparablePrefix: 'voor' }, 'onregelmatig', 'g3'),
  v('vêtir', 'kleden', 'onregelmatig', 'g3'),
  v('moudre', 'malen', 'onregelmatig', 'g3'),
  v('assaillir', { infinitive: 'bestormen', inseparablePrefix: 'be' }, 'onregelmatig', 'g3'),

  // Zeldzaam — in geen enkele snelkeuze
  v('absoudre', { infinitive: 'vrijspreken', separablePrefix: 'vrij' }, 'zeldzaam', 'extra'),
  v('choir', 'vallen', 'zeldzaam', 'extra'),
  v('déchoir', { infinitive: 'vervallen', inseparablePrefix: 'ver', auxiliary: 'zijn' }, 'zeldzaam', 'extra'),
  v('échoir', { infinitive: 'toekomen', separablePrefix: 'toe', auxiliary: 'zijn' }, 'zeldzaam', 'extra'),
  v('clore', 'sluiten', 'zeldzaam', 'extra'),
  v('confire', 'konfijten', 'zeldzaam', 'extra'),
  v('faillir', 'falen', 'zeldzaam', 'extra'),
  v('gésir', 'liggen', 'zeldzaam', 'extra'),
  v('messeoir', { infinitive: 'misstaan', inseparablePrefix: 'mis' }, 'zeldzaam', 'extra'),
  v('seoir', 'passen', 'zeldzaam', 'extra'),
  v('surseoir', { infinitive: 'uitstellen', separablePrefix: 'uit' }, 'zeldzaam', 'extra'),
  v('ouïr', 'horen', 'zeldzaam', 'extra'),
  v('paître', 'grazen', 'zeldzaam', 'extra'),
  v('repaître', 'voeden', 'zeldzaam', 'extra'),
  v('traire', 'melken', 'zeldzaam', 'extra'),
];

export const verbByFr = (fr: string): VerbDef | undefined => VERBS.find(verb => verb.fr === fr);

export const GROUP_LABELS: Readonly<Record<VerbGroup, string>> = {
  er: 'Werkwoorden op -er',
  ir: 'Werkwoorden op -ir',
  re: 'Werkwoorden op -re',
  onregelmatig: 'Onregelmatig',
  zeldzaam: 'Zeldzaam',
};
