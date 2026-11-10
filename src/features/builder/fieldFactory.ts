import { assertNever } from '@/lib/assertNever';
import { FIELD_TYPE_LABELS } from './types';
import type { FieldType, FormField, SelectOption } from './types';

export type IdGenerator = () => string;
const defaultIdGenerator: IdGenerator = () => crypto.randomUUID();

/** "text" + existing text_1, text_2 -> "text_3". Always returns a name that matches the name rule. */
export function generateUniqueName(
  base: string,
  existing: Iterable<string>,
): { name: string; n: number } {
  const used = new Set(existing);
  let n = 1;
  while (used.has(`${base}_${n}`)) n++;
  return { name: `${base}_${n}`, n };
}

export function createOption(
  existing: readonly SelectOption[],
  newId: IdGenerator = defaultIdGenerator,
): SelectOption {
  const { name, n } = generateUniqueName(
    'option',
    existing.map((o) => o.value),
  );
  return { id: newId(), label: `Option ${n}`, value: name };
}

/**
 * Builds a new field with a stable id and a unique default name.
 * The id is generated HERE (not in the reducer) so the reducer stays a pure function.
 */
export function createField(
  type: FieldType,
  existingFields: readonly FormField[],
  newId: IdGenerator = defaultIdGenerator,
): FormField {
  const { name, n } = generateUniqueName(
    type,
    existingFields.map((f) => f.name),
  );
  const base = { id: newId(), name, label: `${FIELD_TYPE_LABELS[type]} ${n}`, required: false };

  switch (type) {
    case 'text':
    case 'email':
      return { ...base, type };
    case 'textarea':
      return { ...base, type };
    case 'select': {
      const first = createOption([], newId);
      const second = createOption([first], newId);
      return { ...base, type, options: [first, second] };
    }
    case 'checkbox':
      return { ...base, type };
    default:
      return assertNever(type);
  }
}
