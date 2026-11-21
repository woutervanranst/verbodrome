interface PlaqueProps {
  readonly prompt: string;
  /** Tense name, shown in the lunette only when the prompt alone is ambiguous. */
  readonly tense: string | null;
  readonly compact: boolean;
}

/** The Dutch prompt, set like a Paris street plaque. */
export function Plaque({ prompt, tense, compact }: PlaqueProps) {
  return (
    <div className={`plaque-wrap${compact ? ' is-compact' : ''}`}>
      {tense && <div className="plaque__lunette"><span>{tense}</span></div>}
      <h1 className="plaque" lang="nl">
        <span className="plaque__text">{prompt}</span>
      </h1>
    </div>
  );
}
