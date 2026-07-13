'use client';

import { useEffect, useRef, useState } from 'react';

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const ROBOTO = "'Roboto Mono', monospace";
const ORBITRON = "'Orbitron', sans-serif";

const REF_WIDTH = 1440;
const REF_HEIGHT = 1024;

function pct(value: number, base: number): string {
  return `${(value / base) * 100}%`;
}

function responsiveFontSize(px: number): string {
  const vw = (px / REF_WIDTH) * 100;
  const min = px * 0.35;
  return `clamp(${min}px, ${vw.toFixed(3)}vw, ${px}px)`;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Setiap item punya posisi, arah masuk, dan text sendiri
const items = [
  // Section 1 - Object A (kiri, besar)
  {
    sectionIndex: 0,
    shape: { left: 31.17, top: 48.17, width: 522.59, height: 583.28 },
    label: { text: 'OBJECT 3D\nA', left: 60, top: 266.32 },
    text: { title: 'lorem ipsum', desc: LOREM, left: 571.33, top: 57.96, width: 576.97, align: 'left' as const },
    direction: 'left',
  },
  // Section 1 - Object B (kanan, kecil) — independent observer
  {
    sectionIndex: 0,
    shape: { left: 986.28, top: 604.48, width: 357.2, height: 357.2 },
    label: { text: 'OBJECT 3D\nB', left: 1000, top: 718.08 },
    text: { title: 'lorem ipsum', desc: LOREM, left: 313.48, top: 620, width: 603.14, align: 'right' as const },
    direction: 'right',
  },
  // Section 2 - Object C (kanan, besar)
  {
    sectionIndex: 1,
    shape: { left: 805.6, top: 42.71, width: 603.55, height: 517.25 },
    label: { text: 'OBJECT 3D\nC', left: 881.81, top: 285.2 },
    text: { title: 'lorem ipsum', desc: LOREM, left: 160, top: 160, width: 583.83, align: 'right' as const },
    direction: 'right',
  },
  // Section 2 - Object D (kiri, kecil) — independent observer
  {
    sectionIndex: 1,
    shape: { left: 42.73, top: 632.26, width: 357.2, height: 357.2 },
    label: { text: 'OBJECT 3D\nD', left: 87.83, top: 765.86 },
    text: { title: 'lorem ipsum', desc: LOREM, left: 435.7, top: 660, width: 640.55, align: 'left' as const },
    direction: 'left',
  },
]

// Section wrapper — hanya sebagai container layout
// A+B share section 0, C+D share section 1
function SectionWrapper({ children, sectionIndex }: { children: React.ReactNode, sectionIndex: number }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: `${REF_WIDTH} / ${REF_HEIGHT}`,
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function ObjectItem({ item }: { item: typeof items[0] }) {
  const shapeRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const textOpacity = Math.max(0, Math.min(1, (progress - 0.7) / 0.3))

  useEffect(() => {
    const handleScroll = () => {
      if (!shapeRef.current) return
      const rect = shapeRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const raw = (windowHeight - rect.top) / (windowHeight * 0.6)
      const clamped = Math.min(Math.max(raw, 0), 1)
      const eased = easeOut(clamped)

      setProgress(eased)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const translateX = `${(item.direction === 'left' ? -120 : 120) * (1 - progress)}%`

  return (
    <>
      {/* Shape */}
      <div
        ref={shapeRef}
        style={{
          position: 'absolute',
          top: pct(item.shape.top, REF_HEIGHT),
          left: pct(item.shape.left, REF_WIDTH),
          width: pct(item.shape.width, REF_WIDTH),
          height: pct(item.shape.height, REF_HEIGHT),
          background: 'linear-gradient(180deg, #D9D9D9 0%, #737373 100%)',
          borderRadius: 0,
          transform: `translateX(${translateX})`,
        }}
      />

      {/* Label */}
      <div style={{
        position: 'absolute',
        top: pct(item.label.top, REF_HEIGHT),
        left: pct(item.label.left, REF_WIDTH),
        fontFamily: ORBITRON,
        fontWeight: 700,
        fontSize: responsiveFontSize(40),
        color: '#000',
        whiteSpace: 'pre-line',
        lineHeight: 1.4,
        transform: `translateX(${translateX})`,
      }}>
        {item.label.text}
      </div>

      {/* Text */}
      <div style={{
        position: 'absolute',
        top: pct(item.text.top, REF_HEIGHT),
        left: pct(item.text.left, REF_WIDTH),
        width: pct(item.text.width, REF_WIDTH),
        opacity: textOpacity,
        transition: 'opacity 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          fontFamily: ROBOTO,
          fontWeight: 600,
          fontSize: responsiveFontSize(40),
          color: '#000',
          textAlign: item.text.align,
        }}>
          {item.text.title}
        </div>
        <div style={{
          fontFamily: ROBOTO,
          fontWeight: 400,
          fontSize: responsiveFontSize(28),
          color: '#000',
          lineHeight: '130%',
          textAlign: item.text.align,
        }}>
          {item.text.desc}
        </div>
      </div>
    </>
  )
}

export default function Object3DSection() {
  // Group items by sectionIndex
  const section0 = items.filter(i => i.sectionIndex === 0)
  const section1 = items.filter(i => i.sectionIndex === 1)

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffff' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${REF_WIDTH} / ${REF_HEIGHT}`, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        {section0.map((item, i) => <ObjectItem key={i} item={item} />)}
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${REF_WIDTH} / ${REF_HEIGHT}`, backgroundColor: '#ffffff', overflow: 'hidden' }}>
        {section1.map((item, i) => <ObjectItem key={i} item={item} />)}
      </div>
    </div>
  )
}