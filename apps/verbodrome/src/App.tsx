import { useCallback, useEffect, useRef, useState } from 'react';
import { APP } from './config/app';
import { levelDef } from './config/levels';
import { makeQuestion } from './trainer/question';
import type { Question, Selection } from './trainer/question';
import { applyAnswer } from './trainer/score';
import type { Stats } from './trainer/score';
import { DEFAULT_LEVEL, matchingLevel, sanitize, selectionForLevel, tensesForLevel, verbsForLevel } from './trainer/selection';
import { Feedback } from './ui/Feedback';
import { Header } from './ui/Header';
import { Picker } from './ui/Picker';
import { Prompt } from './ui/Prompt';
import { Scene } from './ui/Scene';
import { KEYS, read, write } from './ui/storage';
import { Cards } from './ui/Cards';

const CHEERS = ['Juist!', 'Knap!', 'Mooi zo!', 'Helemaal goed!', 'Sterk!', 'Raak!'];
const cheer = (): string => CHEERS[Math.floor(Math.random() * CHEERS.length)]!;

function loadSelection(): Selection {
  return sanitize(read<unknown>(KEYS.selection, null)) ?? selectionForLevel(DEFAULT_LEVEL);
}

function loadStats(): Stats {
  const saved = read<{ xp?: unknown; best?: unknown }>(KEYS.stats, {});
  const number = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  return { streak: 0, xp: number(saved?.xp), best: number(saved?.best) };
}

/** "1e graad secundair" when the selection is exactly a quick-pick, else "Eigen keuze". */
function routeName(selection: Selection): string {
  const tenses = matchingLevel(selection.tenses, tensesForLevel);
  const verbs = matchingLevel(selection.verbs, verbsForLevel);
  if (!tenses || tenses !== verbs) return 'Eigen keuze';
  return tenses === 'extra' ? 'Alles' : levelDef(tenses).name;
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function App() {
  const [selection, setSelection] = useState<Selection>(loadSelection);
  const [question, setQuestion] = useState<Question | null>(() => makeQuestion(loadSelection(), null, Math.random, APP.optionCount));
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(null);
  const [verdict, setVerdict] = useState(cheer);
  const [tableOpen, setTableOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(() => !read<boolean>(KEYS.welcomed, false));
  const [welcomed, setWelcomed] = useState(() => read<boolean>(KEYS.welcomed, false));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopAdvance = useCallback(() => {
    clearTimeout(timer.current);
    setAdvancing(false);
  }, []);

  const next = useCallback(() => {
    stopAdvance();
    setQuestion(previous => makeQuestion(selection, previous, Math.random, APP.optionCount));
    setRound(value => value + 1);
    setPicked(null);
    setTableOpen(false);
  }, [selection, stopAdvance]);

  const pick = useCallback((index: number) => {
    if (!question || picked !== null) return;
    const option = question.options[index];
    if (!option) return;
    const result = applyAnswer(stats, option.correct);
    setPicked(index);
    setStats({ streak: result.streak, best: result.best, xp: result.xp });
    write(KEYS.stats, { xp: result.xp, best: result.best });
    setVerdict(cheer());
    setGain(result.gain ? { amount: result.gain, key: Date.now() } : null);
    if (option.correct && APP.autoAdvance) {
      setAdvancing(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(next, APP.autoAdvanceMs);
    }
  }, [question, picked, stats, next]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (pickerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || !question) return;
      if (picked === null) {
        const index = '1234567890'.indexOf(event.key);
        if (index >= 0 && index < question.options.length) pick(index);
      } else if (event.key === 'Enter' || event.key === ' ') {
        // Let a focused button handle its own activation.
        if (event.target instanceof HTMLButtonElement && event.target.classList.contains('btn--link')) return;
        event.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen, question, picked, pick, next]);

  const confirmSelection = (chosen: Selection) => {
    stopAdvance();
    setSelection(chosen);
    write(KEYS.selection, chosen);
    write(KEYS.welcomed, true);
    setWelcomed(true);
    setQuestion(makeQuestion(chosen, null, Math.random, APP.optionCount));
    setRound(value => value + 1);
    setPicked(null);
    setTableOpen(false);
    setPickerOpen(false);
  };

  const openPicker = () => { stopAdvance(); setPickerOpen(true); };
  const answered = picked !== null && question !== null;
  const pickedOption = answered ? question.options[picked] : undefined;

  return (
    <div className={`app${answered ? ' is-answered' : ''}`}>
      <Scene />
      <Header stats={stats} gain={gain} onOpenPicker={openPicker}
        routeLabel={routeName(selection)}
        routeDetail={`${plural(selection.verbs.length, 'werkwoord', 'werkwoorden')} · ${plural(selection.tenses.length, 'tijd', 'tijden')}`} />

      <main className="stage" inert={pickerOpen}>
        {question ? (
          <div className="stage__round" key={round}>
            <Prompt prompt={question.prompt} tense={question.showTense ? question.tense.label : null} compact={answered} />
            <Cards options={question.options} picked={picked} onPick={pick} />
          </div>
        ) : (
          <div className="stage__empty">
            <p>Met deze keuze valt er niets te vervoegen.</p>
            <button type="button" className="btn btn--go" onClick={openPicker}>Kies iets anders</button>
          </div>
        )}
      </main>

      {answered && pickedOption && !pickerOpen && (
        <Feedback question={question} picked={pickedOption} cheer={verdict} tableOpen={tableOpen} advancing={advancing}
          onToggleTable={() => { stopAdvance(); setTableOpen(open => !open); }} onNext={next} />
      )}

      {pickerOpen && (
        <Picker initial={selection} canCancel={welcomed} onConfirm={confirmSelection} onCancel={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
