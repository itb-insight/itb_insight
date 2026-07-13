/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/shared/components/Navbar/Navbar";

// ── EMBEDDED IMAGES (Figma page 2 assets) ────────────────────────────────────
const ARMS_UP_SRC = "/images/arms-up-2.png";
const WHATSAPP_SRC = "/images/whatsapp-2.png";

// ── DATA ──────────────────────────────────────────────────────────────────────
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
function useCountdown(deadline: Date) {
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

const pad = (n: number) => String(n).padStart(2, "0");

// ── FONT STACKS & TOKENS (Disamakan dengan Halaman Utama) ───────────────────
const G  = "'Gabarito', sans-serif";
const RM = "'Roboto Mono', monospace";

// Headings (INSIGHT COMPETITION / TOTAL PRIZE / FAQ skala)
const HEADING = {
  fontFamily: G, fontWeight: 500,
  fontSize: "clamp(1.8rem, 3vw, 3rem)",
  letterSpacing: "0.05em", color: "#000", lineHeight: 1.2,
};

// Amounts
const AMOUNT = {
  fontFamily: G, fontWeight: 500,
  fontSize: "clamp(1.5rem, 3vw, 3rem)",
  letterSpacing: "0.02em", color: "#000", marginTop: 15,
};

// Countdown digits
const DIGIT = {
  fontFamily: G, fontWeight: 700,
  fontSize: "clamp(2.5rem, 6vw, 5rem)",
  letterSpacing: "0.05em", color: "#000", lineHeight: 1,
};

// Day/hour labels
const DAY_LABEL = {
  fontFamily: G, fontWeight: 500,
  fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
  letterSpacing: "0.05em", color: "#000", marginTop: 8,
};

// Button labels (SILABUS / GUIDEBOOK)
const BTN_LABEL = {
  fontFamily: G, fontWeight: 700,
  fontSize: "clamp(1rem, 1.8vw, 1.5rem)",
  letterSpacing: "0.05em", color: "#000",
};

export default function CompetitionDetailPage({ competition = STATIC_DATA }) {
  const { days, hours } = useCountdown(competition.registrationDeadline);

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      minHeight: "100svh",
      width: "100%",
      margin: "0 auto",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@500;700&family=Roboto+Mono:ital,wght@0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .action-btn {
          flex: 1;
          height: clamp(60px, 8vw, 90px);
          background: #D9D9D9; border: none; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .action-btn:hover { background: #C5C5C5; }

        /* CTA-BTN: Mengikuti spesifikasi tinggi 144px seperti tombol Contact Us kemarin */
        .cta-btn {
          width: 100%;
          maxWidth: 800px;
          height: 100px;
          background: #D9D9D9; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 14px;
          transition: background .2s;
        }
        .cta-btn:hover { background: #C5C5C5; }
      `}</style>

      {/* ── NAVBAR ── */}
      <Navbar isSolid={true} />

      {/* ── HERO ── */}
      <section style={{ padding: "100px 24px 59px", textAlign: "center" }}>
        <img
          src={ARMS_UP_SRC}
          alt="competition mascot"
          style={{ width: "clamp(120px, 25vw, 200px)", height: "auto", display: "block", margin: "0 auto" }}
        />

        {/* JUDUL LOMBA — Skala H1 Insight Competition */}
        <h1 style={{
          ...HEADING,
          fontWeight: 700,
          fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
          marginTop: 24, marginBottom: 19,
        }}>
          {competition.title}
        </h1>

        {/* Description — Skala p kartu active */}
        <p style={{
          fontFamily: RM, fontWeight: 500,
          fontSize: "clamp(.85rem, 1.2vw, 1rem)",
          letterSpacing: "0.05em", lineHeight: "1.6",
          color: "#000",
          maxWidth: "700px",
          margin: "0 auto"
        }}>
          {competition.description}
        </p>
      </section>

      {/* ── SILABUS + GUIDEBOOK ── */}
      <section style={{ padding: "0px 50px 93px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "clamp(16px, 4vw, 32px)", width: "100%", maxWidth: "1140px" }}>
          <button className="action-btn" onClick={() => window.open(competition.sylabusUrl)}>
            <span style={{...BTN_LABEL}}>SILABUS</span>
          </button>
          <button className="action-btn" onClick={() => window.open(competition.guidebookUrl)}>
            <span style={{...BTN_LABEL}}>GUIDEBOOK</span>
          </button>
        </div>
      </section>

      {/* ── REGISTRATION COUNTDOWN ── */}
      <section style={{ padding: "0 24px 90px", textAlign: "center" }}>
        <h2 style={{...HEADING, marginBottom: 24}}>REGISTRATION COUNTDOWN</h2>

        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          marginTop: 12, gap: 16
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{...DIGIT}}>{pad(days)}</span>
            <span style={{...DAY_LABEL}}>days</span>
          </div>

          <span style={{ ...DIGIT, padding: "0 4px" }}>:</span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{...DIGIT}}>{pad(hours)}</span>
            <span style={{...DAY_LABEL}}>hours</span>
          </div>
        </div>
      </section>

      {/* ── REGISTRATION FEE ── */}
      <section style={{ padding: "0 50px 85px", textAlign: "center" }}>
        <h2 style={{...HEADING}}>REGISTRATION FEE</h2>
        <div style={{ margin: "24px auto 0", width: "calc(100% - 300px)", height: "200px", background: "transparent", borderRadius: 10, padding: "28px 20px", textAlign: "center", maxWidth: "1140px", justifyContent: "center", alignItems: "center", display: "flex" }}>
          <p style={{...AMOUNT, marginTop: 0}}>IDR {competition.registrationFee}</p>
        </div>
      </section>

      {/* ── TOTAL PRIZEPOOL ── */}
      <section style={{ padding: "0 50px 123px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "1140px" }}>
          <h2 style={{ ...HEADING, textAlign: "center" }}>TOTAL PRIZEPOOL</h2>

          <div style={{ margin: "24px auto 0", width: "100%", height: "200px", background: "#D9D9D9", borderRadius: 10, padding: "28px 20px", textAlign: "center", justifyContent: "center", alignItems: "center", display: "flex" }}>
            <p style={{ ...AMOUNT, marginTop: 0 }}>IDR {competition.totalPrizepool}</p>
          </div>

          {/* Prize cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(12px, 2.5vw, 32px)",
            marginTop: 33,
          }}>
            {competition.prizeBreakdown.map((_, i) => (
              <div key={i} style={{ background: "#D9D9D9", borderRadius: 10, aspectRatio: "1" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section style={{ padding: "0px 50px 105px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "1140px" }}>
          <h2 style={{...HEADING}}>TIMELINE</h2>
          <div style={{
            background: "#D9D9D9",
            borderRadius: 10,
            width: "100%",
            aspectRatio: "16/9",
            marginTop: 24,
          }} />
        </div>
      </section>

      {/* ── CTA BUTTONS ── */}
      <section style={{ padding: "0 50px 88px", display: "flex", flexDirection: "column", alignItems: "center", gap: 19 }}>
        <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: 19 }}>

          <button className="cta-btn" onClick={() => window.open(competition.whatsappUrl)}>
            <span style={{
              fontFamily: RM, fontWeight: 500,
              fontSize: "clamp(1.8rem, 3vw, 3rem)",
              letterSpacing: "0.05em", color: "#000",
            }}>
              CONTACT US
            </span>
            <img
              src={WHATSAPP_SRC}
              alt="WhatsApp"
              style={{
                width: "clamp(32px, 4vw, 44px)",
                height: "auto",
                objectFit: "contain"
              }}
            />
          </button>

          <button className="cta-btn" onClick={() => window.open(competition.registrationUrl)}>
            <span style={{
              fontFamily: RM, fontWeight: 500,
              fontSize: "clamp(1.8rem, 3vw, 3rem)", // Setara ukuran FAQ
              letterSpacing: "0.05em", color: "#000",
            }}>
              REGISTER NOW
            </span>
          </button>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ height: 162, background: "#D9D9D9" }} />
    </div>
  );
}