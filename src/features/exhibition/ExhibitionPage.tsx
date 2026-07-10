'use client';

import Image from 'next/image';
import { useEffect } from 'react';

interface ExhibitionPageProps {
  onExplore: () => void;
}

export default function ExhibitionPage({ onExplore }: ExhibitionPageProps) {
  // Efek ini otomatis memaksa elemen HTML & Body bawaan proyek menjadi putih total 
  // khusus saat membuka halaman Exhibition ini aja.
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalMargin = document.body.style.margin;
    const originalPadding = document.body.style.padding;

    document.body.style.backgroundColor = '#ffffff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.margin = originalMargin;
      document.body.style.padding = originalPadding;
    };
  }, []);

  return (
    /* Wrapper Utama: Menghilangkan sisa gap/space di tepi layar */
    <div 
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#000000', 
        minHeight: '100vh', 
        width: '100vw', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        overflowX: 'hidden', 
        fontFamily: "'Roboto Mono', monospace",
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      
      {/* 1. Shape Kotak Abu-abu di Atas (Full lebar layar tanpa sela) */}
      <div 
        style={{ 
          width: '100%', 
          height: '149px', 
          backgroundColor: '#D9D9D9',
          flexShrink: 0,
          margin: 0
        }}
      ></div>

      {/* 2. Container Konten Utama (Center Vertikal & Horizontal) */}
      <div 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexGrow: 1,
          width: '100%', 
          maxWidth: '1440px', 
          padding: '0 40px',
          paddingBottom: '149px', /* Kompensasi pas di tengah */
          boxSizing: 'border-box'
        }}
      >
        
        {/* Pembungkus Teks Judul */}
        <div style={{ textAlign: 'center', userSelect: 'none', zIndex: 1 }}>
          <h1 
            style={{ 
              fontWeight: 700, 
              fontSize: '140px', 
              lineHeight: '115%', 
              color: '#000000', 
              margin: 0,
              letterSpacing: '-2px',
              fontFamily: "'Roboto Mono', monospace"
            }}
          >
            TECHNOLOGY
          </h1>
          <h1 
            style={{ 
              fontWeight: 700, 
              fontSize: '140px', 
              lineHeight: '115%', 
              color: '#000000', 
              marginTop: '-20px', 
              marginBottom: 0,
              letterSpacing: '-2px',
              fontFamily: "'Roboto Mono', monospace"
            }}
          >
            EXHIBITION
          </h1>
        </div>

        {/* 3. Kincir Angin (Ditumpuk di tengah-tengah koordinat teks) */}
        <button
          onClick={onExplore}
          style={{ 
            position: 'absolute', 
            top: '38%', 
            left: '50%', 
            transform: 'translate(-50%, -50%) rotate(8.39deg)', 
            width: '330px',  
            height: '395px', 
            background: 'none', 
            border: 'none', 
            padding: 0, 
            cursor: 'pointer', 
            zIndex: 10,
            outline: 'none'
          }}
          title="Klik untuk melihat konten"
        >
          <Image
            src="/kincir%20angin.png" 
            alt="Kincir Angin"
            width={453}
            height={470}
            priority
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain' 
            }}
          />
        </button>

      </div>
    </div>
  );
}