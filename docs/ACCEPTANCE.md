# Acceptance checklist

## MVP acceptance
- [ ] Unauthenticated user cannot access builder or private forms; logout invalidates the session
- [ ] Owner sees only owned forms; loading / empty / error states complete
- [ ] Text, email, textarea, select, checkbox work; selected field is configurable
- [ ] Invalid configuration cannot be saved or published
- [ ] Preview matches saved schema; no eval, no arbitrary executable content
- [ ] Refresh offers Restore or Discard; invalid local draft is never silently applied
- [ ] Malformed or unsupported JSON never overwrites the current valid editor state
- [ ] Only published forms are public; submissions validated on server
- [ ] Owner can view own submissions; another user cannot

## Definition of done
- [ ] Create, configure, reorder, preview, save and reopen a form
- [ ] Five field types validate consistently
- [ ] Keyboard users can add, select, reorder; focus visible and announced
- [ ] Refresh recovery works; corrupted or old local draft cannot overwrite valid state
- [ ] JSON import/export versioned, validated, safe
- [ ] Ownership enforced; public route exposes only published forms
- [ ] Public submissions server-validated and owner-visible; unauthorized tests pass
- [ ] Critical UI / API / E2E tests pass; manual accessibility pass documented
- [ ] Production deployment with HTTPS, correct cookies / proxy / CORS, no leaked secrets
- [ ] README, demo video, architecture diagram, measurements, known limitations complete
