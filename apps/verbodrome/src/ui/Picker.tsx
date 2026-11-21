import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { LEVELS, QUICK_LEVELS, levelDef } from '../config/levels';
import type { Level } from '../config/levels';
import { APP } from '../config/app';
import { ERAS, TENSES } from '../config/tenses';
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

/** "Kies je traject": tenses as stations on one métro line per school level, verbs as tickets. */
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
            <p className="picker__kicker">Plan van het net</p>
            <h2 id="picker-title" className="picker__title">Kies je traject</h2>
          </div>
          {canCancel && <button type="button" className="picker__close" onClick={onCancel} aria-label="Sluiten zonder wijzigen">×</button>}
        </header>

        <div className="picker__body">
          <section className="picker__section" aria-labelledby="picker-tenses">
            <div className="picker__section-head">
              <h3 id="picker-tenses">Tijden</h3>
              <p>Elke lijn is een graad, elke halte een tijd, van vroeger naar later. Tik op het lijnnummer om alles tot en met die graad te nemen, of zet haltes apart aan en uit.</p>
            </div>
            <p className="axis" aria-hidden="true">
              {ERAS.map(era => <span key={era.id}>{era.label}</span>)}
            </p>
            <div className="network">
              {LEVELS.map(level => {
                const stations = TENSES.filter(tense => tense.level === level.id);
                const active = tenseLevel === level.id;
                const style = { '--line': level.color, '--line-ink': level.ink } as CSSProperties;
                return (
                  <div className="line" key={level.id} style={style}>
                    <button type="button" className={`line__head${active ? ' is-active' : ''}`}
                      onClick={() => setTenses(tensesForLevel(level.id))}
                      aria-pressed={active}
                      title={level.id === 'extra' ? 'Alle tijden' : `Alle tijden tot en met ${level.name}`}>
                      <span className="line__roundel" aria-hidden="true">{level.line}</span>
                      <span className="line__name">{level.name}<small>{level.detail}</small></span>
                    </button>
                    <div className="line__stations">
                      {ERAS.map(era => {
                        const zone = stations.filter(tense => tense.era === era.id);
                        if (!zone.length) return null;
                        return (
                          <div className="zone" key={era.id} style={{ flexGrow: zone.length }}>
                            <span className="zone__label">{era.label}</span>
                            <ol className="zone__stations">
                              {zone.map(tense => {
                                const on = tenses.includes(tense.id);
                                const example = examples.get(tense.id);
                                return (
                                  <li key={tense.id}>
                                    <button type="button" className={`station${on ? ' is-on' : ''}`} aria-pressed={on}
                                      onClick={() => setTenses(toggle(tenses, tense.id))}>
                                      <span className="station__dot" aria-hidden="true" />
                                      <span className="station__text">
                                        <span className="station__name" lang="fr">{tense.label}</span>
                                        {example && (
                                          <span className="station__example">
                                            <span lang="fr">{example.fr}</span>
                                            {example.nl && <span className="station__nl">{example.nl}</span>}
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="picker__section" aria-labelledby="picker-verbs">
            <div className="picker__section-head">
              <h3 id="picker-verbs">Werkwoorden</h3>
              <p>Je carnet met tickets. Neem het pakket van een graad of stel zelf samen.</p>
            </div>
            <div className="carnet__tools">
              <div className="carnet__levels" role="group" aria-label="Werkwoorden per graad">
                {QUICK_LEVELS.map((id: Level) => {
                  const level = levelDef(id);
                  return (
                    <button key={id} type="button" className={`chip${verbLevel === id ? ' is-active' : ''}`}
                      style={{ '--line': level.color, '--line-ink': level.ink } as CSSProperties}
                      aria-pressed={verbLevel === id} onClick={() => setVerbs(verbsForLevel(id))}>
                      <span className="chip__roundel" aria-hidden="true">{level.line}</span>{level.name}
                    </button>
                  );
                })}
              </div>
              <input className="carnet__search" type="search" value={search} placeholder="Zoek een werkwoord…"
                aria-label="Zoek een werkwoord" onChange={event => setSearch(event.target.value)} />
            </div>

            {GROUP_ORDER.map(group => {
              const members = visible.filter(verb => verb.group === group);
              if (!members.length) return null;
              const all = VERBS.filter(verb => verb.group === group);
              const allOn = all.every(verb => verbs.includes(verb.fr));
              return (
                <div className="carnet__group" key={group}>
                  <div className="carnet__group-head">
                    <h4>{GROUP_LABELS[group]}</h4>
                    <button type="button" className="btn btn--tiny" onClick={() => setGroup(group, !allOn)}>
                      {allOn ? 'geen' : 'alle'}
                    </button>
                  </div>
                  <div className="carnet">
                    {members.map(verb => {
                      const on = verbs.includes(verb.fr);
                      return (
                        <button key={verb.fr} type="button" className={`stub${on ? ' is-on' : ''}`} aria-pressed={on}
                          onClick={() => setVerbs(toggle(verbs, verb.fr))}>
                          <span className="stub__fr" lang="fr">{verb.fr}</span>
                          <span className="stub__nl">{gloss(verb.nl)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!visible.length && <p className="carnet__empty">Geen werkwoord gevonden voor „{search}”.</p>}
          </section>
        </div>

        <footer className="picker__foot">
          <p className="picker__count" aria-live="polite">
            {problem ?? <><strong>{verbs.length}</strong> {verbs.length === 1 ? 'werkwoord' : 'werkwoorden'} · <strong>{tenses.length}</strong> {tenses.length === 1 ? 'tijd' : 'tijden'}</>}
          </p>
          <button type="button" className="btn btn--go btn--big" disabled={problem !== null}
            onClick={() => onConfirm({ verbs, tenses })}>
            Vertrek
          </button>
        </footer>
      </div>
    </div>
  );
}
