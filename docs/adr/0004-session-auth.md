# ADR 0004: Server-side sessions in an HttpOnly cookie

Status: accepted

## Decision
- Passwords hashed with Argon2.
- Session = random 32-byte token. Only its SHA-256 hash is stored in MongoDB.
- Cookie: HttpOnly, Secure (production), SameSite=Lax, Path=/, 24 hour expiry. Rotated on login.
- CSRF: per-session token sent in `X-CSRF-Token` for every mutation, plus Origin check.
- CORS: exact origin, credentials only for that origin.

## Consequences
- No JWT in localStorage (XSS cannot read the cookie).
- Logout truly revokes the session (server deletes it).
- HttpOnly does not stop XSS itself, so no raw HTML rendering anywhere.

## Interview line
"I store only a hash of the session token, so a database leak does not leak usable sessions."
