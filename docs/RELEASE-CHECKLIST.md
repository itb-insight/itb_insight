## Main Features & Components
1. [x] Fill-in all informational surfaces:
	- [x] a. Events
	- [x] b. Competitions
	- [x] c. Landing page timeline
	- [x] d. Headers and Footers
2. [x] Set interactive map into coming soon.
3. [ ] User admin/ restrict
4. [ ] Secure account creation and signing in
5. [x] Personal QR-code
6. [ ] Feedback (and config)
7. Optimized load and build?
8. [ ] The RSVP flow
9. [ ] Tracking
	- [ ] PostHog env vars on Production (key, region, project id, `query:read` key)
	- [ ] Migrations 0015–0017 applied to production (export `analytics_events` first if wanted)
	- [ ] `/admin` numbers checked against PostHog on production
	- [ ] Booth `lat`/`lng` filled; venue field test done; `presence_radius_m` / `BOOTH_MAX_ACCURACY_M` tuned; burst kept or turned off
	- [ ] `PRESENCE_TEST_MODE` off in Production after testing
	- [ ] D-day rehearsal: check in, scan, wander; someone watches `/admin`
10. [ ] Load test
11. [ ] CI tests
12. [x] The ITB-Model Fallback



PASS 1: Secure surfaces
PASS 2: Discuss backups e.g. if QR didn't generate

## Post-Release
Migrate competition data
ThreeJS
Interactive part of the website
Find other optimization surfaces
Dashboard information
Email notification system
[ ] Optimized location tracking & permissions
[ ] Delete booth presence data within 30 days after the event (SQL in docs/analytics/06-dday-presence.md)