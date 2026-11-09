/**
 * Day 2: schema contract (types only). Runtime Zod validation is added on Day 4.
 * A form schema is DATA. It is never executed (no eval, no Function, no HTML).
 */
export const SCHEMA_VERSION = 1 as const;

export const FIELD_TYPES = ['text', 'email', 'textarea', 'select', 'checkbox'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type BaseField = {
  id: string; // stable identity for React keys and dnd-kit
  name: string; // safe machine key used in submitted answers, unique within a form
  label: string;
  required: boolean;
  placeholder?: string;
  helperText?: string;
};

export type TextField = BaseField & {
  type: 'text' | 'email';
  minLength?: number;
  maxLength?: number;
};

export type TextareaField = BaseField & {
  type: 'textarea';
  minLength?: number;
  maxLength?: number;
};

export type SelectOption = { id: string; label: string; value: string };

export type SelectField = BaseField & {
  type: 'select';
  options: SelectOption[];
};

export type CheckboxField = BaseField & {
  type: 'checkbox';
};

export type FormField = TextField | TextareaField | SelectField | CheckboxField;

export type FormDefinition = {
  schemaVersion: typeof SCHEMA_VERSION;
  title: string;
  description?: string;
  fields: FormField[];
};

/** Record<FieldType, ...> forces a compile error if a new field type is added but not handled. */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  email: 'Email',
  textarea: 'Textarea',
  select: 'Select',
  checkbox: 'Checkbox',
};
