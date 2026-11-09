import { describe, expect, it } from 'vitest';
import { FIELD_TYPES, FIELD_TYPE_LABELS, SCHEMA_VERSION } from './types';
import type { FormField } from './types';

describe('schema contract', () => {
  it('has exactly the five MVP field types, each with a label', () => {
    expect(FIELD_TYPES).toEqual(['text', 'email', 'textarea', 'select', 'checkbox']);
    for (const type of FIELD_TYPES) {
      expect(FIELD_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('narrows by the type discriminator', () => {
    const field: FormField = {
      id: 'f1',
      name: 'favourite_colour',
      label: 'Favourite colour',
      required: true,
      type: 'select',
      options: [{ id: 'o1', label: 'Red', value: 'red' }],
    };
    // options only exists after narrowing to the select member
    if (field.type === 'select') {
      expect(field.options).toHaveLength(1);
    }
    expect(SCHEMA_VERSION).toBe(1);
  });
});
