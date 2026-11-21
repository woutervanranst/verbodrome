import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Option } from '../trainer/question';

const GAP = 12;
const MIN_WIDTH = 150;

/** Even rows where the option count allows it (10 → 5×2 wide, 2×5 narrow). */
export function columnsFor(count: number, width: number): number {
  const max = Math.max(1, Math.floor((width + GAP) / (MIN_WIDTH + GAP)));
  let cols = 1;
  for (let c = Math.min(max, count); c >= 1; c--) if (count % c === 0) { cols = c; break; }
  if (cols === 1 && count > 1) cols = Math.min(max, count);
  return cols;
}

interface CardsProps {
  readonly options: readonly Option[];
  readonly picked: number | null;
  readonly onPick: (index: number) => void;
}

/** The answer cards. Keys 1–9 and 0 pick a card; see App. */
export function Cards({ options, picked, onPick }: CardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1040);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0]?.contentRect.width ?? 1040));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const cols = columnsFor(options.length, width);
  const answered = picked !== null;
  return (
    <div ref={ref} className={`cards${answered ? ' is-answered' : ''}`} lang="fr"
      style={{ '--cols': cols } as CSSProperties}>
      {options.map((option, index) => {
        const state = !answered ? '' : option.correct ? ' is-correct' : index === picked ? ' is-wrong' : ' is-dim';
        return (
          <button key={option.text} type="button" className={`card${state}`} disabled={answered}
            onClick={() => onPick(index)} style={{ '--i': index } as CSSProperties}>
            {option.text}
          </button>
        );
      })}
    </div>
  );
}
