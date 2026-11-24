import { useCallback, useEffect, useRef, useState } from 'react';
import { APP } from './config/app';
import { levelDef } from './config/levels';
import { nextQuestion, recall, record } from './trainer/coach';
import type { Asked, History, Recall } from './trainer/coach';
import type { Option, Selection } from './trainer/question';
import { applyAnswer } from './trainer/score';
import type { Stats } from './trainer/score';
import { DEFAULT_LEVEL, matchingLevel, selectionForLevel, tensesForLevel, verbsForLevel } from './trainer/selection';
import { Feedback } from './ui/Feedback';
import { Header } from './ui/Header';
import { Picker } from './ui/Picker';
import { Prompt } from './ui/Prompt';
import { Scene } from './ui/Scene';
import { Report } from './ui/Report';
import { EMPTY_HISTORY } from './trainer/coach';
import { createStore } from './storage/store';
import type { AnswerMode } from './storage/store';
import { classify } from './trainer/typed';
import { Cards } from './ui/Cards';
import { TypeIn } from './ui/TypeIn';

const CHEERS = ['Juist!', 'Knap!', 'Mooi zo!', 'Helemaal goed!', 'Sterk!', 'Raak!'];
const cheer = (): string => CHEERS[Math.floor(Math.random() * CHEERS.length)]!;

const store = createStore();

/** "1e graad secundair" when the selection is exactly a quick-pick, else "Eigen keuze". */
function routeName(selection: Selection): string {
  const tenses = matchingLevel(selection.tenses, tensesForLevel);
  const verbs = matchingLevel(selection.verbs, verbsForLevel);
  if (!tenses || tenses !== verbs) return 'Eigen keuze';
  return tenses === 'extra' ? 'Alles' : levelDef(tenses).name;
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function App() {
  const [settings] = useState(() => store.loadSettings());
  const [selection, setSelection] = useState<Selection>(() => settings.selection ?? selectionForLevel(DEFAULT_LEVEL));
  const [mode, setMode] = useState<AnswerMode>(settings.mode);
  const [history, setHistory] = useState<History>(() => store.loadHistory());
  // The auto-advance timer outlives a render, so it reads the latest history from a ref.
  const historyRef = useRef(history);
  const [asked, setAsked] = useState<Asked | null>(() => nextQuestion(history, selection, null, Math.random, APP.optionCount));
  const [round, setRound] = useState(0);
  /** The answer given to the current question: a card, or a typed answer checked into the same shape. */
  const [answer, setAnswer] = useState<Option | null>(null);
  const [note, setNote] = useState<Recall | null>(null);
  const [stats, setStats] = useState<Stats>(() => ({ streak: 0, ...store.loadProgress() }));
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(null);
  const [verdict, setVerdict] = useState(cheer);
  const [tableOpen, setTableOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [welcomed, setWelcomed] = useState(settings.welcomed);
  const [pickerOpen, setPickerOpen] = useState(!settings.welcomed);
  const [reportOpen, setReportOpen] = useState(false);
  const question = asked?.question ?? null;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopAdvance = useCallback(() => {
    clearTimeout(timer.current);
    setAdvancing(false);
  }, []);

  const next = useCallback(() => {
    stopAdvance();
    setAsked(previous => nextQuestion(historyRef.current, selection, previous?.question ?? null, Math.random, APP.optionCount));
    setRound(value => value + 1);
    setAnswer(null);
    setTableOpen(false);
  }, [selection, stopAdvance]);

  const answerWith = useCallback((option: Option, typed: boolean) => {
    if (!asked || answer !== null) return;
    const updated = record(historyRef.current, asked, option, Math.random, Date.now(), typed);
    historyRef.current = updated;
    setHistory(updated);
    store.saveHistory(updated);
    setNote(recall(asked.review, option));
    const result = applyAnswer(stats, option.correct, typed ? APP.typedXpFactor : 1);
    setAnswer(option);
    setStats({ streak: result.streak, best: result.best, xp: result.xp });
    store.saveProgress(result);
    setVerdict(cheer());
    setGain(result.gain ? { amount: result.gain, key: Date.now() } : null);
    // A repeat is never rushed: the learner reads the comparison and moves on when ready.
    if (option.correct && APP.autoAdvance && !asked.review) {
      setAdvancing(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(next, APP.autoAdvanceMs);
    }
  }, [asked, answer, stats, next]);

  const pick = useCallback((index: number) => {
    const option = asked?.question.options[index];
    if (option) answerWith(option, false);
  }, [asked, answerWith]);

  const submit = useCallback((text: string) => {
    if (asked) answerWith(classify(asked.question, text, selection.tenses), true);
  }, [asked, answerWith, selection]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (pickerOpen || reportOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || !question) return;
      if (answer === null) {
        // While typing, digits are just typed and the form handles Enter itself.
        if (mode !== 'cards') return;
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
  }, [pickerOpen, reportOpen, question, answer, mode, pick, next]);

  const confirmSelection = (chosen: Selection, chosenMode: AnswerMode) => {
    stopAdvance();
    setSelection(chosen);
    setMode(chosenMode);
    store.saveSettings({ selection: chosen, welcomed: true, mode: chosenMode });
    setWelcomed(true);
    setAsked(nextQuestion(historyRef.current, chosen, null, Math.random, APP.optionCount));
    setRound(value => value + 1);
    setAnswer(null);
    setTableOpen(false);
    setPickerOpen(false);
  };

  const openPicker = () => { stopAdvance(); setPickerOpen(true); };
  const openReport = () => { stopAdvance(); setReportOpen(true); };
  const closeReport = useCallback(() => setReportOpen(false), []);
  const resetResults = () => {
    store.clearResults();
    historyRef.current = EMPTY_HISTORY;
    setHistory(EMPTY_HISTORY);
    setStats({ streak: 0, xp: 0, best: 0 });
    setGain(null);
  };
  const overlay = pickerOpen || reportOpen;
  const answered = answer !== null && question !== null;

  return (
    <div className={`app${answered ? ' is-answered' : ''}`}>
      <Scene />
      <Header stats={stats} gain={gain} onOpenPicker={openPicker} onOpenReport={openReport}
        routeLabel={routeName(selection)}
        routeDetail={`${plural(selection.verbs.length, 'werkwoord', 'werkwoorden')} · ${plural(selection.tenses.length, 'tijd', 'tijden')}${mode === 'typing' ? ' · typen' : ''}`} />

      <main className="stage" inert={overlay}>
        {question ? (
          <div className="stage__round" key={round}>
            <Prompt prompt={question.prompt} tense={question.showTense ? question.tense.label : null} compact={answered} />
            {mode === 'typing'
              ? <TypeIn answer={answer} onSubmit={submit} />
              : <Cards options={question.options} picked={answer ? question.options.indexOf(answer) : null} onPick={pick} />}
          </div>
        ) : (
          <div className="stage__empty">
            <p>Met deze keuze valt er niets te vervoegen.</p>
            <button type="button" className="btn btn--go" onClick={openPicker}>Kies iets anders</button>
          </div>
        )}
      </main>

      {answered && !overlay && (
        <Feedback question={question} picked={answer} recall={note} cheer={verdict} tableOpen={tableOpen} advancing={advancing}
          onToggleTable={() => { stopAdvance(); setTableOpen(open => !open); }} onNext={next} />
      )}

      {reportOpen && (
        <Report history={history} selection={selection} stats={stats} onClose={closeReport} onReset={resetResults} />
      )}

      {pickerOpen && (
        <Picker initial={selection} initialMode={mode} canCancel={welcomed} onConfirm={confirmSelection} onCancel={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
