import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { BuilderCanvas } from '../components/BuilderCanvas';
import { FieldPalette } from '../components/FieldPalette';
import { builderReducer, initialBuilderState } from '../builderReducer';
import { CANVAS_HEADING_ID, fieldCardId } from '../fieldDom';
import { createField } from '../fieldFactory';
import { FIELD_TYPE_LABELS } from '../types';
import type { FieldType, FormField } from '../types';

export function BuilderPage() {
  const { formId } = useParams();
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const [announcement, setAnnouncement] = useState('');
  const pendingFocusId = useRef<string | null>(null);

  // After the DOM updates, move focus where the user expects it (new card, or the canvas if empty).
  useEffect(() => {
    if (pendingFocusId.current) {
      document.getElementById(pendingFocusId.current)?.focus();
      pendingFocusId.current = null;
    }
  }, [state.fields]);

  function handleAdd(type: FieldType) {
    const field = createField(type, state.fields);
    const position = state.fields.length + 1;
    pendingFocusId.current = fieldCardId(field.id);
    dispatch({ type: 'field/add', field });
    setAnnouncement(`${FIELD_TYPE_LABELS[type]} field added at position ${position} of ${position}.`);
  }

  function handleRemove(field: FormField) {
    const action = { type: 'field/remove', id: field.id } as const;
    const nextSelected = builderReducer(state, action).selectedFieldId; // reducer is pure, safe to preview
    pendingFocusId.current = nextSelected ? fieldCardId(nextSelected) : CANVAS_HEADING_ID;
    dispatch(action);
    setAnnouncement(`Removed ${field.label || 'field'}.`);
  }

  return (
    <div className="min-h-screen bg-page">
      <a
        href="#builder-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to builder
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/forms" className="text-sm text-primary underline">
              Back to Forms
            </Link>
            <h1 className="sr-only">Form builder</h1>
            <span className="text-sm text-muted">Form ID: {formId}</span>
            <span className="rounded-control bg-page px-2 py-1 text-xs text-muted">Draft · not saved yet</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled>
              Preview
            </Button>
            <Button disabled>Publish</Button>
          </div>
        </div>
      </header>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <main
        id="builder-main"
        className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]"
      >
        <FieldPalette onAdd={handleAdd} />
        <BuilderCanvas
          title={state.title}
          description={state.description}
          fields={state.fields}
          selectedFieldId={state.selectedFieldId}
          onTitleChange={(title) => dispatch({ type: 'form/rename', title })}
          onDescriptionChange={(description) => dispatch({ type: 'form/describe', description })}
          onSelect={(id) => dispatch({ type: 'field/select', id })}
          onRemove={handleRemove}
        />
        <aside aria-label="Field settings" className="rounded-card border border-line bg-surface p-4">
          <h2 className="text-base font-semibold">Field settings</h2>
          <p className="mt-2 text-muted">Field settings appear here once the inspector is added.</p>
        </aside>
      </main>
    </div>
  );
}
