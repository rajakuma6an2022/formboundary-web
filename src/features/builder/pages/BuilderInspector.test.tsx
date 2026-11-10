import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderBuilder } from '@/test/renderBuilder';

type User = ReturnType<typeof userEvent.setup>;

async function add(user: User, label: string) {
  await user.click(screen.getByRole('button', { name: `Add ${label} field` }));
}

async function setValue(user: User, input: HTMLElement, value: string) {
  await user.clear(input);
  if (value !== '') await user.type(input, value);
}

function inspector() {
  return within(screen.getByRole('complementary', { name: 'Field settings' }));
}

describe('inspector: selection', () => {
  it('asks the user to select a field when nothing is selected', () => {
    renderBuilder();
    expect(inspector().getByText(/Select a field on the canvas/)).toBeInTheDocument();
  });

  it('shows the selected field settings', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    expect(inspector().getByLabelText('Label')).toHaveValue('Text 1');
    expect(inspector().getByLabelText('Name')).toHaveValue('text_1');
  });
});

describe('inspector: editing', () => {
  it('updates only the selected field', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    await add(user, 'Email'); // Email 1 is selected
    await setValue(user, inspector().getByLabelText('Label'), 'Work email');

    expect(screen.getByText('Work email')).toBeInTheDocument();
    expect(screen.getByText(/Text 1/)).toBeInTheDocument(); // untouched
    expect(screen.queryByText('Email 1')).not.toBeInTheDocument();
  });

  it('toggles required and shows it on the card', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    await user.click(inspector().getByLabelText('Required'));
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('clears an optional property when the input is emptied', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    const placeholder = inspector().getByLabelText('Placeholder');
    await setValue(user, placeholder, 'Jane');
    expect(placeholder).toHaveValue('Jane');
    await setValue(user, placeholder, '');
    expect(placeholder).toHaveValue('');
  });
});

describe('inspector: field-specific controls', () => {
  it('shows length controls for text, but not for checkbox', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    expect(inspector().getByLabelText('Min length')).toBeInTheDocument();
    expect(inspector().getByLabelText('Placeholder')).toBeInTheDocument();

    await add(user, 'Checkbox');
    expect(inspector().queryByLabelText('Min length')).not.toBeInTheDocument();
    expect(inspector().queryByLabelText('Max length')).not.toBeInTheDocument();
    expect(inspector().queryByLabelText('Placeholder')).not.toBeInTheDocument();
  });

  it('shows the options editor only for select', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    expect(inspector().queryByRole('group', { name: 'Option 1' })).not.toBeInTheDocument();
    await add(user, 'Select');
    expect(inspector().getByRole('group', { name: 'Option 1' })).toBeInTheDocument();
    expect(inspector().getByRole('group', { name: 'Option 2' })).toBeInTheDocument();
  });
});

describe('inspector: validation', () => {
  it('shows an inline error for an invalid name and clears it when fixed', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    const name = inspector().getByLabelText('Name');
    await setValue(user, name, 'Bad Name');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(inspector().getByText(/Use lowercase letters, numbers and underscores/)).toBeInTheDocument();
    expect(screen.getByText('Needs attention')).toBeInTheDocument();

    await setValue(user, name, 'good_name');
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Needs attention')).not.toBeInTheDocument();
  });

  it('shows a required-label error for an empty label', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    await setValue(user, inspector().getByLabelText('Label'), '');
    expect(inspector().getByText('Error: Label is required')).toBeInTheDocument();
  });

  it('flags duplicate names on both fields', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text'); // text_1
    await add(user, 'Text'); // text_2, selected
    await setValue(user, inspector().getByLabelText('Name'), 'text_1');
    expect(screen.getAllByText('Needs attention')).toHaveLength(2);
    expect(screen.getAllByText(/is used by more than one field/).length).toBeGreaterThan(0);
  });

  it('flags min length greater than max length', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    await user.type(inspector().getByLabelText('Max length'), '5');
    await user.type(inspector().getByLabelText('Min length'), '10');
    expect(inspector().getByText(/Min length cannot be greater than max length/)).toBeInTheDocument();
  });

  it('adds, edits and removes select options and flags duplicate values', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Select');
    await user.click(inspector().getByRole('button', { name: 'Add option' }));
    expect(inspector().getByRole('group', { name: 'Option 3' })).toBeInTheDocument();

    await setValue(user, inspector().getByLabelText('Option 2 value'), 'option_1');
    expect(inspector().getAllByText(/is used more than once/).length).toBe(2);

    await user.click(inspector().getByRole('button', { name: 'Remove option 2' }));
    expect(inspector().queryByText(/is used more than once/)).not.toBeInTheDocument();
  });

  it('blocks publishing a select with no options', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Select');
    await user.click(inspector().getByRole('button', { name: 'Remove option 2' }));
    await user.click(inspector().getByRole('button', { name: 'Remove option 1' }));
    expect(inspector().getByText('Error: Add at least one option before publishing')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fix 1 issue before publishing/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('lists issues in the summary and jumps to the field', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await add(user, 'Text');
    await add(user, 'Email');
    await setValue(user, inspector().getByLabelText('Name'), 'BAD');
    await user.click(screen.getByRole('button', { name: /Position 1 of 2/ })); // select the other field
    await user.click(screen.getByRole('button', { name: /Go to Email 1/ }));
    expect(inspector().getByLabelText('Name')).toHaveValue('BAD');
  });

  it('reports an empty form as not publishable', () => {
    renderBuilder();
    expect(screen.getByText(/Add at least one field before publishing/)).toBeInTheDocument();
  });

  it('shows a title error when the title is empty', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await setValue(user, screen.getByLabelText('Form title'), '');
    expect(screen.getByText('Error: Title is required')).toBeInTheDocument();
  });
});
