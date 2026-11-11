import type { Announcements } from '@dnd-kit/core';
import type { FormField } from './types';

export type Move = { id: string; toIndex: number };

/**
 * Turns a drag result (active id + over id) into a reducer move.
 * Returns null when nothing should change: dropped outside, onto itself, or unknown ids.
 * IDs are compared, never DOM positions, so the result does not depend on rendering.
 */
export function computeMove(
  fields: readonly FormField[],
  activeId: string | number,
  overId: string | number | null | undefined,
): Move | null {
  if (overId === null || overId === undefined) return null;
  const from = fields.findIndex((f) => f.id === activeId);
  const to = fields.findIndex((f) => f.id === overId);
  const moving = fields[from];
  if (!moving || to === -1 || from === to) return null;
  return { id: moving.id, toIndex: to };
}

export const SCREEN_READER_INSTRUCTIONS =
  'To pick up a field, press Space or Enter on its reorder handle. Use the Up and Down arrow keys to move it. ' +
  'Press Space or Enter again to drop it, or Escape to cancel.';

/** Live-region messages for drag start / over / drop / cancel. Positions are 1-based. */
export function buildAnnouncements(fields: readonly FormField[]): Announcements {
  const total = fields.length;
  const labelOf = (id: string | number) => {
    const label = fields.find((f) => f.id === id)?.label.trim();
    return label ? label : 'Field';
  };
  const positionOf = (id: string | number) => fields.findIndex((f) => f.id === id) + 1;

  return {
    onDragStart({ active }) {
      return `Picked up ${labelOf(active.id)}. It is at position ${positionOf(active.id)} of ${total}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return `${labelOf(active.id)} is not over a drop position.`;
      return `${labelOf(active.id)} is over position ${positionOf(over.id)} of ${total}.`;
    },
    onDragEnd({ active, over }) {
      if (!over || over.id === active.id) {
        return `${labelOf(active.id)} was dropped. It stays at position ${positionOf(active.id)} of ${total}.`;
      }
      return `${labelOf(active.id)} was moved to position ${positionOf(over.id)} of ${total}.`;
    },
    onDragCancel({ active }) {
      return `Reordering cancelled. ${labelOf(active.id)} is back at position ${positionOf(active.id)} of ${total}.`;
    },
  };
}
