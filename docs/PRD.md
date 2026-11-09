# FormBoundary: Product Requirements (v1)

## Pitch
FormBoundary is a schema-driven form builder. A signed-in user creates a form by adding
and configuring fields, previews it, saves a draft, imports/exports a versioned JSON schema,
publishes a public form and reviews submissions.

## Problem
Small teams need a simple way to collect structured input without writing code, and without
risking invalid or tampered data reaching their records.

## Core flows
1. Register / sign in / sign out.
2. Dashboard: list, create, rename, delete forms.
3. Builder: add field (text, email, textarea, select, checkbox), configure, reorder (mouse + keyboard), remove.
4. Preview: the same renderer as the public form.
5. Draft safety: server save + versioned local draft with Restore / Discard.
6. JSON export / import with validation and confirmation.
7. Publish to a stable public slug; unpublish.
8. Public form: anyone can submit; the server validates every answer.
9. Owner views submissions for own forms only.

## Field types (exactly five)
text, email, textarea, select, checkbox.

## Non-goals (not in this version)
Conditional logic, formulas, file uploads, signature, payments, email notifications,
roles / workspaces / billing / analytics, rich text or HTML fields, custom scripts,
real-time collaboration, Docker, GraphQL, micro-frontends, extra state libraries.

## State ownership
- Builder configuration: one useReducer.
- Input values (preview + public): React Hook Form.
- Server data (forms, submissions): TanStack Query.
- localStorage: only a versioned recoverable draft snapshot.

## Security principles
- Browser never decides ownership; API derives userId from the session.
- Schema is data, never executed.
- Server re-validates every submission against the stored published schema.

## Success
All items in docs/ACCEPTANCE.md are checked and the 2-minute demo can be recorded.
