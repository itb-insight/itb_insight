import { SAMPLE_RATES } from "./config"

/**
 * 1-in-N sampling for high-volume passive signals (scroll ticks, impressions).
 *
 * Dashboards that read a sampled event type must multiply back up by the rate
 * to get a population estimate — that is documented in docs/analytics.
 * Anything not listed in SAMPLE_RATES is full fidelity.
 */
export default function shouldSample(name: string): boolean {
  const rate = SAMPLE_RATES[name]
  if (!rate || rate <= 1) return true
  return Math.random() < 1 / rate
}
