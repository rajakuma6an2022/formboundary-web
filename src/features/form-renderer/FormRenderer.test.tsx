import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from './FormRenderer';
import { SubmitError } from './SubmitError';
import type { Answers } from './answersSchema';
import type { FormDefinition } from '@/features/builder/types';

const definition: FormDefinition = {
  schemaVersion: 1,
  title: 'Contact us',
  description: 'We reply within a day.',
  fields: [
    { id: 'a', name: 'name', label: 'Your name', required: true, type: 'text' },
    { id: 'e', name: 'email', label: 'Email', required: true, type: 'email' },
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

const noop = async () => undefined;

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Your name/), '  Jane  ');
  await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
  await user.click(screen.getByLabelText(/I agree/));
}

describe('rendering from schema', () => {
  it('renders title, description and every field in schema order', () => {
    const { container } = render(<FormRenderer definition={definition} onSubmit={noop} />);
    expect(screen.getByRole('heading', { name: 'Contact us', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('We reply within a day.')).toBeInTheDocument();
    const names = Array.from(container.querySelectorAll('input, select, textarea')).map((el) =>
      el.getAttribute('name'),
    );
    expect(names).toEqual(['name', 'email', 'topic', 'agree']);
  });

  it('renders a different form from different data with the same component', () => {
    render(
      <FormRenderer
        onSubmit={noop}
        definition={{
          schemaVersion: 1,
          title: 'Other',
          fields: [{ id: 'z', name: 'z', label: 'Zed', required: false, type: 'email' }],
        }}
      />,
    );
    expect(screen.getByLabelText('Zed')).toHaveAttribute('type', 'email');
    expect(screen.queryByLabelText(/Your name/)).not.toBeInTheDocument();
  });

  it('supports an h2 title when embedded in a page that already has an h1', () => {
    render(<FormRenderer definition={definition} headingLevel="h2" onSubmit={noop} />);
    expect(screen.getByRole('heading', { name: 'Contact us', level: 2 })).toBeInTheDocument();
  });

  it('refuses to render a definition that fails the schema', () => {
    const bad = {
      ...definition,
      fields: [{ id: 'x', name: 'Bad Name', label: 'X', required: false, type: 'text' }],
    };
    render(<FormRenderer definition={bad as FormDefinition} onSubmit={noop} />);
    expect(screen.getByRole('alert')).toHaveTextContent('configuration is invalid');
  });
});

describe('invalid submission', () => {
  it('shows errors, a summary, focuses the first invalid field and does not call onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(noop);
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Your name/)).toHaveFocus();
    expect(screen.getByLabelText(/Your name/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Error: Your name is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Fix 3 fields to continue');
    expect(screen.getByRole('alert')).toHaveTextContent('I agree must be checked');
  });

  it('jumps to a field from the error summary', async () => {
    const user = userEvent.setup();
    render(<FormRenderer definition={definition} onSubmit={noop} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'I agree must be checked' }));
    expect(screen.getByLabelText(/I agree/)).toHaveFocus();
  });

  it('clears an error as soon as the value becomes valid', async () => {
    const user = userEvent.setup();
    render(<FormRenderer definition={definition} onSubmit={noop} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.type(screen.getByLabelText(/Your name/), 'Jane');
    await waitFor(() =>
      expect(screen.queryByText('Error: Your name is required')).not.toBeInTheDocument(),
    );
  });

  it('validates an email address', async () => {
    const user = userEvent.setup();
    render(<FormRenderer definition={definition} onSubmit={noop} />);
    await user.type(screen.getByLabelText(/Email/), 'jane@');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Error: Enter a valid email address')).toBeInTheDocument();
  });
});

describe('valid submission', () => {
  it('calls onSubmit once with validated, trimmed answers and shows success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(a: Answers) => Promise<void>>(noop);
    render(<FormRenderer definition={definition} onSubmit={onSubmit} successMessage="Thanks!" />);

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com',
      topic: '',
      agree: true,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Thanks!');
  });

  it('lets the user submit another response with a clean form', async () => {
    const user = userEvent.setup();
    render(<FormRenderer definition={definition} onSubmit={noop} />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(await screen.findByRole('button', { name: 'Submit another response' }));
    expect(screen.getByLabelText(/Your name/)).toHaveValue('');
    expect(screen.getByLabelText(/I agree/)).not.toBeChecked();
  });
});

describe('submit state', () => {
  it('disables the button while submitting and prevents a duplicate submission', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const busy = await screen.findByRole('button', { name: 'Submitting…' });
    expect(busy).toBeDisabled();
    await user.click(busy); // second click while pending
    expect(onSubmit).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});

describe('server errors', () => {
  it('maps a server field error onto that field and focuses it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw new SubmitError('Please fix the highlighted fields.', {
        email: 'This email is already registered',
        ghost: 'ignored',
      });
    });
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Error: This email is already registered')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.');
    expect(screen.queryByText(/ignored/)).not.toBeInTheDocument(); // unknown field names are dropped
  });

  it('shows a generic message for a network failure and allows retry', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(undefined);
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not submit the form. Please try again.',
    );
    expect(screen.getByLabelText(/Your name/)).toHaveValue('  Jane  '); // what the user typed is kept

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
