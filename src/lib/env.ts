import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url({ message: 'VITE_API_URL must be a full URL like http://localhost:4000' }),
});

export type WebEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): WebEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid web environment: ${problems}`);
  }
  return result.data;
}

let cached: WebEnv | undefined;

/** Lazy + memoized: validated once at app startup (see main.tsx), never at import time. */
export function getEnv(): WebEnv {
  cached ??= parseEnv(import.meta.env);
  return cached;
}
