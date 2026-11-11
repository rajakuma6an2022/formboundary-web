import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/Button';
import { fieldCardId } from '../fieldDom';
import { FIELD_TYPE_LABELS } from '../types';
import type { FormField } from '../types';

type Props = {
  field: FormField;
  index: number;
  total: number;
  selected: boolean;
  needsAttention: boolean;
  onSelect: (id: string) => void;
  onRemove: (field: FormField) => void;
  onMoveStep: (field: FormField, delta: -1 | 1) => void;
};

export function SortableFieldCard({
  field,
  index,
  total,
  selected,
  needsAttention,
  onSelect,
  onRemove,
  onMoveStep,
}: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const name = field.label.trim() === '' ? 'field' : field.label;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-stretch rounded-card border bg-surface ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-line'
      } ${isDragging ? 'relative z-10 opacity-90 shadow-md' : ''}`}
    >
      {/* Drag handle: pointer drag, or keyboard (Space/Enter, arrows, Space/Enter, Esc). */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${name}`}
        className="cursor-grab touch-none rounded-card px-3 text-muted hover:text-ink"
      >
        <span aria-hidden="true">⠿</span>
      </button>

      <button
        id={fieldCardId(field.id)}
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(field.id)}
        className="min-w-0 flex-1 rounded-card p-3 text-left"
      >
        <span className="sr-only">
          Position {index + 1} of {total}.{' '}
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
        {needsAttention && <span className="mt-1 inline-block text-xs font-medium text-danger">Needs attention</span>}
      </button>

      {/* Explicit move buttons: a non-drag alternative for pointer, keyboard and touch users. */}
      <div className="flex items-center gap-1 pr-2">
        <Button
          variant="ghost"
          className="px-2"
          aria-label={`Move ${name} up`}
          disabled={index === 0}
          onClick={() => onMoveStep(field, -1)}
        >
          <span aria-hidden="true">↑</span>
        </Button>
        <Button
          variant="ghost"
          className="px-2"
          aria-label={`Move ${name} down`}
          disabled={index === total - 1}
          onClick={() => onMoveStep(field, 1)}
        >
          <span aria-hidden="true">↓</span>
        </Button>
        <Button variant="ghost" aria-label={`Remove ${name}`} onClick={() => onRemove(field)}>
          Remove
        </Button>
      </div>
    </li>
  );
}
