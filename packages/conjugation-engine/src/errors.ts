export type ConjugationErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_LANGUAGE'
  | 'INVALID_INFINITIVE'
  | 'INVALID_TARGET'
  | 'INVALID_HINT'
  | 'AMBIGUOUS_CLASSIFICATION'
  | 'GENERATION_FAILURE';

export class ConjugationError extends Error {
  readonly code: ConjugationErrorCode;

  constructor(code: ConjugationErrorCode, message: string) {
    super(message);
    this.name = 'ConjugationError';
    this.code = code;
  }
}
