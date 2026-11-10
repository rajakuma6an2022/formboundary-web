import { useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const control =
  'block w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:opacity-50';

type Common = { label: string; hint?: string; error?: string };

function describedBy(...ids: (string | false | undefined)[]) {
  const joined = ids.filter(Boolean).join(' ');
  return joined === '' ? undefined : joined;
}

function Messages({ id, hint, error }: { id: string; hint?: string | undefined; error?: string | undefined }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        // The word "Error:" is text, so the problem is not communicated by colour alone.
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
          Error: {error}
        </p>
      )}
    </>
  );
}

type LabeledInputProps = Common & { mono?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>;

export function LabeledInput({ label, hint, error, mono = false, ...rest }: LabeledInputProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        className={`${control} ${error ? 'border-danger' : 'border-line'} ${mono ? 'font-mono' : ''}`}
        {...rest}
      />
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

type LabeledTextareaProps = Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>;

export function LabeledTextarea({ label, hint, error, ...rest }: LabeledTextareaProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={2}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        className={`${control} ${error ? 'border-danger' : 'border-line'}`}
        {...rest}
      />
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

type LabeledCheckboxProps = { label: string; hint?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'type'
>;

export function LabeledCheckbox({ label, hint, ...rest }: LabeledCheckboxProps) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          aria-describedby={describedBy(hint && `${id}-hint`)}
          className="h-4 w-4 accent-primary"
          {...rest}
        />
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      </div>
      <Messages id={id} hint={hint} />
    </div>
  );
}
