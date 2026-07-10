"use client";

import { useState, useRef } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────
const COMPETITIONS = [
  { id: 1, title: "Judul Lomba",   description: "Penjelasan lomba lorem ipsum dolor sit amet" },
  { id: 2, title: "Judul Lomba 2", description: "Penjelasan lomba lorem ipsum dolor sit amet" },
  { id: 3, title: "Judul Lomba 3", description: "Penjelasan lomba lorem ipsum dolor sit amet" },
  { id: 4, title: "Judul Lomba 4", description: "Penjelasan lomba lorem ipsum dolor sit amet" },
];

const FAQS = [
  "Apa itu Insight Competition?",
  "Siapa yang bisa mendaftar?",
  "Bagaimana cara mendaftar?",
  "Kapan deadline pendaftaran?",
];

// ── FONT STACK ──────────────────────────────────────────────────────────────
// Gabarito    (Google Fonts) → headings: INSIGHT COMPETITION, TOTAL PRIZE, FAQ
// Roboto Mono (Google Fonts) → card text, CONTACT US
// Bitcount    (Google Fonts) → prize amount (italic 300) — per Figma spec

// ── ICONS ─────────────────────────────────────────────────────────────────────
const ARMS_UP_SRC = "/images/arms-up.png";
const WHATSAPP_SRC = "/images/whatsapp.png";

// ── CAROUSEL CONSTANTS (from Figma 1440px, scaled to mobile) ──────────────────
const CW = 268;         // card width px
const CH = 268;         // card height px  (square, matches Figma)
const ACTIVE_TOP  = 56; // px – active card drops down
const DARK_TOP    = 0;  // px – dark card peeks above (56px visible)
const SIDE_TOP    = 11; // px – side cards slightly higher than active
const SIDE_OFFSET = 160;// px – center offset for side cards
const CAROUSEL_H  = ACTIVE_TOP + CH + 14; // 338px
const ARMS_SIZE = Math.round(CW * (220 / 520)); // 113px

export default function CompetitionPage() {
  const [active, setActive] = useState(0);
  const n = COMPETITIONS.length;
  const touchX = useRef(null);

  const goto = (i) => setActive(((i % n) + n) % n);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const d = touchX.current - e.changedTouches[0].clientX;
    if (d >  50) goto(active + 1);
    if (d < -50) goto(active - 1);
    touchX.current = null;
  };

  const card = (extra) => ({
    position: "absolute",
    width: CW, height: CH,
    borderRadius: 22,
    ...extra,
  });

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      minHeight: "100svh",
      maxWidth: 480,
      margin: "0 auto",
      overflow: "hidden",
      containerType: "inline-size",
      fontFamily: "'Roboto Mono', 'Courier New', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitcount:wght@300&family=Gabarito:wght@500;700&family=Roboto+Mono:ital,wght@0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes cardIn {
          from { opacity:.6; transform:translateX(-50%) scale(.97); }
          to   { opacity:1;  transform:translateX(-50%) scale(1); }
        }
        .card-active { animation: cardIn .3s ease forwards; }

        .dot {
          width: 16px; height: 16px;
          border-radius: 50%;         /* ← circle, not pill (Figma: Ellipse) */
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
          font-size: clamp(.9rem, 4cqw, 1.2rem);
          letter-spacing: .05em;
          padding: 14px 28px;
          display: flex; align-items: center; justify-content: center;
          gap: 14px;
          color: #000;
          transition: background .2s;
        }
        .contact-btn:hover { background: #C5C5C5; }
      `}</style>

      {/* ── NAVBAR (Figma: 1440×64px #D9D9D9 → 21px @ 480/1440 scale) ── */}
      <header style={{ height: 21, background: "#D9D9D9" }} />

      {/* ── INSIGHT COMPETITION ──────────────────────────────────── */}
      {/* Figma: Gabarito 700 64px, letter-spacing 0.05em, centered */}
      <h1 style={{
        fontFamily: "'Gabarito', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(1.3rem, 6.2cqw, 2rem)",
        letterSpacing: "0.05em",
        textAlign: "center",
        color: "#000",
        margin: "17px 20px 16px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}>
        INSIGHT COMPETITION
      </h1>

      {/* ── CARD CAROUSEL ────────────────────────────────────────── */}
      {/* Figma shadow: 0px -4px 4px rgba(0,0,0,0.25) — upward shadow */}
      <div
        style={{ position: "relative", height: CAROUSEL_H }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-label="Competition slider"
      >
        {/* Dark card behind active — top: 240px in Figma → top: 0 here */}
        <div style={card({ background:"#7C7C7C", left:"50%", top:DARK_TOP, transform:"translateX(-50%)", zIndex:2 })} />

        {/* Left card — center 410/1440 → translateX(-162px) */}
        <div style={card({ background:"#B0B0B0", left:"50%", top:SIDE_TOP, transform:`translateX(calc(-50% - ${SIDE_OFFSET}px))`, zIndex:4 })} />

        {/* Right card — center 1030/1440 → translateX(+162px) */}
        <div style={card({ background:"#B0B0B0", left:"50%", top:SIDE_TOP, transform:`translateX(calc(-50% + ${SIDE_OFFSET}px))`, zIndex:4 })} />

        {/* Active card — shadow goes UPWARD per Figma spec */}
        <div
          key={active}
          className="card-active"
          style={card({
            background: "#D9D9D9",
            left: "50%", top: ACTIVE_TOP,
            transform: "translateX(-50%)",
            zIndex: 10,
            boxShadow: "0px -4px 4px rgba(0, 0, 0, 0.25)", // ← exact Figma value
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 24,
          })}
        >
          <img
            src={ARMS_UP_SRC}
            alt=""
            width={ARMS_SIZE}
            height={ARMS_SIZE}
            style={{ objectFit: "contain" }}
          />
          {/* Figma: Roboto Mono 500, 40px. Gap icon→title scaled from 36px */}
          <h2 style={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 500,
            fontSize: "clamp(.85rem, 3.5cqw, 1rem)",
            letterSpacing: "0.05em",
            marginTop: 19, marginBottom: 19,
            textAlign: "center", color: "#000",
          }}>
            {COMPETITIONS[active].title}
          </h2>
          {/* Figma: Roboto Mono 500, 24px */}
          <p style={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 500,
            fontSize: "clamp(.55rem, 2.5cqw, .7rem)",
            letterSpacing: "0.05em",
            textAlign: "center", color: "#000",
            lineHeight: 1.6, margin: 0,
          }}>
            {COMPETITIONS[active].description}
          </p>
        </div>
      </div>

      {/* ── PAGINATION DOTS (Figma: 16×16px circles, gap 8px, #D9D9D9) ── */}
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

      {/* ── TOTAL PRIZE (Figma: Gabarito 500 64px, centered) ───────── */}
      <section style={{ padding: "0 50px 12px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "'Gabarito', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(1.4rem, 6cqw, 2rem)",
          letterSpacing: "0.05em",
          color: "#000",
        }}>
          TOTAL PRIZE
        </h2>
      </section>

      {/* Prize box — Figma: 1140×400px #D9D9D9, centered with 150px margins */}
      <div style={{ margin: "0 50px 54px", background: "#D9D9D9", borderRadius: 10, padding: "28px 20px", textAlign: "center" }}>
        <span style={{
          fontFamily: "'Bitcount', 'Roboto Mono', monospace",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(1.3rem, 6.5cqw, 2.1rem)",
          color: "#000",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          IDR 00.000.000
        </span>
      </div>

      {/* ── FAQ (Figma: Gabarito 500 64px, left-aligned at x=150) ─── */}
      <section style={{ padding: "0 50px 8px" }}>
        <h2 style={{
          fontFamily: "'Gabarito', sans-serif",
          fontWeight: 500,
          fontSize: "clamp(1.4rem, 6cqw, 2rem)",
          letterSpacing: "0.05em",
          color: "#000",
        }}>
          FAQ
        </h2>
      </section>

      {/* FAQ cards — Figma: 359×304px each, gap 32px → scaled 120×101px, gap 11px */}
      <div
        className="faq-row"
        style={{ display:"flex", gap:11, padding:"4px 50px 72px" }}
      >
        {FAQS.map((q, i) => (
          <div key={i} style={{
            flexShrink: 0,
            width: 120, height: 101,
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

      {/* ── CONTACT US (Figma: 814×144px #D9D9D9, Roboto Mono 500 64px) */}
      <section style={{ display:"flex", justifyContent:"center", padding:"0 50px 67px" }}>
        <button className="contact-btn" style={{ width:"100%", maxWidth:271 }}>
          CONTACT US
          <img
            src={WHATSAPP_SRC}
            alt="WhatsApp"
            style={{ width: "1.27em", height: "1.27em", objectFit: "contain" }}
          />
        </button>
      </section>

      {/* ── FOOTER (Figma: 1440×485px #D9D9D9 → 162px @ 480/1440 scale) ── */}
      <footer style={{ height: 162, background: "#D9D9D9" }} />
    </div>
  );
}