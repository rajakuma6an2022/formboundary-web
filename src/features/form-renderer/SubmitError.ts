/**
 * Thrown by an onSubmit handler when the SERVER rejects the answers.
 * `fieldErrors` maps a field name to a message so it can be shown next to that field (Day 15 uses this).
 */
export class SubmitError extends Error {
  readonly fieldErrors: Record<string, string> | undefined;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'SubmitError';
    this.fieldErrors = fieldErrors;
  }
}
