import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { formDefinitionSchema } from '@/features/builder/schema';
import type { FormDefinition } from '@/features/builder/types';
import { FieldRenderer } from './FieldRenderer';
import { buildAnswersSchema, buildDefaultValues } from './answersSchema';
import type { Answers } from './answersSchema';
import { fieldInputId } from './ids';
import { SubmitError } from './SubmitError';

type Props = {
  definition: FormDefinition;
  /** Receives validated, trimmed answers. Throw SubmitError to show server-side errors. */
  onSubmit: (answers: Answers) => Promise<void>;
  headingLevel?: 'h1' | 'h2';
  successMessage?: string;
};

/** Renders a form ONLY from its schema, and validates answers with rules generated from the same schema. */
export function FormRenderer(props: Props) {
  // Defensive: never build a form from a definition that fails the schema (imported or tampered data).
  const isValid = useMemo(
    () => formDefinitionSchema.safeParse(props.definition).success,
    [props.definition],
  );
  if (!isValid) {
    return (
      <p role="alert" className="rounded-control border border-danger p-3 text-sm text-danger">
        Error: this form cannot be shown because its configuration is invalid.
      </p>
    );
  }
  return <ValidatedForm {...props} />;
}

function ValidatedForm({ definition, onSubmit, headingLevel = 'h1', successMessage }: Props) {
  const Heading = headingLevel;
  const schema = useMemo(() => buildAnswersSchema(definition), [definition]);
  const defaultValues = useMemo(() => buildDefaultValues(definition), [definition]);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<Answers>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched', // first validation when leaving a field, then live while fixing it
    reValidateMode: 'onChange',
  });

  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const submit = handleSubmit(async (answers) => {
    setServerMessage(null);
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } catch (error) {
      if (error instanceof SubmitError) {
        const known = new Set(definition.fields.map((f) => f.name));
        for (const [name, message] of Object.entries(error.fieldErrors ?? {})) {
          if (known.has(name)) setError(name, { type: 'server', message }, { shouldFocus: true });
        }
        setServerMessage(error.message);
      } else {
        setServerMessage('Could not submit the form. Please try again.');
      }
    }
  });

  if (submitted) {
    return (
      <div role="status" className="space-y-3">
        <Heading className="text-2xl font-semibold">{definition.title}</Heading>
        <p className="font-medium">{successMessage ?? 'Thank you. Your response was submitted.'}</p>
        <Button
          variant="secondary"
          onClick={() => {
            reset(defaultValues);
            setSubmitted(false);
          }}
        >
          Submit another response
        </Button>
      </div>
    );
  }

  const invalidFields = definition.fields.filter((f) => errors[f.name]);

  return (
    <form noValidate onSubmit={submit} className="space-y-4" aria-busy={isSubmitting}>
      <div>
        <Heading className="text-2xl font-semibold">{definition.title}</Heading>
        {definition.description && <p className="mt-1 text-muted">{definition.description}</p>}
      </div>

      {(serverMessage || (submitCount > 0 && invalidFields.length > 0)) && (
        <div role="alert" className="rounded-control border border-danger p-3 text-sm">
          {serverMessage && <p className="font-medium text-danger">Error: {serverMessage}</p>}
          {invalidFields.length > 0 && (
            <>
              <p className="font-medium text-danger">
                Fix {invalidFields.length} {invalidFields.length === 1 ? 'field' : 'fields'} to
                continue:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {invalidFields.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="text-left underline"
                      onClick={() => document.getElementById(fieldInputId(f.id))?.focus()}
                    >
                      {String(errors[f.name]?.message ?? `${f.label} is invalid`)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {definition.fields.length > 0 && (
        <p className="text-xs text-muted">Fields marked * are required.</p>
      )}

      {definition.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          error={errors[field.name]?.message ? String(errors[field.name]?.message) : undefined}
          registration={register(field.name)}
        />
      ))}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </Button>
    </form>
  );
}
