# ADR 0006: Reducer rejects structural errors, accepts values still being typed

Status: accepted

## Context

The inspector edits state on every keystroke. If the reducer refused an empty label or a duplicate
name, the input could not show what the user typed, and the user could not see why.

## Decision

- The reducer REJECTS (returns the same state object) anything that breaks structure: unknown id,
  duplicate id or name on add, changing `id` or `type`, a property the field type does not have,
  out-of-range index.
- The reducer ACCEPTS values that are merely invalid while typing (empty label, duplicate name,
  min greater than max). `validateDefinition()` reports them next to the control.
- Saving and publishing are blocked while `validateDefinition()` / `validateForPublish()` return issues.
- Draft may be saved with zero fields or a select without options. Publishing requires at least one
  field and at least one option per select.
- `placeholder` exists on text, email, textarea and select, not on checkbox. Min/max length exists on
  text, email and textarea only. The Zod schemas are strict, so unknown properties are errors.

## Consequences

- Every reducer branch is easy to unit test (same reference means rejected or no-op).
- Validation lives in one place (schema.ts) and is reused by import (Day 11) and the API (Day 12).

## Interview line

"Reducer protects structure, schema validation protects meaning. That keeps typing smooth and still stops bad data at save, import and publish."
