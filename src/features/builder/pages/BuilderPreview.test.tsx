import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderBuilder } from '@/test/renderBuilder';

type User = ReturnType<typeof userEvent.setup>;

async function addText(user: User) {
  await user.click(screen.getByRole('button', { name: 'Add Text field' }));
}

describe('preview mode', () => {
  it('renders the current schema without the palette or inspector', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    await user.clear(screen.getByLabelText('Form title'));
    await user.type(screen.getByLabelText('Form title'), 'Survey');
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByRole('heading', { name: 'Survey', level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText('Text 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Text field' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Field settings' })).not.toBeInTheDocument();
  });

  it('moves focus into the preview, and back to the Preview button on return', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('heading', { name: 'Preview' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Back to editor' }));
    expect(screen.getByRole('button', { name: 'Preview' })).toHaveFocus();
  });

  it('keeps the builder schema unchanged by what is typed in the preview', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    await user.type(screen.getByLabelText('Text 1'), 'typed in preview');
    await user.click(screen.getByRole('button', { name: 'Back to editor' }));

    const inspector = within(screen.getByRole('complementary', { name: 'Field settings' }));
    expect(inspector.getByLabelText('Label')).toHaveValue('Text 1');
    expect(inspector.getByLabelText('Placeholder')).toHaveValue('');
    expect(screen.getByRole('list', { name: 'Form fields' })).toBeInTheDocument();
  });

  it('reflects the latest edits each time preview opens', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    await user.click(screen.getByRole('button', { name: 'Back to editor' }));

    const label = within(screen.getByRole('complementary', { name: 'Field settings' })).getByLabelText('Label');
    await user.clear(label);
    await user.type(label, 'Your name');
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
  });

  it('disables Preview while the form has errors', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    const label = within(screen.getByRole('complementary', { name: 'Field settings' })).getByLabelText('Label');
    await user.clear(label);
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  it('can preview an empty form (publishing is blocked, previewing is not)', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('heading', { name: 'Untitled form', level: 2 })).toBeInTheDocument();
  });

  it('validates inside the preview and shows a preview-only success message', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addText(user);
    await user.click(
      within(screen.getByRole('complementary', { name: 'Field settings' })).getByLabelText('Required'),
    );
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Error: Text 1 is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Text 1/), 'hello');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Preview only: nothing was saved or sent.')).toBeInTheDocument();
  });
});
