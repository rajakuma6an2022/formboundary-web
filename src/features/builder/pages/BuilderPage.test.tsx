import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { liveText, renderBuilder } from '@/test/renderBuilder';
import { FIELD_TYPES, FIELD_TYPE_LABELS } from '../types';

function fieldCard(label: string) {
  // The select-button's accessible name starts with its position; the Remove button's does not.
  return screen.getByRole('button', {
    name: (name) => name.startsWith('Position') && name.includes(label),
  });
}

function fieldList() {
  return screen.queryByRole('list', { name: 'Form fields' });
}

describe('builder palette and canvas', () => {
  it('shows the empty state and all five palette buttons', () => {
    renderBuilder();
    expect(screen.getByText('No fields yet')).toBeInTheDocument();
    for (const type of FIELD_TYPES) {
      expect(screen.getByRole('button', { name: `Add ${FIELD_TYPE_LABELS[type]} field` })).toBeInTheDocument();
    }
  });

  it.each(FIELD_TYPES)('adds a %s field', async (type) => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole('button', { name: `Add ${FIELD_TYPE_LABELS[type]} field` }));
    const list = fieldList();
    expect(list).not.toBeNull();
    expect(within(list!).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('No fields yet')).not.toBeInTheDocument();
  });

  it('selects the new field, moves focus to it and announces it', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole('button', { name: 'Add Text field' }));
    const card = fieldCard('Text 1');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveFocus();
    expect(liveText()).toContain('Text field added at position 1 of 1.');
  });

  it('gives repeated fields unique names', async () => {
    const user = userEvent.setup();
    renderBuilder();
    const add = screen.getByRole('button', { name: 'Add Text field' });
    await user.click(add);
    await user.click(add);
    expect(screen.getByText(/name: text_1/)).toBeInTheDocument();
    expect(screen.getByText(/name: text_2/)).toBeInTheDocument();
  });

  it('changes the selected field when another card is clicked', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole('button', { name: 'Add Text field' }));
    await user.click(screen.getByRole('button', { name: 'Add Email field' }));
    const text = fieldCard('Text 1');
    const email = fieldCard('Email 1');
    expect(email).toHaveAttribute('aria-pressed', 'true');
    await user.click(text);
    expect(text).toHaveAttribute('aria-pressed', 'true');
    expect(email).toHaveAttribute('aria-pressed', 'false');
  });

  it('removes a field, selects its neighbour, and returns to the empty state', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole('button', { name: 'Add Text field' }));
    await user.click(screen.getByRole('button', { name: 'Add Email field' }));
    await user.click(screen.getByRole('button', { name: 'Remove Email 1' }));
    expect(fieldCard('Text 1')).toHaveAttribute('aria-pressed', 'true');
    expect(fieldCard('Text 1')).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove Text 1' }));
    expect(screen.getByText('No fields yet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Form canvas' })).toHaveFocus();
  });

  it('edits the form title', async () => {
    const user = userEvent.setup();
    renderBuilder();
    const title = screen.getByLabelText('Form title');
    await user.clear(title);
    await user.type(title, 'Customer survey');
    expect(title).toHaveValue('Customer survey');
  });
});
