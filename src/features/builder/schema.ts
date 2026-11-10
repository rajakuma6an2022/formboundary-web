import { z } from 'zod';
import { SCHEMA_VERSION } from './types';
import type { FormDefinition } from './types';

export const LIMITS = {
  titleMax: 120,
  descriptionMax: 500,
  labelMax: 120,
  placeholderMax: 120,
  helperTextMax: 200,
  maxFields: 50,
  maxOptions: 50,
  maxTextLength: 5000,
} as const;

export const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
export const FIELD_NAME_MESSAGE =
  'Use lowercase letters, numbers and underscores. Start with a letter (max 40 characters).';

const baseShape = {
  id: z.string().min(1).max(64),
  name: z.string().regex(FIELD_NAME_PATTERN, FIELD_NAME_MESSAGE),
  label: z
    .string()
    .trim()
    .min(1, 'Label is required')
    .max(LIMITS.labelMax, `Label must be at most ${LIMITS.labelMax} characters`),
  required: z.boolean(),
  helperText: z
    .string()
    .max(LIMITS.helperTextMax, `Helper text must be at most ${LIMITS.helperTextMax} characters`)
    .optional(),
};

const placeholderShape = {
  placeholder: z
    .string()
    .max(LIMITS.placeholderMax, `Placeholder must be at most ${LIMITS.placeholderMax} characters`)
    .optional(),
};

// Decision: text, email and textarea share the same min/max length rules.
// Email FORMAT is enforced separately at runtime (Day 9 on web, Day 15 on API).
const lengthShape = {
  minLength: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Must be 0 or more')
    .max(LIMITS.maxTextLength, `Must be at most ${LIMITS.maxTextLength}`)
    .optional(),
  maxLength: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be 1 or more')
    .max(LIMITS.maxTextLength, `Must be at most ${LIMITS.maxTextLength}`)
    .optional(),
};

function lengthRangeIsValid(f: { minLength?: number | undefined; maxLength?: number | undefined }) {
  return f.minLength === undefined || f.maxLength === undefined || f.minLength <= f.maxLength;
}
const lengthRangeIssue = {
  message: 'Min length cannot be greater than max length',
  path: ['maxLength'],
};

const textFieldSchema = z
  .strictObject({
    ...baseShape,
    ...placeholderShape,
    ...lengthShape,
    type: z.enum(['text', 'email']),
  })
  .refine(lengthRangeIsValid, lengthRangeIssue);

const textareaFieldSchema = z
  .strictObject({
    ...baseShape,
    ...placeholderShape,
    ...lengthShape,
    type: z.literal('textarea'),
  })
  .refine(lengthRangeIsValid, lengthRangeIssue);

export const selectOptionSchema = z.strictObject({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1, 'Option label is required').max(LIMITS.labelMax),
  value: z.string().trim().min(1, 'Option value is required').max(LIMITS.labelMax),
});

const selectFieldSchema = z
  .strictObject({
    ...baseShape,
    ...placeholderShape,
    type: z.literal('select'),
    options: z
      .array(selectOptionSchema)
      .max(LIMITS.maxOptions, `At most ${LIMITS.maxOptions} options`),
  })
  .superRefine((field, ctx) => {
    const seen = new Map<string, number>();
    field.options.forEach((o) => seen.set(o.value, (seen.get(o.value) ?? 0) + 1));
    field.options.forEach((o, i) => {
      if ((seen.get(o.value) ?? 0) > 1) {
        ctx.addIssue({
          code: 'custom',
          message: `Option value "${o.value}" is used more than once`,
          path: ['options', i, 'value'],
        });
      }
    });
  });

// Checkbox: no placeholder, no min/max length. strictObject rejects them if present.
const checkboxFieldSchema = z.strictObject({
  ...baseShape,
  type: z.literal('checkbox'),
});

export const formFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  selectFieldSchema,
  checkboxFieldSchema,
]);

export const formDefinitionSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(LIMITS.titleMax, `Title must be at most ${LIMITS.titleMax} characters`),
    description: z
      .string()
      .max(LIMITS.descriptionMax, `Description must be at most ${LIMITS.descriptionMax} characters`)
      .optional(),
    fields: z.array(formFieldSchema).max(LIMITS.maxFields, `At most ${LIMITS.maxFields} fields`),
  })
  .superRefine((def, ctx) => {
    const nameCount = new Map<string, number>();
    const idCount = new Map<string, number>();
    def.fields.forEach((f) => {
      nameCount.set(f.name, (nameCount.get(f.name) ?? 0) + 1);
      idCount.set(f.id, (idCount.get(f.id) ?? 0) + 1);
    });
    def.fields.forEach((f, i) => {
      if ((nameCount.get(f.name) ?? 0) > 1) {
        ctx.addIssue({
          code: 'custom',
          message: `Name "${f.name}" is used by more than one field`,
          path: ['fields', i, 'name'],
        });
      }
      if ((idCount.get(f.id) ?? 0) > 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate field id',
          path: ['fields', i, 'id'],
        });
      }
    });
  });

/** Every issue knows which field it belongs to (null = form-level) so the UI can show it next to the control. */
export type ValidationIssue = {
  fieldId: string | null;
  /** Path inside the field (e.g. ['name'] or ['options', 1, 'value']) or inside the form for form-level issues. */
  path: (string | number)[];
  message: string;
};

function normalizePath(path: readonly PropertyKey[]): (string | number)[] {
  return path.map((p) => (typeof p === 'symbol' ? String(p) : p));
}

function locate(
  def: FormDefinition,
  rawPath: readonly PropertyKey[],
): Pick<ValidationIssue, 'fieldId' | 'path'> {
  const path = normalizePath(rawPath);
  if (path[0] === 'fields' && typeof path[1] === 'number') {
    return { fieldId: def.fields[path[1]]?.id ?? null, path: path.slice(2) };
  }
  return { fieldId: null, path };
}

/** Rules for SAVING a draft: structure, limits, unique names and option values. */
export function validateDefinition(def: FormDefinition): ValidationIssue[] {
  const result = formDefinitionSchema.safeParse(def);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    ...locate(def, issue.path),
    message: issue.message,
  }));
}

/** Extra rules for PUBLISHING: at least one field and every select has at least one option. */
export function validateForPublish(def: FormDefinition): ValidationIssue[] {
  const issues = validateDefinition(def);
  if (def.fields.length === 0) {
    issues.push({
      fieldId: null,
      path: ['fields'],
      message: 'Add at least one field before publishing',
    });
  }
  for (const field of def.fields) {
    if (field.type === 'select' && field.options.length === 0) {
      issues.push({
        fieldId: field.id,
        path: ['options'],
        message: 'Add at least one option before publishing',
      });
    }
  }
  return issues;
}

export function groupIssuesByField(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
  const map = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    if (issue.fieldId === null) continue;
    const list = map.get(issue.fieldId) ?? [];
    list.push(issue);
    map.set(issue.fieldId, list);
  }
  return map;
}
