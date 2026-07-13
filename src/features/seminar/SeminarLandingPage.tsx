'use client';

import React, { useState, useEffect } from 'react';
import { SEMINAR_CARDS, DETAIL_CONTENT } from './data';
import Navbar from "@/shared/components/Navbar/Navbar"

const POINTY_HEX_CLIP = 'polygon(50% 0%, 93.301% 25%, 93.301% 75%, 50% 100%, 6.699% 75%, 6.699% 25%)';
const SVG_POINTS = "50,0 93.301,25 93.301,75 50,100 6.699,75 6.699,25";
const GRADIENT_BG = 'linear-gradient(180deg, #C1BDBD 0%, #7B7B7B 58.17%, #737373 96.15%)';

// Polygons data
const HERO_BG_HEXES = [
  { w: 127.24, h: 127.24, y: 486.1, x: 79.1, blur: 'blur(21.7px)' },
  { w: 173.52, h: 173.52, y: 576.64, x: -30.81, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 715.48, x: 27.94, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 909.22, x: -86.84, blur: 'none' },
  { w: 182.09, h: 182.09, y: 762.95, x: 281.23, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 910.1, x: 142.72, blur: 'none' },
  { w: 229.56, h: 229.56, y: 898.61, x: 372.28, blur: 'none' },
  { w: 192.58, h: 192.58, y: 752.46, x: 505.55, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 898.61, x: 605.22, blur: 'none' },
  { w: 229.56, h: 229.56, y: 921.59, x: 830.96, blur: 'none' },
  { w: 229.56, h: 229.56, y: 715.48, x: 946.18, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 921.59, x: 1060.96, blur: 'none' },
  { w: 173.49, h: 173.49, y: 583.82, x: 1088.99, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 715.48, x: 1179.12, blur: 'blur(21.7px)' },
  { w: 144.18, h: 144.18, y: 598.47, x: 1333.21, blur: 'blur(21.7px)' },
  { w: 229.56, h: 229.56, y: 921.59, x: 1290.52, blur: 'none' }
];

const HERO_OUTLINE_HEXES = [
  { w: 182.7, h: 182.7, y: 624.13, x: 172.66 },
  { w: 112.07, h: 112.07, y: 860.98, x: 38.63 },
  { w: 254.83, h: 254.83, y: 892.77, x: 130.08 },
  { w: 112.07, h: 112.07, y: 842.58, x: 431.02 },
  { w: 182.7, h: 182.7, y: 830.24, x: 740.04 },
  { w: 183.73, h: 183.73, y: 818.24, x: 1074 },
  { w: 182.7, h: 182.7, y: 670.56, x: 1325.66 },
  { w: 107.65, h: 107.65, y: 470.4, x: 1240.08 }
];

const CONTENT_BG_HEXES = [
  { w: 143.20, h: 143.20, y: 110.23, x: 74.5, blur: 'blur(44.4px)' },
  { w: 190.32, h: 190.32, y: 110.23, x: 280.5, blur: 'blur(44.4px)' },
  { w: 126.36, h: 126.36, y: 110.23, x: 542.04, blur: 'none' },
  { w: 194.03, h: 194.03, y: 110.23, x: 737.76, blur: 'blur(44.4px)' },
  { w: 114.78, h: 114.78, y: 110.03, x: 1236.51, blur: 'blur(44.4px)' },
  { w: 69.64, h: 69.64, y: 250.65, x: 74.5, blur: 'blur(16.2px)' },
  { w: 51.87, h: 51.87, y: 240.60, x: 605.22, blur: 'blur(16.2px)' },
  { w: 51.87, h: 51.87, y: 230.93, x: 1242.03, blur: 'blur(16.2px)' },
];

const CONTENT_OUTLINE_HEXES = [
  { w: 114.66, h: 114.66, y: 80.54, x: 433.11 },
  { w: 142.35, h: 142.35, y: 40.15, x: 993.16 },
  { w: 92.08, h: 92.08, y: 70.83, x: 1316.60 },
];

export default function SeminarLandingPage({ onLearnMore }: { onLearnMore: () => void }) {
  const [scale, setScale] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateScale = () => {
      const baseWidth = document.documentElement.clientWidth;
      const newScale = baseWidth / 1440;
      setScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const HERO_HEIGHT = 1000;
  const CONTENT_HEIGHT = 410 + (6 * 435.99) + (5 * 140) + 100;
  const END_HEIGHT = 1000;
  const TOTAL_HEIGHT = HERO_HEIGHT + CONTENT_HEIGHT + END_HEIGHT;

  const MIRROR_AXIS = 1265;
  
  const renderMirrorBg = (hex: any, idx: number, isHero: boolean) => {
    const absY = hex.y + (isHero ? 0 : HERO_HEIGHT);
    const mirrorY = MIRROR_AXIS - (absY + hex.h);
    return <div key={`mbg-${idx}`} style={{ position: 'absolute', width: hex.w, height: hex.h, top: mirrorY, left: hex.x, background: GRADIENT_BG, backdropFilter: hex.blur, clipPath: POINTY_HEX_CLIP, zIndex: 0 }} />;
  };

  const renderMirrorOutline = (out: any, idx: number, isHero: boolean) => {
    const absY = out.y + (isHero ? 0 : HERO_HEIGHT);
    const mirrorY = MIRROR_AXIS - (absY + out.h);
    return (
      <div key={`mout-${idx}`} style={{ position: 'absolute', width: out.w, height: out.h, top: mirrorY, left: out.x, zIndex: 1 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}><polygon points={SVG_POINTS} fill="none" stroke="white" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>
      </div>
    );
  };

  if (!isMounted) return <div style={{ width: '100%', minHeight: '100vh', background: 'rgba(76, 76, 76, 1)' }} />;

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'rgba(76, 76, 76, 1)', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap'); body { margin: 0; padding: 0; overflow-x: hidden; }` }} />
      
      <div style={{ width: '100%', height: `${TOTAL_HEIGHT * scale}px`, position: 'relative' }}>
        <div style={{ 
          width: '1440px', 
          height: `${TOTAL_HEIGHT}px`, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left', 
          position: 'absolute', 
          top: 0, 
          left: 0 
        }}>
          
          {/* HERO */}
          <div style={{ position: 'relative', width: '100%', height: `${HERO_HEIGHT}px` }}>
            <Navbar isSolid={true} />
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '4000px', height: '80px', background: 'rgba(217, 217, 217, 1)', zIndex: 10 }} />
            
            <h1 style={{ position: 'absolute', top: '375.85px', left: '38.63px', fontFamily: 'Roboto Mono', fontWeight: 700, fontSize: '110px', lineHeight: '120%', color: '#FFF', margin: 0, zIndex: 10 }}>Tech Seminar</h1>
            <p style={{ position: 'absolute', top: '524.22px', left: '41.88px', fontFamily: 'Roboto Mono', fontWeight: 600, fontSize: '64px', lineHeight: '80px', color: '#FFF', margin: 0, zIndex: 10 }}>Lorem ipsum</p>
            <p style={{ position: 'absolute', top: '598.46px', left: '42.13px', fontFamily: 'Roboto Mono', fontWeight: 600, fontSize: '64px', lineHeight: '80px', color: '#FFF', margin: 0, zIndex: 10 }}>Lorem ipsum</p>

            {HERO_BG_HEXES.map((hex, i) => (
              <div key={`hero-bg-${i}`} style={{ position: 'absolute', width: hex.w, height: hex.h, top: hex.y, left: hex.x, background: GRADIENT_BG, backdropFilter: hex.blur, clipPath: POINTY_HEX_CLIP, zIndex: 0 }} />
            ))}
            {HERO_OUTLINE_HEXES.map((out, i) => (
              <div key={`hero-out-${i}`} style={{ position: 'absolute', width: out.w, height: out.h, top: out.y, left: out.x, zIndex: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}><polygon points={SVG_POINTS} fill="none" stroke="white" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg>
              </div>
            ))}
          </div>

          {/* CONTENT*/}
          <div style={{ position: 'relative', width: '100%', height: `${CONTENT_HEIGHT}px` }}>
            {CONTENT_BG_HEXES.map((hex, i) => (
              <div key={`content-bg-${i}`} style={{ position: 'absolute', width: hex.w, height: hex.h, top: hex.y, left: hex.x, background: GRADIENT_BG, backdropFilter: hex.blur, clipPath: POINTY_HEX_CLIP, zIndex: 0 }} />
            ))}
            {CONTENT_OUTLINE_HEXES.map((out, i) => (
              <div key={`content-out-${i}`} style={{ position: 'absolute', width: out.w, height: out.h, top: out.y, left: out.x, zIndex: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}><polygon points={SVG_POINTS} fill="none" stroke="white" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>
              </div>
            ))}

            <div style={{ position: 'relative', zIndex: 10, paddingTop: '410px' }}>
              {SEMINAR_CARDS.map((card, idx) => {
                const isLast = idx === SEMINAR_CARDS.length - 1;
                return (
                  <div key={card.id} style={{ position: 'relative', width: '100%', height: '435.99px', marginBottom: isLast ? '0' : '140px' }}>
                    <div style={{ position: 'absolute', top: '0', left: '189.25px', width: '361.5px', height: '435.99px', borderRadius: '19px', background: 'rgba(217, 217, 217, 1)' }} />
                    <h2 style={{ position: 'absolute', top: '-23.69px', left: '605.22px', width: '462px', height: '80px', fontFamily: 'Roboto Mono', fontWeight: 600, fontSize: '64px', lineHeight: '80px', color: '#FFF', margin: 0 }}>
                      {card.title}
                    </h2>
                    <p style={{ position: 'absolute', top: '82px', left: '605.22px', width: '623.03px', fontFamily: 'Roboto Mono', fontWeight: 600, fontSize: '40px', lineHeight: '48px', color: '#FFF', margin: 0 }}>
                      {card.description}
                    </p>
                    <div
                      onClick={onLearnMore}
                      style={{ position: 'absolute', top: '331.36px', left: '627.71px', width: '328.86px', height: '64.66px', borderRadius: '18px', background: 'rgba(217, 217, 217, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'Roboto Mono', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#000000' }}>
                        Learn more
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* END */}
          <div style={{ position: 'relative', width: '100%', height: `${END_HEIGHT}px` }}>
            {HERO_BG_HEXES.map((hex, i) => renderMirrorBg(hex, i, true))}
            {CONTENT_BG_HEXES.map((hex, i) => renderMirrorBg(hex, i, false))}
            {HERO_OUTLINE_HEXES.map((out, i) => renderMirrorOutline(out, i, true))}
            {CONTENT_OUTLINE_HEXES.map((out, i) => renderMirrorOutline(out, i, false))}
            
            <div style={{ position: 'absolute', top: '455.61px', left: '618.8px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(217, 217, 217, 1)', zIndex: 10 }} />
            <img src="/kincir angin.png" alt="Kincir Angin Placeholder" style={{ position: 'absolute', top: '452.7px', left: '742.04px', width: '100.09px', height: '102.9px', zIndex: 10, objectFit: 'contain' }} />
            <div style={{ position: 'absolute', top: '608.82px', left: '484.64px', width: '477.47px', height: '97.35px', borderRadius: '40px', background: 'rgba(217, 217, 217, 1)', zIndex: 10 }} />
            <p style={{ position: 'absolute', top: '729.32px', left: '455.15px', width: '573.78px', height: '96px', fontFamily: 'Roboto Mono', fontWeight: 500, fontSize: '16px', lineHeight: '24px', textAlign: 'center', color: '#FFF', margin: 0, zIndex: 10 }}>
              {DETAIL_CONTENT.endDescription}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}