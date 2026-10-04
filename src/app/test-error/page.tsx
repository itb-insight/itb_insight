// Rendered per request, not at build time — otherwise this deliberate throw
// fails the production build during prerendering.
export const dynamic = "force-dynamic";

export default function Page() {
  throw new Error("Test error");
}
