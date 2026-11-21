interface PromptProps {
  readonly prompt: string;
  /** Tense name, shown only when the prompt alone is ambiguous. */
  readonly tense: string | null;
  readonly compact: boolean;
}

/** The Dutch prompt, large and centred. */
export function Prompt({ prompt, tense, compact }: PromptProps) {
  return (
    <div className={`prompt${compact ? ' is-compact' : ''}`}>
      <h1 className="prompt__text" lang="nl">{prompt}</h1>
      {tense && <p className="prompt__tense" lang="fr">{tense}</p>}
    </div>
  );
}
