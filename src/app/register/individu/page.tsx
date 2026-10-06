"use client";

import React from "react";
import Navbar from "@/shared/components/Navbar/Navbar";

export default function RegisterIndividuPage() {
  return (
    <div style={{
      background: "linear-gradient(180deg, #091B3F 0%, #294D97 100%)",
      minHeight: "100svh",
      width: "100%",
      margin: "0 auto",
      overflowX: "hidden",
      position: "relative",
      fontFamily: "'Inter', sans-serif",
      color: "#FFFFFF",
      paddingBottom: "100px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;700;900&family=Inter:wght@400;500;600&display=swap');

        @font-face {
          font-family: 'EXCRATCH';
          src: url('/fonts/EXCRATCH.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
        }

        *, *::before, *::after { box-sizing: border-box; }

        /* =========================================
           BACKGROUND BLUSHES (DESKTOP ONLY)
           ========================================= */
        .fog-blush-diagonal {
          position: absolute; top: 10%; right: -30vw; width: 2108px; height: 699px; max-width: 150vw;
          background: linear-gradient(266.55deg, rgba(235, 44, 44, 0.6) -0.05%, rgba(137, 77, 183, 0.5) 48.27%, rgba(81, 113, 180, 0.1) 96.59%);
          filter: blur(180px); border-radius: 50%; transform: rotate(-12deg); opacity: 0.65; z-index: 0; pointer-events: none;
        }

        .fog-blush-bottom-left {
          position: absolute; bottom: -10%; left: -20vw; width: 800px; height: 800px; max-width: 80vw; max-height: 80vw;
          background: linear-gradient(135deg, rgba(235, 44, 44, 0.4) 0%, rgba(137, 77, 183, 0.5) 50%, rgba(255, 170, 170, 0.3) 100%);
          filter: blur(180px); border-radius: 50%; opacity: 0.6; z-index: 0; pointer-events: none;
        }

        .fog-blue-top-left {
          position: absolute; top: 10%; left: 15vw; width: 302px; height: 375px;
          background: rgba(172, 199, 255, 0.45); filter: blur(120px); transform: rotate(-45deg); opacity: 0.8; z-index: 0; pointer-events: none;
        }

        /* Hilangkan blush desktop saat masuk mode mobile */
        @media (max-width: 768px) {
          .fog-blush-diagonal, .fog-blush-bottom-left, .fog-blue-top-left {
            display: none;
          }
        }

        /* =========================================
           BACKGROUND BLUSH (MOBILE ONLY)
           ========================================= */
        .fog-mobile-top {
          display: none; /* Sembunyikan di desktop */
          position: absolute;
          top: 150px;
          left: 50%;
          transform: translateX(-50%);
          width: 256px;
          height: 254px;
          background: linear-gradient(180deg, #FFE133 0%, #C08CFF 100%);
          opacity: 0.43;
          filter: blur(200px); /* Blur tebal dari Figma */
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }

        /* Munculkan blush mobile hanya saat di layar kecil */
        @media (max-width: 768px) {
          .fog-mobile-top {
            display: block;
          }
        }

        /* =========================================
           WAVY BACKGROUND MOBILE 
           ========================================= */
        .bg-wave-1 {
          position: absolute;
          top: 350px; 
          left: 50%;
          transform: translateX(-50%); 
          width: 632px; 
          height: 632px;
          z-index: 5; 
          pointer-events: none;
          opacity: 0.4; 
          filter: blur(5px); 
        }

        .bg-wave-2 {
          position: absolute;
          top: 510px; 
          left: -18vw; 
          width: 400px; 
          height: 632px;
          z-index: 5; 
          pointer-events: none;
          opacity: 0.4; 
          filter: blur(5px); 
        }

        .bg-wave-3 {
          position: absolute;
          top: 350px; 
          right: -25vw; 
          width: 301px; 
          height: 301px;
          z-index: 5; 
          pointer-events: none;
          opacity: 0.4; 
          filter: blur(5px); 
        }

        .bg-wave-4 {
          position: absolute;
          top: 870px; 
          right: -32vw; 
          width: 200px; 
          height: 200px;
          z-index: 5; 
          pointer-events: none;
          opacity: 0.4; 
          filter: blur(5px); 
        }

        @media (min-width: 769px) {
          .bg-wave-1, .bg-wave-2, .bg-wave-3, .bg-wave-4 { display: none; }
        }

        /* =========================================
           CONTAINER FORM
           ========================================= */
        .form-container {
          width: 100%;
          max-width: 868px;
          margin: 0 auto;
          padding: 32px 32px 48px;
          background: linear-gradient(180deg, rgba(20, 45, 95, 0.65) 0%, rgba(81, 126, 218, 0.4) 100%);
          backdrop-filter: blur(12px); 
          border-radius: 20px;
          position: relative;
          z-index: 10;
        }
        .form-container::before {
          content: ""; position: absolute; inset: 0; border-radius: 20px; 
          padding: 4px; 
          background: linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%); 
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }

        @media (max-width: 768px) {
          .form-container { padding: 24px 20px 32px; }
        }

        /* =========================================
           CUSTOM INPUT STYLE
           ========================================= */
        .input-group {
          display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;
        }
        .input-label {
          font-family: 'Gabarito', sans-serif; font-weight: 400; font-size: 16px; color: #FFFFFF;
        }
        .input-label span {
          color: #FF6B6B; font-family: 'Gabarito', sans-serif; font-weight: 400; font-size: 16px;
        }
        
        .custom-input-wrapper {
          position: relative; width: 100%; border-radius: 12px;
        }
        .custom-input-wrapper::before {
           content: ""; position: absolute; inset: 0; border-radius: 12px; padding: 2px;
           background: linear-gradient(180deg, #ACC7FF 0%, #517EDA 100%);
           -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
           -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }

        .custom-input {
          width: 100%; height: 48px; background: rgba(255, 255, 255, 0.2);
          border: none; border-radius: 12px; padding: 0 12px; color: #FFFFFF;
          font-family: 'Gabarito', sans-serif; font-size: 16px; outline: none; position: relative; z-index: 2;
        }
        .custom-input::placeholder {
          color: #ACC7FF; font-family: 'Gabarito', sans-serif; font-weight: 400; font-size: 16px;
        }
        .custom-input:focus {
           background: rgba(255, 255, 255, 0.3);
        }

        .search-wrapper { position: relative; width: 100%; border-radius: 12px; }
        .search-wrapper::before {
           content: ""; position: absolute; inset: 0; border-radius: 12px; padding: 2px; 
           background: linear-gradient(180deg, #ACC7FF 0%, #517EDA 100%); 
           -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
           -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }
        .search-icon {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; z-index: 3;
        }
      `}</style>

      {/* ── BACKGROUND BLUSHES (DESKTOP) ── */}
      <div className="fog-blush-diagonal" />
      <div className="fog-blush-bottom-left" />
      <div className="fog-blue-top-left" />

      {/* ── BACKGROUND BLUSH (MOBILE) ── */}
      <div className="fog-mobile-top" />

      {/* ── WAVY IMAGE BACKGROUND DARI FIGMA ── */}
      <img src="/images/bg-wave-1.png" alt="" className="bg-wave-1" />
      <img src="/images/bg-wave-2.png" alt="" className="bg-wave-2" />
      <img src="/images/bg-wave-3.png" alt="" className="bg-wave-3" />
      <img src="/images/bg-wave-4.png" alt="" className="bg-wave-4" />

      {/* ── NAVBAR ── */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Navbar isSolid={false} />
      </div>

      {/* ── HEADER REGISTRASI ── */}
      <div style={{ textAlign: "center", marginTop: "60px", marginBottom: "40px", position: "relative", zIndex: 10 }}>
        <h2 style={{ 
          fontFamily: "'Gabarito', sans-serif", 
          fontWeight: 400, 
          fontSize: "36px", 
          lineHeight: "34px", 
          color: "#DEE8FB", 
          margin: "0 0 8px 0" 
        }}>
          Registrasi
        </h2>
        <h1 style={{
          fontFamily: "'EXCRATCH', 'Impact', sans-serif", 
          fontWeight: 700,
          fontSize: "clamp(32px, 8vw, 64px)", 
          lineHeight: "clamp(48px, 10vw, 80px)", 
          margin: 0,
          background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent"
        }}>
          COMPETITION NAME
        </h1>
      </div>

      {/* ── AREA FORM INDIVIDU ── */}
      <div style={{ padding: "0 20px" }}>
        <div className="form-container">
          <div className="input-group">
            <label className="input-label">Nama Lengkap<span>*</span></label>
            <div className="custom-input-wrapper">
               <input type="text" className="custom-input" placeholder="Placeholder" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email<span>*</span></label>
            <div className="custom-input-wrapper">
               <input type="email" className="custom-input" placeholder="Placeholder" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Nomor Telepon<span>*</span></label>
            <div className="custom-input-wrapper">
               <input type="tel" className="custom-input" placeholder="Placeholder" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Student ID<span>*</span></label>
            <div className="custom-input-wrapper">
               <input type="text" className="custom-input" placeholder="Placeholder" />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Instansi (Universitas)<span>*</span></label>
            <div className="search-wrapper">
              <input type="text" className="custom-input" placeholder="Search..." />
              <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#ACC7FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 14L11.1 11.1" stroke="#ACC7FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}