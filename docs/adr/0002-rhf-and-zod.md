# ADR 0002: React Hook Form + Zod, validated on both sides

Status: accepted

## Context

Preview and public form need runtime validation. Types alone do not exist at runtime.

## Decision

RHF manages the input lifecycle. Zod validates at runtime and infers TypeScript types.
The API validates again with Zod. Client validation is UX only; the server is the authority.

## Consequences

- Validation rules generated from the schema, not hand-written per screen.
- Two validators (web + API) must stay consistent. Tests on both sides cover this.

## Interview line

"Never trust the client: the browser validates for UX, the server validates for correctness."
