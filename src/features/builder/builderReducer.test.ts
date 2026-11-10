import { describe, expect, it } from 'vitest';
import {
  builderReducer,
  getSelectedField,
  initialBuilderState,
  toDefinition,
} from './builderReducer';
import type { BuilderAction, BuilderState } from './builderReducer';
import { createField } from './fieldFactory';
import { validateDefinition } from './schema';
import type { FormField } from './types';

let seq = 0;
const newId = () => `id_${++seq}`;

function run(state: BuilderState, ...actions: BuilderAction[]) {
  return actions.reduce(builderReducer, state);
}

function withFields(...types: FormField['type'][]): BuilderState {
  let state = initialBuilderState;
  for (const type of types) {
    state = builderReducer(state, {
      type: 'field/add',
      field: createField(type, state.fields, newId),
    });
  }
  return state;
}

describe('form/rename and form/describe', () => {
  it('renames and bumps the revision', () => {
    const s = builderReducer(initialBuilderState, { type: 'form/rename', title: 'Survey' });
    expect(s.title).toBe('Survey');
    expect(s.revision).toBe(1);
  });

  it('returns the same state when nothing changes', () => {
    const s = builderReducer(initialBuilderState, {
      type: 'form/rename',
      title: initialBuilderState.title,
    });
    expect(s).toBe(initialBuilderState);
  });

  it('sets and clears the description', () => {
    const a = builderReducer(initialBuilderState, { type: 'form/describe', description: 'Hello' });
    expect(a.description).toBe('Hello');
    const b = builderReducer(a, { type: 'form/describe', description: undefined });
    expect('description' in b).toBe(false);
  });
});

describe('field/add', () => {
  it('appends, selects the new field and bumps revision', () => {
    const s = withFields('text', 'email');
    expect(s.fields.map((f) => f.type)).toEqual(['text', 'email']);
    expect(s.selectedFieldId).toBe(s.fields[1]?.id);
    expect(s.revision).toBe(2);
  });

  it('inserts at an index', () => {
    const base = withFields('text', 'email');
    const extra = createField('checkbox', base.fields, newId);
    const s = builderReducer(base, { type: 'field/add', field: extra, index: 1 });
    expect(s.fields.map((f) => f.type)).toEqual(['text', 'checkbox', 'email']);
  });

  it('rejects a duplicate id', () => {
    const s = withFields('text');
    const dup = { ...createField('email', s.fields, newId), id: s.fields[0]!.id };
    expect(builderReducer(s, { type: 'field/add', field: dup })).toBe(s);
  });

  it('rejects a duplicate name', () => {
    const s = withFields('text');
    const dup = { ...createField('email', s.fields, newId), name: s.fields[0]!.name };
    expect(builderReducer(s, { type: 'field/add', field: dup })).toBe(s);
  });

  it('rejects an out-of-range index', () => {
    const s = withFields('text');
    const f = createField('email', s.fields, newId);
    expect(builderReducer(s, { type: 'field/add', field: f, index: 5 })).toBe(s);
    expect(builderReducer(s, { type: 'field/add', field: f, index: -1 })).toBe(s);
  });
});

describe('field/update', () => {
  it('changes only the targeted field and keeps untouched fields by reference', () => {
    const s = withFields('text', 'email', 'checkbox');
    const [a, b, c] = s.fields as [FormField, FormField, FormField];
    const next = builderReducer(s, {
      type: 'field/update',
      id: b.id,
      changes: { label: 'Work email' },
    });
    expect(next.fields[0]).toBe(a);
    expect(next.fields[2]).toBe(c);
    expect(next.fields[1]?.label).toBe('Work email');
    expect(next.fields[1]?.id).toBe(b.id); // stable id
    expect(next.revision).toBe(s.revision + 1);
  });

  it('clears an optional property when the value is undefined', () => {
    const s0 = withFields('text');
    const id = s0.fields[0]!.id;
    const s1 = builderReducer(s0, { type: 'field/update', id, changes: { placeholder: 'Jane' } });
    expect(s1.fields[0]).toHaveProperty('placeholder', 'Jane');
    const s2 = builderReducer(s1, {
      type: 'field/update',
      id,
      changes: { placeholder: undefined },
    });
    expect(s2.fields[0]).not.toHaveProperty('placeholder');
  });

  it('rejects a property the field type does not have', () => {
    const s = withFields('checkbox', 'text');
    const [checkbox, text] = s.fields as [FormField, FormField];
    expect(
      builderReducer(s, { type: 'field/update', id: checkbox.id, changes: { placeholder: 'x' } }),
    ).toBe(s);
    expect(
      builderReducer(s, { type: 'field/update', id: checkbox.id, changes: { minLength: 1 } }),
    ).toBe(s);
    expect(builderReducer(s, { type: 'field/update', id: text.id, changes: { options: [] } })).toBe(
      s,
    );
  });

  it('rejects clearing label, name or required', () => {
    const s = withFields('text');
    const id = s.fields[0]!.id;
    const bad = { label: undefined } as unknown as { label: string };
    expect(builderReducer(s, { type: 'field/update', id, changes: bad })).toBe(s);
  });

  it('cannot change id or type', () => {
    const s = withFields('text');
    const id = s.fields[0]!.id;
    const sneaky = { id: 'other', type: 'email' } as unknown as { label: string };
    expect(builderReducer(s, { type: 'field/update', id, changes: sneaky })).toBe(s);
  });

  it('returns the same state for an unknown id, empty changes or identical values', () => {
    const s = withFields('text');
    const f = s.fields[0]!;
    expect(builderReducer(s, { type: 'field/update', id: 'nope', changes: { label: 'x' } })).toBe(
      s,
    );
    expect(builderReducer(s, { type: 'field/update', id: f.id, changes: {} })).toBe(s);
    expect(builderReducer(s, { type: 'field/update', id: f.id, changes: { label: f.label } })).toBe(
      s,
    );
  });

  it('accepts a duplicate name while typing, but validateDefinition reports it', () => {
    const s0 = withFields('text', 'email');
    const [a, b] = s0.fields as [FormField, FormField];
    const s1 = builderReducer(s0, { type: 'field/update', id: b.id, changes: { name: a.name } });
    expect(s1.fields[1]?.name).toBe(a.name);
    const issues = validateDefinition(toDefinition(s1));
    expect(issues.some((i) => i.path[0] === 'name')).toBe(true);
  });

  it('updates select options', () => {
    const s0 = withFields('select');
    const f = s0.fields[0]!;
    const s1 = builderReducer(s0, {
      type: 'field/update',
      id: f.id,
      changes: { options: [{ id: 'o1', label: 'Only', value: 'only' }] },
    });
    const updated = s1.fields[0];
    expect(updated?.type === 'select' && updated.options).toHaveLength(1);
  });
});

describe('field/remove', () => {
  it('selects the field that takes the removed slot', () => {
    const s0 = withFields('text', 'email', 'checkbox');
    const [a, b, c] = s0.fields as [FormField, FormField, FormField];
    const s1 = run(s0, { type: 'field/select', id: b.id }, { type: 'field/remove', id: b.id });
    expect(s1.fields.map((f) => f.id)).toEqual([a.id, c.id]);
    expect(s1.selectedFieldId).toBe(c.id);
  });

  it('selects the previous field when the last one is removed', () => {
    const s0 = withFields('text', 'email');
    const [a, b] = s0.fields as [FormField, FormField];
    const s1 = run(s0, { type: 'field/select', id: b.id }, { type: 'field/remove', id: b.id });
    expect(s1.selectedFieldId).toBe(a.id);
  });

  it('clears selection when the last remaining field is removed', () => {
    const s0 = withFields('text');
    const s1 = builderReducer(s0, { type: 'field/remove', id: s0.fields[0]!.id });
    expect(s1.selectedFieldId).toBeNull();
    expect(s1.fields).toEqual([]);
  });

  it('keeps the selection when a different field is removed', () => {
    const s0 = withFields('text', 'email');
    const [a, b] = s0.fields as [FormField, FormField];
    const s1 = run(s0, { type: 'field/select', id: b.id }, { type: 'field/remove', id: a.id });
    expect(s1.selectedFieldId).toBe(b.id);
  });

  it('ignores an unknown id', () => {
    const s = withFields('text');
    expect(builderReducer(s, { type: 'field/remove', id: 'nope' })).toBe(s);
  });
});

describe('field/move', () => {
  it('reorders and preserves ids, selection and untouched references', () => {
    const s0 = withFields('text', 'email', 'checkbox');
    const [a, b, c] = s0.fields as [FormField, FormField, FormField];
    const s1 = run(
      s0,
      { type: 'field/select', id: a.id },
      { type: 'field/move', id: a.id, toIndex: 2 },
    );
    expect(s1.fields.map((f) => f.id)).toEqual([b.id, c.id, a.id]);
    expect(s1.fields[2]).toBe(a);
    expect(s1.selectedFieldId).toBe(a.id);
  });

  it('is a no-op for same index, unknown id or out-of-range index', () => {
    const s = withFields('text', 'email');
    const [a] = s.fields as [FormField, FormField];
    expect(builderReducer(s, { type: 'field/move', id: a.id, toIndex: 0 })).toBe(s);
    expect(builderReducer(s, { type: 'field/move', id: 'nope', toIndex: 0 })).toBe(s);
    expect(builderReducer(s, { type: 'field/move', id: a.id, toIndex: 2 })).toBe(s);
    expect(builderReducer(s, { type: 'field/move', id: a.id, toIndex: -1 })).toBe(s);
  });
});

describe('field/select', () => {
  it('selects, deselects and ignores unknown ids without bumping revision', () => {
    const s0 = withFields('text', 'email');
    const [a] = s0.fields as [FormField, FormField];
    const s1 = builderReducer(s0, { type: 'field/select', id: a.id });
    expect(s1.selectedFieldId).toBe(a.id);
    expect(s1.revision).toBe(s0.revision);
    expect(getSelectedField(s1)).toBe(a);
    expect(builderReducer(s1, { type: 'field/select', id: 'nope' })).toBe(s1);
    expect(builderReducer(s1, { type: 'field/select', id: null }).selectedFieldId).toBeNull();
  });
});

describe('toDefinition', () => {
  it('produces a schema-valid definition from state', () => {
    const s = run(withFields('text', 'select'), { type: 'form/describe', description: 'About us' });
    expect(validateDefinition(toDefinition(s))).toEqual([]);
    expect(toDefinition(s).schemaVersion).toBe(1);
  });
});
