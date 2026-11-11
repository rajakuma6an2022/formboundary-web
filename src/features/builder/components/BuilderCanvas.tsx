import { useMemo } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LabeledInput, LabeledTextarea } from '@/components/ui/Input';
import { CANVAS_HEADING_ID } from '../fieldDom';
import { SCREEN_READER_INSTRUCTIONS, buildAnnouncements, computeMove } from '../reorder';
import type { FormField } from '../types';
import type { ValidationIssue } from '../schema';
import { SortableFieldCard } from './SortableFieldCard';

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
  /** Result of a drag and drop (dnd-kit announces it itself). */
  onMove: (id: string, toIndex: number) => void;
  /** Result of the Move up / Move down buttons (page announces it). */
  onMoveStep: (field: FormField, delta: -1 | 1) => void;
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
  onMove,
  onMoveStep,
}: Props) {
  const titleError = formIssues.find((i) => i.path[0] === 'title')?.message;
  const descriptionError = formIssues.find((i) => i.path[0] === 'description')?.message;

  // distance: 5 lets a plain click on the handle stay a click, a real drag start after 5px.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const announcements = useMemo(() => buildAnnouncements(fields), [fields]);
  const ids = useMemo(() => fields.map((f) => f.id), [fields]);

  function handleDragEnd({ active, over }: DragEndEvent) {
    const move = computeMove(fields, active.id, over?.id);
    if (move) onMove(move.id, move.toIndex);
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: { draggable: SCREEN_READER_INSTRUCTIONS },
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol aria-label="Form fields" className="mt-4 space-y-2">
              {fields.map((field, index) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  total={fields.length}
                  selected={field.id === selectedFieldId}
                  needsAttention={(issuesByField.get(field.id)?.length ?? 0) > 0}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onMoveStep={onMoveStep}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
