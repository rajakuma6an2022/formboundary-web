import { Button } from '@/components/ui/Button';
import type { FormDefinition } from '@/features/builder/types';
import { FieldRenderer } from './FieldRenderer';

type Props = {
  definition: FormDefinition;
  headingLevel?: 'h1' | 'h2';
};

/** Renders a form ONLY from its schema. There is no hand-written markup for any specific form. */
export function FormRenderer({ definition, headingLevel = 'h1' }: Props) {
  const Heading = headingLevel;
  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div>
        <Heading className="text-2xl font-semibold">{definition.title}</Heading>
        {definition.description && <p className="mt-1 text-muted">{definition.description}</p>}
      </div>

      {definition.fields.length > 0 && (
        <p className="text-xs text-muted">Fields marked * are required.</p>
      )}

      {definition.fields.map((field) => (
        <FieldRenderer key={field.id} field={field} />
      ))}

      {/* Disabled until validation and submit are wired (Day 9). */}
      <Button type="submit" disabled>
        Submit
      </Button>
    </form>
  );
}
