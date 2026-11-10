import { describe, expect, it } from 'vitest';
import { createField, createOption, generateUniqueName } from './fieldFactory';
import { FIELD_TYPES } from './types';
import { validateDefinition } from './schema';
import type { FormField } from './types';

function counter() {
  let i = 0;
  return () => `id_${++i}`;
}

describe('generateUniqueName', () => {
  it('skips names already used', () => {
    expect(generateUniqueName('text', ['text_1', 'text_2']).name).toBe('text_3');
    expect(generateUniqueName('text', []).name).toBe('text_1');
  });
});

describe('createField', () => {
  it.each(FIELD_TYPES)('creates a schema-valid %s field', (type) => {
    const field = createField(type, [], counter());
    expect(field.type).toBe(type);
    expect(validateDefinition({ schemaVersion: 1, title: 'T', fields: [field] })).toEqual([]);
  });

  it('gives each new field a unique id and name', () => {
    const newId = counter();
    const fields: FormField[] = [];
    for (let i = 0; i < 3; i++) fields.push(createField('text', fields, newId));
    expect(new Set(fields.map((f) => f.id)).size).toBe(3);
    expect(fields.map((f) => f.name)).toEqual(['text_1', 'text_2', 'text_3']);
    expect(fields.map((f) => f.label)).toEqual(['Text 1', 'Text 2', 'Text 3']);
  });

  it('creates a select with two distinct options', () => {
    const field = createField('select', [], counter());
    if (field.type !== 'select') throw new Error('expected select');
    expect(field.options.map((o) => o.value)).toEqual(['option_1', 'option_2']);
  });

  it('uses crypto.randomUUID by default', () => {
    expect(createField('text', []).id).toMatch(/[0-9a-f-]{36}/);
  });
});

describe('createOption', () => {
  it('picks the next free option value', () => {
    const existing = [{ id: 'a', label: 'A', value: 'option_1' }];
    expect(createOption(existing, counter()).value).toBe('option_2');
  });
});
