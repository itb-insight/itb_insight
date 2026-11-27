import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import type { NextConfig } from "next";

/*
Local dev only. Node tries each address of a host for 250 ms before giving up on it. From Indonesia,
without IPv6, connecting to PostHog's US servers takes ~260-320 ms, so `next dev` proxying /ingest
sometimes failed every address ("Failed to proxy ... AggregateError", a 500 in the browser).
On Vercel, external rewrites are proxied by the platform, not by this process.
*/
if (process.env.NODE_ENV !== "production") setDefaultAutoSelectFamilyAttemptTimeout(1000);

/**
 * Security headers for every response. Checked by src/next-config.test.ts.
 * - frame-ancestors / X-Frame-Options: no framing (clickjacking on the profile form and the
 *   booth "give points" buttons)
 * - Permissions-Policy: camera for the QR scanner and geolocation for self check-in, both
 *   first-party only; everything else off
 * There is no script-src policy yet: Next's inline bootstrap scripts need nonces, which would
 * force every page to render dynamically.
 */
export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

/**
 * PostHog through our own domain (/ingest), so ad blockers that block posthog.com don't drop
 * analytics. Hosts follow NEXT_PUBLIC_POSTHOG_REGION; without a region there is nothing to proxy.
 * Must match INGEST_PATH in src/lib/analytics/posthog.ts, and src/proxy.ts skips these paths.
 */
export function posthogRewrites(region = process.env.NEXT_PUBLIC_POSTHOG_REGION) {
  if (region !== "us" && region !== "eu") return [];
  return [
    { source: "/ingest/static/:path*", destination: `https://${region}-assets.i.posthog.com/static/:path*` },
    { source: "/ingest/array/:path*", destination: `https://${region}-assets.i.posthog.com/array/:path*` },
    { source: "/ingest/:path*", destination: `https://${region}.i.posthog.com/:path*` },
  ];
}

const ONE_YEAR_IMMUTABLE = "public, max-age=31536000, immutable";
const ONE_DAY_SWR = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PostHog's API paths end in a slash (/ingest/e/); redirecting them would break ingestion.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return posthogRewrites();
  },
  // The quest pages became Insight Arcade (/arcade); old links and printed QRs keep working.
  async redirects() {
    return [
      { source: "/quest", destination: "/arcade", permanent: true },
      { source: "/quest/:path*", destination: "/arcade/:path*", permanent: true },
    ];
  },
  experimental: {
    authInterrupts: true, // unauthorized() in src/app/test-unauthorized (dev only)
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Versioned files: change the name (e.g. scrub-16x9-v3.mp4) when the content changes.
      { source: "/itb-model/:path*", headers: [{ key: "Cache-Control", value: ONE_YEAR_IMMUTABLE }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: ONE_YEAR_IMMUTABLE }] },
      // Replaced in place now and then: cache a day, refresh in the background for a week.
      {
        source: "/:dir(images|deco|assets|media-partner|sponsors|events|models|map-pin)/:path*",
        headers: [{ key: "Cache-Control", value: ONE_DAY_SWR }],
      },
    ];
  },
};

export default nextConfig;
