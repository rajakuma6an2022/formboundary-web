import { describe, expect, it } from 'vitest';
import { buildAnswersSchema, buildDefaultValues } from './answersSchema';
import type { FormDefinition, FormField } from '@/features/builder/types';

function def(...fields: FormField[]): FormDefinition {
  return { schemaVersion: 1, title: 'T', fields };
}
const b = { id: 'f1', name: 'full_name', label: 'Full name', required: false };

function issues(definition: FormDefinition, input: unknown): Record<string, string> {
  const result = buildAnswersSchema(definition).safeParse(input);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const i of result.error.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

describe('text / textarea', () => {
  it('requires a value when required, including whitespace-only', () => {
    const d = def({ ...b, type: 'text', required: true });
    expect(issues(d, { full_name: '' })).toEqual({ full_name: 'Full name is required' });
    expect(issues(d, { full_name: '   ' })).toEqual({ full_name: 'Full name is required' });
    expect(issues(d, { full_name: 'Jane' })).toEqual({});
  });

  it('allows an empty value when optional and skips length rules', () => {
    const d = def({ ...b, type: 'text', minLength: 5 });
    expect(issues(d, { full_name: '' })).toEqual({});
  });

  it('enforces min and max length on the trimmed value', () => {
    const d = def({ ...b, type: 'textarea', minLength: 3, maxLength: 5 });
    expect(issues(d, { full_name: 'ab' }).full_name).toBe('Full name must be at least 3 characters');
    expect(issues(d, { full_name: 'abcdef' }).full_name).toBe('Full name must be at most 5 characters');
    expect(issues(d, { full_name: '  abcde  ' })).toEqual({});
  });

  it('returns trimmed values', () => {
    const result = buildAnswersSchema(def({ ...b, type: 'text' })).safeParse({ full_name: '  Jane  ' });
    expect(result.success && result.data).toEqual({ full_name: 'Jane' });
  });
});

describe('email', () => {
  const d = def({ ...b, name: 'email', label: 'Email', type: 'email', required: true });
  it('accepts a valid address and rejects an invalid one', () => {
    expect(issues(d, { email: 'jane@example.com' })).toEqual({});
    expect(issues(d, { email: 'jane@' }).email).toBe('Enter a valid email address');
    expect(issues(d, { email: 'not an email' }).email).toBe('Enter a valid email address');
  });
  it('allows empty when optional', () => {
    expect(issues(def({ ...b, name: 'email', type: 'email' }), { email: '' })).toEqual({});
  });
});

describe('select', () => {
  const d = def({
    ...b,
    name: 'topic',
    label: 'Topic',
    type: 'select',
    required: true,
    options: [
      { id: 'o1', label: 'Sales', value: 'sales' },
      { id: 'o2', label: 'Support', value: 'support' },
    ],
  });
  it('requires a choice when required', () => {
    expect(issues(d, { topic: '' }).topic).toBe('Topic is required');
  });
  it('accepts a listed value and rejects any other value', () => {
    expect(issues(d, { topic: 'sales' })).toEqual({});
    expect(issues(d, { topic: 'hacker_value' }).topic).toBe('Choose one of the listed options');
    expect(issues(d, { topic: 'Sales' }).topic).toBe('Choose one of the listed options'); // label is not a value
  });
});

describe('checkbox', () => {
  it('must be checked when required', () => {
    const d = def({ ...b, name: 'agree', label: 'I agree', type: 'checkbox', required: true });
    expect(issues(d, { agree: false }).agree).toBe('I agree must be checked');
    expect(issues(d, { agree: true })).toEqual({});
  });
  it('may stay unchecked when optional', () => {
    expect(issues(def({ ...b, name: 'agree', type: 'checkbox' }), { agree: false })).toEqual({});
  });
});

describe('whole form', () => {
  it('strips unknown keys so extra data never reaches onSubmit', () => {
    const result = buildAnswersSchema(def({ ...b, type: 'text' })).safeParse({ full_name: 'Jane', isAdmin: true });
    expect(result.success && result.data).toEqual({ full_name: 'Jane' });
  });

  it('reports every invalid field at once', () => {
    const d = def(
      { ...b, type: 'text', required: true },
      { ...b, id: 'f2', name: 'email', label: 'Email', type: 'email', required: true },
    );
    expect(Object.keys(issues(d, { full_name: '', email: '' }))).toEqual(['full_name', 'email']);
  });

  it('builds typed default values', () => {
    const d = def(
      { ...b, type: 'text' },
      { ...b, id: 'f2', name: 'agree', type: 'checkbox' },
      { ...b, id: 'f3', name: 'topic', type: 'select', options: [] },
    );
    expect(buildDefaultValues(d)).toEqual({ full_name: '', agree: false, topic: '' });
  });
});
