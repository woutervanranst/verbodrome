/**
 * The principal parts of common verbs, written from core vocabulary (A&G §§209–212 and Lewis & Short as any school
 * list prints them), not from the engine: the first person present, the perfect and the supine (null: no supine, or
 * not checked). Compounds are well represented, so gaps in the families show up here.
 */
import { describe, expect, it } from 'vitest';
import { conjugate } from '../../src/index.js';
import { forms } from './helpers.js';

type Parts = readonly [infinitive: string, present: string, perfect: string, supine: string | null];

const verbs: readonly Parts[] = [
  // first conjugation
  ['amāre', 'amō', 'amāvī', 'amātum'], ['vocāre', 'vocō', 'vocāvī', 'vocātum'], ['portāre', 'portō', 'portāvī', 'portātum'],
  ['putāre', 'putō', 'putāvī', 'putātum'], ['parāre', 'parō', 'parāvī', 'parātum'], ['appellāre', 'appellō', 'appellāvī', 'appellātum'],
  ['mandāre', 'mandō', 'mandāvī', 'mandātum'], ['dare', 'dō', 'dedī', 'datum'], ['circumdare', 'circumdō', 'circumdedī', 'circumdatum'],
  ['stāre', 'stō', 'stetī', 'statum'], ['praestāre', 'praestō', 'praestitī', 'praestitum'], ['iuvāre', 'iuvō', 'iūvī', 'iūtum'],
  ['adiuvāre', 'adiuvō', 'adiūvī', 'adiūtum'], ['vetāre', 'vetō', 'vetuī', 'vetitum'], ['domāre', 'domō', 'domuī', 'domitum'],
  ['secāre', 'secō', 'secuī', 'sectum'], ['sonāre', 'sonō', 'sonuī', 'sonitum'],
  // second conjugation
  ['monēre', 'moneō', 'monuī', 'monitum'], ['habēre', 'habeō', 'habuī', 'habitum'], ['prohibēre', 'prohibeō', 'prohibuī', 'prohibitum'],
  ['tenēre', 'teneō', 'tenuī', 'tentum'], ['retinēre', 'retineō', 'retinuī', 'retentum'], ['continēre', 'contineō', 'continuī', 'contentum'],
  ['vidēre', 'videō', 'vīdī', 'vīsum'], ['movēre', 'moveō', 'mōvī', 'mōtum'], ['commovēre', 'commoveō', 'commōvī', 'commōtum'],
  ['respondēre', 'respondeō', 'respondī', 'respōnsum'], ['dēspondēre', 'dēspondeō', 'dēspondī', 'dēspōnsum'],
  ['spondēre', 'spondeō', 'spopondī', 'spōnsum'], ['mordēre', 'mordeō', 'momordī', 'morsum'], ['tondēre', 'tondeō', 'totondī', 'tōnsum'],
  ['dētondēre', 'dētondeō', 'dētondī', 'dētōnsum'],
  ['docēre', 'doceō', 'docuī', 'doctum'], ['iubēre', 'iubeō', 'iussī', 'iussum'], ['manēre', 'maneō', 'mānsī', 'mānsum'],
  ['remanēre', 'remaneō', 'remānsī', 'remānsum'], ['sedēre', 'sedeō', 'sēdī', 'sessum'], ['possidēre', 'possideō', 'possēdī', 'possessum'],
  ['augēre', 'augeō', 'auxī', 'auctum'], ['rīdēre', 'rīdeō', 'rīsī', 'rīsum'], ['persuādēre', 'persuādeō', 'persuāsī', 'persuāsum'],
  ['timēre', 'timeō', 'timuī', null], ['dēlēre', 'dēleō', 'dēlēvī', 'dēlētum'], ['complēre', 'compleō', 'complēvī', 'complētum'],
  ['implēre', 'impleō', 'implēvī', 'implētum'], ['tacēre', 'taceō', 'tacuī', 'tacitum'], ['placēre', 'placeō', 'placuī', 'placitum'],
  ['dēbēre', 'dēbeō', 'dēbuī', 'dēbitum'], ['exercēre', 'exerceō', 'exercuī', 'exercitum'], ['terrēre', 'terreō', 'terruī', 'territum'],
  ['cēnsēre', 'cēnseō', 'cēnsuī', 'cēnsum'],
  // third conjugation
  ['regere', 'regō', 'rēxī', 'rēctum'], ['dīrigere', 'dīrigō', 'dīrēxī', 'dīrēctum'], ['corrigere', 'corrigō', 'corrēxī', 'corrēctum'],
  ['dūcere', 'dūcō', 'dūxī', 'ductum'], ['addūcere', 'addūcō', 'addūxī', 'adductum'], ['dīcere', 'dīcō', 'dīxī', 'dictum'],
  ['benedīcere', 'benedīcō', 'benedīxī', 'benedictum'], ['maledīcere', 'maledīcō', 'maledīxī', 'maledictum'],
  ['mittere', 'mittō', 'mīsī', 'missum'], ['āmittere', 'āmittō', 'āmīsī', 'āmissum'], ['committere', 'committō', 'commīsī', 'commissum'],
  ['permittere', 'permittō', 'permīsī', 'permissum'], ['scrībere', 'scrībō', 'scrīpsī', 'scrīptum'], ['agere', 'agō', 'ēgī', 'āctum'],
  ['cōgere', 'cōgō', 'coēgī', 'coāctum'], ['legere', 'legō', 'lēgī', 'lēctum'], ['colligere', 'colligō', 'collēgī', 'collēctum'],
  ['intellegere', 'intellegō', 'intellēxī', 'intellēctum'], ['neglegere', 'neglegō', 'neglēxī', 'neglēctum'],
  ['vincere', 'vincō', 'vīcī', 'victum'], ['currere', 'currō', 'cucurrī', 'cursum'], ['occurrere', 'occurrō', 'occurrī', 'occursum'],
  ['cadere', 'cadō', 'cecidī', 'cāsum'], ['caedere', 'caedō', 'cecīdī', 'caesum'], ['occīdere', 'occīdō', 'occīdī', 'occīsum'],
  ['pellere', 'pellō', 'pepulī', 'pulsum'], ['expellere', 'expellō', 'expulī', 'expulsum'], ['pōnere', 'pōnō', 'posuī', 'positum'],
  ['compōnere', 'compōnō', 'composuī', 'compositum'], ['petere', 'petō', 'petīvī', 'petītum'], ['quaerere', 'quaerō', 'quaesīvī', 'quaesītum'],
  ['requīrere', 'requīrō', 'requīsīvī', 'requīsītum'], ['tollere', 'tollō', 'sustulī', 'sublātum'], ['ostendere', 'ostendō', 'ostendī', 'ostentum'],
  ['tendere', 'tendō', 'tetendī', 'tentum'], ['contendere', 'contendō', 'contendī', 'contentum'], ['vertere', 'vertō', 'vertī', 'versum'],
  ['convertere', 'convertō', 'convertī', 'conversum'], ['gerere', 'gerō', 'gessī', 'gestum'], ['trahere', 'trahō', 'trāxī', 'trāctum'],
  ['vīvere', 'vīvō', 'vīxī', 'vīctum'], ['cēdere', 'cēdō', 'cessī', 'cessum'], ['discēdere', 'discēdō', 'discessī', 'discessum'],
  ['inclūdere', 'inclūdō', 'inclūsī', 'inclūsum'], ['crēdere', 'crēdō', 'crēdidī', 'crēditum'], ['reddere', 'reddō', 'reddidī', 'redditum'],
  ['trādere', 'trādō', 'trādidī', 'trāditum'], ['vēndere', 'vēndō', 'vēndidī', 'vēnditum'], ['dēfendere', 'dēfendō', 'dēfendī', 'dēfēnsum'],
  ['incendere', 'incendō', 'incendī', 'incēnsum'], ['nōscere', 'nōscō', 'nōvī', 'nōtum'], ['cognōscere', 'cognōscō', 'cognōvī', 'cognitum'],
  ['agnōscere', 'agnōscō', 'agnōvī', 'agnitum'], ['ignōscere', 'ignōscō', 'ignōvī', 'ignōtum'], ['crēscere', 'crēscō', 'crēvī', 'crētum'],
  ['discere', 'discō', 'didicī', null], ['poscere', 'poscō', 'poposcī', null], ['cōnstituere', 'cōnstituō', 'cōnstituī', 'cōnstitūtum'],
  ['statuere', 'statuō', 'statuī', 'statūtum'], ['tribuere', 'tribuō', 'tribuī', 'tribūtum'], ['solvere', 'solvō', 'solvī', 'solūtum'],
  ['relinquere', 'relinquō', 'relīquī', 'relictum'], ['surgere', 'surgō', 'surrēxī', 'surrēctum'], ['frangere', 'frangō', 'frēgī', 'frāctum'],
  ['rumpere', 'rumpō', 'rūpī', 'ruptum'], ['fundere', 'fundō', 'fūdī', 'fūsum'], ['iungere', 'iungō', 'iūnxī', 'iūnctum'],
  ['tangere', 'tangō', 'tetigī', 'tāctum'], ['contingere', 'contingō', 'contigī', 'contāctum'], ['emere', 'emō', 'ēmī', 'ēmptum'],
  ['redimere', 'redimō', 'redēmī', 'redēmptum'], ['sūmere', 'sūmō', 'sūmpsī', 'sūmptum'], ['premere', 'premō', 'pressī', 'pressum'],
  ['opprimere', 'opprimō', 'oppressī', 'oppressum'], ['refellere', 'refellō', 'refellī', null], ['fallere', 'fallō', 'fefellī', 'falsum'],
  // third conjugation in -iō
  ['capere', 'capiō', 'cēpī', 'captum'], ['accipere', 'accipiō', 'accēpī', 'acceptum'], ['incipere', 'incipiō', 'incēpī', 'inceptum'],
  ['facere', 'faciō', 'fēcī', 'factum'], ['efficere', 'efficiō', 'effēcī', 'effectum'], ['interficere', 'interficiō', 'interfēcī', 'interfectum'],
  ['iacere', 'iaciō', 'iēcī', 'iactum'], ['ēicere', 'ēiciō', 'ēiēcī', 'ēiectum'], ['cupere', 'cupiō', 'cupīvī', 'cupītum'],
  ['rapere', 'rapiō', 'rapuī', 'raptum'], ['ēripere', 'ēripiō', 'ēripuī', 'ēreptum'], ['aspicere', 'aspiciō', 'aspexī', 'aspectum'],
  ['fugere', 'fugiō', 'fūgī', null],
  // fourth conjugation
  ['audīre', 'audiō', 'audīvī', 'audītum'], ['venīre', 'veniō', 'vēnī', 'ventum'], ['invenīre', 'inveniō', 'invēnī', 'inventum'],
  ['pervenīre', 'perveniō', 'pervēnī', 'perventum'], ['sentīre', 'sentiō', 'sēnsī', 'sēnsum'], ['aperīre', 'aperiō', 'aperuī', 'apertum'],
  ['reperīre', 'reperiō', 'repperī', 'repertum'], ['scīre', 'sciō', 'scīvī', 'scītum'], ['dormīre', 'dormiō', 'dormīvī', 'dormītum'],
  ['mūnīre', 'mūniō', 'mūnīvī', 'mūnītum'], ['sepelīre', 'sepeliō', 'sepelīvī', 'sepultum'], ['vincīre', 'vinciō', 'vīnxī', 'vīnctum'],
  ['haurīre', 'hauriō', 'hausī', 'haustum'],
  // irregular
  ['esse', 'sum', 'fuī', null], ['posse', 'possum', 'potuī', null], ['prōdesse', 'prōsum', 'prōfuī', null], ['abesse', 'absum', 'āfuī', null],
  ['ferre', 'ferō', 'tulī', 'lātum'], ['afferre', 'afferō', 'attulī', 'allātum'], ['referre', 'referō', 'rettulī', 'relātum'],
  ['īre', 'eō', 'iī', 'itum'], ['redīre', 'redeō', 'rediī', 'reditum'], ['velle', 'volō', 'voluī', null], ['nōlle', 'nōlō', 'nōluī', null],
  ['mālle', 'mālō', 'māluī', null],
];

/** Deponents: first person, perfect (masculine), and the participle. */
const deponents: readonly [string, string, string][] = [
  ['hortārī', 'hortor', 'hortātus sum'], ['loquī', 'loquor', 'locūtus sum'], ['sequī', 'sequor', 'secūtus sum'], ['patī', 'patior', 'passus sum'],
  ['morī', 'morior', 'mortuus sum'], ['ūtī', 'ūtor', 'ūsus sum'], ['nāscī', 'nāscor', 'nātus sum'], ['proficīscī', 'proficīscor', 'profectus sum'],
  ['cōnārī', 'cōnor', 'cōnātus sum'], ['verērī', 'vereor', 'veritus sum'], ['experīrī', 'experior', 'expertus sum'], ['orīrī', 'orior', 'ortus sum'],
  ['ēgredī', 'ēgredior', 'ēgressus sum'], ['prōgredī', 'prōgredior', 'prōgressus sum'], ['aggredī', 'aggredior', 'aggressus sum'],
];

describe('common verbs: principal parts written independently of the engine', () => {
  it('pins the size of the list', () => { expect(verbs.length + deponents.length).toBeGreaterThanOrEqual(100); });

  it.each(verbs)('%s', (infinitive, present, perfect, supine) => {
    expect(forms(infinitive, 'indicative', 'present', 'active', { subject: '1sg' })[0]).toBe(present);
    expect(forms(infinitive, 'indicative', 'perfect', 'active', { subject: '1sg' })).toContain(perfect);
    if (supine !== null) expect(forms(infinitive, 'supine')).toContain(supine);
    expect(conjugate({ language: 'la', infinitive, mood: 'infinitive', tense: 'present' } as never).analysis.assumptions, infinitive).toEqual([]);
  });

  it.each(deponents)('%s', (infinitive, present, perfect) => {
    expect(forms(infinitive, 'indicative', 'present', 'active', { subject: '1sg' })[0]).toBe(present);
    expect(forms(infinitive, 'indicative', 'perfect', 'active', { subject: '1sg.m' })).toContain(perfect);
    expect(conjugate({ language: 'la', infinitive, mood: 'infinitive', tense: 'present' } as never).analysis.assumptions, infinitive).toEqual([]);
  });
});
