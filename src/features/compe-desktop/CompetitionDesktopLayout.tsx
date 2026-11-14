import React from "react";
import { externalLinkProps, formatRupiah, joinIndonesian, lowestFee } from "@/features/competition/format";
import type { Competition } from "@/features/competition/types";
import { registerEnabled } from "@/features/competition/status";
import CompetitionInfo, { FeeTiers } from "@/features/competition/info/CompetitionInfo";
import DesktopCountdown from "@/features/compe-desktop/DesktopCountdown";

const vw = (px: number) => `${(px / 1728) * 100}vw`;
/**
 * Skala dari desain 1728px mengikuti lebar layar, TANPA batas atas, supaya
 * halaman selalu menutupi layar selebar penuh (seperti background-size:
 * cover) alih-alih berhenti di 1728px dan menyisakan pita gelap di kiri
 * dan kanan monitor lebar. Batas bawah (minFactor) menjaga teks tetap
 * terbaca di jendela sempit. Halaman /event dan versi mobile skalanya
 * juga mengikuti lebar tanpa batas atas.
 */
const fluid = (px: number, minFactor = 0.62) =>
  `max(${(px * minFactor).toFixed(2)}px, ${vw(px)})`;

const colors = {
  bgTop: "#091B3F",
  bgMiddle: "#132E62",
  bgBottom: "#294D97",
  ice100: "#DEE8FB",
  ice200: "#ACC7FF",
  bodyText: "#E6F4FF",
  btnText: "#1B3B7D",
};

const textPlainIce: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, ${colors.ice100} 0%, ${colors.ice200} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

const textGlowIce: React.CSSProperties = {
  ...textPlainIce,
  opacity: 0.8,
  filter: `drop-shadow(0px 0px 10px rgba(172, 199, 255, 0.5))`,
};

const fontExcratch = "'EXCRATCH', 'Orbitron', sans-serif";
const fontGabarito = "'Gabarito', sans-serif";

const cardBase: React.CSSProperties = {
  borderRadius: fluid(40),
  border: `${fluid(4)} solid rgba(222, 232, 251, 0.45)`,
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: `0 ${fluid(8)} ${fluid(32)} rgba(0, 0, 0, 0.15)`,
};

const buttonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: fluid(52),
  minWidth: fluid(150),
  padding: `${fluid(12)} ${fluid(28)}`,
  borderRadius: fluid(16),
  fontFamily: fontGabarito,
  fontSize: fluid(16),
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
};

const buttonFilled: React.CSSProperties = {
  ...buttonBase,
  borderRadius: fluid(20),
  border: `${fluid(4)} solid transparent`,
  background: `
    linear-gradient(0deg, ${colors.ice100} 0%, ${colors.ice200} 100%) padding-box,
    linear-gradient(180deg, ${colors.ice100} 0%, ${colors.ice200} 100%) border-box
  `,
  color: colors.btnText,
};

const buttonOutline: React.CSSProperties = {
  ...buttonBase,
  borderRadius: fluid(20),
  border: `${fluid(4)} solid transparent`,
  background: `
    linear-gradient(${colors.bgBottom}, ${colors.bgBottom}) padding-box,
    linear-gradient(180deg, ${colors.ice100} 0%, ${colors.ice200} 100%) border-box
  `,
  color: colors.bodyText,
};

const HERO_SHAPES = [
  { src: "/images/shape1.png.png", top: 10, left: 323.9, w: 320.73, h: 320.73, blur: 8 },
  { src: "/images/shape2.png.png", top: 14, left: 900.9, w: 543.73, h: 320.73, blur: 8 },
  { src: "/images/shape3.png.png", top: 2, left: 708.9, w: 543.73, h: 543.73, blur: 6 },
  { src: "/images/shape4.png", top: 2, left: 1285.56, w: 158, h: 158, blur: 6 },
  { src: "/images/shape5.png", top: 360, left: 1251.56, w: 226, h: 226, blur: 6 },
  { src: "/images/shape6.png", top: 450, left: 516, w: 927, h: 350, blur: 5 },
  { src: "/images/shape7.png", top: 200, left: 323, w: 543, h: 543, blur: 5 },
];

const TIMELINE_STEP = 115;

export default function CompetitionDesktopLayout({
  competition,
  countdown,
}: {
  competition: Competition;
  /** Target & judul hitung mundur (status.ts countdownFor) */
  countdown: { target: string; title: [string, string] };
}) {
  const d = competition.desktop;
  const heroButtons = [
    { label: "Silabus", href: competition.syllabusUrl },
    { label: "Guidebook", href: competition.guidebookUrl },
  ].filter((b): b is { label: string; href: string } => b.href !== null);
  const fee = lowestFee(competition.fees.map((f) => f.amount));
  const prize = competition.prize;
  const timelineGradient = `linear-gradient(180deg, ${d.timelineFrom} 0%, ${d.timelineTo} 100%)`;
  const descriptionLines = d.descriptionLines ?? [competition.description];

  // Garis timeline dari titik pertama ke titik terakhir.
  const lineHeight = Math.max(0, competition.timeline.length - 1) * TIMELINE_STEP;
  const timelineHeight = lineHeight + 70;

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.bgTop} 0%, ${colors.bgMiddle} 40%, ${colors.bgBottom} 100%)`,
        color: colors.bodyText,
        fontFamily: fontGabarito,
        overflowX: "hidden",
      }}
    >
      <style>{`
        @font-face {
          font-family: 'EXCRATCH';
          src: url('/fonts/EXCRATCH-Bold.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: `${fluid(80)} ${fluid(64)} ${fluid(100)}`,
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(27, 59, 125, 0.5) 0%, rgba(172, 199, 255, 0.4) 100%)",
          // Sengaja TIDAK overflow: hidden. Bayangan lingkaran blur di hero
          // (HERO_SHAPES) menjulur melewati tepi bawah hero; kalau dipotong,
          // tampak garis datar/putus tepat di atas judul countdown. Potongan
          // horizontal tetap dilakukan oleh <main> (overflowX: hidden).
        }}
      >
        {HERO_SHAPES.map((s) => (
          <img
            key={s.src}
            src={s.src}
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              top: fluid(s.top),
              left: fluid(s.left),
              width: fluid(s.w),
              height: fluid(s.h),
              opacity: 0.8,
              pointerEvents: "none",
              zIndex: 0,
              filter: `blur(${fluid(s.blur)})`,
              WebkitFilter: `blur(${fluid(20)})`,
            }}
          />
        ))}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: fluid(d.heroMaxWidth),
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: fluid(48),
          }}
        >
          <img
            src={d.logoSrc}
            alt={`Logo ${competition.title}`}
            loading="lazy"
            style={{
              width: fluid(d.logoWidth),
              height: fluid(300),
              borderRadius: fluid(47),
              objectFit: "cover",
            }}
          />

          <h1
            style={{
              backgroundImage: `linear-gradient(180deg, ${d.titleFrom} 0%, ${d.titleTo} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              fontFamily: fontGabarito,
              fontWeight: 700,
              fontSize: fluid(48),
              lineHeight: fluid(56),
              margin: 0,
            }}
          >
            {competition.title}
          </h1>

          <p
            style={{
              fontSize: fluid(20),
              lineHeight: fluid(24),
              color: colors.bodyText,
              margin: 0,
              maxWidth: "100%",
            }}
          >
            {descriptionLines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </p>

          {/* Tombol hanya tampil kalau tautannya sudah ada (null = masih TBA). */}
          {heroButtons.length > 0 ? (
            <div style={{ display: "flex", gap: fluid(24) }}>
              {heroButtons.map((b) => (
                <a key={b.label} href={b.href} {...externalLinkProps(b.href)} style={buttonFilled}>
                  {b.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* WRAPPER COUNTDOWN & FEE */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src="/images/shape9.png"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: fluid(2108),
            height: fluid(654),
            transform: "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <img
          src="/images/neuron.png"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: "30%",
            left: fluid(-300),
            width: fluid(660),
            height: fluid(950),
            transform: "translateY(-30%) rotate(90.95deg)",
            opacity: 0.8,
            pointerEvents: "none",
            filter: `blur(${fluid(4)})`,
            WebkitFilter: `blur(${fluid(20)})`,
            zIndex: 0,
          }}
        />

        {/* REGISTRATION COUNTDOWN */}
        <section
          style={{
            position: "relative",
            padding: `${fluid(80)} ${fluid(64)} ${fluid(100)}`,
            background:
              "linear-gradient(180deg, rgba(172, 199, 255, 0.4) 0%, rgba(9, 27, 63, 0) 100%)",
          }}
        >
          <img
            src="/images/shape8.png"
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              top: "50%",
              left: fluid(-150),
              width: fluid(840),
              height: fluid(654),
              transform: "translateY(-50%)",
              opacity: 0.9,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <h2
            style={{
              ...textGlowIce,
              fontFamily: fontExcratch,
              fontWeight: 700,
              fontSize: fluid(54),
              lineHeight: 1.2,
              textAlign: "center",
              margin: 0,
              marginBottom: fluid(48),
              letterSpacing: "1px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {`${countdown.title[0]} ${countdown.title[1]}`.toUpperCase()}
          </h2>

          <div
            style={{
              ...cardBase,
              maxWidth: fluid(600),
              width: "100%",
              margin: "0 auto",
              padding: `${fluid(40)} ${fluid(48)}`,
              boxSizing: "border-box",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                justifyItems: "center",
                columnGap: fluid(32),
                rowGap: fluid(12),
                width: "100%",
              }}
            >
              <DesktopCountdown
                target={countdown.target}
                digitStyle={{ ...textPlainIce, fontFamily: fontExcratch, fontSize: fluid(96), lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}
                colonStyle={{ ...textPlainIce, fontFamily: fontExcratch, fontSize: fluid(96), lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
                labelStyle={{ ...textPlainIce, fontFamily: fontGabarito, fontWeight: 700, fontSize: fluid(32), lineHeight: 1 }}
              />
            </div>
          </div>
        </section>

        {/* REGISTRATION FEE */}
        <section style={{ position: "relative", padding: `${fluid(48)} ${fluid(64)}` }}>
          <div
            style={{
              ...cardBase,
              maxWidth: fluid(900),
              margin: "0 auto",
              padding: `${fluid(48)} ${fluid(32)}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: fluid(16),
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <h2
              style={{
                ...textGlowIce,
                fontFamily: fontExcratch,
                fontSize: fluid(48),
                margin: 0,
              }}
            >
              REGISTRATION FEE
            </h2>
            <p
              style={{
                ...textPlainIce,
                fontFamily: fontExcratch,
                fontSize: fluid(56),
                margin: 0,
              }}
            >
              {formatRupiah(fee)}
            </p>
            {competition.fees.length > 1 ? (
              <>
                <p style={{ fontFamily: fontGabarito, fontSize: fluid(18), color: colors.ice200, margin: 0 }}>
                  Harga terendah · {competition.fees.length} gelombang
                </p>
                <div
                  style={
                    {
                      width: "100%",
                      marginTop: fluid(8),
                      "--accent-from": competition.accentFrom,
                      "--accent-to": competition.accentTo,
                    } as React.CSSProperties
                  }
                >
                  <FeeTiers competition={competition} />
                </div>
              </>
            ) : (
              <p style={{ fontFamily: fontGabarito, fontSize: fluid(32), color: colors.ice200, margin: 0 }}>
                {competition.fees[0].unit}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* WRAPPER PRIZEPOOL, TIMELINE, CONTACT */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src="/images/shape10.png"
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            top: "65%",
            left: "65%",
            width: fluid(1300.52),
            height: fluid(2000.79),
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* PRIZEPOOL */}
        <section style={{ position: "relative", zIndex: 1, padding: `${fluid(48)} ${fluid(64)}` }}>
          <h2
            style={{
              ...textGlowIce,
              fontFamily: fontExcratch,
              fontSize: fluid(54),
              textAlign: "center",
              margin: 0,
              marginBottom: fluid(40),
            }}
          >
            TOTAL PRIZEPOOL
          </h2>

          {/*
            Di desain: enam kotak kosong (nominal belum ada). Nominal aslinya
            8 digit atau belum bernominal ("Uang Tunai"), jadi tampil sebagai
            satu kartu, sama seperti versi mobile (PrizePool.tsx).
          */}
          <div
            style={{
              ...cardBase,
              maxWidth: fluid(900),
              margin: "0 auto",
              padding: `${fluid(40)} ${fluid(32)}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: fluid(12),
              textAlign: "center",
            }}
          >
            <p
              style={{
                ...textPlainIce,
                fontFamily: fontExcratch,
                fontSize: fluid(64),
                lineHeight: 1.1,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
                textTransform: "uppercase",
              }}
            >
              {prize.amount !== null ? formatRupiah(prize.amount) : (prize.fallback ?? "TBA")}
            </p>
            {prize.extras?.length ? (
              <p style={{ fontFamily: fontGabarito, fontSize: fluid(42), color: colors.ice100, margin: 0 }}>
                + {joinIndonesian(prize.extras)}
              </p>
            ) : null}
          </div>
        </section>

        {/* TIMELINE */}
        <section style={{ position: "relative", zIndex: 1, padding: `${fluid(48)} ${fluid(64)}` }}>
          <img
            src="/images/shape11.png"
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              top: fluid(100),
              // shape11.png terpotong lurus di sisi KIRI; tepi itu harus selalu
              // di luar layar (di jendela sempit, left: 120px membuatnya muncul).
              left: fluid(-30),
              width: fluid(400.79),
              height: fluid(466.18),
              opacity: 0.25,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <img
            src="/images/shape12.png"
            alt=""
            loading="lazy"
            style={{
              position: "absolute",
              top: fluid(100),
              // shape12.png terpotong lurus di sisi kanannya (piksel paling
              // kanan masih terisi), jadi sisi itu harus jatuh di luar layar.
              // Dulu left: 1300 + translateX(-40%) menaruh tepi potongnya di
              // 92,6% lebar halaman, terlihat sebagai garis vertikal.
              right: fluid(-40),
              width: fluid(500.79),
              height: fluid(664.18),
              opacity: 0.25,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <h2
            style={{
              ...textGlowIce,
              fontFamily: fontExcratch,
              fontSize: fluid(54),
              textAlign: "center",
              margin: 0,
              marginBottom: fluid(48),
              position: "relative",
              zIndex: 1,
            }}
          >
            TIMELINE
          </h2>

          <div style={{ position: "relative", minHeight: fluid(timelineHeight), zIndex: 1 }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: fluid(24),
                transform: "translateX(-50%)",
                width: fluid(4),
                height: fluid(lineHeight),
                borderRadius: fluid(4),
                background: timelineGradient,
                border: "4px solid",
                borderImageSource: timelineGradient,
                borderImageSlice: 1,
              }}
            />

            {competition.timeline.map((item, i) => {
              const isRight = i % 2 === 0;
              return (
                <React.Fragment key={item.id}>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: fluid(24 + i * TIMELINE_STEP),
                      width: fluid(24),
                      height: fluid(24),
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)",
                      background: timelineGradient,
                      borderImageSource: timelineGradient,
                      borderImageSlice: 1,
                      boxShadow: `0 0 ${fluid(12)} ${d.timelineTo}CC`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: fluid(24 + i * TIMELINE_STEP - 20),
                      width: fluid(420),
                      ...(isRight
                        ? { left: `calc(50% + ${fluid(40)})`, textAlign: "left" }
                        : { right: `calc(50% + ${fluid(40)})`, textAlign: "right" }),
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontFamily: fontGabarito,
                        fontWeight: 600,
                        fontSize: fluid(28),
                        color: colors.ice100,
                        marginBottom: fluid(4),
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontFamily: fontGabarito,
                        fontWeight: 400,
                        fontSize: fluid(20),
                        color: colors.ice200,
                      }}
                    >
                      {item.dateLabel}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>

        {/* DETAIL LOMBA (Form Informasi Competition) */}
        <CompetitionInfo competition={competition} showFees={false} variant="desktop" />

        {/* CONTACT & REGISTER */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "center",
            gap: fluid(24),
            padding: `${fluid(32)} ${fluid(64)} ${fluid(80)}`,
          }}
        >
          {/* Contact Us disembunyikan selama kontak resminya belum ada. */}
          {competition.contactUrl ? (
            <a href={competition.contactUrl} {...externalLinkProps(competition.contactUrl)} style={buttonOutline}>
              Contact Us
            </a>
          ) : null}
          {competition.registerUrl && registerEnabled(competition) ? (
            <a href={competition.registerUrl} {...externalLinkProps(competition.registerUrl)} style={buttonFilled}>
              Register Now
            </a>
          ) : (
            <span aria-disabled="true" style={{ ...buttonOutline, opacity: 0.75, cursor: "default" }}>
              Pendaftaran Ditutup
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
