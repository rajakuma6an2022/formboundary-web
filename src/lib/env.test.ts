import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('accepts a valid API url', () => {
    expect(parseEnv({ VITE_API_URL: 'http://localhost:4000' }).VITE_API_URL).toBe(
      'http://localhost:4000',
    );
  });

  it('rejects a missing or invalid API url', () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_URL/);
    expect(() => parseEnv({ VITE_API_URL: 'localhost' })).toThrow(/VITE_API_URL/);
  });
});
