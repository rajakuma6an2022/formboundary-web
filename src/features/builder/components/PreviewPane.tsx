import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { FormRenderer } from '@/features/form-renderer/FormRenderer';
import type { FormDefinition } from '../types';

type Props = { definition: FormDefinition; onBack: () => void };

/** Read-only preview: same renderer the public form will use. Answers typed here never touch the builder state. */
export function PreviewPane({ definition, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus(); // entering preview: move focus to its heading
  }, []);

  return (
    <main id="builder-main" className="mx-auto max-w-[680px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="text-sm font-medium text-muted">
          Preview
        </h2>
        <Button variant="secondary" onClick={onBack}>
          Back to editor
        </Button>
      </div>
      <p className="mb-4 rounded-control bg-page px-3 py-2 text-xs text-muted">
        This is how your form will look. Nothing typed here is saved.
      </p>
      <div className="rounded-card border border-line bg-surface p-6">
        <FormRenderer
          definition={definition}
          headingLevel="h2"
          onSubmit={async () => undefined}
          successMessage="Preview only: nothing was saved or sent."
        />
      </div>
    </main>
  );
}
