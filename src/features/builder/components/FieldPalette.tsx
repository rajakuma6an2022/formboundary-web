import { Button } from '@/components/ui/Button';
import { FIELD_TYPES, FIELD_TYPE_LABELS } from '../types';
import type { FieldType } from '../types';

const HINTS: Record<FieldType, string> = {
  text: 'Single line of text',
  email: 'Email address',
  textarea: 'Several lines of text',
  select: 'Pick one option',
  checkbox: 'Yes / no',
};

type Props = { onAdd: (type: FieldType) => void };

export function FieldPalette({ onAdd }: Props) {
  return (
    <section aria-labelledby="palette-heading" className="rounded-card border border-line bg-surface p-4">
      <h2 id="palette-heading" className="text-base font-semibold">
        Add a field
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {FIELD_TYPES.map((type) => (
          <li key={type}>
            <Button
              variant="secondary"
              className="w-full flex-col items-start gap-0 text-left"
              aria-label={`Add ${FIELD_TYPE_LABELS[type]} field`}
              onClick={() => onAdd(type)}
            >
              <span>{FIELD_TYPE_LABELS[type]}</span>
              <span className="text-xs font-normal text-muted">{HINTS[type]}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
