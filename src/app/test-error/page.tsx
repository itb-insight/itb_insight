import { notFound } from "next/navigation"
// Rendered per request, not at build time — otherwise this deliberate throw
// fails the production build during prerendering.
export const dynamic = "force-dynamic";

export default function Page() {
  // Preview/dev page: not served in production (tests/guardrails/dev-routes.test.ts).
  if (process.env.NODE_ENV === "production") notFound()
  throw new Error("Test error");
}
