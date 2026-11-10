import { Button } from '@/components/ui/Button';
import { LabeledInput, LabeledTextarea } from '@/components/ui/Input';
import { CANVAS_HEADING_ID, fieldCardId } from '../fieldDom';
import { FIELD_TYPE_LABELS } from '../types';
import type { FormField } from '../types';
import type { ValidationIssue } from '../schema';

type Props = {
  title: string;
  description: string | undefined;
  fields: FormField[];
  selectedFieldId: string | null;
  /** Form-level issues (title, description). Field-level issues arrive via issuesByField. */
  formIssues?: ValidationIssue[];
  issuesByField?: Map<string, ValidationIssue[]>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string | undefined) => void;
  onSelect: (id: string) => void;
  onRemove: (field: FormField) => void;
};

export function BuilderCanvas({
  title,
  description,
  fields,
  selectedFieldId,
  formIssues = [],
  issuesByField = new Map(),
  onTitleChange,
  onDescriptionChange,
  onSelect,
  onRemove,
}: Props) {
  const titleError = formIssues.find((i) => i.path[0] === 'title')?.message;
  const descriptionError = formIssues.find((i) => i.path[0] === 'description')?.message;

  return (
    <section aria-labelledby={CANVAS_HEADING_ID} className="rounded-card border border-line bg-surface p-4">
      <h2 id={CANVAS_HEADING_ID} tabIndex={-1} className="sr-only">
        Form canvas
      </h2>

      <div className="space-y-3">
        <LabeledInput
          label="Form title"
          value={title}
          error={titleError}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <LabeledTextarea
          label="Description (optional)"
          value={description ?? ''}
          error={descriptionError}
          onChange={(e) => onDescriptionChange(e.target.value === '' ? undefined : e.target.value)}
        />
      </div>

      {fields.length === 0 ? (
        <div className="mt-4 rounded-card border border-dashed border-line p-8 text-center">
          <p className="font-medium">No fields yet</p>
          <p className="mt-1 text-muted">Use “Add a field” to add your first question.</p>
        </div>
      ) : (
        <ol aria-label="Form fields" className="mt-4 space-y-2">
          {fields.map((field, index) => {
            const selected = field.id === selectedFieldId;
            const needsAttention = (issuesByField.get(field.id)?.length ?? 0) > 0;
            return (
              <li
                key={field.id}
                className={`flex items-stretch rounded-card border bg-surface ${
                  selected ? 'border-primary ring-1 ring-primary' : 'border-line'
                }`}
              >
                <button
                  id={fieldCardId(field.id)}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(field.id)}
                  className="min-w-0 flex-1 rounded-card p-3 text-left"
                >
                  <span className="sr-only">
                    Position {index + 1} of {fields.length}.{' '}
                  </span>
                  <span className="block truncate font-medium">
                    {field.label.trim() === '' ? '(no label)' : field.label}
                    {field.required && (
                      <>
                        <span aria-hidden="true"> *</span>
                        <span className="sr-only"> (required)</span>
                      </>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {FIELD_TYPE_LABELS[field.type]} · name: {field.name}
                  </span>
                  {needsAttention && (
                    <span className="mt-1 inline-block text-xs font-medium text-danger">Needs attention</span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  className="self-center"
                  aria-label={`Remove ${field.label.trim() === '' ? 'field' : field.label}`}
                  onClick={() => onRemove(field)}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
