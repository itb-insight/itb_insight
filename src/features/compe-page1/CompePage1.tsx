"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/shared/components/Navbar/Navbar";

// ── DATA KOMPETISI ────────────────────────────────────────────────────────────
const COMPETITIONS = [
  { 
    id: 1, 
    title: "SAR", 
    gradient: "linear-gradient(135deg, #FFE4EC 0%, #FFAAAA 100%)",
    icon: "/images/icon-sar.png" 
  },
  { 
    id: 2, 
    title: "Microdrone Obstacle", 
    gradient: "linear-gradient(135deg, #C08CFF 0%, #E9DBF9 100%)",
    icon: "/images/icon-microdrone.png" 
  },
  { 
    id: 3, 
    title: "BPC", 
    gradient: "linear-gradient(135deg, #D0FFC7 0%, #76DF62 100%)",
    icon: "/images/icon-bpc.png" 
  },
  { 
    id: 4, 
    title: "Olimpiade Engineering", 
    gradient: "linear-gradient(135deg, #ACC7FF 0%, #DEEBFB 100%)",
    icon: "/images/icon-olimpiade.png" 
  },
];

const FAQS = [
  "Apa itu Insight Competition?",
  "Siapa yang bisa mendaftar?",
  "Bagaimana cara mendaftar?",
  "Kapan deadline pendaftaran?",
];

// ── DATA TIMELINE ─────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { id: 1, title: "Pendaftaran", year: "2026", align: "right" },
  { id: 2, title: "Warm Up &\nTechnical Meeting", year: "2026", align: "left" },
  { id: 3, title: "Penyisihan", year: "2026", align: "right" },
  { id: 4, title: "Pengumuman Finalis", year: "2026", align: "left" },
  { id: 5, title: "Final", year: "2026", align: "right" },
];

const CW = 320; 
const CH = 320; 
const ACTIVE_TOP  = 120;
const SIDE_TOP    = 60;
const BACK_TOP    = 0;   
const SIDE_OFFSET = 180; 
const CAROUSEL_H  = ACTIVE_TOP + CH + 40;
const ICON_SIZE   = 140;

export default function CompePage1() {
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
      background: "linear-gradient(180deg, #294D97 0%, #091B3F 100%)",
      minHeight: "100svh",
      width: "100%",
      margin: "0 auto",
      overflowX: "hidden", 
      position: "relative",
      fontFamily: "'Roboto Mono', 'Courier New', monospace",
      color: "#FFFFFF",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;700;900&family=Inter:wght@400&family=Roboto+Mono:wght@400;500;700&display=swap');

        @font-face {
          font-family: 'EXCRATCH';
          src: url('/fonts/EXCRATCH.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
        }

        *, *::before, *::after { box-sizing: border-box; }

        /* FOG BUBBLE (ATAS) */
        .fog-green-left {
          position: absolute; top: -5%; left: -25vw; width: 60vw; height: 60vw; max-width: 800px; max-height: 800px;
          background: #76DF62; border-radius: 50%; filter: blur(180px); opacity: 0.25; z-index: 0; pointer-events: none;
        }
        .fog-purple-right {
          position: absolute; top: 0%; right: -25vw; width: 60vw; height: 60vw; max-width: 800px; max-height: 800px;
          background: #C08CFF; border-radius: 50%; filter: blur(180px); opacity: 0.25; z-index: 0; pointer-events: none;
        }
        
        /* BUBBLE HOLOGRAM KUNING-OREN (TIMELINE KE FAQ) */
        .fog-orange-bottom {
          position: absolute; bottom: -5%; right: -15vw; width: 70vw; height: 1000px; max-width: 1200px;
          background: linear-gradient(197.58deg, #FF3A3A 5.26%, rgba(246, 220, 71, 0.7) 52.44%, #FFAAAA 99.62%);
          opacity: 0.25; filter: blur(180px); border-radius: 50%; z-index: 0; pointer-events: none;
        }

        /* ASET UNION GLOBAL ATAS (Dikecilkan agar tidak masuk Total Prize) */
        .bg-union-left {
          position: absolute; top: 5%; left: -5vw; width: 35vw; max-width: 450px; opacity: 0.25; z-index: 1; pointer-events: none;
        }
        .bg-union-right {
          position: absolute; top: 0%; right: -5vw; width: 35vw; max-width: 450px; opacity: 0.25; z-index: 1; pointer-events: none; transform: scaleX(-1);
        }

        /* ANIMASI MARQUEE SLIDING TEXT */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-heading {
          font-family: 'EXCRATCH', 'Impact', sans-serif;
          font-weight: 700;
          font-size: clamp(4rem, 10vw, 110px);
          letter-spacing: 0.08em;
          line-height: 1.2;
          background: linear-gradient(180deg, #D0FFC7 0%, #76DF62 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0px 0px 10px rgba(222, 235, 251, 0.5));
          margin: 0;
          padding-right: 40px;
          white-space: nowrap;
        }

        /* ─────────────────────────────────────────────────────────── */
        /* CSS MASK COMPOSITE: SOLUSI BORDER GRADIENT MURNI & SEMPURNA */
        /* ─────────────────────────────────────────────────────────── */

        .total-prize-box {
          margin: 0 auto 60px;
          width: 100%;
          max-width: 880px;
          padding: 40px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(180deg, rgba(222, 232, 251, 0.1) 0%, rgba(172, 199, 255, 0.1) 100%);
          border-radius: 40px;
          position: relative;
        }
        .total-prize-box::before {
          content: ""; position: absolute; inset: 0; border-radius: 40px; 
          padding: 4px; 
          background: linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%); 
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }

        .faq-dropdown {
          display: flex; flex-direction: row; align-items: center; justify-content: space-between;
          padding: 12px 24px; width: 100%; max-width: 820px; height: 48px; margin: 0 auto;
          border-radius: 12px; background: rgba(255,255,255,0.02);
          cursor: pointer; transition: all 0.3s ease; z-index: 10; position: relative;
        }
        .faq-dropdown::before {
          content: ""; position: absolute; inset: 0; border-radius: 12px; 
          padding: 2px; 
          background: linear-gradient(180deg, #517EDA 0%, #ACC7FF 100%); 
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
        .faq-dropdown:hover { background: rgba(255,255,255,0.1); }
        .faq-text { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 16px; color: #DEE8FB; }

        .contact-btn-small {
          width: 143px; height: 52px; border-radius: 12px; background: transparent;
          font-family: 'Gabarito', sans-serif; font-size: 16px; color: #DEE8FB; cursor: pointer; transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center; margin: 0 auto; z-index: 10; position: relative;
        }
        .contact-btn-small::before {
          content: ""; position: absolute; inset: 0; border-radius: 12px; 
          padding: 2px; 
          background: linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%); 
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
        .contact-btn-small:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      {/* ── BACKGROUND DECORATIONS FOG & UNION ── */}
      <div className="fog-green-left" />
      <div className="fog-purple-right" />
      <div className="fog-orange-bottom" />
      
      <img src="/images/Union.png" alt="" className="bg-union-left" />
      <img src="/images/Union.png" alt="" className="bg-union-right" />

      {/* ── NAVBAR ── */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Navbar isSolid={false} />
      </div>

      {/* ── HEADER: ITB INSIGHT COMPETITION (SLIDING MARQUEE) ── */}
      {/* Margin top ditambah dari 40px jadi 100px agar sliding text turun ke bawah */}
      <div style={{ overflow: "hidden", width: "100%", margin: "100px 0 40px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", width: "max-content", animation: "marquee 20s linear infinite" }}>
          {/* Half 1 */}
          <div style={{ display: "flex", flexShrink: 0 }}>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
          </div>
          {/* Half 2 (Duplikat identik agar looping seamless) */}
          <div style={{ display: "flex", flexShrink: 0 }}>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
            <h1 className="marquee-heading">ITB INSIGHT COMPETITION&nbsp;&nbsp;&nbsp;&nbsp;</h1>
          </div>
        </div>
      </div>

      {/* ── CARD CAROUSEL (4 KARTU NAIK TURUN) ── */}
      <div
        style={{ position: "relative", height: CAROUSEL_H, overflow: "hidden", zIndex: 10, marginBottom: "40px" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {COMPETITIONS.map((comp, idx) => {
          let diff = idx - active;
          if (diff > n / 2) diff -= n;
          if (diff <= -n / 2) diff += n;

          const isActive = diff === 0;
          const isLeft   = diff === -1;
          const isRight  = diff === 1;
          const isBack   = diff === 2 || diff === -2; 

          let animateX = "-50%";
          let animateTop = BACK_TOP;
          let scale = 1;
          let opacity = 0;
          let zIndex = 1;
          let blurEffect = "blur(8px)"; 

          if (isActive) {
            animateX = "-50%"; animateTop = ACTIVE_TOP; scale = 1.1; opacity = 1; zIndex = 10; blurEffect = "blur(0px)";
          } else if (isLeft) {
            animateX = `calc(-50% - ${SIDE_OFFSET}px)`; animateTop = SIDE_TOP; scale = 0.85; opacity = 0.8; zIndex = 4; blurEffect = "blur(4px)";
          } else if (isRight) {
            animateX = `calc(-50% + ${SIDE_OFFSET}px)`; animateTop = SIDE_TOP; scale = 0.85; opacity = 0.8; zIndex = 4; blurEffect = "blur(4px)";
          } else if (isBack) {
            animateX = "-50%"; animateTop = BACK_TOP; scale = 0.7; opacity = 0.6; zIndex = 1; blurEffect = "blur(8px)";
          }

          return (
            <motion.div
              key={comp.id}
              style={{
                position: "absolute", width: CW, height: CH, borderRadius: "30px", left: "50%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: 24, boxSizing: "border-box", cursor: "pointer",
                background: comp.gradient, 
                border: "4px solid rgba(255, 255, 255, 0.6)", 
                boxShadow: isActive ? "0px 20px 40px rgba(0,0,0,0.4)" : "0px 10px 20px rgba(0,0,0,0.2)",
              }}
              animate={{ x: animateX, top: animateTop, scale: scale, opacity: opacity, zIndex: zIndex, filter: blurEffect }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              onClick={() => {
                  if (isActive) router.push("/competition2"); 
                  else goto(idx);
              }}
            >
              <motion.div
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.8 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  src={comp.icon}
                  alt={comp.title}
                  style={{ width: ICON_SIZE, height: ICON_SIZE, objectFit: "contain", filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.15))" }}
                />
                <h2 style={{
                  fontFamily: "'Gabarito', sans-serif", fontWeight: 800, fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                  marginTop: 20, textAlign: "center", color: "#111827", 
                }}>
                  {comp.title}
                </h2>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ── TOTAL PRIZE ── */}
      <section style={{ padding: "0 24px", textAlign: "center", position: "relative", zIndex: 10 }}>
        {/* Hologram Bubble Tambahan di Kiri Bawah Area Total Prize */}
        <div style={{
          position: "absolute", bottom: "-20%", left: "-15vw", width: "40vw", height: "40vw", maxWidth: "500px", maxHeight: "500px",
          background: "linear-gradient(266.55deg, rgba(137, 77, 183, 0.6) 0%, #5171B4 100%)", borderRadius: "50%", filter: "blur(140px)", opacity: 0.5, zIndex: 0, pointerEvents: "none"
        }} />

        <h2 style={{ 
          fontFamily: "'EXCRATCH', 'Impact', sans-serif", 
          fontWeight: 700, 
          fontSize: "clamp(2rem, 5vw, 64px)", 
          letterSpacing: "0px", 
          marginBottom: 24,
          background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0px 0px 10px rgba(222, 232, 251, 0.6))",
          position: "relative", zIndex: 2
        }}>
          TOTAL PRIZE
        </h2>

        <div className="total-prize-box">
          <span style={{
            fontFamily: "'Gabarito', sans-serif", 
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 6vw, 110px)", 
            lineHeight: "1.2",
            background: "linear-gradient(191deg, #DEE8FB 20%, #ACC7FF 75%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}>
            IDR 150.000.000
          </span>
        </div>
      </section>

      {/* ── TIMELINE ZIG-ZAG ── */}
      <section style={{ padding: "40px 24px 100px", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Union Didorong Masuk (left/right -2vw) Agar Lebih Kelihatan */}
        <img src="/images/Union.png" alt="" style={{ position: "absolute", top: "10%", left: "-2vw", width: "25vw", maxWidth: "300px", opacity: 0.15, zIndex: 0, pointerEvents: "none" }} />
        <img src="/images/Union.png" alt="" style={{ position: "absolute", bottom: "10%", right: "-2vw", width: "25vw", maxWidth: "300px", opacity: 0.15, zIndex: 0, pointerEvents: "none", transform: "scaleX(-1) rotate(15deg)" }} />

        <h2 style={{ 
          fontFamily: "'EXCRATCH', 'Impact', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 64px)", letterSpacing: "0px", marginBottom: "60px",
          background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0px 0px 10px rgba(222, 232, 251, 0.6))", position: "relative", zIndex: 2
        }}>
          TIMELINE
        </h2>

        {/* Restore Kode Timeline Zig-zag Asli */}
        <div style={{ position: "relative", width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "40px" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)", width: "2px", background: "linear-gradient(180deg, rgba(222,232,251,0) 0%, rgba(222,232,251,0.5) 10%, rgba(222,232,251,0.5) 90%, rgba(222,232,251,0) 100%)", zIndex: 1 }} />
          
          {TIMELINE_STEPS.map((step) => (
            <div key={step.id} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
              
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", paddingRight: "clamp(15px, 4vw, 40px)" }}>
                {step.align === "left" && (
                  <>
                    <span style={{ fontFamily: "'Gabarito', sans-serif", fontWeight: 400, fontSize: "clamp(1.1rem, 2.5vw, 36px)", lineHeight: "1.2", whiteSpace: "pre-line", background: "linear-gradient(0deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {step.title}
                    </span>
                    <span style={{ fontFamily: "'Gabarito', sans-serif", fontWeight: 400, fontSize: "clamp(0.9rem, 2vw, 28px)", lineHeight: "1.2", marginTop: "4px", background: "linear-gradient(0deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {step.year}
                    </span>
                  </>
                )}
              </div>

              <div style={{ width: "32px", height: "32px", flexShrink: 0, borderRadius: "50%", background: "linear-gradient(0deg, #FFE4EC 0%, #FFAAAA 100%)", boxShadow: "0px 0px 15px rgba(255, 170, 170, 0.6)", zIndex: 3 }} />

              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", paddingLeft: "clamp(15px, 4vw, 40px)" }}>
                {step.align === "right" && (
                  <>
                    <span style={{ fontFamily: "'Gabarito', sans-serif", fontWeight: 400, fontSize: "clamp(1.1rem, 2.5vw, 36px)", lineHeight: "1.2", whiteSpace: "pre-line", background: "linear-gradient(0deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {step.title}
                    </span>
                    <span style={{ fontFamily: "'Gabarito', sans-serif", fontWeight: 400, fontSize: "clamp(0.9rem, 2vw, 28px)", lineHeight: "1.2", marginTop: "4px", background: "linear-gradient(0deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {step.year}
                    </span>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ & CONTACT AREA ── */}
      <section style={{ padding: "0px 24px 120px", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Union Hanya Mengapit Judul FAQ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
          <img src="/images/Union.png" alt="" style={{ width: "clamp(60px, 15vw, 120px)", opacity: 0.3 }} />
          <h2 style={{ 
            fontFamily: "'EXCRATCH', 'Impact', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 64px)", letterSpacing: "0px", margin: 0,
            background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent",
            filter: "drop-shadow(0px 0px 10px rgba(222, 232, 251, 0.6))" // Menambahkan Glow pada FAQ
          }}>
            FAQ
          </h2>
          <img src="/images/Union.png" alt="" style={{ width: "clamp(60px, 15vw, 120px)", opacity: 0.3, transform: "scaleX(-1)" }} />
        </div>

        {/* Dropdown FAQ Transparan Murni Border Gradient */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "820px", zIndex: 2 }}>
          {FAQS.map((q, i) => (
            <div key={i} className="faq-dropdown">
              <span className="faq-text">{q}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="#DEE8FB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Contact Us Button Transparan Murni Border Gradient */}
        <button className="contact-btn-small" style={{ marginTop: "60px", zIndex: 2 }}>
          Contact Us
        </button>

      </section>

      {/* ── FOOTER ── */}
      <footer style={{ height: 100, borderTop: "1px solid rgba(255,255,255,0.2)", background: "transparent", position: "relative", zIndex: 10 }} />
    </div>
  );
}