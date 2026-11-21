import { useEffect, useState } from 'react';
import type { Stats } from '../trainer/score';

interface HeaderProps {
  readonly stats: Stats;
  /** `+16` right after a correct answer; `key` changes to replay the animation. */
  readonly gain: { readonly amount: number; readonly key: number } | null;
  readonly routeLabel: string;
  readonly routeDetail: string;
  readonly onOpenPicker: () => void;
}

const STOPS = 10;

export function Header({ stats, gain, routeLabel, routeDetail, onOpenPicker }: HeaderProps) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!gain) return;
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(timer);
  }, [gain]);

  const hot = stats.streak >= 5;
  return (
    <header className="top">
      <button type="button" className="route" onClick={onOpenPicker} aria-label={`Traject wijzigen. Nu: ${routeLabel}, ${routeDetail}`}>
        <span className="route__roundel" aria-hidden="true">V</span>
        <span className="route__text">
          <span className="route__name">{routeLabel}</span>
          <span className="route__detail">{routeDetail}</span>
        </span>
        <span className="route__change" aria-hidden="true">wijzig</span>
      </button>

      <div className="board" role="status" aria-label={`Reeks ${stats.streak}, record ${stats.best}, ${stats.xp} XP`}>
        <div className={`board__streak${hot ? ' is-hot' : ''}${pulse ? ' is-pulse' : ''}`}>
          <div className="stops" aria-hidden="true">
            {Array.from({ length: STOPS }, (_, i) => (
              <span key={i} className={`stops__stop${i < Math.min(stats.streak, STOPS) ? ' is-on' : ''}`} />
            ))}
          </div>
          <span className="board__num">{stats.streak}</span>
          <span className="board__label">Reeks</span>
        </div>
        <div className="board__cell">
          <span className="board__num">{stats.best}</span>
          <span className="board__label">Record</span>
        </div>
        <div className="board__cell board__cell--xp">
          <span className="board__num">{stats.xp}</span>
          <span className="board__label">XP</span>
          {gain && <span key={gain.key} className="board__pop">+{gain.amount}</span>}
        </div>
      </div>
    </header>
  );
}
