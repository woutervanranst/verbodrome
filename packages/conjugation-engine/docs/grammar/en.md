# English grammar: rules, defaults and limits

English runs on the staged core (`src/languages/en/`): every form is derived by recorded rules, and every step explains
itself in English and Dutch with its source. The lexical authorities are the
[Longman Dictionary of Contemporary English](https://www.ldoceonline.com/) (LDOCE) and the
[American Heritage Dictionary](https://www.ahdictionary.com/) (AHD, 5th ed.); the spelling rules follow the Department
for Education's [National Curriculum English Appendix 1: Spelling](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf)
and the University of Twente's [English Style Guide](https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/);
the verb system follows Huddleston and Pullum, *The Cambridge Grammar of the English Language* (CGEL), cited by chapter.
Oxford Learner's Dictionaries, Merriam-Webster and Cambridge refuse automated reading: nothing here was verified there.
A rule is never cited to the scraped corpus.

## How a form is built

- **Classification** (`classify.ts`, `lexicon.ts`): the infinitive without a leading `to`, one word of plain letters;
  modal verbs (must, ought, shall, should, would, could, might, may) are refused. A listed irregular verb gives one
  paradigm, or two for hang, lie and shine (hung / hanged; lay / lied; shone / shined), each tagged with its pattern
  and meaning. An unlisted verb that is a prefix (under, inter, fore, over, with, mis, out, for, off, pre, sub, be, re,
  un, up, in; at most two) plus a listed verb inherits that verb's first paradigm, unmarked forms only (outswim:
  outswam, outswum; never a regional, dated or literary variant of the base). Verbs that look prefixed but are regular
  are listed (behave, belie, befit, refit, outfit, relay, welcome, belay, reprove, retread). Any other verb is regular,
  with the assumption recorded, unless a side list records it.
- **Hints**: `classHint` keeps the regular or the irregular forms; `stems` gives an unknown verb its past and past
  participle; `stress` and `sEnding` decide what spelling cannot show. A hint overrides an assumption; a hint that
  contradicts a recorded fact (the listed stress of begin, the -s of demo) is an `INVALID_HINT`, and so is a query
  whose `region` and class hint leave no form.
- **Cells** (`stems.ts`, `paradigms.ts`): be's present and past and its irrealis were, has, and the listed past and
  past participle forms are whole words; a regular form beside a listed one (betted beside bet) is derived by the
  stages (`deriveWords`). Otherwise the plain form takes ∅, -s, -ed or -ing.
- **Spelling** (`orthography.ts`), in order: -es after a sibilant sound and after consonant + o; y → i; ie → y before
  -ing; -ed after e adds -d; the silent e drops before -ing; c → ck; consonant doubling in a stressed last syllable (or
  in a verb listed as always doubling); the British final l. c → ck, doubling and the British l read only a stem no
  earlier rule changed (facing, becoming). Regional and older spellings come out as tagged variants.
- **Compound tenses** (`periphrasis.ts`): have, be, will, would, let's and to with the plain form, the -ing form or
  the past participle (18 recipes). A compound form never mixes British and American words.
- **Clause** (`clause.ts`): the subject pronoun before the verb chain; none in the imperative.
- **Availability**: no English verb in scope is defective; nothing is declared unavailable.

## Labels: region and usage

- A form is `GB` or `US` only where a dictionary marks it so: LDOCE's "(especially) British English" / "(especially)
  American English" (learnt, spelt, leapt, quitted are GB; gotten, dove, proven, snuck, pled, kneeled are US). The British
  final l (travelled / traveled) is a rule of the spelling sources and tags the two spellings it makes.
- A form both dictionaries print without a label is standard; LDOCE's order is the order of preference.
- A form only one dictionary prints (AHD's "X or Y" second choices such as sung, shrunk, stunk, stricken, strived,
  awaked, waked, forgot as participle; a form only LDOCE's verb table shows, such as shoed) and the forms marked old
  (writ, smote, begot) are `usage: 'dated'`: accepted as an answer, never preferred, never inherited.
- LDOCE's literary forms (bade, bidden, hewn) are `usage: 'literary'`.
- `region: 'GB' | 'US'` keeps only the forms of that region and those without one, and ranks that region first; British
  is preferred by default.

## Side lists

| List | Members | What it decides |
|---|---|---|
| finalStress | abet, abhor, acquit, admit, allot, annul, appal, commit, compel, concur, confer, control, corral, defer, deter, dispel, distil, emit, enrol, equip, excel, expel, extol, fulfil, impel, incur, infer, instil, nonplus, occur, omit, patrol, permit, prefer, propel, rebel, recur, refer, regret, remit, repel, submit, transfer, transmit | doubling (preferred, controlled) |
| nonFinalStress | bevel, combat, conquer, debit, devil, enter, interpret, profit, prosper, revel | no doubling; British l (entered, devilled / deviled) |
| doublesUnstressed | babysit, eavesdrop, format, handicap, input, kidnap, output, program, retrofit, sidestep, typeset, worship, zigzag | doubling without stress |
| consonantVariants | kidnap, worship, corral (single consonant US); program, nonplus (single consonant dated); bus (single preferred: bused, bussed) | the other spelling |
| noDoubling | debut | silent final t (debuted) |
| keepsE / keepsEBritish | be, singe / age | being, singeing / aging, ageing (GB) |
| plainS / takesEs / sVariant | solo, demo, disco, photo, ditto, stomach / veto, echo, psych, tango / tango | -s or -es (demos, stomachs; vetoes, psyches; tangoes, tangos) |
| lNotDoubled | parallel | paralleled, with the British variant parallelled |
| notModal / mostlyImperative | can, will / beware | a note in the analysis |

## Defaults and assumptions

- `en.classify.assume-regular`: an unknown verb is regular (-ed).
- `en.classify.assume-final-stress` / `assume-nonfinal-stress`: where doubling or the British l depends on stress and no
  list records it, a prefix + one-syllable root (re·blit) is assumed stressed on the root, anything else on an earlier
  syllable. The `stress` hint overrides both.
- `en.classify.assume-es`: an unknown verb ending in consonant + o, or in ch after a single vowel (attach), is assumed
  to take -es; the `sEnding` hint overrides it. Spelling decides -tch, consonant + ch and vowel pair + ch (/tʃ/).

## Lexicon verification

The 186 irregular entries and every side-list verb were read in LDOCE and AHD at
`https://www.ldoceonline.com/dictionary/<lemma>` and `https://www.ahdictionary.com/word/search.html?q=<lemma>` (2026-11-24
and 2026-11-25); `src/languages/en/sources.ts` records each verb (`lexiconChecked`, `sideListsChecked`,
`derivativesChecked`) and the explanation of a lexicon step says when only one dictionary was read. Checked in one
dictionary only (secondary source only):

| Verb | Why |
|---|---|
| appal | AHD has no entry for the British spelling; LDOCE only. |
| typeset, breastfeed, ghostwrite | LDOCE has no entry under these spellings; AHD only. |
| nonplus, devil, bevel, disco, photo, ditto, retread, inlay | LDOCE has no verb entry; AHD only. |
| preset | LDOCE's verb entry prints no forms; AHD only. |
| demo | AHD prints no forms for the verb; LDOCE's verb table only. |

## Rule inventory

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `en.classify.lexicon` | lexical | {before} is in the list of irregular verbs: past {past}, past participle {participle}{source, select, ahd { (checked in the American Heritage Dictionary only)} ldoce { (checked in the Longman Dictionary only)} other {}}. | [LDOCE swim, verb entry header: past tense, past participle](https://www.ldoceonline.com/dictionary/swim); [AHD swim, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=swim) |
| `en.classify.suppletive` | lexical | {before} is completely irregular: its forms are listed one by one. | CGEL ch. 3 "The verb"; [AHD be, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=be) |
| `en.classify.homograph` | lexical | This paradigm of {before} means "{paradigm, select, hung {hang up, be suspended} hanged {kill by hanging} lay {be flat, be situated} lied {say something untrue} shone {give out light} shined {polish} other {{paradigm}}}". | [LDOCE hang, verb entry, sense 3 "hanged"](https://www.ldoceonline.com/dictionary/hang); [AHD hang, verb, transitive sense 3 "hanged"](https://www.ahdictionary.com/word/search.html?q=hang) |
| `en.classify.prefixed` | rule | {before} is {prefix}- + {base}, so it is irregular like {base}: {prefix}- + the forms of {base}. | Quirk et al. Appendix I, Word-formation: prefixation; [AHD overcome, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=overcome); [LDOCE overcome, verb entry header](https://www.ldoceonline.com/dictionary/overcome) |
| `en.classify.no-inherit` | lexical | {before} looks like {prefix}- + {base} but is a regular verb{source, select, ahd { (checked in the American Heritage Dictionary only)} ldoce { (checked in the Longman Dictionary only)} other {}}. | [AHD behave, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=behave); [LDOCE behave, verb table](https://www.ldoceonline.com/dictionary/behave); [AHD relay, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=relay) |
| `en.classify.listed-regular` | lexical | {before} is a regular verb (-ed); the lexicon lists it for its spelling{source, select, ahd { (checked in the American Heritage Dictionary only)} ldoce { (checked in the Longman Dictionary only)} other {}}. | [LDOCE kidnap, verb entry header](https://www.ldoceonline.com/dictionary/kidnap); [AHD kidnap, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=kidnap) |
| `en.classify.assume-regular` | assumption | Assuming {before} is regular (-ed): it is not in the list of irregular verbs. | CGEL ch. 18 "Inflectional morphology and related matters"; CGEL ch. 3 "The verb" |
| `en.classify.hint-regular` | rule | You asked for the regular forms of {before}. | CGEL ch. 3 "The verb" |
| `en.classify.hint-irregular` | rule | You gave the past {past} and the past participle {participle} of {before}. | CGEL ch. 3 "The verb" |
| `en.classify.stress-listed` | lexical | {before} is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}. | [LDOCE prefer, pronunciation and inflected forms](https://www.ldoceonline.com/dictionary/prefer); [AHD prefer, pronunciation and inflected forms](https://www.ahdictionary.com/word/search.html?q=prefer) |
| `en.classify.stress-hint` | rule | You said {before} is stressed on {stress, select, final {its last syllable} other {an earlier syllable}}. | [DfE Appendix 1 p. 11, Years 3–4: adding vowel suffixes to words of more than one syllable](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.classify.assume-final-stress` | assumption | Assuming the last syllable of {before} is stressed: it looks like the prefix {prefix}- plus a one-syllable root. | [DfE Appendix 1 p. 11, Years 3–4: adding vowel suffixes to words of more than one syllable](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf); CGEL ch. 18 "Inflectional morphology and related matters" |
| `en.classify.assume-nonfinal-stress` | assumption | Assuming the last syllable of {before} is not stressed: spelling does not show stress. | [DfE Appendix 1 p. 11, Years 3–4: the consonant is not doubled if the syllable is unstressed](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.classify.keeps-e` | lexical | {before} keeps its final e before -ing. | [DfE Appendix 1 p. 8, Year 2: adding -ing to a word ending in -e, "Exception: being"](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf); [AHD singe, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=singe) |
| `en.classify.doubles-unstressed` | lexical | {before} doubles its last consonant although its last syllable is not stressed. | [UT style guide doubling of consonants: formatted, handicapped, kidnapped, worshipped](https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/); [LDOCE kidnap, verb entry header](https://www.ldoceonline.com/dictionary/kidnap); [AHD program, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=program) |
| `en.classify.l-not-doubled` | lexical | {before} keeps one l before -ed and -ing; British spelling may also double it. | [UT style guide doubling of a final -l: exception parallel, paralleled](https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/) |
| `en.classify.plain-s` | lexical | {before} takes only -s in the 3rd person singular. | [AHD solo, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=solo); [LDOCE stomach, verb table: stomachs](https://www.ldoceonline.com/dictionary/stomach); [AHD disco, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=disco) |
| `en.classify.assume-es` | assumption | {letters, select, o {Assuming -s is written -es after the final o of {before}: some verbs in -o take only -s (demos).} other {Assuming the ch of {before} sounds as in church, so -s is written -es: when ch sounds like k the verb takes only -s (stomachs).}} | [DfE Appendix 1 p. 3, Year 1: adding s and es to words](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf); [LDOCE veto, verb entry header](https://www.ldoceonline.com/dictionary/veto); [AHD tango, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=tango); [LDOCE stomach, verb table: stomachs](https://www.ldoceonline.com/dictionary/stomach) |
| `en.classify.es-hint` | rule | You said {before} takes -{ending} in the 3rd person singular. | [DfE Appendix 1 p. 3, Year 1: adding s and es to words](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.classify.silent-consonant` | lexical | The last letter of {before} is not pronounced, so it is never doubled. | [LDOCE debut, verb table: debuted](https://www.ldoceonline.com/dictionary/debut); [AHD debut, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=debut) |
| `en.classify.not-modal` | lexical | {before} is conjugated here as an ordinary verb ({before, select, can {to put food in cans} other {to make something happen by wanting it very hard}}), not as the modal verb. | [LDOCE can, can³, verb: canned](https://www.ldoceonline.com/dictionary/can); [LDOCE will, will³, verb: willed](https://www.ldoceonline.com/dictionary/will); [AHD can, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=can) |
| `en.classify.mostly-imperative` | lexical | {before} is used mostly in the imperative and the to-infinitive (Beware of the dog!); its other forms are rare. | [LDOCE beware, verb [intransitive, transitive only in imperative and infinitive]](https://www.ldoceonline.com/dictionary/beware) |
| `en.cell.past-listed` | lexical | The past of {before} is {after}. | [LDOCE swim, verb entry header: past tense](https://www.ldoceonline.com/dictionary/swim); [AHD swim, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=swim) |
| `en.cell.participle-listed` | lexical | The past participle of {before} is {after}. | [LDOCE swim, verb entry header: past participle](https://www.ldoceonline.com/dictionary/swim); [AHD swim, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=swim) |
| `en.cell.has` | lexical | The 3rd person singular present of have is {after}. | [AHD have, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=have); [LDOCE have, auxiliary entry header: third person singular has](https://www.ldoceonline.com/dictionary/have) |
| `en.cell.be` | lexical | {tense} of be, {person} {number}: {after}. | CGEL ch. 3 "The verb"; [AHD be, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=be) |
| `en.cell.irrealis-were` | lexical | In the past subjunctive be is were for every person. | [AHD were, entry: past subjunctive of be](https://www.ahdictionary.com/word/search.html?q=were); CGEL ch. 3 "The verb" |
| `en.end.present-plain` | rule | Present, {person} {number}: the plain form {after}, no ending. | CGEL ch. 3 "The verb" |
| `en.end.third-s` | rule | Present, 3rd person singular: add -s to {before}. | [DfE Appendix 1 p. 3, Year 1: adding s and es to words (plural of nouns and the third person singular of verbs)](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.end.past-ed` | rule | Regular past: add -ed to {before}. | [DfE Appendix 1 p. 3, Year 1: adding the endings -ing, -ed and -er to verbs](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.end.irrealis-past` | rule | The past subjunctive has the same form as the past tense. | CGEL ch. 3 "The verb" |
| `en.end.subjunctive-plain` | rule | The present subjunctive is the plain form {after} for every person. | CGEL ch. 3 "The verb" |
| `en.end.imperative-plain` | rule | The imperative is the plain form {after}. | CGEL ch. 3 "The verb" |
| `en.end.plain-form` | rule | The plain form {after} has no ending. | CGEL ch. 3 "The verb" |
| `en.end.ing` | rule | -ing form: add -ing to {before}. | [DfE Appendix 1 p. 3, Year 1: adding the endings -ing, -ed and -er to verbs](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.end.participle-ed` | rule | Regular past participle: add -ed to {before}. | [DfE Appendix 1 p. 3, Year 1: adding the endings -ing, -ed and -er to verbs](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.orth.es-sibilant` | rule | After s, x, z, sh and ch the ending -s is written -es: {before} becomes {after}. | [DfE Appendix 1 p. 3, Year 1: adding s and es, "catches"](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.orth.es-o` | rule | After a consonant + o, -s is written -es: {before} becomes {after}. | [LDOCE veto, verb entry header](https://www.ldoceonline.com/dictionary/veto); [AHD veto, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=veto); [AHD echo, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=echo) |
| `en.orth.y-to-i` | rule | After a consonant, y becomes i before -es and -ed: {before} becomes {after}. | [DfE Appendix 1 p. 8, Year 2: adding -es, -ed, -er and -est to a root word ending in -y with a consonant before it](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.orth.ie-to-y` | rule | ie becomes y before -ing: {before} becomes {after}. | [LDOCE die, verb entry header](https://www.ldoceonline.com/dictionary/die); [AHD tie, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=tie) |
| `en.orth.e-plus-ed` | rule | The verb already ends in e, so -ed adds only -d: {before} becomes {after}. | [DfE Appendix 1 p. 8, Year 2: adding the endings -ing, -ed, -er, -est and -y to words ending in -e with a consonant before it](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.orth.drop-e` | rule | The silent e is dropped before -ing: {before} becomes {after}. | [DfE Appendix 1 p. 8, Year 2: adding the endings -ing, -ed, -er, -est and -y to words ending in -e with a consonant before it ("Exception: being")](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |
| `en.orth.c-to-ck` | rule | A final c after a vowel becomes ck before -ed and -ing: {before} becomes {after}. | [LDOCE panic, verb entry header](https://www.ldoceonline.com/dictionary/panic); [AHD panic, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=panic); [AHD picnic, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=picnic); [LDOCE bivouac, verb entry header](https://www.ldoceonline.com/dictionary/bivouac) |
| `en.orth.double-consonant` | rule | One {consonant} after one vowel {reason, select, listed {at the end of this verb is always doubled} other {at the end of a stressed syllable is doubled}} before -{ending}: {before} becomes {after}. | [DfE Appendix 1 p. 8, Year 2: adding -ing, -ed, -er, -est and -y to words of one syllable ending in a single consonant letter after a single vowel letter](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf); [DfE Appendix 1 p. 11, Years 3–4: adding vowel suffixes to words of more than one syllable (forgetting, beginning, preferred)](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf); [UT style guide doubling of consonants](https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/) |
| `en.orth.double-l-british` | rule | British spelling doubles a final l after a vowel even without stress: {before} becomes {after}. | [UT style guide doubling of a final -l after a short vowel](https://www.utwente.nl/en/language-centre/translation-editing-services/english-styleguide/tricky/spelling/); [LDOCE travel, verb entry header](https://www.ldoceonline.com/dictionary/travel); [LDOCE cancel, verb entry header](https://www.ldoceonline.com/dictionary/cancel) |
| `en.orth.single-l-american` | rule | American spelling keeps one l: {after}. | [AHD travel, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=travel); [LDOCE travel, verb entry header: traveled American English](https://www.ldoceonline.com/dictionary/travel) |
| `en.orth.single-consonant-american` | rule | American spelling may keep one consonant: {after}. | [LDOCE kidnap, verb entry header: also kidnaped American English](https://www.ldoceonline.com/dictionary/kidnap); [LDOCE worship, verb entry header](https://www.ldoceonline.com/dictionary/worship) |
| `en.orth.spelling-variant` | rule | {variant, select, single {The dictionaries prefer one consonant here: {after}.} dated {An older spelling keeps one consonant: {after}.} keepE {British spelling may also keep the e: {after}.} other {This verb is also written with -s only: {after}.}} | [LDOCE age, verb: aging or ageing British English](https://www.ldoceonline.com/dictionary/age); [LDOCE bus, verb entry header](https://www.ldoceonline.com/dictionary/bus); [AHD program, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=program); [AHD tango, verb entry, inflected forms](https://www.ahdictionary.com/word/search.html?q=tango) |
| `en.periphrasis.perfect` | rule | Present perfect: the present of have plus the past participle. | CGEL ch. 3 "The verb" |
| `en.periphrasis.pluperfect` | rule | Past perfect: had plus the past participle. | CGEL ch. 3 "The verb" |
| `en.periphrasis.future` | rule | Future: will plus the plain form. | CGEL ch. 3 "The verb"; [LDOCE will, modal verb, sense 1: "used to make future tenses"](https://www.ldoceonline.com/dictionary/will) |
| `en.periphrasis.future-perfect` | rule | Future perfect: will have plus the past participle. | CGEL ch. 3 "The verb" |
| `en.periphrasis.present-progressive` | rule | Present continuous: the present of be plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.past-progressive` | rule | Past continuous: the past of be plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.perfect-progressive` | rule | Present perfect continuous: has/have been plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.pluperfect-progressive` | rule | Past perfect continuous: had been plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.future-progressive` | rule | Future continuous: will be plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.future-perfect-progressive` | rule | Future perfect continuous: will have been plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.conditional` | rule | Conditional: would plus the plain form. | CGEL ch. 3 "The verb"; [LDOCE would, modal verb, sense 2: the result of an imagined situation](https://www.ldoceonline.com/dictionary/would) |
| `en.periphrasis.conditional-perfect` | rule | Conditional perfect: would have plus the past participle. | CGEL ch. 3 "The verb"; [LDOCE would, modal verb, sense 2: something that did not happen](https://www.ldoceonline.com/dictionary/would) |
| `en.periphrasis.conditional-progressive` | rule | Conditional continuous: would be plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.conditional-perfect-progressive` | rule | Conditional perfect continuous: would have been plus the -ing form. | CGEL ch. 3 "The verb" |
| `en.periphrasis.subjunctive-perfect` | rule | Perfect subjunctive: have (for every person) plus the past participle. | CGEL ch. 3 "The verb" |
| `en.periphrasis.subjunctive-pluperfect` | rule | Pluperfect subjunctive: had plus the past participle. | CGEL ch. 3 "The verb" |
| `en.periphrasis.lets` | rule | First person plural imperative: let's plus the plain form. | [LDOCE let's, entry: "the short form of let us, used especially to make suggestions"](https://www.ldoceonline.com/dictionary/let-s); CGEL ch. 10 "Clause type and illocutionary force" |
| `en.periphrasis.to-infinitive` | rule | To-infinitive: to plus the plain form. | CGEL ch. 3 "The verb" |
| `en.clause.subject` | rule | The subject {pronoun} comes before the verb. | CGEL ch. 2 "Syntactic overview" |
| `en.clause.imperative-subject` | rule | The imperative is used without a subject. | CGEL ch. 10 "Clause type and illocutionary force" |

## Corpus

145 pages, 126 cells each (18,270 cells, 435 empty imperative template rows), compared with every form the engine
generates for the verb (`scripts/corpus/`). Expected texts keep a page's region tag as a ` (US)` / ` (GB)` suffix on the
172 cells that print one, and those cells are compared with the region of each engine form. Extra engine forms must be
tagged (`requireTaggedExtras`).

Remaps (the page prints the wrong heading over a whole block):

| Heading | Target | Cells | Source |
|---|---|---|---|
| Subjunctive › Present #2 | subjunctive perfect | 870 | [CGEL ch. 3](https://doi.org/10.1017/9781316423530) |
| Subjunctive › Imperfect | subjunctive past | 870 | [AHD were](https://www.ahdictionary.com/word/search.html?q=were) |
| Nominal Forms › Gerund | participle present | 145 | [DfE Appendix 1](https://assets.publishing.service.gov.uk/media/5a7ccc06ed915d63cc65ce61/English_Appendix_1_-_Spelling.pdf) |

Corrections (480 cells, 19,005 form expectations after them):

| Verb | Page | Correct | Cells | Source |
|---|---|---|---|---|
| dig | diging | digging | 49 | LDOCE dig |
| fly | flys | flies | 1 | DfE Appendix 1 |
| teach | teachs | teaches | 1 | DfE Appendix 1 |
| shake | shaked | shook | 12 | LDOCE shake |
| strike | striked; stricken (U) | struck; stricken (dated, no region) | 49 | LDOCE / AHD strike |
| shut, cast, spit, slide, bend | shutted, casted, spitted, slidden, bended | dropped | 49, 49, 49, 37, 37 | LDOCE |
| bear | born (active perfect) | dropped | 37 | AHD bear |
| spin | span | dropped | 12 | AHD spin |
| rid | ridded (E); rid (U) | ridded; rid, no region | 49 | AHD rid |
| strive | strove (E), striven (E), strived (U) | no region | 49 | LDOCE strive |

## Limits

- Not modelled: negation, questions and do-support, contractions (I'll), shall futures, the passive, modal verbs,
  phrasal verbs (a multiword infinitive is refused), subjunctive progressives, the perfect infinitive and participle.
- Second verbs left out, their forms restricted to one sense: spit (spitted), wind (winded), weave (weaved), ring
  (ringed), relay (relaid), cost (costed), fly (flied), grind (grinded), pay (payed), stick (sticked), let (letted).
- Spelling variants not generated: focussed, benefitted, combatted, eying, glueing, queueing; nonplusses (AHD's first
  3rd person; the engine writes nonpluses, AHD's second).
- can and will conjugate as the ordinary verbs (canned, willed); beware has a full paradigm though it is used mostly in
  the imperative and the infinitive. The analysis says so.
- Stress is read from the lists or assumed from spelling; an unlisted polysyllable may be assumed wrongly (the
  assumption is shown and the `stress` hint corrects it).
