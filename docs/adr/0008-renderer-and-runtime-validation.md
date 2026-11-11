# ADR 0008: One schema-driven renderer, answer validation generated from the schema

Status: accepted

## Decision

- `FieldRenderer` is a single `switch` over the field type. A new field type without a case is a compile error.
  An unknown type found at runtime renders a safe text note, never markup or code.
- `FormRenderer` renders title, description and fields only from a form definition. The preview and the
  public form use the same component.
- The renderer is presentational. A field's react-hook-form `register()` result is passed in as a
  structural `registration` prop, so the renderer does not import form libraries.
- Answer validation (Day 9) is generated from the same definition (`buildAnswersSchema`). It is for fast
  feedback only. The API re-validates against the STORED published schema and is the authority.
- Rules (web and API must match): values are trimmed first; required means non-empty after trimming;
  min/max length apply to the trimmed value and only when it is not empty; email uses `z.email()`;
  a select value must be one of the configured option values; a required checkbox must be checked.
- `FormRenderer` refuses to render a definition that fails `formDefinitionSchema`.

## Consequences

- Adding a field type touches: types, Zod field schema, renderer case, answer rule, tests. The compiler lists the gaps.
- Preview answers live in the preview form only and never change the builder schema.

## Interview line

"The same schema describes the form, draws it, and validates the answers. The browser checks for UX, the server checks for truth."
