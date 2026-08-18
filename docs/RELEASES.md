schema_version: 2

# Releases

## Unreleased

- Adopted `PRD(v1.0).md` as final public product intent on 2026-08-19, reconciled derived canonical documents, and normalized Markdown naming guidance. This is documentation-only and not deployed, committed, or merged.
- Consolidated documentation authority on 2026-08-19: current implementation, approved milestones, future scope, and reference inputs are explicitly separated.
- Recorded that `/admin` remains public/demo/mock, payments remain schema-only, and analytics ingest remains volatile with mock dashboard metrics.

## Release record template

```markdown
## YYYY-MM-DD
### Changed
- …
### Verification
- `npm run lint` — pass/fail/skipped with reason
- `npm run build` — pass/fail/skipped with reason
- Manual checks — environment and result
```

Use only commands defined in `package.json`; currently `dev`, `build`, `start`, and `lint` are available.
