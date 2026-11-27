# Analytics known gaps

What the numbers can't tell you. Say so when you report them.

1. **Presence is a sample, not a headcount.** Browsers give location only while the page is open
   and the screen is on, and only for visitors who opted in. A phone in a pocket stops reporting.
   QR scans and gate check-ins are the complete counts.
2. **GPS can't separate neighbouring booths.** Accuracy is about 5–20 m outdoors and worse indoors.
   Booths closer than their radii cross-match; tune `presence_radius_m` and
   `BOOTH_MAX_ACCURACY_M` in a field test. Burst sampling is experimental.
3. **Presence can be faked**, so it never awards points.
4. **Venue time** ends at a visitor's last scan or ping, which is earlier than when they left.
   Visitors with nothing after check-in are reported as unknown.
5. **PostHog counts browsers, not people.** No `identify()`: one person on two devices is two
   visitors; clearing storage makes a new one. Ad blockers that block our own `/ingest` path, and
   visitors whose browser never loads the SDK, are not counted.
6. **Sampled events** (`scroll_depth`, `section_impression`) are estimates once scaled up.
7. **One PostHog project for every environment.** Production `/admin` filters on `app_env`; in
   PostHog's own UI, add that filter yourself.
8. **Figures lag**: up to 5 minutes for history panels, 30 seconds for live ones.
9. **No push yet.** Feedback prompts and presence need the site open; see `docs/FEEDBACK.md` and the
   PWA notes in `CLAUDE.md`.
