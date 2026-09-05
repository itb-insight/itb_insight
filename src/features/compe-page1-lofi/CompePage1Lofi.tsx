"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/shared/components/Navbar/Navbar";

// ── DATA ──────────────────────────────────────────────────────────────────────
const COMPETITIONS = [
  { id: 1, title: "Robotika Challenge", description: "Kompetisi robotika untuk tim mahasiswa yang ingin membangun prototipe cerdas dan kompetitif" },
  { id: 2, title: "Hackathon Innovation Sprint", description: "Sprint pengembangan produk digital dengan fokus pada solusi nyata untuk kampus dan industri" },
  { id: 3, title: "Paper Competition", description: "Kompetisi penulisan karya ilmiah individual untuk ide teknologi dan inovasi digital" },
  { id: 4, title: "UI/UX Design Sprint", description: "Kompetisi merancang antarmuka digital yang intuitif untuk studi kasus produk nyata" },
];

const FAQS = [
  "Apa itu Insight Competition?",
  "Siapa yang bisa mendaftar?",
  "Bagaimana cara mendaftar?",
  "Kapan deadline pendaftaran?",
];

// ── ICONS ─────────────────────────────────────────────────────────────────────
const ARMS_UP_SRC = "/images/arms-up.png";
const WHATSAPP_SRC = "/images/whatsapp.png";

// ── CAROUSEL CONSTANTS ────────────────────────────────────────────────────────
const CW = 268;
const CH = 268;
const ACTIVE_TOP  = 56;
const DARK_TOP    = 0;
const SIDE_TOP    = 11;
const SIDE_OFFSET = 160;
const CAROUSEL_H  = ACTIVE_TOP + CH + 14;
const ARMS_SIZE = Math.round(CW * (220 / 520));

export default function CompetitionPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const n = COMPETITIONS.length;
  const touchX = useRef<number | null>(null);

  const goto = (i: number) => setActive(((i % n) + n) % n);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const d = touchX.current - e.changedTouches[0].clientX;
    if (d >  50) goto(active + 1);
    if (d < -50) goto(active - 1);
    touchX.current = null;
  };

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      minHeight: "100svh",
      width: "100%",
      margin: "0 auto",
      overflow: "hidden",
      containerType: "inline-size",
      fontFamily: "'Roboto Mono', 'Courier New', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitcount:wght@300&family=Gabarito:wght@500;700&family=Roboto+Mono:ital,wght@0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #D9D9D9;
          border: none; cursor: pointer; padding: 0;
          transition: transform .2s;
        }
        .dot.active { transform: scale(1.25); background: #888; }

        .faq-row { overflow-x: auto; scrollbar-width: none; }
        .faq-row::-webkit-scrollbar { display: none; }

        .contact-btn {
          border: none;
          background: #D9D9D9;
          cursor: pointer;
          font-family: 'Roboto Mono', monospace;
          font-weight: 500;
          font-size: clamp(1.8rem, 3vw, 3rem);
          letter-spacing: .05em;
          height: 144px;
          padding: 0 28px;
          display: flex; align-items: center; justify-content: center;
          gap: 14px;
          color: #000;
          transition: background .2s;
        }
        .contact-btn:hover { background: #C5C5C5; }
      `}</style>

      {/* ── NAVBAR ── */}
      <Navbar isSolid={true} />

      {/* ── INSIGHT COMPETITION ── */}
      <h1 style={{
        fontFamily: "'Gabarito', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
        letterSpacing: "0.05em",
        textAlign: "center",
        color: "#000",
        margin: "17px 20px 16px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}>
        INSIGHT COMPETITION
      </h1>

      {/* ── CARD CAROUSEL (MUTER DENGAN FRAMER MOTION) ── */}
      <div
        style={{ position: "relative", height: CAROUSEL_H, overflow: "hidden" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-label="Competition slider"
      >
        {COMPETITIONS.map((comp, idx) => {
          let diff = idx - active;
          if (diff > n / 2) diff -= n;
          if (diff <= -n / 2) diff += n;

          const isActive = diff === 0;
          const isLeft   = diff === -1;
          const isRight  = diff === 1;
          const isBackground = !isActive && !isLeft && !isRight;

          let animateX = "-50%";
          let animateTop = DARK_TOP;
          let scale = 1;
          let opacity = 0;
          let zIndex = 2;
          let background = "#7C7C7C";
          let shadow = "none";

          if (isActive) {
            animateX = "-50%";
            animateTop = ACTIVE_TOP;
            scale = 1;
            opacity = 1;
            zIndex = 10;
            background = "#D9D9D9";
            shadow = "0px -4px 4px rgba(0, 0, 0, 0.25)";
          } else if (isLeft) {
            animateX = `calc(-50% - ${SIDE_OFFSET}px)`;
            animateTop = SIDE_TOP;
            scale = 1;
            opacity = 1;
            zIndex = 4;
            background = "#B0B0B0";
          } else if (isRight) {
            animateX = `calc(-50% + ${SIDE_OFFSET}px)`;
            animateTop = SIDE_TOP;
            scale = 1;
            opacity = 1;
            zIndex = 4;
            background = "#B0B0B0";
          } else if (isBackground) {
            animateX = "-50%";
            animateTop = DARK_TOP;
            scale = 0.95;
            opacity = 0.3;
            zIndex = 1;
            background = "#7C7C7C";
          }

          return (
            <motion.div
              key={comp.id}
              style={{
                position: "absolute",
                width: CW,
                height: CH,
                borderRadius: 22,
                left: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                boxSizing: "border-box",
                cursor: "pointer"
              }}
              animate={{
                x: animateX,
                top: animateTop,
                scale: scale,
                opacity: opacity,
                zIndex: zIndex,
                backgroundColor: background,
                boxShadow: shadow,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25
              }}
              onClick={() => {
                  if (isActive) {
                    router.push("/competition2");
                  } else {
                    goto(idx);
                  }
                }}
            >
              {isActive ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                >
                  <img
                    src={ARMS_UP_SRC}
                    alt=""
                    width={ARMS_SIZE}
                    height={ARMS_SIZE}
                    style={{ objectFit: "contain" }}
                  />
                  <h2 style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 500,
                    fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
                    letterSpacing: "0.05em",
                    marginTop: 19, marginBottom: 19,
                    textAlign: "center", color: "#000",
                  }}>
                    {comp.title}
                  </h2>
                  <p style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 500,
                    fontSize: "clamp(.85rem, 1.2vw, 1rem)",
                    letterSpacing: "0.05em",
                    textAlign: "center", color: "#000",
                    lineHeight: 1.6, margin: 0,
                  }}>
                    {comp.description}
                  </p>
                </motion.div>
              ) : (
                // Sisi kartu kiri/kanan/belakang yang kosong polos tanpa teks sesuai Figma asli kamu
                <div style={{ width: "100%", height: "100%" }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── PAGINATION DOTS ── */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, padding:"12px 0 56px" }}>
        {COMPETITIONS.map((_, i) => (
          <button
            key={i}
            className={`dot${i === active ? " active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Competition ${i + 1}`}
            aria-pressed={i === active}
          />
        ))}
      </div>

      {/* ── TOTAL PRIZE ── */}
      <section style={{ padding: "0 50px 12px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "'Gabarito', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(1.8rem, 3vw, 3rem)",
          letterSpacing: "0.05em",
          color: "#000",
        }}>
          TOTAL PRIZE
        </h2>
      </section>

      {/* Prize box */}
      <div style={{ margin: "0 auto 54px", width: "calc(100% - 300px)", height: "400px", background: "#D9D9D9", borderRadius: 10, padding: "28px 20px", textAlign: "center", maxWidth: "1440px", justifyContent: "center", alignItems: "center", display: "flex" }}>
        <span style={{
          fontFamily: "'Bitcount', 'Roboto Mono', monospace",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(1.5rem, 3vw, 3rem)",
          color: "#000",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          IDR 150.000.000
        </span>
      </div>

      {/* ── FAQ ── */}
      <section style={{ padding: "0 150px 8px" }}>
        <h2 style={{
          fontFamily: "'Gabarito', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(1.8rem, 3vw, 3rem)",
          letterSpacing: "0.05em",
          color: "#000",
        }}>
          FAQ
        </h2>
      </section>

      {/* FAQ cards */}
      <div className="faq-row" style={{ display:"flex", gap:11, padding:"4px 150px 72px" }}>
        {FAQS.map((q, i) => (
          <div key={i} style={{
            flexShrink: 0,
            width: 359, height: 304,
            background: "#D9D9D9",
            borderRadius: 10,
            padding: 10,
            display: "flex", alignItems: "center",
          }}>
            <p style={{
              fontFamily: "'Roboto Mono', monospace",
              fontWeight: 500,
              fontSize: ".55rem",
              letterSpacing: "0.03em",
              lineHeight: 1.5,
              color: "#333", margin: 0,
            }}>
              {q}
            </p>
          </div>
        ))}
      </div>

      {/* ── CONTACT US ── */}
      <section style={{ display:"flex", justifyContent:"center", padding:"0 50px 67px" }}>
        <button className="contact-btn" style={{ width:"100%", maxWidth: "600px"}}>
          CONTACT US
          <img
            src={WHATSAPP_SRC}
            alt="WhatsApp"
            style={{ width: "1.27em", height: "1.27em", objectFit: "contain" }}
          />
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ height: 162, background: "#D9D9D9" }} />
    </div>
  );
}