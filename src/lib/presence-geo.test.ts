import { describe, expect, it } from 'vitest'

import { distanceM } from './geofence'
import { combineFixes, inZone, nearestBooth, type PresenceBooth } from './presence-geo'

// ITB Ganesha, roughly. 0.0001° of latitude ≈ 11 m.
const ORIGIN = { lat: -6.8915, lng: 107.6107 }
const at = (dLat: number, dLng: number, accuracyM: number) => ({ lat: ORIGIN.lat + dLat, lng: ORIGIN.lng + dLng, accuracyM })

describe('presence geometry', () => {
  it('counts a fix in a zone when its accuracy circle overlaps it', () => {
    const zone = { ...ORIGIN, radiusM: 50 }
    expect(inZone(zone, at(0.0004, 0, 5))).toBe(true) // ~44 m
    expect(inZone(zone, at(0.0006, 0, 5))).toBe(false) // ~67 m
    expect(inZone(zone, at(0.0006, 0, 20))).toBe(true) // ~67 m, but ±20 m reaches the edge
  })

  it('drops imprecise fixes, and returns null when none is precise enough', () => {
    expect(combineFixes([at(0, 0, 40), at(0, 0, 60)], 25)).toBeNull()
    expect(combineFixes([at(0, 0, 10), at(0.001, 0, 60)], 25)).toMatchObject({ used: 1, spreadM: 0 })
  })

  it('drops a multipath outlier from a burst and averages the rest', () => {
    const burst = [
      at(0.00001, 0, 8),
      at(-0.00001, 0, 8),
      at(0, 0.00001, 8),
      at(0, -0.00001, 8),
      at(0.00002, 0, 8),
      at(-0.00002, 0, 8),
      at(0, 0.00002, 8),
      at(0.0009, 0, 8), // ~100 m off
    ]
    const combined = combineFixes(burst, 25)!
    expect(combined.used).toBe(7)
    expect(distanceM(ORIGIN, combined.fix)).toBeLessThan(2)
    expect(combined.spreadM).toBeLessThan(3)
  })

  it('weights precise fixes more', () => {
    const combined = combineFixes([at(0, 0, 5), at(0.0001, 0, 20)], 25)!
    // 1/25 vs 1/400: the result sits close to the 5 m fix, not halfway (~5.5 m).
    expect(distanceM(ORIGIN, combined.fix)).toBeLessThan(1)
  })

  it('matches the nearest booth whose radius contains the fix', () => {
    const booths: PresenceBooth[] = [
      { id: 'a', name: 'A', ...ORIGIN, radiusM: 15 },
      { id: 'b', name: 'B', lat: ORIGIN.lat + 0.0002, lng: ORIGIN.lng, radiusM: 15 }, // ~22 m north
    ]
    expect(nearestBooth(at(0.00003, 0, 5), booths)?.id).toBe('a')
    expect(nearestBooth(at(0.00017, 0, 5), booths)?.id).toBe('b')
    expect(nearestBooth(at(0.0001, 0.0002, 5), booths)).toBeNull() // between and off to the side
  })
})
