import Image from "next/image";

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
      <button
        type="button"
        aria-label="Buka menu"
        className="absolute right-[23px] top-[24px] grid h-[51px] w-[51px] place-items-center rounded-[15.3px]"
        style={{ background: "linear-gradient(180deg, #dee8fb 0%, #acc7ff 100%)" }}
      >
        <svg width="22" height="15" viewBox="0 0 22 15" aria-hidden="true">
          <path d="M0 1.5h22M0 7.5h22M0 13.5h22" stroke="#1b3b7d" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  );
}
