# Dutch grammar: rules, defaults and limits

Dutch runs on the staged core (`src/languages/nl/`): every form is derived by recorded rules, and every step explains
itself in English and Dutch with its source. Spelling follows the Taalunie's [Leidraad](https://woordenlijst.org/leidraad)
on woordenlijst.org; grammar follows the [e-ANS](https://e-ans.ivdnt.org/topics/pid/ans0203lingtopic) of the Instituut
voor de Nederlandse Taal. A rule is never cited to the scraped corpus. `tests/nl/explanations.test.ts` pins the full
English and Dutch explanation of 64 everyday forms, analyses and unavailable targets, together using every rule below.

## How a form is built

- **Classification** (`lexicon.ts`): the verb's lexeme from the lexicon tables and the query's hints, with a recorded
  step for what the lexicon says (an irregular past tense, an irregular past participle only, or the detail a weak
  verb is listed for), a loan, a separable or inseparable prefix, and every assumption made for a verb the lexicon does
  not know.
- **Present stem** (`stems.ts`): the infinitive without -en, a single final consonant, a long vowel written double in
  the closed syllable unless the last syllable is unstressed, f and s for a final v and z, or a listed stem. The
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
| `nl.classify.default-unprefixed` | assumption | Separability is not inferred by stripping an unknown written prefix. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.classify.assume-separable` | assumption | {before} is not in the lexicon and starts with the separable particle {particle}, so it is conjugated as a separable verb. If {particle}- is a prefix that stays on the verb here, give it as the inseparable prefix; if the verb has no prefix, give its class (weak or strong). | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304), [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710), [Leidraad 7.2](https://woordenlijst.org/zoeken/leidraad/7/2.html) |
| `nl.classify.assume-inseparable` | assumption | {before} is not in the lexicon and starts with {prefix}-, which can be a separable particle or an unstressed prefix: it is taken as a prefix that stays on the verb. If {prefix} is separable here, give it as the separable prefix; if the verb has no prefix, give its class (weak or strong). | [e-ANS 12.3.2.1.5](https://e-ans.ivdnt.org/topics/pid/topic-16131019751135534), [e-ANS 12.3.2.1.6](https://e-ans.ivdnt.org/topics/pid/topic-10736514965277082), [e-ANS 12.3.2.1.7](https://e-ans.ivdnt.org/topics/pid/topic-19065733157797735), [e-ANS 12.3.2.1.8](https://e-ans.ivdnt.org/topics/pid/topic-15955547301744486), [e-ANS 12.3.2.1.9](https://e-ans.ivdnt.org/topics/pid/topic-12953722418251955), [e-ANS 12.3.4.1.1](https://e-ans.ivdnt.org/topics/pid/topic-14781130780092856), [e-ANS 12.3.4.1.2](https://e-ans.ivdnt.org/topics/pid/topic-12837118759979596), [e-ANS 12.3.4.1.22](https://e-ans.ivdnt.org/topics/pid/topic-16418926026532594), [e-ANS 12.3.4.2.8](https://e-ans.ivdnt.org/topics/pid/topic-17227872050078844), [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic) |
| `nl.avail.impersonal` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.2.5](https://e-ans.ivdnt.org/topics/pid/ans020205lingtopic) |
| `nl.avail.singular-only` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.2.5](https://e-ans.ivdnt.org/topics/pid/ans020205lingtopic) |
| `nl.avail.no-imperative` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.3.2.5](https://e-ans.ivdnt.org/topics/pid/ans02030205lingtopic) |
| `nl.avail.no-compound` | unavailable | {before} has no modern {form} form in this slot. | [e-ANS 2.3.6.6](https://e-ans.ivdnt.org/topics/pid/ans02030606lingtopic) |
| `nl.stem.drop-en` | rule | Take -en off {before}: {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
| `nl.stem.undouble-consonant` | rule | A word does not end in a double consonant, so {before}- becomes {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [Leidraad 2.2](https://woordenlijst.org/zoeken/leidraad/2/2.html) |
| `nl.stem.lengthen-vowel` | rule | A long vowel in a closed syllable is written with two letters, so {before}- becomes {after}-. | [Leidraad 2.1](https://woordenlijst.org/zoeken/leidraad/2/1.html), [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html) |
| `nl.stem.unstressed-e` | rule | The last syllable of {before}- is unstressed, so its vowel is not written double: the stem stays {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
| `nl.stem.devoice` | rule | At the end of a word, v and z are written f and s, so {before}- becomes {after}-. | [Leidraad 11.1](https://woordenlijst.org/zoeken/leidraad/11/1.html), [e-ANS 2.3.2.3](https://e-ans.ivdnt.org/topics/pid/ans02030203lingtopic) |
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
| `nl.part.ge-prefix` | rule | The past participle starts with ge-: {after}. | [e-ANS 2.3.2.7](https://e-ans.ivdnt.org/topics/pid/ans02030207lingtopic), [Leidraad 11.4](https://woordenlijst.org/zoeken/leidraad/11/4.html) |
| `nl.part.ge-diaeresis` | rule | The past participle starts with ge-, and the {vowel} after it gets a diaeresis: {after}. | [Leidraad 7.2](https://woordenlijst.org/zoeken/leidraad/7/2.html) |
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
- its prefix is read from its spelling, as below (`nl.classify.assume-separable`, `nl.classify.assume-inseparable`),
  or, when none is read, it has no prefix (`nl.classify.default-unprefixed`).

### When an unknown verb is split

An unknown verb is split as a separable verb (`nl.classify.assume-separable`: opzorpen, ik zorp op, opgezorpt) only
when all four guards hold:

1. **The particle.** It starts with a separable particle of e-ANS
   [12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) or
   [12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) that e-ANS never names as an unstressed
   prefix (`separableParticles`: af, bij, binnen, boven, buiten, heen, in, langs, mee, na, op, rond, tegen, toe, uit,
   voorbij, neer, samen, terecht, terug, thuis, voort, weg, and the compound particles such as achteruit, omhoog,
   uiteen), the longest that fits. A particle that e-ANS also names as an unstressed prefix (`dualPrefixes`: aan,
   achter, door, mis, om, onder, over, voor, weer: 12.3.2.1.5-9, 12.3.4.1.1, 12.3.4.1.2, 12.3.4.1.22, 12.3.4.2.8) is
   never split without a hint: the verb is taken as inseparable (`nl.classify.assume-inseparable`: overwinnen, ik
   overwon, overwonnen; aanzorpen, ik aanzorp).
2. **The rest.** What follows the particle is a verb in the lexicon (opeten: op + eten, ik eet op), or it begins with a
   consonant and is -en after a root of two letters or more with a vowel (opzorpen: zorp). A rest that begins with a
   vowel is split only when it is a verb in the lexicon: openen is not op + enen, opereren not op + ereren. A rest of
   one letter or without a vowel is no verb: bijzen, opsten.
3. **No vowel clash.** A particle that ends in a vowel does not meet a vowel, as that is written with a hyphen
   (na-apen): naaien is not na + aien.
4. **Not on the no-split list.** The verb is not one of the 156 simplex verbs of `simplexVerbs` (`lexicon.ts`), whose
   spelling begins with a particle's letters: naderen, nagelen, informeren, installeren, opperen, toeteren,
   missioneren, weerlichten. The list was compiled from the woordenlijst.org lexicon service on 2026-11-25: for every
   particle and dual prefix, each verb listed with it that is not marked separable and that guards 1-3 would read
   with a prefix; for a dual prefix only those whose participle has ge- before the whole word (gemissioneerd). Each
   entry records its woordenlijst lemma id and participle; four whose participle shows the particle split off
   (weggeweest, voorafgebeeld, voorafgeschaduwd, voorafgespiegeld) are left out.

Guards 2 to 4 also decide whether a dual prefix is read at all, except that its rest may begin with a vowel (omarmen:
ik omarm, omarmd); a dual prefix never meets a vowel clash, as none ends in a vowel.

A verb that guard 2, 3 or 4 keeps whole gets no assumed prefix: its analysis records `nl.classify.default-unprefixed`
instead. The assumption of a split (or of an inseparable dual prefix) tells the learner how to override it: an
`inseparablePrefix` or `separablePrefix` hint decides, and a `classHint` keeps the verb one word. A verb listed in the
lexicon, or whose base is, takes what the lexicon says.

## The two behaviour changes of the switch

Decided with the user:

1. An unknown verb that starts with a separable particle is split when the four guards hold, and one that starts with
   a dual prefix is taken as inseparable (above). Snapshot verbs: neerzetten, opzorpen, teruggeven, toegeven, toekomen,
   uitstellen (split); misstaan, overwinnen, voorzien (inseparable).
2. A lemma that is separable in one sense and inseparable in another (voorkomen, overleggen, doorlopen, overlopen,
   ondergaan) returns both paradigms, separable first, with `variant.pattern` `separable` / `inseparable`, its meaning
   as `variant.condition`, and its own perfect auxiliary (woordenlijst.org: het is voorgekomen, ik heb het voorkomen).
   A prefix hint returns that paradigm alone, untagged.

## Intended differences from the frozen snapshot

The characterization snapshot (`tests/characterization/nl.tsv.gz`) froze the output before the switch. Each
difference since is an entry of `tests/characterization/intended-diffs.json` with its reason and source, in one of two
forms (`tests/characterization.test.ts` documents both):

- a line-level entry replaces, removes or adds one line of a frozen block;
- a block-level entry supersedes the whole frozen block of one query by the block with the same header in
  `tests/characterization/nl.accepted.tsv.gz`, written from the current engine by `npm run characterize:accept`.

The switch has 56 block-level entries, the four queries of each verb below (no hint; `inversion`; `pronoun: het`;
`pronoun: u`):

| Infinitive | Change | Reason | Source |
| --- | --- | --- | --- |
| doorlopen | 2 | two readings: dóórlopen (to walk on; loopt door, heeft or is doorgelopen) and doorlópen (to pass through; doorloopt, heeft or is doorlopen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=doorlopen) |
| ondergaan | 2 | two readings: óndergaan (to go down; gaat onder, is ondergegaan) and ondergáán (to undergo; ondergaat, heeft ondergaan); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=ondergaan) |
| overleggen | 2 | two readings: óverleggen (to hand over; legt over, heeft overgelegd) and overléggen (to discuss; overlegt, heeft overlegd); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=overleggen) |
| overlopen | 2 | two readings: óverlopen (to defect, to overflow; loopt over, is overgelopen) and overlópen (to walk all over; overloopt, heeft overlopen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=overlopen) |
| voorkomen | 2 | two readings: vóórkomen (to occur; komt voor, is voorgekomen) and voorkómen (to prevent; voorkomt, heeft voorkomen); frozen: AMBIGUOUS_CLASSIFICATION | [woordenlijst.org](https://woordenlijst.org/zoeken/?q=voorkomen) |
| misstaan | 1 | dual prefix mis- taken as inseparable: misstaat, misstond, misstaan; frozen: AMBIGUOUS_CLASSIFICATION | [e-ANS 12.3.2.1.6](https://e-ans.ivdnt.org/topics/pid/topic-10736514965277082) |
| overwinnen | 1 | dual prefix over- taken as inseparable: overwin, overwon, overwonnen; frozen: weak, geoverwind | [e-ANS 12.3.2.1.9](https://e-ans.ivdnt.org/topics/pid/topic-12953722418251955) |
| voorzien | 1 | dual prefix voor taken as inseparable: voorzie, voorzag, voorzien; frozen: weak, ik voorzi, gevoorzid | [e-ANS 12.3.4.1.22](https://e-ans.ivdnt.org/topics/pid/topic-16418926026532594) |
| neerzetten | 1 | split at neer: zet neer, neergezet; frozen: ik neerzet, geneerzet | [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) |
| opzorpen | 1 | split at op: zorp op, opgezorpt; frozen: ik opzorp, geopzorpt | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| teruggeven | 1 | split at terug: geef terug, gaf terug, teruggegeven; frozen: ik teruggeef, geteruggeefd | [e-ANS 12.3.4.2](https://e-ans.ivdnt.org/topics/pid/topic-19059235502398710) |
| toegeven | 1 | split at toe: geef toe, gaf toe, toegegeven; frozen: ik toegeef, getoegeefd | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| toekomen | 1 | split at toe: kom toe, kwam toe, ben toegekomen (the zijn of komen); frozen: ik toekoom, getoekoomd, hebben | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |
| uitstellen | 1 | split at uit: stel uit, uitgesteld; frozen: ik uitstel, geüitsteld | [e-ANS 12.3.4.1](https://e-ans.ivdnt.org/topics/pid/topic-16531765141029304) |

## Limits

- **Separability of a verb the lexicon does not list is inferred from its spelling, and can be wrong in both
  directions.** Stress and meaning decide it, and spelling shows neither. Checked against the verbs woordenlijst.org
  listed on 2026-11-25, if the lexicon did not list them:
  - *A separable verb kept whole or read as inseparable.* A verb with a dual prefix is read as inseparable, although
    most such verbs are separable: of the separable verbs woordenlijst.org lists, 286 of the 297 with aan-, 228 of the
    230 with door-, 132 of the 208 with om-, 122 of the 122 with over- and 82 of the 203 with voor- would be read as
    inseparable (most of the others start with a longer particle such as aaneen, omhoog or vooruit and are split
    there). An unlisted aanklikken comes out as ik aanklik, aanklikt, not ik klik aan, aangeklikt. Guard 2 keeps 97
    separable verbs with an unambiguous particle whole, because their rest begins with a vowel and is not in the lexicon
    (opeisen, opofferen, uitoefenen, inademen, inenten), or because their particle is not on the list (openmaken,
    opendoen, opzijgaan): ik opeis, geopeist.
  - *A simplex verb split or read with a prefix.* The no-split list holds the simplex verbs woordenlijst.org lists; a
    newer one, or one that is also the spelling of a particle verb, is still split: opteren is split as op + teren (ik
    teer op, opgeteerd: to live off), which is right for one of its two woordenlijst.org lemmas and wrong for the other
    (ik opteer: to opt). A new simplex verb with a dual prefix's letters loses its ge-.
  The assumption in the analysis says which reading was taken and how to override it: an `inseparablePrefix` or
  `separablePrefix` hint, or a `classHint` to keep the verb one word.
- Stress and meaning also decide the auxiliary, and the stress of a final syllable (informeren: ik informeer, not ik
  informer, needs a stress hint); spelling does not show them. Unknown strong verbs need their principal parts
  (`stems`), and unknown loans their stem and, where needed, their d/t.
- Subjects are slots (`1sg` ... `3pl`, `2sg.je`, `2sg.u`, `3sg.zij`, `3sg.ze`, `3sg.het`, `1pl.we`, `3pl.ze`); the
  `pronoun` option selects the slots with that pronoun. `u` takes the 2nd person singular, with the formal forms the
  lexicon lists (u heeft), and keeps its -t after the verb. gij/ge, the subjunctive and archaic imperatives are not
  generated.
- `variant.condition` texts (the hebben/zijn choice, the spoken infinitive wezen, the meanings of two readings) are
  English in both locales.
