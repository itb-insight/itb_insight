import { unauthorized, notFound } from "next/navigation";

export default function Page() {
  // Preview/dev page: not served in production (tests/guardrails/dev-routes.test.ts).
  if (process.env.NODE_ENV === "production") notFound()
  unauthorized(); // always throws → renders unauthorized.tsx with a 401
}
