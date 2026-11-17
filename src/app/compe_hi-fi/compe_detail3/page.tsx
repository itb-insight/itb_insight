import { notFound } from "next/navigation"
import CompeDetail3 from "@/features/compe-desktop/CompeDetail3";

export default function HomePage() {
  // Preview/dev page: not served in production (tests/guardrails/dev-routes.test.ts).
  if (process.env.NODE_ENV === "production") notFound()
  return <CompeDetail3 />;
}