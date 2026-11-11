/** Stable DOM ids derived from the field id, so errors, hints and the error summary can point at a control. */
export const fieldInputId = (fieldId: string) => `fb-field-${fieldId}`;
export const fieldHintId = (fieldId: string) => `${fieldInputId(fieldId)}-hint`;
export const fieldErrorId = (fieldId: string) => `${fieldInputId(fieldId)}-error`;
