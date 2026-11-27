# Italian grammar: rules, defaults and limits

The Italian pack (`src/languages/it/`) builds every form from recorded rules and explains each step in English and Dutch,
with a citation per rule. The rules come from Treccani's *La grammatica italiana* and *Enciclopedia dell'Italiano*. The
lexicon comes from the Treccani *Vocabolario*: every entry's header was read on the page (`verification.ts` records the
page and the day). Serianni's *Grammatica italiana* (cap. XI) is cited only beside a Treccani page, and its paragraph
numbers are unverified. The DOP was not consulted.

## How a form is built

- **Classification.** The verb is classified in this order, and every decision records a step (`it.classify.*`):
  1. normalisation (the Vocabolario's stress marks are stripped from the input);
  2. a reflexive `-rsi`;
  3. the lexicon;
  4. a family: a suffix family (`-durre`, `-porre`, `-trarre`, `-cludere`, `-sistere`, `-primere`, …) or a prefix before a lexicon verb of six letters or more, with the doubled consonant of assimilation;
  5. the look-alikes, which are not derived;
  6. the ending;
  7. the side lists: `-isc-`, auxiliaries, stressed `-iare`, palatal c;
  8. the defaults, each an assumption;
  9. the hints.

  A verb with and without `-isc-` (mentire) has two paradigms, `plain` and `isc`.
- **A cell.** A word is built as stem (infinitive, long stem of a shortened infinitive, `-isc-`, lexical stem, the stem of io or of noi for the present subjunctive, strong passato remoto, future stem), then ending, then the spelling rules in order: `velar-h`, `palatal-i-drop`, `i-merge`, `participle-ci`, `final-accent`.
  - Whole words from the lexicon (sono, fa', dite) record `it.cell.lexical`. A derived verb's whole word also records its prefix (`it.cell.prefix`: rifa) and the written accent (rifà).
  - Where the Vocabolario prints a regular form beside an irregular one (visto o veduto), the lexicon holds `*` and the regular form is derived by rule.
- **Compound tenses.** The nine compound tenses are the verb's auxiliary plus the past participle (`it.periphrasis.*`).
  - With essere (every reflexive verb, and the derivatives of an essere-only base) the participle agrees with the subject in gender and number. The masculine and the feminine forms are both generated, as separate forms of one target with `target.agreement`.
  - With avere the participle stays in -o.
  - A verb with two auxiliaries gives both, each with its condition.
- **The clause.**
  - The subject pronoun comes first: io … loro, and Lei and Loro as courtesy slots in the third person, not default. The bare rendering drops it (pro-drop).
  - A reflexive pronoun goes before a finite verb, after the imperative (lavati, fatti with the doubled consonant), and after the infinitive and the gerund (lavarsi, essersi lavato).
  - The negative imperative of tu is non + infinitive, with both clitic orders: non ti lavare / non lavarti.

## Subjects and gender

Only lui and lei carry a gender (`genderedTargets`). Every other slot shows gender only in an agreeing participle, which the clause forks. Italian does not use the core's `clause.subjectGenders`, because its gender-bearing subjects are separate slots (lui, lei). With `gender: 'feminine'`, lui and the masculine agreements are left out.

## Defaults and assumptions

| Default | Assumption | Hint that replaces it |
|---|---|---|
| regular, no strong forms | `it.classify.assume-regular` | `stems.past`, `stems.participle`, `stems.future` |
| -ire with -isc- | `it.classify.assume-isc` | `classHint: 'plain'` |
| auxiliary avere | `it.classify.assume-avere` | `auxiliary: 'essere'` |
| unstressed i in -iare | `it.classify.assume-unstressed-i` | `stems.stressedI: true` |
| an unlisted verb follows its apparent base or family | `it.classify.assume-family` | — |

## Availability

`availability` is the only place a form is declared missing:

- weather verbs (piovere, nevicare, grandinare, piovigginare): third person singular only, both auxiliaries, masculine singular participle (`it.avail.impersonal`). With `gender: 'feminine'` a weather verb keeps no finite form, because lui is filtered out and every other subject is unavailable. It keeps its masculine non-finite forms: the participle of a verb without a subject does not agree;
- potere, dovere, parere, solere: no imperative (`it.avail.no-imperative`);
- sapere, potere, parere: no present participle;
- solere: only the simple indicative (not the future), the subjunctive, the present infinitive and solito (`it.avail.defective`).

## Corpus and oracles

- **Scraped corpus:** 20 pages, 1,920 cells (1,900 compared, 20 unmodelled compound participles, 20 template placeholders), 3 remaps, 67 sourced corrections. Each correction cites a Treccani page read for this pack:
  - essere's compound tenses rebuilt with essere;
  - the doublets the page omits (deva, fo, faciente);
  - the forms the page gets wrong (dànno, vò, volsi, sapete, tradunente, tradunendo, venente);
  - the forms the Vocabolario says are missing (sapiente, potente, dovere's imperative).
- **Authority cells:** 10 files, 442 cells of forms printed by Treccani pages (`tests/goldens/it/authority/`). The Serianni file is empty.
- **Second oracle:** en.wiktionary tables for 63 pinned pages, 3,361 cells (6 unmodelled reflexive participles with enclitic), in `tests/fixtures/wiktionary-it.json` (CC BY-SA 4.0, English Wiktionary contributors; each page's title, revision and history URL recorded). They are compared through an 8-rule ledger (`scripts/corpus/corrections/wiktionary-it.ts`), each rule citing a Treccani page. The oracle found five engine defects, which were fixed in the engine with tests:
  - the future of verbs with two unstressed stems (cuocerò);
  - three present participles (udiente, dormiente, offerente);
  - three intransitive essere uses (cuocere, muovere, seguire).

## Limits

Not generated:
- the passive;
- stare + gerund and the other periphrases;
- object clitics;
- pronominal verbs with ne or la (andarsene, farcela: rejected);
- the elided reflexive (m'alzo);
- the participle with enclitic (lavatosi);
- forms the Vocabolario marks ant., poet., pop., dial., tosc.;
- optional pronunciation accents (dànno);
- the transitive regular conjugation of riandare;
- the second sense of ripartire (to leave again).

Present participles are generated by rule for verbs that rarely use them. The trainer should not drill them.

## Rule inventory

| Rule | Stage | Kind | Message (en) | Citation |
|---|---|---|---|---|
| `it.classify.lexicon` | classify | lexical | {before} is in the lexicon, which gives the forms it does not build by the rules. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.conjugation` | classify | rule | {before} ends in -{ending}: it follows the -{ending} conjugation. | [Enciclopedia dell'Italiano, Coniugazione verbale (R. Cimaglia, 2010), §2.1](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.classify.contracted` | classify | lexical | {before} is a shortened infinitive; its other forms are built on the long stem {stem}-. | [Enciclopedia dell'Italiano, Coniugazione verbale, §4 (porre < ponere, condurre < conducere)](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.classify.reflexive` | classify | rule | {before} ends in -si: a reflexive verb, conjugated like {after} with mi, ti, si, ci, vi, si. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/) |
| `it.classify.reflexive-essere` | classify | rule | Reflexive verbs always form their compound tenses with essere. | [Enciclopedia dell'Italiano, Ausiliari, verbi (R. Cimaglia, 2010), §3](https://www.treccani.it/enciclopedia/verbi-ausiliari_(Enciclopedia-dell'Italiano)/) |
| `it.classify.family` | classify | rule | {before} is {prefix} + {base}: it is conjugated like {base}. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.suffix-family` | classify | rule | {before} ends in -{suffix}: it is conjugated like {model}. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/); [Enciclopedia dell'Italiano, Coniugazione verbale, §4](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.classify.prefix-doubling` | classify | rule | After {prefix}- the first consonant of {base} is doubled: {after}. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.derived-differently` | classify | lexical | {before} comes from {base} but is not conjugated like it. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.assume-family` | classify | assumption | {before} is not in the lexicon: assuming it is conjugated like {base}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §4](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.classify.no-inherit` | classify | lexical | {before} only looks like {base} with a prefix; it is conjugated on its own. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.assume-regular` | classify | assumption | {before} is not in the lexicon: assuming it is regular. | [Enciclopedia dell'Italiano, Coniugazione verbale, §4.1](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.classify.isc` | classify | lexical | {before} adds -isc- in the forms stressed on the stem. | [La grammatica italiana, Incoativi, verbi](https://www.treccani.it/enciclopedia/verbi-incoativi_(La-grammatica-italiana)/) |
| `it.classify.no-isc` | classify | lexical | {before} does not add -isc-. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/); [La grammatica italiana, Terza coniugazione](https://www.treccani.it/enciclopedia/terza-coniugazione_(La-grammatica-italiana)/) |
| `it.classify.isc-both` | classify | lexical | {before} has forms with and without -isc-. | [La grammatica italiana, Terza coniugazione](https://www.treccani.it/enciclopedia/terza-coniugazione_(La-grammatica-italiana)/) |
| `it.classify.assume-isc` | classify | assumption | Assuming {before} adds -isc-, as most verbs in -ire do. | [Enciclopedia dell'Italiano, Coniugazione verbale, §4.1](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.classify.auxiliary` | classify | lexical | {before} forms its compound tenses with {auxiliary}. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.auxiliaries` | classify | lexical | {before} forms its compound tenses with {first} or {second}, depending on the use; each form says which use it has. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/); [Enciclopedia dell'Italiano, Ausiliari, verbi, §3](https://www.treccani.it/enciclopedia/verbi-ausiliari_(Enciclopedia-dell'Italiano)/) |
| `it.classify.assume-inherit-auxiliary` | classify | assumption | Assuming {before} takes {auxiliary} in its compound tenses, like {base}. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.classify.assume-avere` | classify | assumption | Assuming {before} forms its compound tenses with avere, like most verbs. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/) |
| `it.classify.stressed-i` | classify | lexical | In {before} the i of the stem is stressed (io {after}), so it is kept before another i. | [La grammatica italiana, Prima coniugazione](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.classify.assume-unstressed-i` | classify | assumption | Assuming the i of {before} is not stressed, as in studiare. | [La grammatica italiana, Prima coniugazione](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.classify.hint` | classify | rule | Following your hint: {hint}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2–4](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.avail.no-imperative` | availability | unavailable | This verb has no imperative. | [Vocabolario Treccani, s.v. potere](https://www.treccani.it/vocabolario/potere2/); [Vocabolario Treccani, s.v. dovere](https://www.treccani.it/vocabolario/dovere2/) |
| `it.avail.impersonal` | availability | unavailable | This verb is impersonal: it is used only in the third person singular. | [Enciclopedia dell'Italiano, Ausiliari, verbi, §3 (verbi atmosferici)](https://www.treccani.it/enciclopedia/verbi-ausiliari_(Enciclopedia-dell'Italiano)/); [Vocabolario Treccani, s.v. piovere](https://www.treccani.it/vocabolario/piovere/) |
| `it.avail.defective` | availability | unavailable | This verb has no {mood} {tense}. | [Vocabolario Treccani, s.v. sapere](https://www.treccani.it/vocabolario/sapere2/); [Vocabolario Treccani, s.v. parere](https://www.treccani.it/vocabolario/parere2/); [Vocabolario Treccani, s.v. potere](https://www.treccani.it/vocabolario/potere2/); [Vocabolario Treccani, s.v. solere](https://www.treccani.it/vocabolario/solere/) |
| `it.stem.infinitive` | stem | rule | Remove -{ending} from {before}: the stem is {after}-. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2.1](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.stem.long` | stem | rule | This form is built on the long stem {after}-. | [Enciclopedia dell'Italiano, Coniugazione verbale, §4](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.stem.isc` | stem | rule | Add -isc- in the forms stressed on the stem: {before} → {after}. | [La grammatica italiana, Incoativi, verbi](https://www.treccani.it/enciclopedia/verbi-incoativi_(La-grammatica-italiana)/) |
| `it.stem.lexical` | stem | lexical | The lexicon gives the stem {after}- for this form. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.stem.subjunctive-from-1sg` | stem | rule | The present subjunctive is built on the stem of io {base}: {after}-. | [Vocabolario Treccani, s.v. venire](https://www.treccani.it/vocabolario/venire/); [Vocabolario Treccani, s.v. uscire](https://www.treccani.it/vocabolario/uscire/); [Vocabolario Treccani, s.v. salire](https://www.treccani.it/vocabolario/salire/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.stem.subjunctive-from-1pl` | stem | rule | The noi and voi forms of the present subjunctive are built on noi {base}: {after}-. | [Vocabolario Treccani, s.v. dovere](https://www.treccani.it/vocabolario/dovere2/); [Vocabolario Treccani, s.v. sapere](https://www.treccani.it/vocabolario/sapere2/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.stem.strong-past` | stem | lexical | Strong passato remoto: io, lui/lei and loro use the stem {after}-. | [Enciclopedia dell'Italiano, Passato remoto (E. Wiberg, 2011), §2b](https://www.treccani.it/enciclopedia/passato-remoto_(Enciclopedia-dell'Italiano)/) |
| `it.stem.future` | stem | rule | The future and the conditional are built on the infinitive without its final -e: {after}-. | [Enciclopedia dell'Italiano, Coniugazione verbale, §3d](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.stem.future-syncope` | stem | lexical | The future and the conditional of this verb use the short stem {after}-. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/); [Enciclopedia dell'Italiano, Sincope (L. Romito, 2011), §3](https://www.treccani.it/enciclopedia/sincope_(Enciclopedia-dell'Italiano)/) |
| `it.stem.strong-participle` | stem | lexical | Irregular past participle: it is built on {after}-. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.stem.palatal` | stem | lexical | The c of {before} stays soft before a and o, so it is written ci: {after}-. | [La grammatica italiana, Seconda coniugazione](https://www.treccani.it/enciclopedia/seconda-coniugazione_(La-grammatica-italiana)/); [Vocabolario Treccani, s.v. cuocere](https://www.treccani.it/vocabolario/cuocere/) |
| `it.cell.lexical` | stem | lexical | {after} is an irregular form that has to be learnt. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.cell.prefix` | stem | rule | {after} is the prefix {prefix}- with {before}, the irregular form of {base}. | [Vocabolario Treccani, the verb's own entry (header)](https://www.treccani.it/vocabolario/) |
| `it.end.present` | ending | rule | Present, {person} {number}: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.imperfect` | ending | rule | Imperfetto: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.past` | ending | rule | Passato remoto: add -{ending}. | [Enciclopedia dell'Italiano, Passato remoto, §2a](https://www.treccani.it/enciclopedia/passato-remoto_(Enciclopedia-dell'Italiano)/) |
| `it.end.past-etti` | ending | rule | Passato remoto, the equally common -etti series: add -{ending}. | [La grammatica italiana, Seconda coniugazione](https://www.treccani.it/enciclopedia/seconda-coniugazione_(La-grammatica-italiana)/) |
| `it.end.past-strong` | ending | rule | Strong passato remoto: add -{ending} to the strong stem. | [Enciclopedia dell'Italiano, Passato remoto, §2b](https://www.treccani.it/enciclopedia/passato-remoto_(Enciclopedia-dell'Italiano)/) |
| `it.end.future` | ending | rule | Future: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §3d](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.future-ar-er` | ending | rule | In the future and the conditional, -are verbs use -e- instead of -a-: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §3d (amare habeo > amarò > amerò)](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.conditional` | ending | rule | Conditional: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §3e](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.subjunctive-present` | ending | rule | Present subjunctive: add -{ending}. | [La grammatica italiana, Prima coniugazione (ripudino)](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.end.subjunctive-imperfect` | ending | rule | Imperfect subjunctive: add -{ending}. | [La grammatica italiana, Congiuntivo](https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.end.imperative` | ending | rule | Imperative: add -{ending}. | [La grammatica italiana, Imperativo](https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/); [Enciclopedia dell'Italiano, Coniugazione verbale, §2.3](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.imperative-subjunctive` | ending | rule | This imperative form is the present subjunctive: {after}. | [La grammatica italiana, Imperativo](https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/) |
| `it.end.infinitive` | ending | rule | Infinitive: {after}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2.1](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/) |
| `it.end.gerund` | ending | rule | Gerund: add -{ending}. | [Enciclopedia dell'Italiano, Coniugazione verbale, §2](https://www.treccani.it/enciclopedia/coniugazione-verbale_(Enciclopedia-dell'Italiano)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.end.present-participle` | ending | rule | Present participle: add -{ending}. | [La grammatica italiana, Terza coniugazione (-ente / -iente)](https://www.treccani.it/enciclopedia/terza-coniugazione_(La-grammatica-italiana)/) |
| `it.end.participle` | ending | rule | Past participle: add -{ending}. | [La grammatica italiana, Concordanza](https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.orth.velar-h` | orthography | rule | The letters c and g keep their hard sound before e and i, so they are written {letter}h: {before} becomes {after}. | [La grammatica italiana, Prima coniugazione](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.orth.palatal-i-drop` | orthography | rule | The i after c or g only marks the soft sound; before e and i it is not written: {before} becomes {after}. | [La grammatica italiana, Prima coniugazione](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.orth.i-merge` | orthography | rule | The unstressed i of the stem and the i of the ending are written once: {before} becomes {after}. | [La grammatica italiana, Prima coniugazione](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.orth.stressed-i-kept` | orthography | rule | The i of the stem is stressed here, so both i's are written: {after}. | [La grammatica italiana, Prima coniugazione (invìi, scìino)](https://www.treccani.it/enciclopedia/prima-coniugazione_(La-grammatica-italiana)/) |
| `it.orth.participle-ci` | orthography | rule | Before -uto the c keeps its soft sound with an i: {before} becomes {after}. | [La grammatica italiana, Seconda coniugazione (taciuto, cresciuto)](https://www.treccani.it/enciclopedia/seconda-coniugazione_(La-grammatica-italiana)/) |
| `it.orth.final-accent` | orthography | rule | A word of several syllables stressed on its last vowel is written with an accent: {before} becomes {after}. | [Enciclopedia dell'Italiano, Accento grafico (S. Demartini; A. Viviani, 2010), §1](https://www.treccani.it/enciclopedia/accento-grafico_(Enciclopedia-dell'Italiano)/) |
| `it.periphrasis.perfect` | periphrasis | rule | Passato prossimo: the present of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/) |
| `it.periphrasis.pluperfect` | periphrasis | rule | Trapassato prossimo: the imperfetto of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere? (mi ero vestito)](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.periphrasis.past-anterior` | periphrasis | rule | Trapassato remoto: the passato remoto of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.periphrasis.future-perfect` | periphrasis | rule | Futuro anteriore: the future of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.periphrasis.subjunctive-past` | periphrasis | rule | Congiuntivo passato: the present subjunctive of {auxiliary} plus the past participle. | [La grammatica italiana, Congiuntivo](https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/) |
| `it.periphrasis.subjunctive-pluperfect` | periphrasis | rule | Congiuntivo trapassato: the imperfect subjunctive of {auxiliary} plus the past participle. | [La grammatica italiana, Congiuntivo](https://www.treccani.it/enciclopedia/congiuntivo_(La-grammatica-italiana)/) |
| `it.periphrasis.conditional-past` | periphrasis | rule | Condizionale passato: the conditional of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.periphrasis.infinitive-past` | periphrasis | rule | Past infinitive: {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.periphrasis.gerund-past` | periphrasis | rule | Past gerund: the gerund of {auxiliary} plus the past participle. | [La grammatica italiana, Avere o essere?](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.clause.subject` | clause | rule | Subject pronoun {pronoun}; in Italian it is often left out. | [Enciclopedia dell'Italiano, Soggetto (M. Palermo, 2011), §7.1](https://www.treccani.it/enciclopedia/soggetto_(Enciclopedia-dell'Italiano)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.clause.formal-subject` | clause | rule | Polite address: {pronoun} takes the verb in the third person. | [La grammatica italiana, Imperativo](https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/); Grammatica italiana. Italiano comune e lingua letteraria, cap. XI, Il verbo (unverified) |
| `it.clause.agree-subject` | clause | rule | With essere the past participle agrees with the subject: {gender} {number}. | [La grammatica italiana, Concordanza](https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/) |
| `it.clause.avere-invariable` | clause | rule | With avere the past participle does not change: it ends in -o. | [La grammatica italiana, Concordanza](https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/) |
| `it.clause.participle-forms` | clause | rule | Past participle, {gender} {number}. | [La grammatica italiana, Concordanza](https://www.treccani.it/enciclopedia/concordanza_(La-grammatica-italiana)/) |
| `it.clause.reflexive-pronoun` | clause | rule | The reflexive pronoun {pronoun} goes before the verb. | [La grammatica italiana, Avere o essere? (mi sono lavato)](https://www.treccani.it/enciclopedia/avere-o-essere_(La-grammatica-italiana)/) |
| `it.clause.enclitic` | clause | rule | The pronoun {pronoun} is attached to the end of the verb: {before} becomes {after}. | [Enciclopedia dell'Italiano, Parole enclitiche (L. Gaeta, 2011), §2–3](https://www.treccani.it/enciclopedia/parole-enclitiche_(Enciclopedia-dell'Italiano)/) |
| `it.clause.infinitive-e-drop` | clause | rule | Before an attached pronoun the infinitive loses its final -e (-re after rr): {before} becomes {after}. | [Enciclopedia dell'Italiano, Parole enclitiche, §3 (farlo)](https://www.treccani.it/enciclopedia/parole-enclitiche_(Enciclopedia-dell'Italiano)/) |
| `it.clause.enclitic-doubling` | clause | rule | After a one-syllable imperative the apostrophe goes and the first consonant of {pronoun} doubles: {before} becomes {after}. | [Enciclopedia dell'Italiano, Parole enclitiche, §2](https://www.treccani.it/enciclopedia/parole-enclitiche_(Enciclopedia-dell'Italiano)/); [Vocabolario Treccani, s.v. enclisi](https://www.treccani.it/vocabolario/enclisi/); [Enciclopedia dell'Italiano, Clitici (C. Schwarze, 2010), §3.1 (not gli)](https://www.treccani.it/enciclopedia/clitici_(Enciclopedia-dell'Italiano)/) |
| `it.clause.negative-infinitive` | clause | rule | Negative imperative for tu: non plus the infinitive. | [La grammatica italiana, Imperativo](https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/) |
| `it.clause.negative` | clause | rule | Negative imperative: non before the imperative form. | [La grammatica italiana, Imperativo](https://www.treccani.it/enciclopedia/imperativo_(La-grammatica-italiana)/) |
