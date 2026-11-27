# Seven-language engine: decisions taken during the build

Every decision the coordinating agent took on the owner's behalf while building the seven-language engine,
in the order it was made within each area, with what it costs to undo. Later entries can reverse or narrow
earlier ones; this is marked. The design is in `docs/superpowers/specs/2026-11-24-seven-language-engine-design.md`.

## Process and execution

1. Work on the existing feature branch in the main checkout instead of a new worktree, because the branch already isolates the work from main — if wrong: a `git worktree` move later when parallel language work needs separate trees (it does; worktrees are created then).
2. Plan test bodies that are only comments count as descriptions; implementers must write real assertions for each — if wrong: none.
3. Every commit on the branch carries the session's `Claude Fable 5.2` co-author trailer, whichever subagent model wrote it (later reversed by 4) — if wrong: if per-model attribution is wanted, trailers must be rewritten before the PR.
4. Each commit keeps the co-author trailer of the session that actually wrote it, since accurate attribution beats uniformity (reverses 3) — if wrong: five early commits still say Fable 5.2; fix in one message-rewrite pass at the end of the branch, before any push, which makes recorded hashes stale.
5. The first fix wave covers the important defects, ledger mechanics and cheap minors; the hook-signature and type-surface designs become opening "core completion" tasks of the next plan, before any real pack — if wrong: the first real language pack is delayed by those tasks.
6. Plans for de, en, es, it and la are written by fresh plan authors from the spec's per-language sections and the grammar authorities directly — if wrong: each author repeats part of the detailed research (rule trigger conditions, oracle parsing traps).
7. Do not delete the first plan's workspace or finish the development branch yet; the branch continues through the remaining plans and decisions are collected for the final message — if wrong: none (the workspace is git-ignored scratch).
8. Build each language on its own worktree branch by one lead implementer, in two stints with one whole-stint review per stint instead of a review per task, merging branches one at a time and re-importing generated fixtures (narrows 1) — if wrong: an early-task defect is caught only at the stint review, so rework can span up to four tasks.
9. Run the languages one at a time (Dutch, French, English, German, Spanish, Italian, Latin), each finishing fix wave, second stint, review, fixes and merge, then equivalence, then the closing plan (narrows 8) — if wrong: cost not recorded.
10. Use opus only where deep language and architecture judgement is needed (fix waves, linguistic stint reviews), sonnet for corpus parser, import, guards, docs and merges, and haiku for scoped re-reviews of small fixes — if wrong: cost not recorded.
11. Merge the main line into the French branch before the French switch, rather than merging French first and reconciling afterwards; the same order applies to every later language (narrows 8) — if wrong: a harder merge inside the lead's context; the final merge back becomes near fast-forward.
12. Do not redo the unfinished French stint-1 review; run one whole-pack French review after stint 2, then one fix wave and one scoped re-review (narrows 8) — if wrong: defects from early tasks are found after later tasks were built on them and cost more to fix.
13. Apply one small targeted patch for the Dutch regression on real verbs and the listed wrong forms, despite the rule allowing no second fix wave, because this was a pack review rather than the final review — if wrong: one more sonnet seat, and a later Dutch commit on the main line that French must merge once more.
14. Verify that Dutch patch by CLI spot-checks and the report's gate lines instead of another review agent; the final whole-branch review still covers it — if wrong: a defect in the patch survives until the final review.
15. The Dutch follow-up round is the last before the whole-branch final review; anything still wrong is documented as a limit — if wrong: known wrong forms for unlisted Dutch verbs ship documented rather than fixed.
16. Verify the last French round by gates, CLI spot-check and ledger shape instead of another review agent, then merge the French branch into the main line — if wrong: a defect in the last round survives until the final review.
17. English gets one review (mid-tier model) after its fix wave and second stint, instead of a separate re-review and stint-2 review (narrows 8) — if wrong: subtler architecture issues wait for the whole-branch final review.

## Core and architecture

18. The shared `Gender` type gains `neuter`, while French keeps its own two-value `FrenchGender = 'masculine' | 'feminine'` for its `gender`/`agreement` options — if wrong: French type-checks `neuter` that it rejects at runtime.
19. Store the characterization snapshots as deterministic .tsv.gz instead of plain .tsv, since the frozen snapshot changes only through the intended-diff ledger — if wrong: a failure needs `gunzip -c` to inspect, which the test message mitigates.
20. Accept the changed precedence among simultaneous validation errors, since it was never a documented contract and every single-fault input keeps its code and message — if wrong: a caller depending on the order sees a different code for doubly-invalid input.
21. Add a contract-hardening task before the next planned task: simple non-finite targets consult `clause.agreements`; `ruleIds` follow the surviving form's steps (union if none); periphrases validated once via `validateGrammar`; agreement `FieldSpec` parameterised by genders/cases; target keys move to `core/target.ts` — if wrong: one extra task of rework in the core.
22. An unterminated quoted section in a message is a SyntaxError; closed quotes and lone apostrophes keep ICU behaviour — if wrong: a deliberately unterminated quote (never useful) is no longer accepted.
23. Simple `{n}` with a number formats through `Intl.NumberFormat(locale)` like `#`, so one message never shows a number two ways — if wrong: cost not recorded.
24. Accept the `explain.*` key names and the loud failure in `conjugate` when the English assumption message is missing, since the completeness test guards it — if wrong: a pack that bypasses the completeness test can break `conjugate`.
25. `UnavailableTarget.explanation` for staged packs is the English rendering of its step whenever an English catalog exists — if wrong: cost not recorded.
26. Make four small follow-up changes in a new commit before the next task: English `explanation` for staged packs, a guarded format call in the completeness gate, `defineRules` rejecting params named before/after, and export `Explainable` while dropping unused `Catalogs` — if wrong: cost not recorded.
27. `availability` is the single place a pack declares "no form"; an empty fork for an available target is a GENERATION_FAILURE naming target, lemma and stage — if wrong: packs must consult their lexicon in `availability` as well as in `cell`/`stem`, and the spec sentence is corrected.
28. When branches combine, orthography and region are constraints (a conflict drops the branch), pattern joins with '.', usage takes the most marked, and condition joins with '; ' — if wrong: French pattern strings must match this join format later or get ledger entries.
29. Report the perfect auxiliary's lemma, else the first named-lemma verb, else null; `Periphrasis.reports` overrides — if wrong: cost not recorded.
30. Accept `generate(target, subject?)`, since the staged engine cannot otherwise see a pack's slots — if wrong: direct `engine.generate(target)` callers (the test helper) must pass the slot once Dutch is staged.
31. Fold four review minors into the next task: throw on an undeclared slot returned by `subjectsFor`; a typed `subject` option plus builder method; slot ids may not collide with voice names; catalogue entries may restrict `slots` — if wrong: one more small core change later.
32. Accept that each paradigm is complete and separately labelled, so repeated text across paradigms is correct and a form-less available paradigm fails loudly; paradigm section titles get the pattern label — if wrong: consumers listing forms by text see duplicates for dual-paradigm verbs and must group by `variant.pattern`.
33. Fold five review minors into the authoring-surface and docs task: a `wordPart` overload without the `{}` placeholder; localisable paradigm/pattern labels; voiced periphrasis parts carry the voice; reject `slots` on non-finite or empty entries; a pack-authoring guide — if wrong: cost not recorded.
34. Accept an additive hook, landed with the French work, so gender can fork inside a target, because the frozen French output requires it — if wrong: French and Italian model subject gender differently (Italian uses gendered slots), to be reconciled later if it matters.
35. Accept `wordPart` throwing on a mixed third argument (loud beats silently dropping `joinBefore`) and the wider `./core` export list — if wrong: none known.
36. Fix in code as well as the guide: the completeness gate fails for a registered pack without `rules` unless on an explicit legacy list (fr, nl until migrated), and a catalogue entry with `slots` is finite whatever its `persons` — if wrong: small core edits in a docs fix round.
37. Fold all minors into fix round 1 for the corpus model; unmodelled cells become their own partition (available + unavailable + unmodelled = cells) — if wrong: cost not recorded.
38. Accept `variant.region: null` on staged forms (legacy forms omit the field), giving one explicit shape for every staged pack — if wrong: Dutch tests comparing whole variant objects need `region: null` at the switch, and consumers doing deep equality see a new key.
39. An explanation step never doubles as a control signal; if the clause needs a marker, add a minimal additive core feature (word-level marks that reach the clause but never the variant) — if wrong: cost not recorded.
40. `compareKey` becomes an optional `LanguagePack` member with `Engine.normalizeForComparison` and a typed root export, as a sanctioned core change made during the Latin work — if wrong: cost not recorded.
41. Ledger form: block-level entries `{ query, block: true, reason, source }` backed by a per-language accepted .tsv.gz; 53 queries cover the Dutch switch instead of 2,625 line entries, and the new blocks stay frozen — if wrong: line-by-line was/now pairs are no longer in the ledger for those queries.
42. The corpus test's "cell without subject matches any slot of its person/number" applies only to languages that declare subject-less fixtures (nl, fr) — if wrong: cost not recorded.
43. Add a sentence-level ledger form `{ sentence: { was, now }, reason, source }` for reworded or removed analysis sentences, pinned separately — if wrong: cost not recorded.
44. Block-level ledger entries are also allowed for a real verb when its whole block changes for one stated cause with an authority source, relaxing the invented-probes-only limit (extends 41) — if wrong: an unintended change inside such a block is covered by the entry and visible only in the accepted snapshot diff.
45. Dutch is not refactored onto the shared Germanic prefix code now; noted for the closing plan — if wrong: Dutch and German keep parallel prefix code until the closing plan.
46. The pack-authoring guide's rule 14 gets a narrow named exception: a spelling rule that decides against an expected change may record its step on the unchanged word — if wrong: other packs may use the exception for noise steps; the final review should check.
47. `normalizeForComparison` for packs without `compareKey` is NFC, case-fold and trim, with no diacritic stripping, since é/e and ü/u are different answers — if wrong: the trainer must not use it to forgive accent slips; that would be a separate, explicit option.

## Dutch

48. Accept two extra assumption rule ids, slots only on the shadow pack until the Dutch switch, and the `Object.hasOwn` lookup, each needed to reproduce the frozen analysis lines or a pure bug fix — if wrong: none known.
49. Fix the Dutch explanation defects before the switch, with a test file pinning full en + nl explanations for at least 40 everyday forms — if wrong: the switch is delayed by one fix wave.
50. After the switch, a separate "Dutch lexicon corrections" commit fixes wrong Dutch in the frozen output (verhuizen and other inseparable verbs, boxen, spijten) through lexicon data, each change a sourced ledger entry (woordenlijst.org / e-ANS), with no general inference of inseparable prefixes — if wrong: Dutch output differs from the legacy in a few more queries than the user explicitly approved; each is listed in the ledger.
51. Keep the approved separable-particle inference but guarded: unambiguous particle only, a lexicon-verb or plausible consonant-initial remainder, a vowel-clash rule, and a no-split list of real simplex verbs checked on woordenlijst.org; flag to the user that it is unreliable from spelling alone — if wrong: an unlisted simplex verb passing the guards is split wrongly, and an unlisted particle verb with a vowel-initial remainder is not split (documented limit).
52. The default reading of dual-prefix verbs becomes the per-prefix majority from woordenlijst.org counts (aan 286/297 and door 228/230 separable), replacing the blanket inseparable default — if wrong: more frozen queries change (ledgered).
53. `spijten` stays unchanged, since the authority supports "zij spijten" (narrows 50) — if wrong: cost not recorded.
54. `x` counts as a consonant cluster in the stem and dental rules, replacing sixteen -xen lexicon workarounds — if wrong: output for unlisted or invented -xen verbs changes.
55. In the final Dutch fix wave, make listed verbs facts by importing verb data (stress class of -eren/-elen/-enen verbs, separability and both-readings lemmas per prefix, vowel-initial remainders) from the woordenlijst.org lexicon service, with unknown verbs keeping guarded inference plus assumption steps — if wrong: the package grows, and it depends on the Woordenlijst licence, which must be checked first (no bulk import if redistribution is not clearly permitted).
56. Leave the three imported Woordenlijst tables in place on the unpushed branch and import nothing further; no push or PR until the user decides (ask for permission, or replace them with independently compiled lists) — if wrong: the local branch holds data whose redistribution is unsettled and must not be published as is.
57. "doorzóéken" is correct Dutch stress marking on a digraph, not a typo, and is left as is — if wrong: one odd accent in a condition label.
58. New separable entries with auxiliary 'both' stay; unverified ones are listed in the patch report — if wrong: an extra "is/heeft" variant offered for a verb that takes only one.
59. Accept spelling-based inference of bound prefixes for unlisted verbs, since without it common verbs (verdelen, verzorgen, ontkennen) got ge- — if wrong: verbs whose be-/ge- is not a prefix need a lexicon entry (false positives).

## French

60. croître participle becomes crû, crue, crus, crues (dropping crûe/crûs/crûes) and clore gives il clôt only (dropping il clot), with sourced line-level ledger entries, superseding an earlier keep-legacy plan because the authorities agree — if wrong: an answer the trainer accepted before (crûe, il clot) is now rejected; reverting is two lexicon lines plus ledger entries.
61. surseoir keeps je sursoirai (1990, from the rectified infinitive sursoir) beside je surseoirai (traditional), with the citation made honest and marked secondary, left as an open user decision (later reversed by 67) — if wrong: a 1990-spelling future the Journal officiel did not intend.
62. French être verbs are a closed, per-lemma verified list including derivatives (redevenir, apparaître, éclore…); unlisted verbs get avoir as a recorded assumption — if wrong: an être derivative missing from the list is conjugated with avoir, with a visible assumption step.
63. faillir takes avoir only with an invariable participle; asseoir (assois series) gives assoirai in both spellings; redevoir's 1990 participle is redu; each with sourced ledger entries — if wrong: legacy answers are no longer accepted.
64. h aspiré becomes a closed list checked per lemma against the Académie; invented h- verbs assume h muet with an assumption step — if wrong: an h-aspiré verb missing from the list elides (j'hausse).
65. The pronominal past imperative, the absoudre passé simple, the gésir imperative and the paître compound tenses stay unavailable (legacy), but steps must not cite authorities that print the opposite; all four are open user decisions in the French grammar doc — if wrong: forms the Académie prints are reported as not existing.
66. Keep the dual-auxiliary condition surviving an auxiliary hint, as the snapshot pins it; keep the rank tiebreak with a comment and pinning test; send the core build-order question to the whole-branch final review — if wrong: another language hits the same ordering and needs its own tiebreak.
67. surseoir: je surseoirai preferred in both spellings; je sursoirai kept only as a non-preferred, marked 1990 variant flagged secondary, because two independent reviewers read the sources as surseoirai only (reverses 61) — if wrong: learners using a reference that prints sursoirai see it as non-preferred; stays an open user decision (alternative: drop sursoirai).
68. An assumed auxiliary must accept an overriding hint (INVALID_HINT only where a listed lexical auxiliary is contradicted and the legacy snapshot pins that) — if wrong: none beyond the fix.

## English

69. A form only one dictionary prints is not labelled US for that reason; region labels go only to forms a dictionary marks as American or British — if wrong: cost not recorded.
70. Archaic or literary forms (writ, smote, begot) get usage dated or literary, without a region — if wrong: cost not recorded.
71. Add GB `parallelled` — if wrong: cost not recorded.
72. Real verbs that come out wrong (offseted, retrod, debutted) are fixed in the first commit of the second stint, with dictionary verification — if wrong: cost not recorded.
73. `dated`/`literary` only where a dictionary marks the form old, archaic or literary; an unmarked second form is `standard`, listed second, not preferred; no new usage value in core (narrows 70) — if wrong: the trainer shows a rarer variant without any "less common" hint.
74. The region option makes that region's form preferred (GB → ageing, burnt); the default without the option is documented — if wrong: none.
75. No suffix-based inheritance for arbitrary first elements (cheat/defeat/repeat end in "eat"); common compounds of irregular verbs and final-stressed compounds become dictionary-checked lexicon entries, and everything else stays regular with an assumption step and a documented limit — if wrong: an unlisted compound (e.g. a rare "-cast" verb) comes out regular unless hinted.

## German

76. Lookalikes never inherit (begleiten, verleiden are weak), and nested prefixes are resolved outside-in — if wrong: cost not recorded.
77. The perfect auxiliary is set per lemma, with recorded assumptions for unlisted derivatives (inseparable → haben, particle + sein-root → sein) — if wrong: an unlisted derivative's auxiliary can be wrong, shown as a visible step and overridable by hint.
78. Dual-prefix lemmas get distinct, truthful labels — if wrong: cost not recorded.
79. melken, triefen and dingen (plus glimmen and stieben if DWDS agrees) fold into one paradigm with marked older variants — if wrong: cost not recorded.
80. Both Konjunktiv II doublets are given, each with its DWDS/Duden usage — if wrong: cost not recorded.
81. A derivative of a two-paradigm root inherits only the paradigms recorded for that derivative (DWDS-checked); the root's sense glosses never carry over; an unlisted derivative gets both paradigms labelled by pattern only, plus an assumption step — if wrong: an unlisted derivative shows one paradigm too many, flagged as assumed.
82. Separable verbs with a noun, adjective or verb first element (teilnehmen, stattfinden, fernsehen, kennenlernen, bereitstellen…) form a closed DWDS-checked list; compound particles (überein, hinterher, auseinander, vorwärts…) are single entries; stacked particles print apart only after wieder; no generic inference this round (parked as a user option) — if wrong: an unlisted compound such as an invented "plumfahren" is conjugated as a weak simplex; the assumption step must name that guess.
83. An explicit usage mark in either dictionary (selten, veraltend, ugs., landsch.) beats an unmarked listing in the other, and order inside a generated table is not evidence (applied to verdürbe, hülfe, milkst, lade, schwimmen) — if wrong: the preferred/alternate order of a handful of doublets.
84. "Duden only" and "DWDS only" steps say only which source prints the form, with no frequency claim — if wrong: none.
85. German keeps `requireTaggedExtras` off; its guard instead pins the reviewed list of 24 untagged preferred forms the page lacks, and a language-supplied tag predicate is a closing-plan item — if wrong: none once pinned.
86. Weak verbs with sein stay lexical (no "inchoative ver-/er- → sein" rule); the list is extended from DWDS for frequent verbs; denominal verbs record the haben assumption — if wrong: an unlisted change-of-state verb is taught with haben, flagged as assumed.
87. werden's wurden/wurdet derive from wurd- only if no new rule is needed; tun stays listed — if wrong: cost not recorded.
88. lad (imperative of laden) is not emitted at all (dropped via the corrections ledger like find/halt), because core has no colloquial usage value (narrows 83) — if wrong: a colloquial form a learner may meet is absent; adding a usage value is a core change for the closing plan.

## Spanish

89. Impersonal verbs render no subject pronoun, third person singular only, with feminine and formal slots unavailable — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
90. Only freír, imprimir and proveer have two participles in compound tenses (NGLE §4.12), and the regular one is derived — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
91. electo, preso, bendito and maldito are adjectives and are not generated as participles, reversing the Spanish design's deviation; the oracle's electo becomes a correction — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
92. raer has raigo and rayo — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
93. iros gets its own rule (later reversed by 102) — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
94. anticúo is accepted, auxiliar takes both stresses, and errar has a regional erro — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
95. contradecir and desdecir have the irregular future first, regular only once the DPD is read — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
96. -eír and -oír are rule classes — if wrong: rests on unverified knowledge of RAE doctrine (not checked against rae.es).
97. pudrir is one verb with participle podrido, and roer has roo/roigo/royo — if wrong: cost not recorded.
98. idos is tagged older (later reversed by 102) — if wrong: cost not recorded.
99. bendecir and maldecir take a regular future and participle — if wrong: cost not recorded.
100. concernir, atañer, soler, acaecer and acontecer are defective, and abolir is full — if wrong: cost not recorded.
101. The prefix list gains retro- — if wrong: cost not recorded.
102. idos is the preferred plural imperative of irse, with iros a standard non-preferred variant, because the RAE note and DPD «ir» call idos recommended and iros valid (reverses 93 and 98) — if wrong: the order of two accepted forms.
103. predecir has the regular future first (predeciré) and prediré second, both standard; contradecir, desdecir, antedecir and interdecir behave like decir (contradiré first, regular tagged variant) unless a page actually read says otherwise (narrows 95) — if wrong: the preferred order of future doublets for four rare verbs; unverified against the RAE.
104. h- before a diphthong is written only word-initially (huele); deshueso/deshuevo are lexical; desollar gives desuello — if wrong: none (DLE).
105. -iar verbs whose root has no other vowel (ciar, criar, fiar, guiar, liar, piar; invented fliar) stress the i by rule, not by list or assumption, because the i is the root's only vowel — if wrong: an invented monosyllabic-root -iar verb gets hiatus forms without an assumption flag.
106. Regular variants are derived, never stored (predeciré, satisface, yace, roo) — if wrong: cost not recorded.
107. Third-person-only defectives render no subject pronoun — if wrong: cost not recorded.
108. Impersonal verbs accept the feminine 3sg slot (narrows 89) — if wrong: cost not recorded.
109. A class hint that does not fit gives INVALID_HINT — if wrong: cost not recorded.
110. The lexical step states its own verification status through a select parameter — if wrong: cost not recorded.
111. The ser/ir imperfect cells, habéis and vayamos stay suppletive data — if wrong: cost not recorded.
112. cimentar and emparentar variants are added only if a readable source confirms them — if wrong: cost not recorded.

## Italian

113. `fo` is emitted as a standard variant but never preferred (faccio stays preferred), rather than as `regional` (Tuscan), because the Vocabolario prints "fo o faccio" unlabelled — if wrong: cost not recorded.
114. Weather verbs keep both auxiliaries but, being impersonal, expose third person singular only with the masculine singular participle, with no plural or feminine compound forms — if wrong: figurative plural uses (piovono critiche) are not generated.
115. Derivatives inherit an essere-only base's auxiliary — if wrong: cost not recorded.
116. Inheritance for an unlisted verb is recorded as an assumption step — if wrong: cost not recorded.
117. The lexicon grows to cover the irregular verbs a learner meets, by a systematic sweep with each entry verified — if wrong: cost not recorded.
118. Verification is recorded per entry, never defaulted — if wrong: cost not recorded.
119. solere and other defectives get no compound cells — if wrong: cost not recorded.
120. vo is generated only if the Vocabolario prints it — if wrong: cost not recorded.
121. Regular variants are derived, not stored — if wrong: cost not recorded.
122. An en.wiktionary second oracle is added, fetched with a generic User-Agent that carries no personal data — if wrong: cost not recorded.
123. The auxiliary is set per lemma from the derivative's own Vocabolario header; only an unlisted derivative of an essere-only base inherits essere, as an assumption step (narrows 115) — if wrong: an unlisted intransitive derivative of a dual-auxiliary base gets avere, flagged as assumed.
124. Doublets the Vocabolario prints are generated with its label (standard non-preferred when unlabelled) and never dropped by the ledger (veggente, faciente, fo) — if wrong: a rare printed variant appears in tables.
125. Every readPages record must belong to a lexicon or side-list entry, and entries touched in the last round get an authority cell with the header's printed forms; the 449 read headers are not fully re-derived this round — if wrong: other "read" entries may still contradict their headers (riempire did); candidate check for the final review.
126. Short bases (dire, fare, volere) resolve derivatives by explicit list only — if wrong: cost not recorded.
127. Non-isc side-list verbs are valid prefix bases (a rule step when listed, an assumption when not) — if wrong: cost not recorded.
128. The dare/stare six-cell tables and the nine-item final-accent trigger list stay — if wrong: a little more table than rule in two suppletive verbs.

## Latin

129. Add the rule la.avail.not-attested — if wrong: cost not recorded.
130. Add āiō and inquam (plus fārī, quaesō, cedo, salvē, avē) as defective entries, so nothing gets an invented paradigm — if wrong: cost not recorded.
131. Macron-less identification consults the lexicon first; common regular second-conjugation verbs are added as entries; ambiguous spellings (macron-less -ere verbs outside the lexicon) return two paradigms — if wrong: cost not recorded.
132. ferō compounds are treated as a family, and eō's perfect is derived — if wrong: cost not recorded.
133. The Latin pack imports no unexported core internals — if wrong: cost not recorded.
134. Compounds are families with their own perfect and supine (attingō is not tingō; reddō, redeō, referō) — if wrong: cost not recorded.
135. An unlisted ferō compound is resolved with an assumption step — if wrong: cost not recorded.
136. The passive infinitive of a known active verb is not silently treated as a deponent — if wrong: cost not recorded.
137. coepī, meminī, ōdī and nōvī are defective entries — if wrong: cost not recorded.
138. The loss of v in -īvī perfects (audiī, petiī) is its own rule, standard usage, never preferred; `syncope` stays literary for contracted forms only (A&G §181.a/b) — if wrong: one usage label on audiī-type forms.
139. A typed infinitive whose macron-less key matches the lexicon but whose vowel lengths conflict (regēre, āmāre) resolves to the lexicon verb with an assumption step naming the corrected spelling, and never builds a paradigm on the typed lengths — if wrong: an invented verb differing from a real one only in vowel length cannot be conjugated (no hint can force it).
140. Homograph order is data: the common verb comes first (veniō before vēneō, occīdō before occidō) — if wrong: the order of two paradigms.
141. Transcribe the four small missing authority files (semi-deponents, edō, defective, impersonal) and sweep the parenthesised compound notes of A&G §§209–212 already used by the lexicon; park the two Bennett files and a full §§209–212 principal-parts file; the planned user spot check of five cells per file becomes an open item — if wrong: transcription slips in 1,249+ single-reader cells stay undetected until a human reads them.
142. Authority and Wiktionary tests forbid untagged extras; forem/fore of sum compounds stay generated but tagged (pattern); the Wiktionary ledger is pinned by content hash — if wrong: none beyond tags.
143. Forms the grammars label old, archaic or early are not generated; surfaced to the user as an option (about 120 ledger cells would become dated forms) — if wrong: cost not recorded.
144. Variants that L&S prints (plūvit, reperī) are generated tagged if the entry can be read, otherwise they stay dropped and are listed as unverified — if wrong: cost not recorded.
145. nāscitūrus and potēns are tagged — if wrong: cost not recorded.
146. scītō gets a §182.a rule step and scīte is tagged — if wrong: cost not recorded.
147. nescīre follows L&S if readable, otherwise keeps the derived imperative, listed as unverified — if wrong: cost not recorded.
148. The reduplication-loss rule applies only where a family has no compound perfect of its own — if wrong: rare admomordī-type compounds are not modelled.
149. queō's quīverint and quīvisse are left out, per A&G §206.d — if wrong: two cells.
150. fugitum is generated tagged on L&S against A&G's silence — if wrong: one entry and five ledger cells.

## Tense equivalence

151. `equivalentTenses` returns `{ matches, notes }` (matches may be empty, then notes is not) instead of a never-empty array with a `none` entry — if wrong: it differs from the approved sketch, which showed a bare array.
152. fr passé composé → en ranks simple past first and present perfect second, as the approved design states, although the raw weights would rank them the other way — if wrong: cost not recorded.
153. Equivalence runs with a mapped-language union that grows per task (fr, nl first), the second part adds one language per task, and the last task tightens the registry to `{ [L in Language]: LanguageMap<L> }` so totality is a compile error — if wrong: none (ordering only).
154. Fix equivalence review findings in the language maps, not by overrides — if wrong: pinned plan rows change (it perfect → fr 0.48 → 0.8 etc.); a trainer author wanting the old order adds a pair override.
155. English simple past carries PAST_PERFECTIVE 1 and PAST_IMPERFECTIVE 0.9, with past progressive 0.8 — if wrong: cost not recorded.
156. Italian passato prossimo carries PRESENT_PERFECT 1 and PAST_PERFECTIVE 0.8 — if wrong: cost not recorded.
157. French imparfait and plus-que-parfait get target-only links for the subjunctive imperfect/pluperfect (si-clause), replacing both en→fr overrides — if wrong: cost not recorded.
158. German Konjunktiv I is reported speech, not the Romance subjunctive: target-only links on the indicative and a source-only indicative link on Konjunktiv I — if wrong: cost not recorded.
159. A literary tense is never first when a standard tense corresponds, so de Konjunktiv II → fr gives the conditionnel first (reversing an earlier open-question answer) — if wrong: one de→fr row.
160. The register rung of the ladder comes last, after mood: a dated target is offered only when even relaxing mood finds nothing, so de subjunctive future → es gives the indicative future (changes an earlier plan review focus) — if wrong: two rows; the futuro de subjuntivo is then reachable only from Spanish itself.
161. Aspect is never relaxed to progressive from a non-progressive source — if wrong: six rows lose a second-place progressive at full score.
162. es/it negative imperative → la answers with the present infinitive (nōlī + infinitive) and a Latin-specific note — if wrong: cost not recorded.
163. The `./equivalence` subpath also exports the note texts (en, nl) so a browser trainer need not load the packs — if wrong: cost not recorded.

## Closing

164. README and grammar-doc totals for fr/nl are left for the closing plan, to avoid merge conflicts with the next languages — if wrong: cost not recorded.
165. The first four closing tasks get no per-task reviews; the final whole-branch review is their review, with one fix wave — if wrong: a defect in those tasks is found one step later.

166. For third person plural the trainer accepts every `elles` form (`elles parlent`, `elles ont mangé`), because the Dutch prompt "zij" does not fix gender; the past imperative accepts `sois allée !` — if wrong: those answers are marked right; one filter line.
167. The corpus guard hook is `acceptsUntagged(form, file)`, and German's list of 30 reviewed untagged forms exists both in its corpus module and in its test — if wrong: the list is kept in two places.
168. The Dutch derivative resolver, the ge- participle, family resolvers, participle agreement, clitic placement and stem sources stay per language; only particle placement, the dual-paradigm fork and consonant spelling are shared — if wrong: some duplication remains between packs.
169. The engine package is marked `"private": true` until the licence and the three Dutch tables compiled from woordenlijst.org are decided — if wrong: one line to remove before publishing.
170. One gender model for all languages: `target.gender` is the subject gender a form shows; Italian, Latin and Spanish are brought in line with French (texts, order and fixtures unchanged) — if wrong: consumers of the old null value see a value; nobody consumes it yet.
171. Formal address (usted, Sie, Lei, u) is returned only on request in every language, the imperative included; Spanish drops usted/ustedes from the unfiltered imperative — if wrong: a classic imperative table includes the formal forms; flipping the default touches three packs.
172. `variant.condition` (the sense gloss on homograph paradigms, e.g. "be sold") stays English and is documented as not localized — if wrong: a Dutch UI shows English glosses until conditions move into the message catalogs.
173. Absolute local paths and the account name are removed from tracked documents and origin-naming test helpers are renamed; the site names inside the design documents under docs/superpowers stay, as does a pre-existing comment in the app — if wrong: the corpus's origin sites remain named in the design record.
174. The build ships no source maps, the migration adapter is deleted, and the core ranks by variant when a pack gives no `rank` — if wrong: restore two compiler flags.
175. Final-review follow-ups are left as documented limits: the French rank workaround, formal-slot id conventions, assumption wording, missing infinitive explanations for some fr/nl verbs, impersonal verbs in Dutch and English, rule-id naming, trainer feedback echoing the masculine form, and German colloquial `lad` — if wrong: each is a small follow-up task.

176. The six minor findings of the last re-check are left as they are, with no second fix wave: CLI labels print the slot gender for German, English and Spanish default forms; api.md says gender is null when none shows although Italian `piove` carries masculine; three sentences in pack-authoring.md describe the gender hooks as before the unification; Spanish `haber` and `llover` lost one formal-slot assertion each; a Spanish `{mood: imperative, person: 3}` query now throws instead of returning usted; one Dutch equivalence note still says "de lijdende vorm" — if wrong: three documentation sentences are inaccurate until a follow-up.
