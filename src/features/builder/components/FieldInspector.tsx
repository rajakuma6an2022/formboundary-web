import type { Dispatch } from 'react';
import { Button } from '@/components/ui/Button';
import { LabeledCheckbox, LabeledInput } from '@/components/ui/Input';
import { createOption } from '../fieldFactory';
import { FIELD_TYPE_LABELS } from '../types';
import type { FormField, SelectField } from '../types';
import type { BuilderAction, FieldChanges } from '../builderReducer';
import type { ValidationIssue } from '../schema';

type Props = {
  field: FormField | null;
  /** All issues for this field (save rules + publish rules). */
  issues: ValidationIssue[];
  dispatch: Dispatch<BuilderAction>;
};

// Issue paths the inspector shows next to a specific control. Anything else is shown in the general list.
const CONTROL_KEYS = new Set([
  'label',
  'name',
  'placeholder',
  'helperText',
  'minLength',
  'maxLength',
  'options',
]);

export function FieldInspector({ field, issues, dispatch }: Props) {
  if (!field) {
    return <p className="mt-2 text-muted">Select a field on the canvas to edit its settings.</p>;
  }

  const update = (changes: FieldChanges) =>
    dispatch({ type: 'field/update', id: field.id, changes });
  const errorFor = (key: string) =>
    issues.find((i) => i.path.length === 1 && i.path[0] === key)?.message;
  const generalIssues = issues.filter((i) => !CONTROL_KEYS.has(String(i.path[0])));

  const supportsLength =
    field.type === 'text' || field.type === 'email' || field.type === 'textarea';
  const supportsPlaceholder = field.type !== 'checkbox';

  return (
    <div className="mt-3 space-y-4">
      <p className="text-xs text-muted">
        Type: {FIELD_TYPE_LABELS[field.type]} (cannot be changed)
      </p>

      {generalIssues.length > 0 && (
        <ul className="space-y-1 text-xs font-medium text-danger">
          {generalIssues.map((i, n) => (
            <li key={n}>Error: {i.message}</li>
          ))}
        </ul>
      )}

      <LabeledInput
        label="Label"
        value={field.label}
        error={errorFor('label')}
        onChange={(e) => update({ label: e.target.value })}
      />

      <LabeledInput
        label="Name"
        mono
        value={field.name}
        hint="Key used for this answer in submissions. Must be unique."
        error={errorFor('name')}
        onChange={(e) => update({ name: e.target.value })}
      />

      {supportsPlaceholder && (
        <LabeledInput
          label="Placeholder"
          value={field.placeholder ?? ''}
          error={errorFor('placeholder')}
          onChange={(e) =>
            update({ placeholder: e.target.value === '' ? undefined : e.target.value })
          }
        />
      )}

      <LabeledInput
        label="Helper text"
        value={field.helperText ?? ''}
        error={errorFor('helperText')}
        onChange={(e) => update({ helperText: e.target.value === '' ? undefined : e.target.value })}
      />

      <LabeledCheckbox
        label="Required"
        checked={field.required}
        onChange={(e) => update({ required: e.target.checked })}
      />

      {supportsLength && (
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput
            label="Min length"
            type="number"
            min={0}
            step={1}
            value={field.minLength ?? ''}
            error={errorFor('minLength')}
            onChange={(e) =>
              update({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
          <LabeledInput
            label="Max length"
            type="number"
            min={1}
            step={1}
            value={field.maxLength ?? ''}
            error={errorFor('maxLength')}
            onChange={(e) =>
              update({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </div>
      )}

      {field.type === 'select' && <OptionsEditor field={field} issues={issues} update={update} />}
    </div>
  );
}

function OptionsEditor({
  field,
  issues,
  update,
}: {
  field: SelectField;
  issues: ValidationIssue[];
  update: (changes: FieldChanges) => void;
}) {
  const optionError = (index: number, key: 'label' | 'value') =>
    issues.find((i) => i.path[0] === 'options' && i.path[1] === index && i.path[2] === key)
      ?.message;
  const listError = issues.find((i) => i.path.length === 1 && i.path[0] === 'options')?.message;

  const patchOption = (index: number, patch: { label?: string; value?: string }) =>
    update({ options: field.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Options</legend>
      {listError && <p className="text-xs font-medium text-danger">Error: {listError}</p>}

      <ul className="space-y-3">
        {field.options.map((option, index) => (
          <li key={option.id} className="rounded-control border border-line p-3">
            <div role="group" aria-label={`Option ${index + 1}`} className="space-y-2">
              <LabeledInput
                label={`Option ${index + 1} label`}
                value={option.label}
                error={optionError(index, 'label')}
                onChange={(e) => patchOption(index, { label: e.target.value })}
              />
              <LabeledInput
                label={`Option ${index + 1} value`}
                mono
                value={option.value}
                error={optionError(index, 'value')}
                onChange={(e) => patchOption(index, { value: e.target.value })}
              />
              <Button
                variant="ghost"
                aria-label={`Remove option ${index + 1}`}
                onClick={() => update({ options: field.options.filter((_, i) => i !== index) })}
              >
                Remove option
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => update({ options: [...field.options, createOption(field.options)] })}
      >
        Add option
      </Button>
    </fieldset>
  );
}
