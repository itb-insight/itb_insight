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

  it('replaces every upcoming event location with "To be Announced" when on', async () => {
    vi.stubEnv('EVENTS_LOCATION_TBA', 'true')
    const events = (await getEvents()).filter((e) => e.status !== 'done')
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) expect(e.location).toBe('To be Announced')

    const details = (await getAllEventDetails()).filter((d) => !d.done)
    expect(details.length).toBeGreaterThan(0)
    for (const d of details) {
      expect(d.facts.venue).toBe('To be Announced')
      expect(d.card.where).toBe('To be Announced')
    }
    const one = await getEventDetail(details[0].slug)
    expect(one?.facts.venue).toBe('To be Announced')
  })

  it('keeps the real location of events that already took place', async () => {
    vi.stubEnv('EVENTS_LOCATION_TBA', 'true')
    const done = (await getEvents()).filter((e) => e.status === 'done')
    expect(done.length).toBeGreaterThan(0)
    for (const e of done) expect(e.location).not.toBe('To be Announced')

    const doneDetails = (await getAllEventDetails()).filter((d) => d.done)
    expect(doneDetails.length).toBeGreaterThan(0)
    for (const d of doneDetails) {
      expect(d.facts.venue).not.toBe('To be Announced')
      expect(d.card.where).not.toBe('To be Announced')
    }
  })
})
