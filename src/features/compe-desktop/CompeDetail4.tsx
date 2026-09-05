import React from "react";

const vw = (px: number) => `${(px / 1728) * 100}vw`;
const fluid = (px: number, minFactor = 0.62, maxFactor = 1.15) =>
  `clamp(${(px * minFactor).toFixed(2)}px, ${vw(px)}, ${(px * maxFactor).toFixed(2)}px)`;

const colors = {
  bgTop: "#091B3F",
  bgMiddle: "#132E62",
  bgBottom: "#294D97",
  ice100: "#DEE8FB",
  ice200: "#ACC7FF",
  pink100: "#FFE4EC",
  pink200: "#FFAAAA",
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

const timelineItems = [
  { title: "Registration", date: "22 Agustus 2026", side: "right" },
  { title: "Try Out", date: "2026", side: "left" },
  { title: "Technical Meeting", date: "2026", side: "right" },
  { title: "Pre-Elim", date: "2026", side: "left" },
  { title: "Semifinal", date: "27 November 2026", side: "right" },
  { title: "Final", date: "28 November 2026", side: "left" },
  { title: "Awarding", date: "28 November 2026", side: "right" },
] as const;

export default function SARLandingPage() {
  return (
    <main
      style={{
        width: "100%",
        maxWidth: "1728px",
        margin: "0 auto",
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
          overflow: "hidden",
        }}
      >
        <img
          src="/images/shape1.png"
          alt="Background Shape 1"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(10),
            left: fluid(323.9),
            width: fluid(320.73),
            height: fluid(320.73),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(8)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape2.png"
          alt="Background Shape 2"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(14),
            left: fluid(900.9),
            width: fluid(543.73),
            height: fluid(320.73),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(8)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape3.png"
          alt="Background Shape 3"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(2),
            left: fluid(708.9),
            width: fluid(543.73),
            height: fluid(543.73),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(6)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape4.png"
          alt="Background Shape 4"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(2),
            left: fluid(1285.56),
            width: fluid(158),
            height: fluid(158),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(6)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape5.png"
          alt="Background Shape 5"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(360),
            left: fluid(1251.56),
            width: fluid(226),
            height: fluid(226),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(6)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape6.png"
          alt="Background Shape 6"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(450),
            left: fluid(516),
            width: fluid(927),
            height: fluid(350),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(5)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <img
          src="/images/shape7.png"
          alt="Background Shape 7"
          loading="lazy"
          style={{
            position: "absolute",
            top: fluid(200),
            left: fluid(323),
            width: fluid(543),
            height: fluid(543),
            opacity: 0.8,
            borderWidth: "0px",
            transform: "rotate(0deg)",
            pointerEvents: "none",
            zIndex: 0,
            filter: `blur(${fluid(5)})`,
            WebkitFilter: `blur(${fluid(20)})`,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: fluid(1400),
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: fluid(48),
          }}
        >
          <img
            src="/images/oe.png"
            alt="OE Logo"
            loading="lazy"
            style={{
              width: fluid(350),
              height: fluid(300),
              borderRadius: fluid(47),
              objectFit: "cover",
            }}
          />

          <h1
            style={{
              backgroundImage: `linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)`,
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
            Olimpiade Engineering
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
            Kompetisi berbasis olimpiade untuk siswa SMA/SMK/MA/sederajat di seluruh Indonesia dengan tujuan mengenal dunia<br />
            engineering di perguruan tinggi.
          </p>

          <div style={{ display: "flex", gap: fluid(24) }}>
            <button style={buttonFilled}>Silabus</button>
            <button style={buttonFilled}>Guidebook</button>
          </div>
        </div>
      </section>

      {/* WRAPPER COUNTDOWN & FEE */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src="/images/shape9.png"
          alt="Background Shape 9"
          loading="lazy"
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: fluid(2108),
            height: fluid(654),
            transform: "translateY(-50%)",
            opacity: 1,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <img
          src="/images/neuron.png"
          alt="Background Neuron"
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

        {/* REGIST COUNTDOWN */}
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
            alt="Background Shape 8"
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
            REGISTRATION COUNTDOWN
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
              <span style={{ ...textPlainIce, fontFamily: fontExcratch, fontSize: fluid(96), lineHeight: 1.2 }}>00</span>
              <span style={{ ...textPlainIce, fontFamily: fontExcratch, fontSize: fluid(96), lineHeight: 1 }}>:</span>
              <span style={{ ...textPlainIce, fontFamily: fontExcratch, fontSize: fluid(96), lineHeight: 1 }}>00</span>

              <span style={{ ...textPlainIce, fontFamily: fontGabarito, fontWeight: 700, fontSize: fluid(32), lineHeight: 1 }}>DAYS</span>
              <span style={{ ...textPlainIce, fontFamily: fontGabarito, fontWeight: 700, fontSize: fluid(32), lineHeight: 1 }}>:</span>
              <span style={{ ...textPlainIce, fontFamily: fontGabarito, fontWeight: 700, fontSize: fluid(32), lineHeight: 1 }}>HOURS</span>
            </div>
          </div>
        </section>

        {/* REGIST FEE */}
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
              IDR 000.000
            </p>
          </div>
        </section>
      </div>

      {/* WRAPPER PRIZEPOOL, TIMELINE, CONTACT */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src="/images/shape10.png"
          alt="Background Shape 10"
          loading="lazy"
          style={{
            position: "absolute",
            top: "65%",
            left: "65%",
            width: fluid(1300.52),
            height: fluid(2000.79),
            transform: "translate(-50%, -50%)",
            opacity: 1,
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

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: fluid(13),
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...cardBase,
                  width: fluid(180),
                  height: fluid(250),
                }}
              />
            ))}
          </div>
        </section>

        {/* TIMELINE */}
        <section style={{ position: "relative", zIndex: 1, padding: `${fluid(48)} ${fluid(64)}` }}>
          <img
            src="/images/shape11.png"
            alt="Background Shape 11"
            loading="lazy"
            style={{
              position: "absolute",
              top: fluid(100),
              left: 120,
              width: fluid(400.79),
              height: fluid(466.18),
              transform: "translateX(-40%)",
              opacity: 0.25,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <img
            src="/images/shape12.png"
            alt="Background Shape 12"
            loading="lazy"
            style={{
              position: "absolute",
              top: fluid(100),
              left: 1300,
              width: fluid(500.79),
              height: fluid(664.18),
              transform: "translateX(-40%)",
              opacity: 0.25,
              pointerEvents: "none",
              zIndex: 0,
              backdropFilter: "blur(17.275020599365234px)",
              WebkitBackdropFilter: "blur(17.275020599365234px)",
            }}
          />

          <h2
            style={{
              ...textGlowIce,
              fontFamily: fontExcratch,
              fontSize: fluid(54),
              textAlign: "left",
              margin: 0,
              marginBottom: fluid(48),
              position: "relative",
              zIndex: 1,
            }}
          >
            TIMELINE
          </h2>

          <div style={{ position: "relative", minHeight: fluid(770), zIndex: 1 }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: fluid(24),
                transform: "translateX(-50%)",
                width: fluid(4),
                height: fluid(700),
                borderRadius: fluid(4),
                background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
                border: "4px solid",
                borderImageSource: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
                borderImageSlice: 1,
              }}
            />

            {timelineItems.map((item, i) => {
              const top = fluid(24 + i * 115);
              return (
                <React.Fragment key={item.title}>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top,
                      width: fluid(24),
                      height: fluid(24),
                      borderRadius: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
                      borderImageSource: "linear-gradient(180deg, #DEE8FB 0%, #ACC7FF 100%)",
                      borderImageSlice: 1,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: fluid(24 + i * 115 - 20),
                      width: fluid(420),
                      ...(item.side === "right"
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
                      {item.date}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>

        {/* CONTACT */}
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
          <button style={buttonOutline}>Contact Us</button>
          <button style={buttonFilled}>Register Now</button>
        </div>
      </div>
    </main>
  );
}