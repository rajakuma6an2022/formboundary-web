# ADR 0005: JSON import is parse, validate, preview, confirm, atomic apply

Status: accepted

## Decision
1. Enforce a file size limit before reading.
2. `JSON.parse` inside try/catch.
3. Validate with the versioned Zod schema (reject unsupported `schemaVersion`).
4. Show summary and preview.
5. Only after explicit confirmation dispatch ONE replace action.

## Consequences
- An invalid import never dispatches anything, so current state and stored draft stay untouched.

## Interview line
"Invalid input never reaches the reducer, so data loss is impossible by construction."
