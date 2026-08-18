schema_version: 2

# Release checklist

1. Review the intended diff and confirm no runtime/config/migration changes are undocumented.
2. Run the available checks as appropriate: `npm run lint` and `npm run build`.
3. Verify current routes and claims against [MVP-STATUS.md](../MVP-STATUS.md); do not release a public/demo `/admin` as secure operations.
4. If Supabase is configured, use a non-production environment for mutation checks; keep the service-role key server-only.
5. Do not claim payment verification, Midtrans operation, secure admin review/check-in/export, or durable analytics until implemented and tested.
6. Record release-relevant decisions in [DECISIONS.md](../DECISIONS.md), release notes in [RELEASES.md](../RELEASES.md), and follow-up in [BACKLOG.md](../BACKLOG.md).
