import { describe, expect, it } from 'vitest';
import { formDefinitionSchema, validateDefinition, validateForPublish } from './schema';
import type { FormDefinition } from './types';

const base = { id: 'f1', name: 'full_name', label: 'Full name', required: true };

function def(fields: unknown[], extra: Record<string, unknown> = {}) {
  return { schemaVersion: 1, title: 'Contact', fields, ...extra } as unknown as FormDefinition;
}

describe('field schemas (one valid example per type)', () => {
  it.each([
    ['text', { ...base, type: 'text', placeholder: 'Jane', minLength: 2, maxLength: 50 }],
    ['email', { ...base, id: 'f2', name: 'email', type: 'email' }],
    ['textarea', { ...base, id: 'f3', name: 'message', type: 'textarea', maxLength: 500 }],
    [
      'select',
      {
        ...base,
        id: 'f4',
        name: 'topic',
        type: 'select',
        options: [{ id: 'o1', label: 'Sales', value: 'sales' }],
      },
    ],
    ['checkbox', { ...base, id: 'f5', name: 'agree', type: 'checkbox' }],
  ])('accepts a valid %s field', (_label, field) => {
    expect(validateDefinition(def([field]))).toEqual([]);
  });
});

describe('invalid data', () => {
  it('rejects an unknown field type', () => {
    const issues = validateDefinition(def([{ ...base, type: 'date' }]));
    expect(issues.length).toBeGreaterThan(0);
  });

  it('rejects an unsupported schemaVersion', () => {
    const result = formDefinitionSchema.safeParse({ schemaVersion: 2, title: 'x', fields: [] });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra properties (strict)', () => {
    const issues = validateDefinition(def([{ ...base, type: 'text', onClick: 'alert(1)' }]));
    expect(issues.some((i) => i.fieldId === 'f1')).toBe(true);
  });

  it('rejects placeholder and length rules on a checkbox', () => {
    const issues = validateDefinition(
      def([{ ...base, type: 'checkbox', placeholder: 'x', minLength: 1 }]),
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it('rejects options on a text field', () => {
    const issues = validateDefinition(def([{ ...base, type: 'text', options: [] }]));
    expect(issues.length).toBeGreaterThan(0);
  });

  it.each(['Name', '1name', 'has space', 'has-dash', '', 'a'.repeat(41)])(
    'rejects field name %j',
    (name) => {
      const issues = validateDefinition(def([{ ...base, name, type: 'text' }]));
      expect(issues.some((i) => i.fieldId === 'f1' && i.path[0] === 'name')).toBe(true);
    },
  );

  it('rejects an empty or whitespace label', () => {
    const issues = validateDefinition(def([{ ...base, label: '   ', type: 'text' }]));
    expect(issues).toContainEqual(expect.objectContaining({ fieldId: 'f1', path: ['label'] }));
  });

  it('rejects min length greater than max length', () => {
    const issues = validateDefinition(
      def([{ ...base, type: 'text', minLength: 10, maxLength: 5 }]),
    );
    expect(issues).toContainEqual(expect.objectContaining({ fieldId: 'f1', path: ['maxLength'] }));
  });

  it('rejects a fractional length', () => {
    const issues = validateDefinition(def([{ ...base, type: 'text', minLength: 1.5 }]));
    expect(issues.length).toBeGreaterThan(0);
  });

  it('flags every field that shares a name', () => {
    const issues = validateDefinition(
      def([
        { ...base, id: 'a', name: 'dup', type: 'text' },
        { ...base, id: 'b', name: 'dup', type: 'email' },
      ]),
    );
    const flagged = issues.filter((i) => i.path[0] === 'name').map((i) => i.fieldId);
    expect(flagged).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('flags duplicate option values on the right option', () => {
    const issues = validateDefinition(
      def([
        {
          ...base,
          type: 'select',
          options: [
            { id: 'o1', label: 'A', value: 'same' },
            { id: 'o2', label: 'B', value: 'same' },
          ],
        },
      ]),
    );
    expect(issues).toContainEqual(
      expect.objectContaining({ fieldId: 'f1', path: ['options', 1, 'value'] }),
    );
  });

  it('reports an empty title as a form-level issue', () => {
    const issues = validateDefinition(def([], { title: '  ' }));
    expect(issues).toContainEqual(expect.objectContaining({ fieldId: null, path: ['title'] }));
  });

  it('rejects more than 50 fields', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({
      id: `f${i}`,
      name: `field_${i}`,
      label: `Field ${i}`,
      required: false,
      type: 'text',
    }));
    expect(validateDefinition(def(many)).length).toBeGreaterThan(0);
  });
});

describe('publish rules', () => {
  it('allows saving a draft with no fields but blocks publishing it', () => {
    expect(validateDefinition(def([]))).toEqual([]);
    expect(validateForPublish(def([])).map((i) => i.message)).toContain(
      'Add at least one field before publishing',
    );
  });

  it('allows saving a select with no options but blocks publishing it', () => {
    const d = def([{ ...base, type: 'select', options: [] }]);
    expect(validateDefinition(d)).toEqual([]);
    expect(validateForPublish(d)).toContainEqual(
      expect.objectContaining({ fieldId: 'f1', path: ['options'] }),
    );
  });

  it('passes a complete form', () => {
    expect(validateForPublish(def([{ ...base, type: 'text' }]))).toEqual([]);
  });
});
