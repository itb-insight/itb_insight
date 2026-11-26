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

### Filter tabs, search and the mobile sheet

- Tabs (`src/features/event-map-hifi/mapFilters.ts`): Competition = Drone Soccer, Olympiad + BPC;
  Exhibition = Stage, Drone Soccer, Play Tech, Seminar + Showtech, Exhibition (+ Booth/Megaprop
  categories); Amenities = parking, toilets, Food & Beverages, Mushola. Paths, exits, landmarks,
  Main Gate and sterile areas show on every tab. New event zones need an entry in `ZONE_TABS`.
- Search (`mapSearch.ts`) matches every typed word against name, description, category (plus its
  `keywords` in `mapCategories.ts`) and linked page names, within the active tab.
- The map only moves on **Navigate**. Opening a place highlights its pin without moving the map.
- Mobile bottom sheet (`sheetSnap.ts`): drag the handle; it snaps to shut (44px), half
  (360px, max 60% of the map) or full (up to the navbar). A flick goes to the next snap; a tap
  cycles shut → half → full → half.
- "Exits & Gates" lists every `Exit` point and every polygon/point whose name contains gate,
  gerbang, entrance or entry, described by the side of the event area it is on. It shows on every
  tab. To add a gate, draw it in geojson.io with such a name.
- Public parking titles drop the vehicle words: "public parking (Parkir Seni Rupa (motorcycles
  and car))" shows as "Parkir Seni Rupa" with motorcycle and car icons (`PlaceName.tsx`, icons in
  `CategoryIcons.tsx`).
- The points named `BL` (bottom-left) and `TR` (top-right) set the rectangle the map may show
  (MapLibre `maxBounds`): users can't pan or zoom out past it. They are not drawn. Move them in
  geojson.io to change the limit.
