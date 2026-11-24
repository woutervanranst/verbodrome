import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { APP } from '../config/app';
import type { Option } from '../trainer/question';

interface TypeInProps {
  /** The checked answer, once given; the field then shows it as right or wrong. */
  readonly answer: Option | null;
  readonly onSubmit: (text: string) => void;
}

/** Typing the answer: one field, a check button and buttons for accented letters. Enter checks; see App for what follows. */
export function TypeIn({ answer, onSubmit }: TypeInProps) {
  const [value, setValue] = useState('');
  const field = useRef<HTMLInputElement>(null);
  // Where the caret goes after an accent button changed the text.
  const caret = useRef<number | null>(null);
  const answered = answer !== null;

  useLayoutEffect(() => {
    if (caret.current === null || !field.current) return;
    field.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const insert = (letter: string) => {
    const input = field.current;
    if (!input || answered) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    setValue(value.slice(0, start) + letter + value.slice(end));
    caret.current = start + letter.length;
    input.focus();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (answered || !value.trim()) return;
    onSubmit(value);
  };

  const state = !answered ? '' : ` is-answered ${answer.correct ? 'is-right' : 'is-wrong'}`;
  return (
    <form className={`typein${state}`} onSubmit={submit} autoComplete="off">
      <div className="typein__row">
        <input ref={field} className="typein__field" type="text" lang="fr" value={value} readOnly={answered}
          onChange={event => setValue(event.target.value)} placeholder="Typ het in het Frans…"
          aria-label="Jouw antwoord in het Frans" autoFocus autoComplete="off" autoCorrect="off"
          autoCapitalize="off" spellCheck={false} enterKeyHint="done" />
        <button type="submit" className="btn btn--go typein__check" disabled={!value.trim()}>Controleer</button>
      </div>
      <div className="typein__keys" role="group" aria-label="Letters met accent">
        {APP.accentKeys.map(letter => (
          // Pressing a key must not take the focus away from the field.
          <button key={letter} type="button" className="key" tabIndex={-1} aria-label={`voeg ${letter} in`}
            onMouseDown={event => event.preventDefault()} onClick={() => insert(letter)}>
            {letter}
          </button>
        ))}
      </div>
      <p className="typein__hint">Enter om te controleren</p>
    </form>
  );
}
