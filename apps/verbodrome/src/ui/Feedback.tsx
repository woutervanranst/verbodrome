import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { APP } from '../config/app';
import { diff, subjectLength } from '../trainer/diff';
import { verbForms } from '../trainer/forms';
import type { FrForm } from '../trainer/forms';
import type { Recall } from '../trainer/coach';
import { categoryOf } from '../trainer/question';
import type { Option, Question } from '../trainer/question';
import { rule } from '../trainer/rules';

interface FeedbackProps {
  readonly question: Question;
  readonly picked: Option;
  /** Set when this question was asked before: how this answer compares with the earlier one. */
  readonly recall: Recall | null;
  readonly cheer: string;
  readonly tableOpen: boolean;
  readonly advancing: boolean;
  readonly onToggleTable: () => void;
  readonly onNext: () => void;
}

function Marked({ parts, className }: { parts: [string, string, string]; className: string }) {
  return <>{parts[0]}{parts[1] && <mark className={className}>{parts[1]}</mark>}{parts[2]}</>;
}

/** The tense laid out like a classic table: singular left, plural right. */
function tableRows(forms: readonly FrForm[]): (FrForm | null)[][] {
  const at = (slot: string) => forms.find(form => form.slot === slot) ?? null;
  const rows = ['1', '2', '3'].map(person => [at(`${person}s`), at(`${person}p`)]).filter(row => row[0] || row[1]);
  return rows.length ? rows : forms.map(form => [form]);
}

export function Feedback({ question, picked, recall, cheer, tableOpen, advancing, onToggleTable, onNext }: FeedbackProps) {
  const wrong = !picked.correct;
  // Named exactly as in the results report.
  const category = categoryOf(picked.kind);
  const hasSubject = question.slot !== '-' && question.tense.mood !== 'imperative';
  const correctParts = diff(question.correct, wrong ? picked.text : null, subjectLength(question.correct, hasSubject));
  const pickedParts = diff(picked.text, question.correct, subjectLength(picked.text, hasSubject));
  const explanation = useMemo(() => rule(question.verb, question.tense), [question]);
  const rows = useMemo(
    () => tableRows(verbForms(question.verb.fr).byTense.get(question.tense.id) ?? []),
    [question],
  );

  return (
    <section className={`sheet${wrong ? ' is-wrong' : ' is-right'}`} aria-live="polite">
      <div className="sheet__paper">
        <div className={`sheet__bar${advancing ? ' is-running' : ''}`}
          style={{ '--ms': `${APP.autoAdvanceMs}ms` } as CSSProperties} />
        <div className="sheet__head">
          <p className="sheet__verdict">{wrong ? 'Net niet' : cheer}</p>
          <button type="button" className="btn btn--go" onClick={onNext}>Volgende</button>
        </div>

        {recall && (
          <p className={`sheet__recall is-${recall.tone}`}>
            <span className="sheet__badge">Herhaling</span>{recall.text}
          </p>
        )}

        <div className="compare">
          {wrong && (
            <div className="compare__row compare__row--you">
              <span className="compare__tag">Jij</span>
              <span className="compare__form" lang="fr"><Marked parts={pickedParts} className="mark--bad" /></span>
              <span className="compare__meta">{picked.nl ? `= ${picked.nl} · ` : ''}{picked.label}{category !== picked.label && <> · <strong>{category}</strong></>}</span>
            </div>
          )}
          <div className="compare__row compare__row--right">
            <span className="compare__tag">Juist</span>
            <span className="compare__form" lang="fr"><Marked parts={correctParts} className="mark--good" /></span>
            <span className="compare__meta">
              = {question.prompt} · <span lang="fr">{question.verb.fr}</span>{wrong && <> · <span lang="fr">{question.tense.label}</span></>}
            </span>
          </div>
        </div>

        <p className="sheet__rule">{explanation}</p>

        <button type="button" className="btn btn--link" onClick={onToggleTable} aria-expanded={tableOpen}>
          {tableOpen ? 'Verberg vervoeging' : 'Toon alle vormen'}
        </button>
        {tableOpen && (
          <div className="table" lang="fr">
            <div className="table__title">{question.verb.fr} · {question.tense.label}</div>
            {rows.map((row, index) => (
              <div className="table__row" key={index}>
                {row.map((cell, column) => (
                  <span key={column} className={cell && cell.slot === question.slot ? 'is-asked' : ''}>{cell?.text ?? ''}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
