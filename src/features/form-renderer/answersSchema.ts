import { z } from 'zod';
import { assertNever } from '@/lib/assertNever';
import type { FormDefinition, FormField } from '@/features/builder/types';

export type AnswerValue = string | boolean;
export type Answers = Record<string, AnswerValue>;

const emailCheck = z.email();

function addIssue(ctx: z.RefinementCtx, message: string) {
  ctx.addIssue({ code: 'custom', message });
}

/**
 * Builds ONE Zod schema for a form's answers, generated from the (already validated) form definition.
 * The browser uses it for fast feedback. The API rebuilds the same rules from the STORED published schema
 * and is the real authority (Day 15). Never trust what the browser sends.
 */
function schemaForField(field: FormField): z.ZodType {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'textarea':
      // .trim() runs first, so every rule below sees the trimmed value and the submitted value is trimmed.
      return z.string().trim().superRefine((value, ctx) => {
        if (value === '') {
          if (field.required) addIssue(ctx, `${field.label} is required`);
          return; // optional + empty: skip the other rules
        }
        if (field.minLength !== undefined && value.length < field.minLength) {
          addIssue(ctx, `${field.label} must be at least ${field.minLength} characters`);
        }
        if (field.maxLength !== undefined && value.length > field.maxLength) {
          addIssue(ctx, `${field.label} must be at most ${field.maxLength} characters`);
        }
        if (field.type === 'email' && !emailCheck.safeParse(value).success) {
          addIssue(ctx, 'Enter a valid email address');
        }
      });

    case 'select': {
      const allowed = new Set(field.options.map((o) => o.value));
      return z.string().superRefine((value, ctx) => {
        if (value === '') {
          if (field.required) addIssue(ctx, `${field.label} is required`);
          return;
        }
        // The client cannot select an arbitrary value: it must be one of the configured options.
        if (!allowed.has(value)) addIssue(ctx, 'Choose one of the listed options');
      });
    }

    case 'checkbox':
      return z.boolean().superRefine((value, ctx) => {
        if (field.required && !value) addIssue(ctx, `${field.label} must be checked`);
      });

    default:
      return assertNever(field);
  }
}

export function buildAnswersSchema(definition: FormDefinition): z.ZodType<Answers, Answers> {
  const shape: Record<string, z.ZodType> = {};
  for (const field of definition.fields) shape[field.name] = schemaForField(field);
  // Unknown keys are stripped (z.object default), so extra data never reaches onSubmit.
  return z.object(shape) as unknown as z.ZodType<Answers, Answers>;
}

export function buildDefaultValues(definition: FormDefinition): Answers {
  const values: Answers = {};
  for (const field of definition.fields) values[field.name] = field.type === 'checkbox' ? false : '';
  return values;
}
