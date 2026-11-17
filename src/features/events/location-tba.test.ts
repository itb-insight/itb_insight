import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getEvents } from '@/features/events/data'
import { getAllEventDetails, getEventDetail } from '@/features/events/details'

afterEach(() => vi.unstubAllEnvs())

describe('EVENTS_LOCATION_TBA', () => {
  it('keeps the real locations when off', async () => {
    vi.stubEnv('EVENTS_LOCATION_TBA', 'false')
    const events = await getEvents()
    expect(events.some((e) => e.location !== 'To be Announced')).toBe(true)
    const details = await getAllEventDetails()
    expect(details.some((d) => d.facts.venue !== 'To be Announced')).toBe(true)
  })

  it('replaces every event location with "To be Announced" when on', async () => {
    vi.stubEnv('EVENTS_LOCATION_TBA', 'true')
    const events = await getEvents()
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) expect(e.location).toBe('To be Announced')

    const details = await getAllEventDetails()
    expect(details.length).toBeGreaterThan(0)
    for (const d of details) {
      expect(d.facts.venue).toBe('To be Announced')
      expect(d.card.where).toBe('To be Announced')
    }
    const one = await getEventDetail(details[0].slug)
    expect(one?.facts.venue).toBe('To be Announced')
  })
})
