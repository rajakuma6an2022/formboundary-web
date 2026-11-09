# ADR 0003: Form schema is data, never code

Status: accepted

## Context

The same schema drives editor, preview, public renderer, persistence and import/export.

## Decision

The schema is plain JSON validated by a versioned Zod schema (`schemaVersion`).
Fields use a discriminated union on `type`. No eval, no Function constructor, no HTML or JS in schema.
Unknown field types render a safe fallback, never executable output.

## Consequences

- Safe to import from untrusted files.
- Adding a field type requires a type, a Zod member, a renderer and tests (compiler flags missing cases).

## Interview line

"Discriminated union: the type decides which properties are legal, and the compiler tells me which renderer is missing."
