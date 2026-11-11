import { unauthorized } from "next/navigation";

export default function Page() {
  unauthorized(); // always throws → renders unauthorized.tsx with a 401
}
