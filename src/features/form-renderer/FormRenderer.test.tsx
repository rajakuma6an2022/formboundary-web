import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormRenderer } from './FormRenderer';
import type { FormDefinition } from '@/features/builder/types';

const definition: FormDefinition = {
  schemaVersion: 1,
  title: 'Contact us',
  description: 'We reply within a day.',
  fields: [
    { id: 'a', name: 'name', label: 'Your name', required: true, type: 'text' },
    {
      id: 'b',
      name: 'topic',
      label: 'Topic',
      required: false,
      type: 'select',
      options: [{ id: 'o', label: 'Sales', value: 'sales' }],
    },
    { id: 'c', name: 'agree', label: 'I agree', required: true, type: 'checkbox' },
  ],
};

describe('FormRenderer', () => {
  it('renders title, description and every field in schema order', () => {
    const { container } = render(<FormRenderer definition={definition} />);
    expect(screen.getByRole('heading', { name: 'Contact us', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('We reply within a day.')).toBeInTheDocument();
    const names = Array.from(container.querySelectorAll('input, select, textarea')).map((el) =>
      el.getAttribute('name'),
    );
    expect(names).toEqual(['name', 'topic', 'agree']);
  });

  it('renders a different form from different data with the same component', () => {
    render(
      <FormRenderer
        definition={{
          schemaVersion: 1,
          title: 'Other',
          fields: [{ id: 'z', name: 'z', label: 'Zed', required: false, type: 'email' }],
        }}
      />,
    );
    expect(screen.getByLabelText('Zed')).toHaveAttribute('type', 'email');
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
  });

  it('supports an h2 title when embedded in a page that already has an h1', () => {
    render(<FormRenderer definition={definition} headingLevel="h2" />);
    expect(screen.getByRole('heading', { name: 'Contact us', level: 2 })).toBeInTheDocument();
  });

  it('shows the required-fields note only when there are fields', () => {
    const { rerender } = render(<FormRenderer definition={definition} />);
    expect(screen.getByText('Fields marked * are required.')).toBeInTheDocument();
    rerender(<FormRenderer definition={{ ...definition, fields: [] }} />);
    expect(screen.queryByText('Fields marked * are required.')).not.toBeInTheDocument();
  });
});
