import type { ChangeEvent, FocusEvent, ReactNode } from 'react';
import type { CheckboxField, FormField, SelectField, TextField, TextareaField } from '@/features/builder/types';
import { fieldErrorId, fieldHintId, fieldInputId } from './ids';

type AnyControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * What react-hook-form's register(name) returns, described structurally so this file does not depend on it.
 * Without a registration the control is a plain uncontrolled input (used in the Day 8 preview).
 */
export type FieldRegistration = {
  name: string;
  onChange: (event: ChangeEvent<AnyControl>) => unknown;
  onBlur: (event: FocusEvent<AnyControl>) => unknown;
  ref: (instance: AnyControl | null) => void;
};

export type FieldRendererProps = {
  field: FormField;
  error?: string | undefined;
  registration?: FieldRegistration | undefined;
};

const controlClass =
  'block w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

function describedBy(field: FormField, error?: string) {
  const ids = [field.helperText ? fieldHintId(field.id) : null, error ? fieldErrorId(field.id) : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

function Messages({ field, error }: { field: FormField; error?: string | undefined }) {
  return (
    <>
      {field.helperText && (
        <p id={fieldHintId(field.id)} className="mt-1 text-xs text-muted">
          {field.helperText}
        </p>
      )}
      {error && (
        <p id={fieldErrorId(field.id)} className="mt-1 text-xs font-medium text-danger">
          Error: {error}
        </p>
      )}
    </>
  );
}

function Frame({ field, error, children }: { field: FormField; error?: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={fieldInputId(field.id)} className="mb-1 block text-sm font-medium">
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      <Messages field={field} error={error} />
    </div>
  );
}

function commonProps(field: FormField, error: string | undefined, registration: FieldRegistration | undefined) {
  return {
    id: fieldInputId(field.id),
    'aria-required': field.required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy(field, error),
    className: `${controlClass} ${error ? 'border-danger' : 'border-line'}`,
    ...(registration ?? { name: field.name }),
  };
}

function TextView({ field, error, registration }: { field: TextField } & Omit<FieldRendererProps, 'field'>) {
  return (
    <Frame field={field} error={error}>
      <input
        type={field.type}
        placeholder={field.placeholder}
        autoComplete={field.type === 'email' ? 'email' : 'off'}
        {...commonProps(field, error, registration)}
      />
    </Frame>
  );
}

function TextareaView({ field, error, registration }: { field: TextareaField } & Omit<FieldRendererProps, 'field'>) {
  return (
    <Frame field={field} error={error}>
      <textarea rows={4} placeholder={field.placeholder} {...commonProps(field, error, registration)} />
    </Frame>
  );
}

function SelectView({ field, error, registration }: { field: SelectField } & Omit<FieldRendererProps, 'field'>) {
  return (
    <Frame field={field} error={error}>
      <select {...commonProps(field, error, registration)} defaultValue={registration ? undefined : ''}>
        <option value="">{field.placeholder ?? 'Select an option'}</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Frame>
  );
}

function CheckboxView({ field, error, registration }: { field: CheckboxField } & Omit<FieldRendererProps, 'field'>) {
  const props = commonProps(field, error, registration);
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...props}
          className={`h-4 w-4 accent-primary ${error ? 'outline outline-2 outline-danger' : ''}`}
        />
        <label htmlFor={fieldInputId(field.id)} className="text-sm font-medium">
          {field.label}
          {field.required && <span aria-hidden="true"> *</span>}
        </label>
      </div>
      <Messages field={field} error={error} />
    </div>
  );
}

/** Shown instead of crashing when data contains a field type this version does not know. Nothing is executed. */
function UnsupportedField({ field }: { field: unknown }) {
  const rawType = typeof field === 'object' && field !== null && 'type' in field ? String(field.type) : 'unknown';
  return (
    <p role="note" className="rounded-control border border-dashed border-line p-3 text-sm text-muted">
      This field type (“{rawType.slice(0, 40)}”) is not supported and was skipped.
    </p>
  );
}

/** One switch maps a field type to its view. Adding a type without a case here is a compile error. */
export function FieldRenderer({ field, error, registration }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
    case 'email':
      return <TextView field={field} error={error} registration={registration} />;
    case 'textarea':
      return <TextareaView field={field} error={error} registration={registration} />;
    case 'select':
      return <SelectView field={field} error={error} registration={registration} />;
    case 'checkbox':
      return <CheckboxView field={field} error={error} registration={registration} />;
    default: {
      const unknownField: never = field; // compile error if a field type is not handled above
      return <UnsupportedField field={unknownField} />;
    }
  }
}
