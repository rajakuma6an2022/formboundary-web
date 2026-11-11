import { describe, expect, it } from 'vitest';
import { buildAnnouncements, computeMove } from './reorder';
import { createField } from './fieldFactory';
import type { FormField } from './types';

function makeFields(): FormField[] {
  let n = 0;
  const newId = () => `id_${++n}`;
  const fields: FormField[] = [];
  for (const type of ['text', 'email', 'checkbox'] as const) fields.push(createField(type, fields, newId));
  return fields;
}

describe('computeMove', () => {
  const fields = makeFields();
  const [a, b, c] = fields as [FormField, FormField, FormField];

  it('maps active and over ids to a target index', () => {
    expect(computeMove(fields, a.id, c.id)).toEqual({ id: a.id, toIndex: 2 });
    expect(computeMove(fields, c.id, a.id)).toEqual({ id: c.id, toIndex: 0 });
    expect(computeMove(fields, b.id, a.id)).toEqual({ id: b.id, toIndex: 0 });
  });

  it('returns null when dropped outside, onto itself, or with unknown ids', () => {
    expect(computeMove(fields, a.id, null)).toBeNull();
    expect(computeMove(fields, a.id, undefined)).toBeNull();
    expect(computeMove(fields, a.id, a.id)).toBeNull();
    expect(computeMove(fields, 'nope', a.id)).toBeNull();
    expect(computeMove(fields, a.id, 'nope')).toBeNull();
  });
});

describe('buildAnnouncements', () => {
  const fields = makeFields();
  const [a, , c] = fields as [FormField, FormField, FormField];
  const announce = buildAnnouncements(fields);
  const active = { id: a.id } as never;
  const over = { id: c.id } as never;

  it('announces pick up with position', () => {
    expect(announce.onDragStart?.({ active })).toBe('Picked up Text 1. It is at position 1 of 3.');
  });

  it('announces the position it is over', () => {
    expect(announce.onDragOver?.({ active, over })).toBe('Text 1 is over position 3 of 3.');
  });

  it('announces drop and cancel', () => {
    expect(announce.onDragEnd?.({ active, over })).toBe('Text 1 was moved to position 3 of 3.');
    expect(announce.onDragEnd?.({ active, over: null })).toBe(
      'Text 1 was dropped. It stays at position 1 of 3.',
    );
    expect(announce.onDragCancel?.({ active, over: null })).toBe(
      'Reordering cancelled. Text 1 is back at position 1 of 3.',
    );
  });
});
