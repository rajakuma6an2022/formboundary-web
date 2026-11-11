# ADR 0007: Reordering with dnd-kit, plus explicit move buttons

Status: accepted

## Decision

- dnd-kit `DndContext` + `SortableContext` (vertical list, `closestCenter`).
- Sensors: `PointerSensor` (activation distance 5px so a click stays a click) and `KeyboardSensor`
  with `sortableKeyboardCoordinates`.
- The sortable id is the field's stable `id`, never the array index.
- The drag handle is its own button. Clicking the card body only selects the field.
- A drop is converted to a reducer action by `computeMove(fields, activeId, overId)`; dropping outside or
  onto itself changes nothing.
- Every card also has "Move up" / "Move down" buttons: a non-drag alternative (WCAG 2.2, dragging movements).
- Announcements: custom dnd-kit announcements (pick up, over, drop, cancel) plus screen reader instructions.
- Selection never follows a move. After a button move, focus stays on the moved card.

## Consequences

- Keyboard path is tested in jsdom with mocked layout. Real pointer dragging needs an E2E test (Day 16-18).
- Two live regions exist (ours and dnd-kit's), so tests read both via `liveText()`.

## Interview line

"Drag is an enhancement, not the only way: the same reducer action is reachable from the pointer, the keyboard and plain buttons."
