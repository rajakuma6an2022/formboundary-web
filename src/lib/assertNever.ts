/** Compile-time exhaustiveness check: if a union member is not handled, TypeScript errors here. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
