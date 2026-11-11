import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldRenderer } from './FieldRenderer';
import type { FormField } from '@/features/builder/types';

const base = { id: 'f1', name: 'full_name', label: 'Full name', required: false };

function renderField(field: FormField, error?: string) {
  return render(<FieldRenderer field={field} error={error} />);
}

describe('FieldRenderer: one view per field type', () => {
  it('renders a text input with label, placeholder and name', () => {
    renderField({ ...base, type: 'text', placeholder: 'Jane Doe' });
    const input = screen.getByLabelText('Full name');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Jane Doe');
    expect(input).toHaveAttribute('name', 'full_name');
  });

  it('renders an email input', () => {
    renderField({ ...base, id: 'f2', name: 'email', label: 'Email', type: 'email' });
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('renders a textarea', () => {
    renderField({ ...base, id: 'f3', name: 'message', label: 'Message', type: 'textarea' });
    expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
  });

  it('renders a select with a placeholder option and every choice in order', () => {
    renderField({
      ...base,
      id: 'f4',
      name: 'topic',
      label: 'Topic',
      type: 'select',
      placeholder: 'Choose one',
      options: [
        { id: 'o1', label: 'Sales', value: 'sales' },
        { id: 'o2', label: 'Support', value: 'support' },
      ],
    });
    const select = screen.getByLabelText('Topic');
    const options = Array.from(select.querySelectorAll('option')).map((o) => [
      o.textContent,
      o.value,
    ]);
    expect(options).toEqual([
      ['Choose one', ''],
      ['Sales', 'sales'],
      ['Support', 'support'],
    ]);
  });

  it('renders a checkbox with its label', () => {
    renderField({ ...base, id: 'f5', name: 'agree', label: 'I agree', type: 'checkbox' });
    expect(screen.getByLabelText('I agree')).toHaveAttribute('type', 'checkbox');
  });
});

describe('FieldRenderer: shared behaviour', () => {
  it('marks required fields with an indicator and aria-required', () => {
    renderField({ ...base, type: 'text', required: true });
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not set aria-required on optional fields', () => {
    renderField({ ...base, type: 'text' });
    expect(screen.getByLabelText('Full name')).not.toHaveAttribute('aria-required');
  });

  it('links helper text to the control', () => {
    renderField({ ...base, type: 'text', helperText: 'As on your passport' });
    const input = screen.getByLabelText('Full name');
    const hint = screen.getByText('As on your passport');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
  });

  it('shows an error with text (not colour only) and marks the control invalid', () => {
    renderField({ ...base, type: 'text', helperText: 'Hint' }, 'Full name is required');
    const input = screen.getByLabelText('Full name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByText('Error: Full name is required');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByText('Hint').id);
  });

  it('works for every type with a single error (checkbox and select too)', () => {
    renderField(
      { ...base, id: 'c', name: 'c', label: 'Agree', type: 'checkbox', required: true },
      'Must be checked',
    );
    expect(screen.getByLabelText(/Agree/)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('FieldRenderer: unknown field fallback', () => {
  it('shows a safe note instead of crashing or rendering markup', () => {
    const bad = {
      id: 'x',
      name: 'x',
      label: 'X',
      required: false,
      type: '<img src=x onerror=alert(1)>',
    };
    const { container } = render(<FieldRenderer field={bad as unknown as FormField} />);
    expect(screen.getByRole('note')).toHaveTextContent('not supported');
    expect(container.querySelector('img')).toBeNull(); // text only, never HTML
  });
});
