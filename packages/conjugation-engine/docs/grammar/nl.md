# Dutch grammar: rules, defaults and limits

Dutch runs on the staged core (`src/languages/nl/`): every form is derived by recorded rules, and every step explains
itself in English and Dutch with its source. Spelling follows the Taalunie's [Leidraad](https://woordenlijst.org/leidraad)
on woordenlijst.org; grammar follows the [e-ANS](https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic) of the Instituut
voor de Nederlandse Taal. A rule is never cited to the scraped corpus. `tests/nl/explanations.test.ts` pins the full
English and Dutch explanation of 67 everyday forms, analyses and unavailable targets, together using every rule below.

## How a form is built

- **Classification** (`lexicon.ts`): the verb's lexeme from the lexicon tables and the query's hints, with a recorded
  step for what the lexicon says (an irregular past tense, an irregular past participle only, or the detail a weak
  verb is listed for), a loan, a separable or inseparable prefix, and every assumption made for a verb the lexicon does
  not know.
- **Present stem** (`stems.ts`): the infinitive without -en, a single final consonant, a long vowel written double in
  the closed syllable unless the last syllable is unstressed, f and s for a final v and z, or a listed stem. x stands
  for two sounds, /ks/, so the vowel before it is short and is never written double, and for 't kofschip the stem ends
  in a voiceless sound (relaxen: relax, relaxte, gerelaxt; mixen: mix, mixte; [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html),
  [2.2](https://woordenlijst.org/zoeken/leidraad/2/2.html), and faxen in [12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html)). The
  pronounced stem (leev, reiz) is kept for 't kofschip.
- **Cells** (`paradigms.ts`): a regular word is stem + ending, spelled by `orthography.ts`; a cell with listed material
  (ben, kunt, a strong past, a listed participle, the dropped d of hou) is built whole, its regular members taken from
  the same derivation (`deriveWords`). The plural present is the infinitive; the present participle is the infinitive
  + d. The 2nd person singular present gives its plain forms, its forms after the verb and the extra formal forms of
  u, told apart by word marks, never by steps.
- **Compound tenses** (`periphrasis.ts`): the perfect and pluperfect with the perfect auxiliary (once for each the verb
  takes), the future and conditional with zullen and the infinitive, their perfect forms with the participle and the
  infinitive of the perfect auxiliary. The infinitive of zijn has the spoken alternative wezen.
- **Clause** (`clause.ts`): the subject before the finite verb, or after it with `inversion`; the reflexive pronoun; a
  separable particle at the end of the clause after a finite main verb, written onto the verb elsewhere; an
  inseparable prefix always written on. An impersonal verb's 3rd person singular subject is het unless the query names
  a subject.
- **Availability**: an impersonal verb has only the 3rd person, a singular-only verb (vriezen) no plural, some verbs no
  imperative, and zullen no compound forms; the reasons are rules with a source.

## Rule inventory

| Rule | Kind | What it says (English message) | Sources |
|---|---|---|---|
| `nl.classify.irregular` | lexical | {before} is an irregular verb: its past tense, {after}, is in the verb list. | [e-ANS 2.3.5.1](https://e-ans.ivdnt.org/topics/pid/ans02030501lingtopic), [e-ANS 2.3.6](https://e-ans.ivdnt.org/topics/pid/ans020306lingtopic) |
| `nl.classify.half-irregular` | lexical | {before} is half irregular: its past tense is regular, its past participle {after} is in the verb list. | [e-ANS 2.3.5.2](https://e-ans.ivdnt.org/topics/pid/ans02030502lingtopic) |
| `nl.classify.listed-weak` | lexical | {before} is a weak verb; the verb list records {detail, select, auxiliary {which auxiliary it takes} reflexive {that it is reflexive} imperative {that it has no imperative} stress {where its stress falls} other {a detail of it}}. | [e-ANS 2.3.3](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic) |
| `nl.classify.loan` | rule | {before} is a verb borrowed from English, so its stem is the one given for it, not one formed by the Dutch stem rules. | [Leidraad 12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html) |
| `nl.classify.separable` | rule | {before} is a separable verb: {particle} carries the stress and can stand apart from the verb. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.classify.inseparable` | rule | {before} starts with the unstressed prefix {prefix}-, which never splits off, so the past participle gets no ge-. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.classify.default-weak` | assumption | An unlisted Dutch verb defaults to the weak native model. | [e-ANS 2.3.3](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic), [e-ANS 2.3.5.1](https://e-ans.ivdnt.org/topics/pid/ans02030501lingtopic) |
| `nl.classify.default-syllables` | assumption | Ordinary open/closed syllables are inferred; use a stem or stress hint when pronunciation differs. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [Leidraad 2.1](https://woordenlijst.org/zoeken/leidraad/2/1.html) |
| `nl.classify.default-hebben` | assumption | An unlisted verb defaults to hebben; lexical meaning may require zijn. | [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| `nl.classify.default-unprefixed` | assumption | No separable particle or unstressed prefix is read in this verb, so it is conjugated as a verb without one. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.classify.assume-separable` | assumption | {before} is not in the lexicon and starts with the separable particle {particle}, so it is conjugated as a separable verb; if {particle}- stays on the verb here, give it as the inseparable prefix, and if the verb has no prefix, give its class (weak or strong). | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304), [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710), [Leidraad 7.2](https://woordenlijst.org/zoeken/leidraad/7/2.html) |
| `nl.classify.assume-dual-separable` | assumption | {before} is not in the lexicon and starts with {prefix}, a separable particle in most verbs with it but an unstressed prefix in some, so it is conjugated as a separable verb; if {prefix}- stays on the verb here, give it as the inseparable prefix, and if the verb has no prefix, give its class (weak or strong). | [e-ANS 12.3.2.1.5](https://e-ans.ivdnt.org/topics/pid/topic-16131019751135534), [e-ANS 12.3.2.1.6](https://e-ans.ivdnt.org/topics/pid/topic-10736514965277082), [e-ANS 12.3.2.1.7](https://e-ans.ivdnt.org/topics/pid/topic-19065733157797735), [e-ANS 12.3.2.1.8](https://e-ans.ivdnt.org/topics/pid/topic-15955547301744486), [e-ANS 12.3.2.1.9](https://e-ans.ivdnt.org/topics/pid/topic-12953722418251955), [e-ANS 12.3.4.1.1](https://e-ans.ivdnt.org/topics/pid/topic-14781130780092856), [e-ANS 12.3.4.1.2](https://e-ans.ivdnt.org/topics/pid/topic-12837118759979596), [e-ANS 12.3.4.1.22](https://e-ans.ivdnt.org/topics/pid/topic-16418926026532594), [e-ANS 12.3.4.2.8](https://e-ans.ivdnt.org/topics/pid/topic-17227872050078844), [e-ANS 12.3.2.1](https://e-ans.ivdnt.org/topics/pid/topic-14428052248902267), [woordenlijst.org](https://woordenlijst.org/), [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304), [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) |
| `nl.classify.assume-inseparable` | assumption | {before} is not in the lexicon and starts with {prefix}-, which can be a separable particle or an unstressed prefix, and it is taken as a prefix that stays on the verb because {why, select, most {most verbs with {prefix}- keep it} close {about as many verbs with {prefix}- are separable as keep it, and keeping the verb whole is the safer guess} other {what follows {prefix} here starts with a vowel and is not a verb in the lexicon, although most verbs with {prefix} are separable}}; if {prefix} is separable here, give it as the separable prefix, and if the verb has no prefix, give its class (weak or strong). | [e-ANS 12.3.2.1.5](https://e-ans.ivdnt.org/topics/pid/topic-16131019751135534), [e-ANS 12.3.2.1.6](https://e-ans.ivdnt.org/topics/pid/topic-10736514965277082), [e-ANS 12.3.2.1.7](https://e-ans.ivdnt.org/topics/pid/topic-19065733157797735), [e-ANS 12.3.2.1.8](https://e-ans.ivdnt.org/topics/pid/topic-15955547301744486), [e-ANS 12.3.2.1.9](https://e-ans.ivdnt.org/topics/pid/topic-12953722418251955), [e-ANS 12.3.4.1.1](https://e-ans.ivdnt.org/topics/pid/topic-14781130780092856), [e-ANS 12.3.4.1.2](https://e-ans.ivdnt.org/topics/pid/topic-12837118759979596), [e-ANS 12.3.4.1.22](https://e-ans.ivdnt.org/topics/pid/topic-16418926026532594), [e-ANS 12.3.4.2.8](https://e-ans.ivdnt.org/topics/pid/topic-17227872050078844), [e-ANS 12.3.2.1](https://e-ans.ivdnt.org/topics/pid/topic-14428052248902267), [woordenlijst.org](https://woordenlijst.org/), [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.classify.assume-rest-prefix` | assumption | {before} is not in the lexicon and starts with {prefix}-, which is taken as an unstressed prefix that stays on the verb, so the past participle gets no ge-. | [e-ANS 12.3.2.1](https://e-ans.ivdnt.org/topics/pid/topic-14428052248902267), [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.avail.impersonal` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.2.5](https://e-ans.ivdnt.org/topics/pid/ans020205lingtopic) |
| `nl.avail.singular-only` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.2.5](https://e-ans.ivdnt.org/topics/pid/ans020205lingtopic) |
| `nl.avail.no-imperative` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.3.2.5](https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic) |
| `nl.avail.no-compound` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.3.6.6](https://e-ans.ivdnt.org/topics/pid/ans02030606lingtopic) |
| `nl.stem.drop-en` | rule | Take -en off {before}: {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
| `nl.stem.undouble-consonant` | rule | A word does not end in a double consonant, so {before}- becomes {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [Leidraad 2.2](https://woordenlijst.org/zoeken/leidraad/2/2.html) |
| `nl.stem.lengthen-vowel` | rule | A long vowel in a closed syllable is written with two letters, so {before}- becomes {after}-. | [Leidraad 2.1](https://woordenlijst.org/zoeken/leidraad/2/1.html), [Leidraad 2.2](https://woordenlijst.org/zoeken/leidraad/2/2.html), [Leidraad 7.1](https://woordenlijst.org/zoeken/leidraad/7/1.html), [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html) |
| `nl.stem.unstressed-e` | rule | {inferred, select, yes {The last syllable of {before}- is taken to be unstressed, so its vowel is not written double: the stem stays {after}-.} other {The last syllable of {before}- is unstressed, so its vowel is not written double: the stem stays {after}-.}} | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [Leidraad 2.2](https://woordenlijst.org/zoeken/leidraad/2/2.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
| `nl.stem.devoice` | rule | At the end of a word, v and z are written f and s, so {before}- becomes {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
| `nl.stem.no-trema` | rule | After i no trema is written when three or more vowel letters follow one another, so {before}- becomes {after}-. | [Leidraad 7.4](https://woordenlijst.org/zoeken/leidraad/7/4.html), [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html) |
| `nl.stem.lexical` | lexical | The stem of {before} is {after}-, as given for this verb. | [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic), [e-ANS 2.3.6](https://e-ans.ivdnt.org/topics/pid/ans020306lingtopic), [Leidraad 12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html) |
| `nl.cell.lexical` | lexical | {before} has the listed form {after} here. | [e-ANS 2.3.6](https://e-ans.ivdnt.org/topics/pid/ans020306lingtopic), [e-ANS 2.3.5.1](https://e-ans.ivdnt.org/topics/pid/ans02030501lingtopic) |
| `nl.cell.d-dropped` | lexical | After a vowel, the d at the end of the stem {before}- is often left out: {after}. | [e-ANS 2.3.2.8.ii](https://e-ans.ivdnt.org/topics/pid/ans0203020802lingtopic) |
| `nl.cell.spoken-infinitive` | lexical | In speech, {before} also has the infinitive {after}. | [e-ANS 2.3.6.5](https://e-ans.ivdnt.org/topics/pid/ans02030605lingtopic) |
| `nl.cell.formal` | lexical | With u, {before} also has the form {after}. | [e-ANS 2.3.6.1](https://e-ans.ivdnt.org/topics/pid/ans02030601lingtopic) |
| `nl.end.present` | rule | {person} {number} present: {ending, select, t {stem + t, {after}} en {the plural is the infinitive, {after}} other {the stem alone, {after}}}. | [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html), [e-ANS 2.3.2.8.ii](https://e-ans.ivdnt.org/topics/pid/ans0203020802lingtopic) |
| `nl.end.present-t-drop` | rule | The stem {before}- already ends in t, so no t is added: {after}. | [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html) |
| `nl.end.inversion-t-drop` | rule | When jij or je comes after the verb, the -t of the 2nd person falls away: {after}. | [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html), [e-ANS 2.3.3](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic) |
| `nl.end.past-weak` | rule | Weak verb: the past tense is the stem + {ending}: {after}. | [Leidraad 11.3](https://woordenlijst.org/zoeken/leidraad/11/3.html), [e-ANS 2.3.2.8.iii](https://e-ans.ivdnt.org/topics/pid/ans0203020803lingtopic) |
| `nl.end.past-strong` | lexical | {before} has an irregular past tense: {after}. | [Leidraad 11.5](https://woordenlijst.org/zoeken/leidraad/11/5.html), [e-ANS 2.3.5.1](https://e-ans.ivdnt.org/topics/pid/ans02030501lingtopic) |
| `nl.end.past-plural-strong` | rule | The past tense {before} becomes {after} in the plural. | [Leidraad 11.5](https://woordenlijst.org/zoeken/leidraad/11/5.html) |
| `nl.imp.stem` | rule | Imperative: the stem alone, {after}. | [Leidraad 11.7](https://woordenlijst.org/zoeken/leidraad/11/7.html), [e-ANS 2.3.2.5](https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic) |
| `nl.part.present` | rule | Present participle: the infinitive + d, {after}. | [e-ANS 2.3.2.6](https://e-ans.ivdnt.org/topics/pid/ans02030206lingtopic) |
| `nl.part.weak` | rule | Weak verb: in the past participle a {ending} comes after the stem: {after}. | [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html), [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.part.weak-no-ending` | rule | The stem {before}- already ends in {dental}, so no extra {dental} is added: {after}. | [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html), [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html) |
| `nl.part.strong` | lexical | {before} has an irregular past participle: {after}. | [Leidraad 11.6](https://woordenlijst.org/zoeken/leidraad/11/6.html), [e-ANS 2.3.5.1](https://e-ans.ivdnt.org/topics/pid/ans02030501lingtopic) |
| `nl.part.ge-blocked` | rule | After the prefix {prefix}- the past participle has no ge-: {after}. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.part.ge-prefix` | rule | The past participle starts with ge-: {after}. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic), [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html), [Leidraad 7.4](https://woordenlijst.org/zoeken/leidraad/7/4.html) |
| `nl.part.ge-diaeresis` | rule | The past participle starts with ge-, and the {vowel} after it gets a diaeresis: {after}. | [Leidraad 7.2](https://woordenlijst.org/zoeken/leidraad/7/2.html), [Leidraad 7.4](https://woordenlijst.org/zoeken/leidraad/7/4.html) |
| `nl.orth.dental-kofschip` | rule | {sound} {dental, select, t {is} other {is not}} one of the sounds of 't kofschip (t, k, f, s, ch, p), so the ending starts with {dental}: {after}. | [Leidraad 11.3](https://woordenlijst.org/zoeken/leidraad/11/3.html), [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html) |
| `nl.orth.dental-voiceless` | rule | {sound, select, x {x is pronounced ks, and s is one of the sounds of 't kofschip} other {{sound} is pronounced without voice, like the sounds of 't kofschip}}, so the ending starts with t: {after}. | [Leidraad 11.3](https://woordenlijst.org/zoeken/leidraad/11/3.html), [Leidraad 12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html) |
| `nl.orth.dental-given` | rule | For {before} the ending starts with {dental}, as given for this verb: {after}. | [Leidraad 12.2](https://woordenlijst.org/zoeken/leidraad/12/2.html) |
| `nl.orth.double-a` | rule | In the closed syllable the long a is written aa: {after}. | [Leidraad 2.1](https://woordenlijst.org/zoeken/leidraad/2/1.html), [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html) |
| `nl.periphrasis.perfect` | rule | Present perfect: the present tense of {auxiliary} + the past participle. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic), [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| `nl.periphrasis.pluperfect` | rule | Past perfect: the past tense of {auxiliary} + the past participle. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic), [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| `nl.periphrasis.future` | rule | Future: the present tense of zullen + the infinitive. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic) |
| `nl.periphrasis.future-perfect` | rule | Future perfect: the present tense of zullen + the past participle + {auxiliary}. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic), [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| `nl.periphrasis.conditional` | rule | Conditional: the past tense of zullen (zou, zouden) + the infinitive. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic) |
| `nl.periphrasis.conditional-perfect` | rule | Conditional perfect: the past tense of zullen (zou, zouden) + the past participle + {auxiliary}. | [e-ANS 2.3.2.8.i](https://e-ans.ivdnt.org/topics/pid/ans0203020801lingtopic), [e-ANS 2.3.2.8.iv](https://e-ans.ivdnt.org/topics/pid/ans0203020804lingtopic) |
| `nl.clause.subject` | rule | The subject is {pronoun}. | [e-ANS 2.3.3](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic) |
| `nl.clause.impersonal-subject` | rule | {before} is impersonal: its subject is het. | [e-ANS 2.2.5](https://e-ans.ivdnt.org/topics/pid/ans020205lingtopic) |
| `nl.clause.inversion` | rule | The finite verb comes before the subject {pronoun}. | [Leidraad 11.2](https://woordenlijst.org/zoeken/leidraad/11/2.html), [e-ANS 2.3.3](https://e-ans.ivdnt.org/topics/pid/ans020303lingtopic) |
| `nl.clause.reflexive` | rule | {before} is a reflexive verb: the reflexive pronoun {pronoun} goes with it. | [e-ANS 2.2.4](https://e-ans.ivdnt.org/topics/pid/ans020204lingtopic) |
| `nl.clause.particle-final` | rule | The separable part {particle} goes to the end of the clause. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic), [e-ANS 21.3.4.3.2](https://e-ans.ivdnt.org/topics/pid/ans2103040302lingtopic) |
| `nl.clause.particle-attached` | rule | {particle} is written together with the verb: {before} becomes {after}. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic), [e-ANS 12.3.4](https://e-ans.ivdnt.org/topics/pid/topic-11721585681016076) |
| `nl.clause.prefix-attached` | rule | {prefix}- is an inseparable prefix and always stays in front of the verb: {before} becomes {after}. | [e-ANS 12.3.2.1](https://e-ans.ivdnt.org/topics/pid/topic-14428052248902267), [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |

## Defaults and assumptions

A verb the lexicon does not know records each assumption it rests on (the English sentences of the analysis):

- it is weak (`nl.classify.default-weak`), its stem follows the open and closed syllable rules
  (`nl.classify.default-syllables`, unless a stem or stress hint is given), and its perfect auxiliary is hebben
  (`nl.classify.default-hebben`, unless an `auxiliary` hint or a listed derivative says otherwise);
- its prefix is read from its spelling, as below (`nl.classify.assume-separable`, `nl.classify.assume-dual-separable`,
  `nl.classify.assume-inseparable`, `nl.classify.assume-rest-prefix`), or, when none is read, it has no prefix
  (`nl.classify.default-unprefixed`).

A verb listed with its unstressed prefix (`inseparableVerbs`: betalen, vertellen) is a checked weak verb: none of these
assumptions is recorded for it. An assumed reading comes first in the analysis and is not restated as a fact: the
assumption says what is read and why, and no "is a separable verb" step follows it. A stress taken from the spelling is
worded as such in the stem step of a verb the lexicon does not list ("The last syllable of zorbel- is taken to be
unstressed …"); a stress from the lexicon, a hint, a recorded participle or the checked forms of a listed verb is
stated as a fact.

### When an unknown verb is split

An unknown verb is split as a separable verb (`nl.classify.assume-separable`: opzorpen, ik zorp op, opgezorpt) only
when all four guards hold:

1. **The particle.** It starts with a separable particle of e-ANS
   [12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) or
   [12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) that e-ANS never names as an unstressed
   prefix (`separableParticles`: af, bij, binnen, boven, buiten, heen, in, langs, mee, na, op, rond, tegen, toe, uit,
   voorbij, neer, samen, terecht, terug, thuis, voort, weg, and the compound particles such as achteruit, omhoog,
   uiteen), the longest that fits; or it starts with a dual prefix whose default reading is separable (below).
2. **The rest.** What follows the particle is a verb in the lexicon (opeten: op + eten, ik eet op), or it begins with a
   consonant and is -en after a root of two letters or more with a vowel (opzorpen: zorp). A rest that begins with a
   vowel is split only when it is a verb in the lexicon: openen is not op + enen, opereren not op + ereren. A rest of
   one letter or without a vowel is no verb: bijzen, opsten.
3. **No vowel clash.** A particle that ends in a vowel does not meet a vowel, as that is written with a hyphen
   (na-apen): naaien is not na + aien.
4. **Not on the no-split list.** The verb is not one of the simplex verbs of `simplexVerbs` (`lexicon.ts`), whose
   spelling begins with a particle's letters: naderen, nagelen, informeren, installeren, opperen, toeteren,
   missioneren, voltigeren, weerlichten. The list was compiled from the woordenlijst.org lexicon service on 2026-11-25: for every
   particle and dual prefix, each verb listed with it that is not marked separable and that guards 1-3 would read
   with a prefix; for a dual prefix only those whose participle has ge- before the whole word (gemissioneerd). Each
   entry records its woordenlijst lemma id and participle; four whose participle shows the particle split off
   (weggeweest, voorafgebeeld, voorafgeschaduwd, voorafgespiegeld) are left out. Six have since moved into the
   lexicon proper (five English loans with their stem, and integreren with its stress and auxiliary), so the list has
   155 entries. The stress of an entry in -eren, -elen, -enen or -emen is read from its recorded participle
   (geïnformeerd: stressed), and a test checks that the engine gives every recorded participle.

**The rest of a separable verb** is classified like any verb (e-ANS 2.3.2.7, punt 2: no ge- after be-, er-, ge-,
her-, ont-, ver-, also inside a separable verb). A rest the lexicon lists with an unstressed prefix keeps it:
terugbetalen, ik betaal terug, terugbetaald (betalen); a rest that is an inseparable derivative takes its forms:
uitverkopen, ik verkocht uit, uitverkocht (verkopen: ver + kopen); doorverbinden, doorverbonden. A rest the lexicon does
not know is read with an unstressed prefix it starts with when a consonant follows the prefix and a root with a vowel
follows that (`nl.classify.assume-rest-prefix`: voorbereiden, voorbereid; uitvergroten, uitvergroot); bellen in
opbellen and beelden in uitbeelden are not (opgebeld, uitgebeeld). The same holds with a `separablePrefix` hint.

A verb that guard 2, 3 or 4 keeps whole gets no assumed prefix: its analysis records `nl.classify.default-unprefixed`
instead. Every assumed reading tells the learner how to override it: an `inseparablePrefix` or `separablePrefix` hint
decides, and a `classHint` keeps the verb one word. A verb listed in the lexicon, or whose base is, takes what the
lexicon says.

### Dual prefixes: the reading most verbs with the prefix have

e-ANS names ten particles that are also unstressed prefixes (`dualPrefixes`): door-, mis-, om-, onder-, over-
(12.3.2.1.5-9), aan (12.3.4.1.1), achter (12.3.4.1.2), voor (12.3.4.1.22), weer (12.3.4.2.8) and vol (12.3.2.1, table
2: vol-dóen). An unlisted verb with one gets the reading most verbs with that prefix have, counted on 2026-11-25 with
the woordenlijst.org lexicon service over every verb it lists that starts with the prefix (and with no longer
particle such as aaneen or omhoog). A reading counts as separable when the verb is marked separable or its participle
has ge- after the prefix (aangehold), as inseparable when its participle has the prefix and no ge- (aanbeden); a lemma
with both readings counts once for each; verbs with ge- before the whole word (achterklappen: geachterklapt) are
simplex and left out (they are on the no-split list). The counts are in `dualPrefixCounts` (`lexicon.ts`):

| Prefix | Separable | Inseparable | Separable share | Default |
| --- | ---: | ---: | ---: | --- |
| aan | 295 | 4 | 98.7% | separable |
| voor | 80 | 10 | 88.9% | separable |
| achter | 9 | 3 | 75.0% | separable |
| door | 228 | 79 | 74.3% | separable |
| vol | 37 | 13 | 74.0% | separable |
| om | 134 | 67 | 66.7% | separable |
| over | 129 | 109 | 54.2% | inseparable (close to even) |
| onder | 39 | 54 | 41.9% | inseparable |
| weer | 6 | 9 | 40.0% | inseparable |
| mis | 20 | 40 | 33.3% | inseparable |

The default is separable when at least 60% of the readings are (`dualReading`). Below that the verb keeps the prefix:
mis, onder and weer because most of their verbs do, and over, whose readings are close to even (54% separable),
because keeping the verb whole is the safer error for a learner: its forms keep the spelling of the infinitive (ik
overzorp, overzorpt), where a wrong split invents a word order and a ge- (ik zorp over, overgezorpt).

- A separable default splits the verb when the guards above hold (`nl.classify.assume-dual-separable`: aanzorpen, ik
  zorp aan, aangezorpt; volzorpen, ik zorp vol). When the rest begins with a vowel and is not a verb in the lexicon, the
  verb keeps the prefix instead, which a dual prefix allows (om + elpen: omelpt).
- An inseparable default keeps the prefix on the verb (`nl.classify.assume-inseparable`: overwinnen, ik overwin,
  overwonnen; miszorpen, ik miszorp). Guards 2 and 4 decide here too whether the prefix is read at all, except that the
  rest may begin with a vowel; no dual prefix ends in a vowel, so guard 3 never applies.
- The assumption names the prefix, the reading taken and why (most verbs with it; close to even; a rest that cannot be
  split off), and how to give the other reading.
- So that a verb that was right before is not made wrong, the verbs woordenlijst.org lists only with the inseparable
  reading of a prefix whose default is separable are in the lexicon (`dualInseparableVerbs`, 67: aanbidden,
  aanvaarden, achtervolgen, doorgronden, omhelzen, omringen, omschrijven, voldoen, voltooien, voorzien …), each with
  its lemma id and participle and checked: the engine's present, past and participle for it equal woordenlijst.org's.
  Left out: doordesemen (its base has an unstressed last syllable the rules cannot see) and four verbs with a second
  particle inside (vooraanmelden …). A lemma woordenlijst.org lists with both readings (doorzoeken, omgeven) gets the
  prefix's default unless it is one of the lemmas with two paradigms (change 2).

## The two behaviour changes of the switch

Decided with the user:

1. An unknown verb that starts with a separable particle is split when the four guards hold, and one that starts with
   a dual prefix gets the reading most verbs with that prefix have (above; at first every dual prefix was read as
   inseparable, and the per-prefix default followed after the lexicon corrections). Snapshot verbs: neerzetten,
   opzorpen, teruggeven, toegeven, toekomen, uitstellen (split); misstaan, overwinnen (inseparable); voorzien
   (inseparable, listed).
2. A lemma that is separable in one sense and inseparable in another (voorkomen, overleggen, doorlopen, overlopen,
   ondergaan) returns both paradigms, separable first, with `variant.pattern` `separable` / `inseparable`, its meaning
   as `variant.condition`, and its own perfect auxiliary (woordenlijst.org: het is voorgekomen, ik heb het voorkomen).
   A prefix hint returns that paradigm alone, untagged.

## Intended differences from the frozen snapshot

The characterization snapshot (`tests/characterization/nl.tsv.gz`) froze the output before the switch. Each
difference since is an entry of `tests/characterization/intended-diffs.json` with its reason and source, in one of three
forms (`tests/characterization.test.ts` and `docs/pack-authoring.md` document them):

- a line-level entry replaces, removes or adds one line of a frozen block;
- a block-level entry supersedes the whole frozen block of one query by the block with the same header in
  `tests/characterization/nl.accepted.tsv.gz`, written from the current engine by `npm run characterize:accept`;
- a sentence-level entry rewords or removes one assumption sentence in the analysis line of every frozen block that lists
  it.

The ledger has 100 block-level entries (the switch and the lexicon corrections, below), 44 line-level entries and 1
sentence-level entry (the final review fix wave):

- 44 line-level entries: the analysis lines of bedanken, behandelen, beloven (also as zich beloven), bestellen, betalen,
  gebruiken, geloven, herinneren, herkennen and ontdekken, four queries each, which no longer record the assumptions for
  an unlisted verb: each is listed with its unstressed prefix, and woordenlijst.org confirms its weak forms and hebben.
- 1 sentence-level entry: "Separability is not inferred by stripping an unknown written prefix." became "No separable
  particle or unstressed prefix is read in this verb, so it is conjugated as a verb without one." in 213 analysis lines,
  because since the switch separability is inferred for a known particle.

The switch has 56 block-level entries, the four queries of each verb below (no hint; `inversion`; `pronoun: het`;
`pronoun: u`):

| Infinitive | Change | Reason | Source |
| --- | --- | --- | --- |
| doorlopen | 2 | two readings: dóórlopen (to walk on; loopt door, heeft or is doorgelopen) and doorlópen (to pass through; doorloopt, heeft or is doorlopen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=doorlopen) |
| ondergaan | 2 | two readings: óndergaan (to go down; gaat onder, is ondergegaan) and ondergáán (to undergo; ondergaat, heeft ondergaan); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=ondergaan) |
| overleggen | 2 | two readings: óverleggen (to hand over; legt over, heeft overgelegd) and overléggen (to discuss; overlegt, heeft overlegd); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=overleggen) |
| overlopen | 2 | two readings: óverlopen (to defect, to overflow; loopt over, is overgelopen) and overlópen (to walk all over; overloopt, heeft overlopen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=overlopen) |
| voorkomen | 2 | two readings: vóórkomen (to occur; komt voor, is voorgekomen) and voorkómen (to prevent; voorkomt, heeft voorkomen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=voorkomen) |
| misstaan | 1 | dual prefix mis- taken as inseparable, as most verbs with mis- keep it: misstaat, misstond, misstaan; frozen: AMBIGUOUS_CLASSIFICATION | [e-ANS 12.3.2.1.6](https://e-ans.ivdnt.org/topics/pid/topic-10736514965277082) |
| overwinnen | 1 | dual prefix over- taken as inseparable, its readings being close to even: overwin, overwon, overwonnen; frozen: weak, geoverwind | [e-ANS 12.3.2.1.9](https://e-ans.ivdnt.org/topics/pid/topic-12953722418251955) |
| voorzien | 1 | listed with the inseparable prefix voor- (voor defaults to separable): voorzie, voorzag, voorzien; frozen: weak, ik voorzi, gevoorzid | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=voorzien) |
| neerzetten | 1 | split at neer: zet neer, neergezet; frozen: ik neerzet, geneerzet | [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) |
| opzorpen | 1 | split at op: zorp op, opgezorpt; frozen: ik opzorp, geopzorpt | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| teruggeven | 1 | split at terug: geef terug, gaf terug, teruggegeven; frozen: ik teruggeef, geteruggeefd | [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) |
| toegeven | 1 | split at toe: geef toe, gaf toe, toegegeven; frozen: ik toegeef, getoegeefd | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| toekomen | 1 | split at toe: kom toe, kwam toe, ben toegekomen (the zijn of komen); frozen: ik toekoom, getoekoomd, hebben | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| uitstellen | 1 | split at uit: stel uit, uitgesteld; frozen: ik uitstel, geüitsteld | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |

## What is certain and what is assumed

For a consumer of the API (an app, a learner tool) that wants to know how far to trust a Dutch form:

- **Certain, from the lexicon data.** A verb the lexicon lists (`dutchExceptions`, `inseparableVerbs`,
  `separableVerbs`, `inseparableDerivatives`, `dualInseparableVerbs`, the loan table, the lemmas with two readings, the
  no-split list) has its irregular forms, prefix or particle, stress where it matters and auxiliary from the lexicon,
  checked against woordenlijst.org (lemma ids in `lexicon.ts`) and, for the corpus verbs, against the corpus.
  `analysis.classificationSource` is `lexicon`.
- **Certain, from the rules.** Stem, endings, spelling ('t kofschip, open and closed syllables, trema, ge-) follow from
  the rules cited per step (e-ANS, Leidraad), for listed and unlisted verbs alike, once the class, prefix and stress are
  known.
- **Assumed, from the spelling.** For a verb the lexicon does not list: that it is weak, that its auxiliary is hebben,
  whether its last syllable is stressed, and whether it has a separable particle or an unstressed prefix (and which
  reading a dual prefix takes). These are educated guesses, right for most verbs and wrong for some (see Limits).
  `analysis.classificationSource` is then `regularRule`.

**How to tell from a result.** Every guess is an assumption step: `analysis.assumptions` lists their sentences (in
English) and `analysis.steps` holds them with `kind: 'assumption'` (explained in English or Dutch by `explain`). A
result whose analysis has no assumption steps rests on lexicon data and rules only; a result with assumptions should be
shown as uncertain, or the user should be asked for the hint the assumption names (`separablePrefix`,
`inseparablePrefix`, `classHint`, `stems`, `auxiliary`). A hint replaces the matching assumption, and
`classificationSource` becomes `explicitHint`.

## Where the lexicon data comes from, and its licence

Grammar comes from the e-ANS and spelling from the Leidraad, both cited per rule. Facts about single verbs (an
irregular past, an unstressed prefix, a separable particle, a stressed last syllable, an auxiliary, the meaning of each
reading of a two-reading lemma) come from the Woordenlijst Nederlandse Taal on woordenlijst.org, © Nederlandse Taalunie,
alle rechten voorbehouden. The INT terms of use (https://ivdnt.org/gebruiksvoorwaarden/, clauses 3 and 4, checked on
2026-11-25) allow its content to be used for non-commercial or private purposes only, and not to be reproduced or made
available to others without the INT's written permission. That does not clearly permit redistributing lists derived
from it inside this package, so no further lists are imported: each verb added since was checked by hand and carries its
lemma id and, where it matters, its participle, in a comment or in its entry. The no-split list, `dualInseparableVerbs`
and the dual-prefix counts were compiled from the lexicon service by script before this check; whether they may stay is
an open decision for the maintainers. Attribution: "Woordenlijst Nederlandse Taal, © Nederlandse Taalunie
(woordenlijst.org)".

## Lexicon corrections

After the switch, the lexicon was corrected where the frozen output, or a common verb, was wrong Dutch, each entry
checked on woordenlijst.org (by data only: no prefix is inferred for an unknown verb with be-, ver- and the like):

- 61 common verbs with an unstressed prefix: weak ones in `inseparableVerbs` (verhuizen, bedekken, veranderen,
  vertellen, gebeuren, ontmoeten …; the auxiliary woordenlijst.org gives in `dutchExceptions` when it is not hebben
  alone), strong ones as derivatives of their base in `inseparableDerivatives` (besluiten of sluiten, verbinden of
  binden, vervallen of vallen with zijn …), and vergelijken and ervaren with their own strong forms;

In the final review fix wave, more hand-checked entries followed, each with its woordenlijst.org lemma id:

- 12 verbs in -eren with a stressed last syllable (reageren, controleren, organiseren, presenteren, repareren,
  telefoneren, fotograferen, accepteren, irriteren, regeren, opereren, integreren), whose stress the rules cannot see;
- 13 separable verbs the spelling would read otherwise: overstappen, overnemen, overslaan, overgaan, overblijven,
  onderduiken, onderbrengen, misgaan, mislopen (a prefix whose default is inseparable), opeisen, inademen, uitoefenen (a
  rest that begins with a vowel) and tegemoetkomen (a particle not on the list);
- 3 more lemmas with two readings, from the two woordenlijst.org lemmas and their glosses: voorspellen, doorzoeken,
  omgeven;
- beëindigen with its prefix be-;
- five English loans with their stem (influencen, inlineskaten, insourcen, interfacen, internetdaten).

The rules gained what woordenlijst.org's forms showed they lacked: -em is an unstressed ending like -el, -er and -en
(ademen, adem; Leidraad 2.2 lists it); a stressed ë before the last consonant is long, and after i it loses its trema
(kopiëren, kopieer; creëren, creëer; Leidraad 7.4); the e after u is a vowel of its own (insinueren, insinueer;
Leidraad 7.1); and ge- puts no trema on the u of ui or the i of ij (geuit, geijkt; Leidraad 7.4).

The snapshot queries it changes are 44 block-level entries, the four queries of each verb below:

| Infinitive | Correction | Source |
| --- | --- | --- |
| bedekken | bedekt, not gebedekt | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=bedekken) |
| behagen | behaagd, not gebehaagd | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=behagen) |
| belegeren | belegerd, not gebelegerd | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=belegeren) |
| bemoeien, zich bemoeien | zich bemoeid, not zich gebemoeid | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=bemoeien) |
| besluiten | besloot, besloten, not besluitte, gebesluit | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=besluiten) |
| bestormen | bestormd, not gebestormd | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=bestormen) |
| bewegen | bewoog, bewogen, not beweegde, gebeweegd | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=bewegen) |
| verbinden | verbond, verbonden, not verbindde, geverbind | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=verbinden) |
| vervallen | verviel, is vervallen, not vervalde, heeft gevervald | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=vervallen) |
| verwerven | verwierf, verworven, not verwerfde, geverwerfd | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=verwerven) |

spijten keeps its forms: woordenlijst.org gives it only in the 3rd person, het spijt and zij spijten (lemma 108415),
and e-ANS [20.5.2](https://e-ans.ivdnt.org/topics/pid/ans200502lingtopic) lists it among the verbs whose subject is
what is regretted (die woorden spijten me), so the 3rd person plural stays.

## Limits

- **What the lexicon does not list is inferred from spelling, and can be wrong.** Stress and meaning decide
  separability and the stress of a last syllable, and spelling shows neither. The verbs the final review found wrong are
  now listed (above), each checked on woordenlijst.org; the bulk lists that would cover every verb were not imported
  (licence, above). What remains, for a verb the lexicon does not list:
  - *Separability.* A verb with a prefix whose default is inseparable is kept whole when it is separable (an unlisted
    overtikken gives ik overtik, not ik tik over); a lemma with both readings that is not one of the eight listed gets
    only its prefix's default reading; a separable verb whose rest begins with a vowel and is not in the lexicon is kept
    whole (an unlisted inenten gives ik inent, not ik ent in); a simplex verb not on the no-split list but spelled like a
    particle verb is split (opteren: ik teer op, right for one of its two woordenlijst.org lemmas and wrong for the
    other, ik opteer).
  - *Stress.* A verb in -el, -er, -en or -em after a consonant, with more than one vowel group, is taken to have an
    unstressed last syllable (wandelen: wandel; ademen: adem). That is wrong for French loans in -eren that are not
    listed (an unlisted arresteren gives ik arrester, not ik arresteer); -iëren, -eëren and -ueren follow from the rules
    (kopieer, creëer, evalueer).
  The analysis records each such assumption, with how to override it: an `inseparablePrefix` or
  `separablePrefix` hint, a `classHint` to keep the verb one word, or a stem or stress hint (`stems`).
- Stress and meaning also decide the auxiliary, and the stress of a final syllable (informeren: ik informeer, not ik
  informer, needs a stress hint); spelling does not show them. Unknown strong verbs need their principal parts
  (`stems`), and unknown loans their stem and, where needed, their d/t.
- Subjects are slots (`1sg` ... `3pl`, `2sg.je`, `2sg.u`, `3sg.zij`, `3sg.ze`, `3sg.het`, `1pl.we`, `3pl.ze`); the
  `pronoun` option selects the slots with that pronoun. `u` takes the 2nd person singular, with the formal forms the
  lexicon lists (u heeft), and keeps its -t after the verb. gij/ge, the subjunctive and archaic imperatives are not
  generated.
- `variant.condition` texts (the hebben/zijn choice, the spoken infinitive wezen, the meanings of two readings) are
  English in both locales.
