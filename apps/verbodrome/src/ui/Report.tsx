import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ERAS } from '../config/tenses';
import type { History, Skill } from '../trainer/coach';
import type { Selection } from '../trainer/question';
import { buildReport } from '../trainer/report';
import type { MistakeExample } from '../trainer/report';
import type { Stats } from '../trainer/score';

interface ReportProps {
  readonly history: History;
  readonly selection: Selection;
  readonly stats: Stats;
  readonly onClose: () => void;
  /** Forget all results. */
  readonly onReset: () => void;
}

const percent = (part: number, whole: number): number => whole ? Math.round(part / whole * 100) : 0;
const times = (count: number): string => `${count} keer`;

/** How a tense is going, in a word. Needs a few answers before it judges. */
function verdict(skill: Skill): { word: string; tone: 'good' | 'mid' | 'bad' } {
  if (skill.asked < 3) return { word: 'pas begonnen', tone: 'mid' };
  if (skill.level >= 0.8) return { word: 'sterk', tone: 'good' };
  if (skill.level >= 0.55) return { word: 'gaat goed', tone: 'mid' };
  return { word: 'extra oefenen', tone: 'bad' };
}

function Examples({ examples }: { examples: readonly MistakeExample[] }) {
  return (
    <ul className="examples" lang="fr">
      {examples.map((example, index) => <li key={index}><s>{example.pick}</s><span aria-hidden="true">→</span><span>{example.want}</span></li>)}
    </ul>
  );
}

/** "Mijn resultaten": how the learner has done so far, on this device. */
export function Report({ history, selection, stats, onClose, onReset }: ReportProps) {
  const [confirming, setConfirming] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const report = useMemo(() => buildReport(history, selection), [history, selection]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const wrong = report.answered - report.correct;
  return (
    <div className="picker" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="picker__panel">
        <header className="picker__head">
          <h2 id="report-title" className="picker__title">Mijn resultaten</h2>
          <button type="button" className="picker__close" onClick={onClose} aria-label="Sluiten">×</button>
        </header>

        <div className="picker__body">
          {report.answered === 0 ? (
            <p className="report__empty">Nog geen antwoorden. Beantwoord een paar vragen en kom dan terug kijken.</p>
          ) : (
            <>
              <section className="picker__section" aria-label="Totalen">
                <dl className="totals">
                  <div><dt>Vragen</dt><dd>{report.answered}</dd></div>
                  <div className="is-good"><dt>Juist</dt><dd>{report.correct}<small>{percent(report.correct, report.answered)}%</small></dd></div>
                  <div className="is-bad"><dt>Fout</dt><dd>{wrong}</dd></div>
                  <div><dt>Langste reeks</dt><dd>{stats.best}</dd></div>
                  <div><dt>XP</dt><dd>{stats.xp}</dd></div>
                </dl>
                {report.today.answered > 0 && report.today.answered < report.answered && (
                  <p className="report__note">Vandaag: {report.today.correct} van {report.today.answered} juist.</p>
                )}
              </section>

              <section className="picker__section" aria-labelledby="report-tenses">
                <div className="picker__section-head">
                  <h3 id="report-tenses">Per tijd</h3>
                  <p>Hoeveel vragen je per tijd juist had. Het oordeel kijkt vooral naar je laatste antwoorden.</p>
                </div>
                <div className="timeline">
                  {ERAS.map(era => (
                    <section className={`era${era.id === 'nu' ? ' is-now' : ''}`} key={era.id} aria-label={era.label}>
                      <h4 className="era__head"><span className="era__dot" aria-hidden="true" />{era.label}</h4>
                      <ul className="era__box">
                        {report.tenses.filter(score => score.tense.era === era.id).map(({ tense, skill }) => {
                          const judged = skill && verdict(skill);
                          return (
                            <li className={`score${judged ? ` is-${judged.tone}` : ' is-new'}`} key={tense.id}>
                              <span className="score__name" lang="fr">{tense.label}</span>
                              <span className="score__bar" aria-hidden="true">
                                <span style={{ '--share': skill ? skill.correct / skill.asked : 0 } as CSSProperties} />
                              </span>
                              <span className="score__detail">
                                {skill ? <>{skill.correct} van {skill.asked} juist · <strong>{judged!.word}</strong></> : 'nog niet gevraagd'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
                <p className="timeline__ends" aria-hidden="true"><span>← verleden</span><span>toekomst →</span></p>
              </section>

              <section className="picker__section" aria-labelledby="report-mistakes">
                <div className="picker__section-head">
                  <h3 id="report-mistakes">Typische fouten</h3>
                  <p>De soorten fouten die je het vaakst maakt. Tik op een soort om je fouten te zien.</p>
                </div>
                {report.mistakes.length ? (
                  <ul className="rows">
                    {report.mistakes.map(mistake => {
                      const isOpen = open === mistake.category;
                      return (
                        <li key={mistake.category} className="rows__fold">
                          <button type="button" className="rows__toggle" aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : mistake.category)}>
                            <span className="rows__main">{mistake.category}</span>
                            <span className="rows__count">{times(mistake.count)}</span>
                            <span className="rows__caret" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                          </button>
                          {isOpen && (
                            <div className="rows__detail">
                              {mistake.groups.length ? mistake.groups.map(group => (
                                <div key={group.label}>
                                  <p className="rows__group"><span lang="fr">{group.label}</span><span>{times(group.count)}</span></p>
                                  <Examples examples={group.examples} />
                                </div>
                              )) : <Examples examples={mistake.examples} />}
                              {!mistake.groups.length && mistake.count > mistake.examples.length && (
                                <p className="report__note">Je laatste {mistake.examples.length} van {mistake.count}.</p>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="report__note">Nog geen fouten. Knap!</p>}
              </section>

              {report.verbs.length > 0 && (
                <section className="picker__section" aria-labelledby="report-verbs">
                  <div className="picker__section-head">
                    <h3 id="report-verbs">Lastigste werkwoorden</h3>
                  </div>
                  <ul className="rows">
                    {report.verbs.map(score => (
                      <li key={score.verb}>
                        <span className="rows__main" lang="fr">{score.verb}</span>
                        <span className="rows__count">{score.wrong} van {score.asked} fout</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </>
          )}
        </div>

        <footer className="picker__foot">
          {confirming ? (
            <p className="picker__count">
              Alles wissen? Dat kan je niet terugdraaien.{' '}
              <button type="button" className="btn btn--tiny btn--danger" onClick={() => { setConfirming(false); onReset(); }}>Ja, wis alles</button>{' '}
              <button type="button" className="btn btn--tiny" onClick={() => setConfirming(false)}>Nee</button>
            </p>
          ) : (
            <button type="button" className="btn btn--tiny" disabled={report.answered === 0 && stats.xp === 0}
              onClick={() => setConfirming(true)}>Wis mijn resultaten</button>
          )}
          <button type="button" className="btn btn--go btn--big" onClick={onClose}>Verder oefenen</button>
        </footer>
      </div>
    </div>
  );
}
