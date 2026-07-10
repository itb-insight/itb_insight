'use client';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TextEl extends Box {
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: string;
  textAlign?: 'left' | 'right';
}

interface FrameSpec {
  shapes: Box[];
  texts: TextEl[];
}

const REF_WIDTH = 1440;
const REF_HEIGHT = 1024;

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const ROBOTO = "'Roboto Mono', monospace";
const ORBITRON = "'Orbitron', sans-serif";

// Frame 1
const frame1: FrameSpec = {
  shapes: [
    { left: -99.62, top: 154.8, width: 357.2, height: 357.2 },
    { left: 1181, top: 619.17, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D A',
      left: -121.21,
      top: 294.23,
      width: 346,
      height: 160,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 80,
      letterSpacing: '0em',
    },
    {
      text: 'OBJECT 3D B',
      left: 1226,
      top: 752.77,
      width: 346,
      height: 160,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 80,
      letterSpacing: '0em',
    },
  ],
};

// Frame 2
const frame2: FrameSpec = {
  shapes: [
    { left: 73.06, top: 154.8, width: 357.2, height: 357.2 },
    { left: 986.28, top: 604.48, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D A',
      left: 75.86,
      top: 297.7,
      width: 351.6,
      height: 71.39,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 80,
      letterSpacing: '0em',
    },
    {
      text: 'OBJECT 3D B',
      left: 991.88,
      top: 718.08,
      width: 346,
      height: 160,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 80,
      letterSpacing: '0em',
    },
  ],
};

// Frame 3
const frame3: FrameSpec = {
  shapes: [
    { left: 31.17, top: 48.17, width: 522.59, height: 583.28 },
    { left: 986.28, top: 604.48, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D A',
      left: 97.15,
      top: 266.32,
      width: 432.66,
      height: 195.95,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
    {
      text: 'lorem ipsum',
      left: 571.33,
      top: 57.96,
      width: 265,
      height: 48,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'left',
    },
    {
      text: LOREM,
      left: 580.46,
      top: 167.32,
      width: 576.97,
      height: 272,
      fontFamily: ROBOTO,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 34,
      textAlign: 'left',
    },
    {
      text: 'OBJECT 3D B',
      left: 991.88,
      top: 718.08,
      width: 346,
      height: 160,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 80,
      letterSpacing: '0em',
    },
    {
      text: 'lorem ipsum',
      left: 652.37,
      top: 735.08,
      width: 265,
      height: 48,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'left',
    },
    {
      text: LOREM,
      left: 313.48,
      top: 826,
      width: 603.14,
      height: 238,
      fontFamily: ROBOTO,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 34,
      textAlign: 'right',
    },
  ],
};

// Frame 4
const frame4: FrameSpec = {
  shapes: [
    { left: -176.95, top: 72.86, width: 522.59, height: 583.28 },
    { left: 1286, top: 607.24, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D A',
      left: -110.97,
      top: 287.49,
      width: 390.62,
      height: 195.95,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
    {
      text: 'OBJECT 3D B',
      left: 1331,
      top: 740.84,
      width: 267,
      height: 120,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
  ],
};

// Frame 5
const frame5: FrameSpec = {
  shapes: [
    { left: 1232.14, top: 82.45, width: 357.2, height: 357.2 },
    { left: -201.05, top: 616.36, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D C',
      left: 1277.24,
      top: 216.05,
      width: 267,
      height: 120,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
    {
      text: 'OBJECT 3D D',
      left: -155.95,
      top: 749.96,
      width: 267,
      height: 120,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
  ],
};

// Frame 6
const frame6: FrameSpec = {
  shapes: [
    { left: 805.6, top: 42.71, width: 603.55, height: 517.25 },
    { left: 42.73, top: 632.26, width: 357.2, height: 357.2 },
  ],
  texts: [
    {
      text: 'OBJECT 3D C',
      left: 881.81,
      top: 285.2,
      width: 451.14,
      height: 217.8,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
    {
      text: 'lorem ipsum',
      left: 513.7,
      top: 83.27,
      width: 265,
      height: 48,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'left',
    },
    {
      text: LOREM,
      left: 194.88,
      top: 159.26,
      width: 583.83,
      height: 272,
      fontFamily: ROBOTO,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 34,
      textAlign: 'right',
    },
    {
      text: 'OBJECT 3D D',
      left: 87.83,
      top: 765.86,
      width: 267,
      height: 120,
      fontFamily: ORBITRON,
      fontWeight: 700,
      fontSize: 40,
      lineHeight: 60,
      letterSpacing: '-0.011em',
    },
    {
      text: 'lorem ipsum',
      left: 435.7,
      top: 777.86,
      width: 265,
      height: 48,
      fontFamily: ROBOTO,
      fontWeight: 600,
      fontSize: 40,
      lineHeight: 48,
      textAlign: 'left',
    },
    {
      text: LOREM,
      left: 435.7,
      top: 845.46,
      width: 640.55,
      height: 238,
      fontFamily: ROBOTO,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 34,
      textAlign: 'left',
    },
  ],
};

const frames: FrameSpec[] = [frame1, frame2, frame3, frame4, frame5, frame6];

function pct(value: number, base: number): string {
  return `${(value / base) * 100}%`;
}

function responsiveFontSize(px: number): string {
  const vw = (px / REF_WIDTH) * 100;
  const min = px * 0.35;
  return `clamp(${min}px, ${vw.toFixed(3)}vw, ${px}px)`;
}

function FrameShape({ box }: { box: Box }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: pct(box.top, REF_HEIGHT),
        left: pct(box.left, REF_WIDTH),
        width: pct(box.width, REF_WIDTH),
        height: pct(box.height, REF_HEIGHT),
        background: 'linear-gradient(180deg, #D9D9D9 0%, #737373 100%)',
      }}
    />
  );
}

function FrameText({ t }: { t: TextEl }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: pct(t.top, REF_HEIGHT),
        left: pct(t.left, REF_WIDTH),
        width: pct(t.width, REF_WIDTH),
        fontFamily: t.fontFamily,
        fontWeight: t.fontWeight,
        fontSize: responsiveFontSize(t.fontSize),
        lineHeight: `${(t.lineHeight / t.fontSize) * 100}%`,
        letterSpacing: t.letterSpacing,
        textAlign: t.textAlign ?? 'left',
        color: '#000',
        whiteSpace: 'pre-line',
      }}
    >
      {t.text}
    </div>
  );
}

function ObjectFrame({ spec }: { spec: FrameSpec }) {
  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: '100%',
        aspectRatio: `${REF_WIDTH} / ${REF_HEIGHT}`,
        scrollSnapAlign: 'start',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      {spec.shapes.map((box, i) => (
        <FrameShape key={`shape-${i}`} box={box} />
      ))}
      {spec.texts.map((t, i) => (
        <FrameText key={`text-${i}`} t={t} />
      ))}
    </div>
  );
}

export default function Object3DSection() {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="object3d-track"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {frames.map((spec, i) => (
          <ObjectFrame key={i} spec={spec} />
        ))}
      </div>

      <style jsx>{`
        .object3d-track {
          scrollbar-width: none;
        }
        .object3d-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}