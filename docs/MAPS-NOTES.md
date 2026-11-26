QR works only if user within coordinate of venue.
## Venue layout (event map)

The `/event-map` zones, parking, walking paths and sterile lines come from
`src/features/event-map-hifi/venue-layout.json`, drawn in [geojson.io](https://geojson.io).
Edit it there and save over the file. `venueLayout.ts` classifies shapes by their `name`
(see the comment at the top of that file), so keep the naming conventions.

Sidebar entries are built in `mapLocations.ts`: event/competition zones listed in `ZONE_CONTENT`
(summary + links to their `/event` or `/competition` page), plus one entry per parking and
toilet polygon, described by the nearest listed zone. A new zone only shows up in the sidebar
once it has an entry in `ZONE_CONTENT`; its id is the slugged zone name (e.g. "Play Tech" ->
`play-tech`).

- `event area` is never drawn. It is the boundary for the live count of people still inside
  the event.
- Special guest parking is visible to everyone for now. It may later be limited to users with a
  special-guest role. Hiding it in the client is cosmetic, so if those locations must stay
  private, serve them from a role-checked API instead of the bundled JSON.
