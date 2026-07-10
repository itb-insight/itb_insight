/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";

// ── FONTS ─────────────────────────────────────────────────────────────────────
// Gabarito    (Google Fonts) → ALL headings + numbers
// Roboto Mono (Google Fonts) → description, CONTACT US, REGISTER NOW

// ── EMBEDDED IMAGES (Figma page 2 assets) ────────────────────────────────────
const ARMS_UP_SRC = "/images2/arms-up-2.png";
const WHATSAPP_SRC = "/images2/whatsapp-2.png";

// ── STATIC DATA (swap with API fetch / props in production) ──────────────────
const STATIC_DATA = {
  title:                "JUDUL LOMBA",
  description:          "Penjelasan lomba lorem ipsum dolor sit amet",
  registrationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
  registrationFee:      "000.000",
  totalPrizepool:       "000.000",
  prizeBreakdown:       [null, null, null, null],
  sylabusUrl:           "#",
  guidebookUrl:         "#",
  whatsappUrl:          "https://wa.me/62xxxxxxxxxx",
  registrationUrl:      "#",
};

// ── Countdown hook (days + hours only, per Figma) ────────────────────────────
function useCountdown(deadline) {
  const [time, setTime] = useState({ days: 0, hours: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return setTime({ days: 0, hours: 0 });
      setTime({
        days:  Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);
  return time;
}

const pad = (n) => String(n).padStart(2, "0");

// ── Type tokens (from Figma Dev Mode, scaled 1440→480) ───────────────────────
// Scale factor ≈ 1/3.  All clamp() values hit ≈ Figma_px / 3 at 480vw.

const G  = "'Gabarito', sans-serif";
const RM = "'Roboto Mono', monospace";

// Headings: Gabarito 700, 64px → target ~21px at 480px viewport
const HEADING = {
  fontFamily: G, fontWeight: 700,
  fontSize: "clamp(1.05rem, 4.44vw, 1.33rem)",
  letterSpacing: "0.05em", color: "#000", lineHeight: 1.2,
};

// Amounts: Gabarito 500, 96px → target ~32px
const AMOUNT = {
  fontFamily: G, fontWeight: 500,
  fontSize: "clamp(1.6rem, 6.67vw, 2rem)",
  letterSpacing: "0.05em", color: "#000", marginTop: 11,
};

// Countdown digits: Gabarito 700, 128px → target ~43px
const DIGIT = {
  fontFamily: G, fontWeight: 700,
  fontSize: "clamp(2.15rem, 8.89vw, 2.67rem)",
  letterSpacing: "0.05em", color: "#000", lineHeight: 1,
};

// Day/hour labels: Gabarito 500, 40px → target ~13px
const DAY_LABEL = {
  fontFamily: G, fontWeight: 500,
  fontSize: "clamp(0.7rem, 2.78vw, 0.83rem)",
  letterSpacing: "0.05em", color: "#000", marginTop: 8,
};

// Button labels (SILABUS / GUIDEBOOK): Gabarito 700, 40px
const BTN_LABEL = {
  fontFamily: G, fontWeight: 700,
  fontSize: "clamp(0.68rem, 2.78vw, 0.83rem)",
  letterSpacing: "0.05em", color: "#000",
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CompetitionDetailPage({ competition = STATIC_DATA }) {
  const { days, hours } = useCountdown(competition.registrationDeadline);

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      minHeight: "100svh",
      maxWidth: 480,
      margin: "0 auto",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@500;700&family=Roboto+Mono:ital,wght@0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Figma: Rectangle 42497/42498 — 456×120px #D9D9D9 border-radius 30px
           Scaled to mobile (÷3): ~152×40px, border-radius ~10px              */
        .action-btn {
          flex: 1;
          height: clamp(40px, 8.3vw, 48px);
          background: #D9D9D9; border: none; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .action-btn:hover { background: #C5C5C5; }

        /* Figma: Rectangle 42495/42504 — 814×144px #D9D9D9, NO border-radius
           Scaled: full-width × 48px                                           */
        .cta-btn {
          width: 100%;
          height: clamp(44px, 10vw, 56px);
          background: #D9D9D9; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          transition: background .2s;
        }
        .cta-btn:hover { background: #C5C5C5; }
      `}</style>

      {/* ── NAVBAR: Figma 1440×64px #D9D9D9 ──────────────────────────────── */}
      <header style={{ height: "clamp(17px, 4.44vw, 21px)", background: "#D9D9D9" }} />

      {/* ── HERO: Arms Up icon + title + description ─────────────────────── */}
      {/* Figma: Arms Up 323×323px centred; title Gabarito 700 64px centred   */}
      <section style={{ padding: "45px 24px 59px", textAlign: "center" }}>

        {/* Arms Up — Figma 323×323px → scaled ~108px */}
        <img
          src={ARMS_UP_SRC}
          alt="competition mascot"
          style={{ width: "clamp(88px, 22.5vw, 108px)", height: "auto", display: "block", margin: "0 auto" }}
        />

        {/* JUDUL LOMBA — Gabarito 700 64px */}
        <h1 style={{
          ...HEADING,
          fontWeight: 700,
          fontSize: "clamp(1.05rem, 4.44vw, 1.33rem)",
          marginTop: 10, marginBottom: 17,
        }}>
          {competition.title}
        </h1>

        {/* Description — Roboto Mono 500 24px */}
        <p style={{
          fontFamily: RM, fontWeight: 500,
          fontSize: "clamp(0.38rem, 1.67vw, 0.5rem)",
          letterSpacing: "0.05em", lineHeight: "1.6",
          color: "#000",
        }}>
          {competition.description}
        </p>
      </section>

      {/* ── SILABUS + GUIDEBOOK ─────────────────────────────────────────── */}
      {/* Figma: two 456×120px buttons (border-radius 30px), gap 96px
          Mobile: equal-flex with proportional gap and radius                  */}
      <section style={{ padding: "0px 24px 93px" }}>
        <div style={{ display: "flex", gap: "clamp(16px, 6.67vw, 32px)" }}>
          <button className="action-btn" onClick={() => window.open(competition.sylabusUrl)}>
            <span style={{...BTN_LABEL}}>SILABUS</span>
          </button>
          <button className="action-btn" onClick={() => window.open(competition.guidebookUrl)}>
            <span style={{...BTN_LABEL}}>GUIDEBOOK</span>
          </button>
        </div>
      </section>

      {/* ── REGISTRATION COUNTDOWN ──────────────────────────────────────── */}
      {/* Figma: heading 64px centred; "00 : 00" 128px centred;
                "days" / "hours" 40px directly under each digit               */}
      <section style={{ padding: "0 24px 90px", textAlign: "center" }}>
        <h2 style={{...HEADING}}>REGISTRATION COUNTDOWN</h2>

        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          marginTop: 12,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{...DIGIT}}>{pad(days)}</span>
            <span style={{...DAY_LABEL}}>days</span>
          </div>

          {/* Colon — same DIGIT style, no label below */}
          <span style={{ ...DIGIT, padding: "0 4px" }}>:</span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{...DIGIT}}>{pad(hours)}</span>
            <span style={{...DAY_LABEL}}>hours</span>
          </div>
        </div>
      </section>

      {/* ── REGISTRATION FEE ─────────────────────────────────────────────── */}
      {/* Figma: heading 64px centred; amount 96px centred                    */}
      <section style={{ padding: "0 24px 85px", textAlign: "center" }}>
        <h2 style={{...HEADING}}>REGISTRATION FEE</h2>
        <p style={{...AMOUNT}}>IDR {competition.registrationFee}</p>
      </section>

      {/* ── TOTAL PRIZEPOOL ──────────────────────────────────────────────── */}
      {/* Figma: heading left-aligned at x=150; amount at x=256 (indented)   */}
      <section style={{ padding: "0 50px 123px" }}>
        <h2 style={{ ...HEADING, textAlign: "left" }}>TOTAL PRIZEPOOL</h2>
        <p style={{ ...AMOUNT, textAlign: "left", marginTop: 21, paddingLeft: "clamp(28px, 7.29vw, 35px)" }}>
          IDR {competition.totalPrizepool}
        </p>

        {/* Prize cards: Figma 4 × 261×261px, gap 32px → scaled ~87px, gap ~11px */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "clamp(6px, 2.29vw, 11px)",
          marginTop: 33,
        }}>
          {competition.prizeBreakdown.map((_, i) => (
            <div key={i} style={{ background: "#D9D9D9", borderRadius: 4, aspectRatio: "1" }} />
          ))}
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      {/* Figma: heading centred; box 1140×640px (16:9) #D9D9D9 radius 30px  */}
      <section style={{ padding: "0px 50px 105px", textAlign: "center" }}>
        <h2 style={{...HEADING}}>TIMELINE</h2>
        <div style={{
          background: "#D9D9D9",
          borderRadius: 10,
          width: "100%",
          aspectRatio: "16/9",
          marginTop: 13,
        }} />
      </section>

      {/* ── CTA BUTTONS ──────────────────────────────────────────────────── */}
      {/* Figma: 814×144px #D9D9D9, NO border-radius; Roboto Mono 500 64px   */}
      <section style={{ padding: "0 104px 88px", display: "flex", flexDirection: "column", gap: 19 }}>

        <button className="cta-btn" onClick={() => window.open(competition.whatsappUrl)}>
          <span style={{
            fontFamily: RM, fontWeight: 500,
            fontSize: "clamp(1.05rem, 4.44vw, 1.33rem)",
            letterSpacing: "0.05em", color: "#000",
          }}>
            CONTACT US
          </span>
          {/* WhatsApp — Figma 81×81px → scaled ~27px */}
          <img
            src={WHATSAPP_SRC}
            alt="WhatsApp"
            style={{ width: "clamp(22px, 5.63vw, 27px)", height: "auto" }}
          />
        </button>

        <button className="cta-btn" onClick={() => window.open(competition.registrationUrl)}>
          <span style={{
            fontFamily: RM, fontWeight: 500,
            fontSize: "clamp(1.05rem, 4.44vw, 1.33rem)",
            letterSpacing: "0.05em", color: "#000",
          }}>
            REGISTER NOW
          </span>
        </button>

      </section>

      {/* ── FOOTER: Figma 1440×485px #D9D9D9 → scaled ~162px ─────────────── */}
      <footer style={{ height: "clamp(120px, 33.7vw, 162px)", background: "#D9D9D9" }} />
    </div>
  );
}
