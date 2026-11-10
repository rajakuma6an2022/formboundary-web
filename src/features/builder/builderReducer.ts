import { assertNever } from '@/lib/assertNever';
import { SCHEMA_VERSION } from './types';
import type { FormDefinition, FormField, SelectOption } from './types';

export type BuilderState = {
  title: string;
  description?: string;
  fields: FormField[];
  selectedFieldId: string | null;
  /** Increments on every change to the saved document (NOT on selection). Used by autosave on Day 10. */
  revision: number;
};

export const initialBuilderState: BuilderState = {
  title: 'Untitled form',
  fields: [],
  selectedFieldId: null,
  revision: 0,
};

/** Only these properties can be edited. `id` and `type` are immutable so identity stays stable. */
export type FieldChanges = Partial<{
  label: string;
  name: string;
  required: boolean;
  placeholder: string | undefined;
  helperText: string | undefined;
  minLength: number | undefined;
  maxLength: number | undefined;
  options: SelectOption[];
}>;

type ChangeKey = keyof FieldChanges;

export type BuilderAction =
  | { type: 'form/rename'; title: string }
  | { type: 'form/describe'; description: string | undefined }
  | { type: 'field/add'; field: FormField; index?: number }
  | { type: 'field/update'; id: string; changes: FieldChanges }
  | { type: 'field/remove'; id: string }
  | { type: 'field/move'; id: string; toIndex: number }
  | { type: 'field/select'; id: string | null };

const COMMON_KEYS: readonly ChangeKey[] = ['label', 'name', 'required', 'helperText'];

function allowedKeys(type: FormField['type']): readonly ChangeKey[] {
  switch (type) {
    case 'text':
    case 'email':
    case 'textarea':
      return [...COMMON_KEYS, 'placeholder', 'minLength', 'maxLength'];
    case 'select':
      return [...COMMON_KEYS, 'placeholder', 'options'];
    case 'checkbox':
      return COMMON_KEYS;
    default:
      return assertNever(type);
  }
}

const REQUIRED_KEYS: readonly ChangeKey[] = ['label', 'name', 'required'];

/**
 * Design rule (ADR 0006): invalid input is REJECTED (state returned unchanged) when it would break
 * structure: unknown id, duplicate id/name on add, id/type change, a property the field type does not have,
 * out-of-range index. Values the user is still typing (empty label, duplicate name) are ACCEPTED and reported
 * by validateDefinition(), which blocks saving and publishing.
 */
export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'form/rename': {
      if (action.title === state.title) return state;
      return { ...state, title: action.title, revision: state.revision + 1 };
    }

    case 'form/describe': {
      if (action.description === state.description) return state;
      const next: BuilderState = { ...state, revision: state.revision + 1 };
      if (action.description === undefined) delete next.description;
      else next.description = action.description;
      return next;
    }

    case 'field/add': {
      const { field, index = state.fields.length } = action;
      if (!Number.isInteger(index) || index < 0 || index > state.fields.length) return state;
      if (state.fields.some((f) => f.id === field.id)) return state;
      if (state.fields.some((f) => f.name === field.name)) return state;
      const fields = [...state.fields.slice(0, index), field, ...state.fields.slice(index)];
      return { ...state, fields, selectedFieldId: field.id, revision: state.revision + 1 };
    }

    case 'field/update': {
      const index = state.fields.findIndex((f) => f.id === action.id);
      const current = state.fields[index];
      if (index === -1 || !current) return state;

      const allowed = allowedKeys(current.type);
      const keys = Object.keys(action.changes) as ChangeKey[];
      if (keys.length === 0) return state;

      const next: Record<string, unknown> = { ...current };
      let changed = false;
      for (const key of keys) {
        if (!allowed.includes(key)) return state; // property does not exist on this field type
        const value = action.changes[key];
        if (value === undefined && REQUIRED_KEYS.includes(key)) return state;
        if (Object.is(next[key], value)) continue;
        changed = true;
        if (value === undefined) delete next[key];
        else next[key] = value;
      }
      if (!changed) return state;

      const fields = state.fields.map((f, i) => (i === index ? (next as FormField) : f));
      return { ...state, fields, revision: state.revision + 1 };
    }

    case 'field/remove': {
      const index = state.fields.findIndex((f) => f.id === action.id);
      if (index === -1) return state;
      const fields = state.fields.filter((f) => f.id !== action.id);
      let selectedFieldId = state.selectedFieldId;
      if (selectedFieldId === action.id) {
        // prefer the field that moved into this slot, else the previous one, else nothing
        selectedFieldId = fields[index]?.id ?? fields[index - 1]?.id ?? null;
      }
      return { ...state, fields, selectedFieldId, revision: state.revision + 1 };
    }

    case 'field/move': {
      const from = state.fields.findIndex((f) => f.id === action.id);
      const to = action.toIndex;
      if (from === -1) return state;
      if (!Number.isInteger(to) || to < 0 || to >= state.fields.length) return state;
      if (from === to) return state;
      const fields = [...state.fields];
      const [moved] = fields.splice(from, 1);
      if (!moved) return state;
      fields.splice(to, 0, moved);
      return { ...state, fields, revision: state.revision + 1 }; // selection untouched on purpose
    }

    case 'field/select': {
      if (action.id === state.selectedFieldId) return state;
      if (action.id !== null && !state.fields.some((f) => f.id === action.id)) return state;
      return { ...state, selectedFieldId: action.id };
    }

    default:
      return assertNever(action);
  }
}

export function toDefinition(state: BuilderState): FormDefinition {
  return {
    schemaVersion: SCHEMA_VERSION,
    title: state.title,
    ...(state.description !== undefined ? { description: state.description } : {}),
    fields: state.fields,
  };
}

export function getSelectedField(state: BuilderState): FormField | null {
  return state.fields.find((f) => f.id === state.selectedFieldId) ?? null;
}
