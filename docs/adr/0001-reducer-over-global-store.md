# ADR 0001: useReducer for builder state (no global store)

Status: accepted

## Context

The builder has related transitions: add, update, remove, move, select, rename.

## Decision

One `useReducer` owns the field array, selection and editor actions. No Redux, Zustand or
extra Context for the same state.

## Consequences

- Every transition is an explicit action, so the reducer is a pure function and unit-testable.
- Server data stays in TanStack Query. Input values stay in React Hook Form.
- If many distant components need the state later, wrap the reducer in one Context. Do not add a second store.

## Interview line

"One owner per kind of state. Reducer for builder config, Query for server data, RHF for inputs."
