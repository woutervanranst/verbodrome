import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { LEVELS, QUICK_LEVELS, levelDef } from '../config/levels';
import type { Level } from '../config/levels';
import { APP } from '../config/app';
import { ERAS, TENSES } from '../config/tenses';
import type { Era, TenseDef } from '../config/tenses';
import { GROUP_LABELS, VERBS } from '../config/verbs';
import type { VerbGroup } from '../config/verbs';
import { exampleOf } from '../trainer/forms';
import { dutchPrompt } from '../trainer/prompt';
import { askable } from '../trainer/question';
import type { Selection } from '../trainer/question';
import { matchingLevel, tensesForLevel, toggle, verbsForLevel } from '../trainer/selection';

interface PickerProps {
  readonly initial: Selection;
  /** First visit: there is nothing to go back to, so no close button. */
  readonly canCancel: boolean;
  readonly onConfirm: (selection: Selection) => void;
  readonly onCancel: () => void;
}

const GROUP_ORDER: readonly VerbGroup[] = ['er', 'ir', 're', 'onregelmatig', 'zeldzaam'];

const gloss = (nl: { infinitive: string; complement?: string; tail?: string }): string =>
  [nl.complement, nl.infinitive, nl.tail].filter(Boolean).join(' ');

/** Every tense illustrated with the example verb: French form and its Dutch meaning. */
function tenseExamples(): Map<string, { fr: string; nl: string | null }> {
  const verb = VERBS.find(candidate => candidate.fr === APP.exampleVerb);
  const examples = new Map<string, { fr: string; nl: string | null }>();
  if (!verb) return examples;
  for (const tense of TENSES) {
    const fr = exampleOf(verb.fr, tense.id);
    if (!fr) continue;
    const slot = tense.finite ? (tense.mood === 'imperative' ? '2s' : '1s') : '-';
    examples.set(tense.id, { fr, nl: dutchPrompt(verb, tense, slot) });
  }
  return examples;
}

const LEVEL_ORDER: readonly Level[] = LEVELS.map(level => level.id);

/** Tenses per era of the time axis; within an era the ones taught first come first. */
function tensesByEra(): Map<Era, TenseDef[]> {
  const out = new Map<Era, TenseDef[]>();
  for (const tense of TENSES) out.set(tense.era, [...(out.get(tense.era) ?? []), tense]);
  for (const list of out.values()) list.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  return out;
}

function LevelChips({ label, active, onPick }: { label: string; active: Level | null; onPick: (level: Level) => void }) {
  return (
    <div className="levels" role="group" aria-label={label}>
      {QUICK_LEVELS.map(id => {
        const level = levelDef(id);
        return (
          <button key={id} type="button" className={`chip${active === id ? ' is-active' : ''}`}
            style={{ '--level': level.color } as CSSProperties} aria-pressed={active === id}
            title={level.detail} onClick={() => onPick(id)}>
            <span className="chip__dot" aria-hidden="true" />{level.name}
          </button>
        );
      })}
    </div>
  );
}

/** Pick what to practise: tenses on a time axis, verbs as a list; both with quick-picks per school level. */
export function Picker({ initial, canCancel, onConfirm, onCancel }: PickerProps) {
  const [tenses, setTenses] = useState<readonly string[]>(initial.tenses);
  const [verbs, setVerbs] = useState<readonly string[]>(initial.verbs);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && canCancel) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canCancel, onCancel]);

  const examples = useMemo(tenseExamples, []);
  const byEra = useMemo(tensesByEra, []);
  const tenseLevel = matchingLevel(tenses, tensesForLevel);
  const verbLevel = matchingLevel(verbs, verbsForLevel);

  const needle = search.trim().toLowerCase();
  const visible = useMemo(() => VERBS.filter(verb => !needle
    || verb.fr.toLowerCase().includes(needle) || gloss(verb.nl).toLowerCase().includes(needle)), [needle]);

  // The selection must yield at least one question before the learner can leave.
  const playable = useMemo(() => {
    const set = new Set(tenses);
    return VERBS.some(verb => verbs.includes(verb.fr) && askable(verb, set).length > 0);
  }, [tenses, verbs]);
  const problem = !verbs.length ? 'Kies minstens één werkwoord.'
    : !tenses.length ? 'Kies minstens één tijd.'
    : !playable ? 'Deze werkwoorden hebben geen vormen in de gekozen tijden.' : null;

  const setGroup = (group: VerbGroup, on: boolean) => {
    const members = VERBS.filter(verb => verb.group === group).map(verb => verb.fr);
    setVerbs(on ? [...new Set([...verbs, ...members])] : verbs.filter(fr => !members.includes(fr)));
  };

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <div className="picker__panel">
        <header className="picker__head">
          <div>
            <h2 id="picker-title" className="picker__title">Wat wil je oefenen?</h2>
          </div>
          {canCancel && <button type="button" className="picker__close" onClick={onCancel} aria-label="Sluiten zonder wijzigen">×</button>}
        </header>

        <div className="picker__body">
          <section className="picker__section" aria-labelledby="picker-tenses">
            <div className="picker__section-head">
              <h3 id="picker-tenses">Tijden</h3>
              <p>Kies een graad om alles tot en met die graad te nemen, of zet tijden apart aan en uit op de tijdlijn.</p>
            </div>
            <LevelChips label="Tijden per graad" active={tenseLevel} onPick={id => setTenses(tensesForLevel(id))} />
            <div className="timeline">
              {ERAS.map(era => {
                const members = byEra.get(era.id) ?? [];
                const lit = members.some(tense => tenses.includes(tense.id));
                return (
                  <section className={`era${lit ? ' is-lit' : ''}`} key={era.id} aria-label={era.label}>
                    <h4 className="era__head"><span className="era__dot" aria-hidden="true" />{era.label}</h4>
                    <ul className="era__box">
                      {members.map(tense => {
                        const on = tenses.includes(tense.id);
                        const level = levelDef(tense.level);
                        const example = examples.get(tense.id);
                        return (
                          <li key={tense.id}>
                            <button type="button" className={`tense${on ? ' is-on' : ''}`} aria-pressed={on}
                              style={{ '--level': level.color } as CSSProperties} title={level.name}
                              onClick={() => setTenses(toggle(tenses, tense.id))}>
                              <span className="tense__check" aria-hidden="true" />
                              <span className="tense__text">
                                <span className="tense__name" lang="fr">{tense.label}</span>
                                {example && <span className="tense__example" lang="fr">{example.fr}</span>}
                                {example?.nl && <span className="tense__nl">{example.nl}</span>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
            <p className="timeline__ends" aria-hidden="true"><span>← verleden</span><span>toekomst →</span></p>
          </section>

          <section className="picker__section" aria-labelledby="picker-verbs">
            <div className="picker__section-head">
              <h3 id="picker-verbs">Werkwoorden</h3>
              <p>Neem de werkwoorden van een graad of stel zelf een lijst samen.</p>
            </div>
            <div className="verbs__tools">
              <LevelChips label="Werkwoorden per graad" active={verbLevel} onPick={id => setVerbs(verbsForLevel(id))} />
              <input className="verbs__search" type="search" value={search} placeholder="Zoek een werkwoord…"
                aria-label="Zoek een werkwoord" onChange={event => setSearch(event.target.value)} />
            </div>

            {GROUP_ORDER.map(group => {
              const members = visible.filter(verb => verb.group === group);
              if (!members.length) return null;
              const all = VERBS.filter(verb => verb.group === group);
              const allOn = all.every(verb => verbs.includes(verb.fr));
              return (
                <div className="verbs__group" key={group}>
                  <div className="verbs__group-head">
                    <h4>{GROUP_LABELS[group]}</h4>
                    <button type="button" className="btn btn--tiny" onClick={() => setGroup(group, !allOn)}>
                      {allOn ? 'geen' : 'alle'}
                    </button>
                  </div>
                  <div className="verbs">
                    {members.map(verb => {
                      const on = verbs.includes(verb.fr);
                      return (
                        <button key={verb.fr} type="button" className={`verb${on ? ' is-on' : ''}`} aria-pressed={on}
                          onClick={() => setVerbs(toggle(verbs, verb.fr))}>
                          <span className="verb__fr" lang="fr">{verb.fr}</span>
                          <span className="verb__nl">{gloss(verb.nl)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!visible.length && <p className="verbs__empty">Geen werkwoord gevonden voor „{search}”.</p>}
          </section>
        </div>

        <footer className="picker__foot">
          <p className="picker__count" aria-live="polite">
            {problem ?? <><strong>{verbs.length}</strong> {verbs.length === 1 ? 'werkwoord' : 'werkwoorden'} · <strong>{tenses.length}</strong> {tenses.length === 1 ? 'tijd' : 'tijden'}</>}
          </p>
          <button type="button" className="btn btn--go btn--big" disabled={problem !== null}
            onClick={() => onConfirm({ verbs, tenses })}>
            Start
          </button>
        </footer>
      </div>
    </div>
  );
}
