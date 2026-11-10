# Baseline status board (Day 1)

Legend: DONE / PARTIAL / NOT STARTED

| Area                         | Web         | API         | Notes     |
| ---------------------------- | ----------- | ----------- | --------- |
| Repository + tooling         | NOT STARTED | NOT STARTED | Day 3     |
| Zod schemas + reducer        | NOT STARTED | n/a         | Day 4     |
| Palette + canvas             | NOT STARTED | n/a         | Day 5     |
| Inspector                    | NOT STARTED | n/a         | Day 6     |
| Drag and drop                | NOT STARTED | n/a         | Day 7     |
| Preview renderer             | NOT STARTED | n/a         | Day 8     |
| RHF + Zod validation         | NOT STARTED | NOT STARTED | Day 9     |
| Draft save / recovery        | NOT STARTED | NOT STARTED | Day 10    |
| JSON import / export         | NOT STARTED | n/a         | Day 11    |
| Form persistence API         | n/a         | NOT STARTED | Day 12    |
| Auth + sessions              | NOT STARTED | NOT STARTED | Day 13    |
| Ownership + publish          | NOT STARTED | NOT STARTED | Day 14    |
| Public form + submissions    | NOT STARTED | NOT STARTED | Day 15    |
| Tests / a11y / perf / deploy | NOT STARTED | NOT STARTED | Day 16-18 |

## Blockers

- None known. Need MongoDB Atlas cluster with databases `formboundary` and `formboundary_test` (Day 3).

## Next commit

Day 2: architecture decisions (ADRs) and the schema + API contract.

## Day 4 update

Zod schemas, validation (save + publish rules), field factory and reducer done with unit tests.
ADR 0006 records the reject-vs-accept rule. Builder UI starts Day 5.

## Day 5 update
Palette, canvas, empty state, select/add/remove, focus management and live announcements done.
Builder state is in memory only (persistence on Day 10 and Day 12). Inspector is Day 6.
