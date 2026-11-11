import Image from "next/image";
import MobileMenuHifi from "@/shared/components/Navbar/NavbarHifi/MobileMenuHifi";

/**
 * Figma: "Header Mobile" 393x99. Logo 49x48 di x=23 y=24.
 * Tombol menu 51x51 di kanan — fill gradient PENUH #dee8fb -> #acc7ff
 * (bukan transparan), radius 15.3, jadi ikonnya gelap.
 */
export default function MobileHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 h-[99px]">
      <Image
        src="/assets/logo-itb-insight.png"
        alt="ITB Insight"
        width={49}
        height={48}
        priority
        style={{ position: "absolute", left: 23, top: 24, width: 49, height: 48, maxWidth: "none" }}
      />
      <MobileMenuHifi variant="header" />
    </header>
  );
}
