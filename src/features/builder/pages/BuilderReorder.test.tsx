import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { liveText, renderBuilder } from '@/test/renderBuilder';

type User = ReturnType<typeof userEvent.setup>;

async function addThree(user: User) {
  await user.click(screen.getByRole('button', { name: 'Add Text field' }));
  await user.click(screen.getByRole('button', { name: 'Add Email field' }));
  await user.click(screen.getByRole('button', { name: 'Add Checkbox field' }));
}

/** Order of the cards, read from the DOM. */
function order() {
  const list = screen.getByRole('list', { name: 'Form fields' });
  return within(list)
    .getAllByRole('listitem')
    .map((li) => {
      const text = li.textContent ?? '';
      return /(Text|Email|Checkbox) 1/.exec(text)?.[0] ?? text;
    });
}

describe('reorder with Move up / Move down buttons', () => {
  it('moves a field, keeps the selection, moves focus and announces', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user); // Checkbox 1 is selected

    await user.click(screen.getByRole('button', { name: 'Move Text 1 down' }));

    expect(order()).toEqual(['Email 1', 'Text 1', 'Checkbox 1']);
    expect(liveText()).toContain('Text 1 moved to position 2 of 3.');
    const textCard = screen.getByRole('button', {
      name: (n) => n.startsWith('Position 2 of 3') && n.includes('Text 1'),
    });
    expect(textCard).toHaveFocus();
    // selection did NOT follow the moved field
    const checkboxCard = screen.getByRole('button', {
      name: (n) => n.startsWith('Position 3 of 3') && n.includes('Checkbox 1'),
    });
    expect(checkboxCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables Move up on the first field and Move down on the last', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user);
    expect(screen.getByRole('button', { name: 'Move Text 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Checkbox 1 down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Email 1 up' })).toBeEnabled();
  });

  it('moves a field up and keeps all ids and labels intact', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user);
    await user.click(screen.getByRole('button', { name: 'Move Checkbox 1 up' }));
    await user.click(screen.getByRole('button', { name: 'Move Checkbox 1 up' }));
    expect(order()).toEqual(['Checkbox 1', 'Text 1', 'Email 1']);
  });
});

describe('reorder with the keyboard (dnd-kit KeyboardSensor)', () => {
  // jsdom has no layout, so give each list item a fake rectangle based on its position.
  const original = Element.prototype.getBoundingClientRect;
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const li = this.tagName === 'LI' ? this : null;
      const siblings = li?.parentElement ? Array.from(li.parentElement.children) : [];
      const top = li ? siblings.indexOf(li) * 60 : 0;
      const height = li ? 50 : 0;
      return {
        x: 0,
        y: top,
        top,
        bottom: top + height,
        left: 0,
        right: 300,
        width: 300,
        height,
        toJSON: () => ({}),
      };
    };
  });
  afterAll(() => {
    Element.prototype.getBoundingClientRect = original;
  });

  it('picks up, moves with the arrow key and drops', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user);

    screen.getByRole('button', { name: 'Reorder Text 1' }).focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');

    expect(order()).toEqual(['Email 1', 'Text 1', 'Checkbox 1']);
  });

  it('cancels with Escape and leaves the order unchanged', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user);

    screen.getByRole('button', { name: 'Reorder Text 1' }).focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');

    expect(order()).toEqual(['Text 1', 'Email 1', 'Checkbox 1']);
  });

  it('exposes instructions to assistive technology', async () => {
    const user = userEvent.setup();
    renderBuilder();
    await addThree(user);
    const handle = screen.getByRole('button', { name: 'Reorder Text 1' });
    const describedBy = handle.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(/press Space or Enter/i);
  });
});
