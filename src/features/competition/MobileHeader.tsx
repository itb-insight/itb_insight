import Image from "next/image";
import Link from "next/link";
import MobileMenuHifi from "@/shared/components/Navbar/NavbarHifi/MobileMenuHifi";

/**
 * Figma: "Header Mobile" 393x99. Logo 49x48 di x=23 y=24 (kini 55x54, +6px).
 * Tombol menu 51x51 (kini 57x57) di kanan, fill gradient PENUH
 * #dee8fb -> #acc7ff (bukan transparan), radius 15.3, jadi ikonnya gelap.
 *
 * Logo adalah tautan ke beranda ("/"), seperti logo di navbar desktop.
 */
export default function MobileHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 h-[99px]">
      <Link
        href="/"
        aria-label="ITB Insight, ke beranda"
        style={{ position: "absolute", left: 23, top: 24, width: 55, height: 54, display: "block" }}
      >
        <Image
          src="/assets/logo-itb-insight.png"
          alt="ITB Insight"
          width={55}
          height={54}
          priority
          style={{ width: 55, height: 54, maxWidth: "none" }}
        />
      </Link>
      <MobileMenuHifi variant="header" />
    </header>
  );
}
