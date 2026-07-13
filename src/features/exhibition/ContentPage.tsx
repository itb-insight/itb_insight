'use client';

import { useEffect } from 'react';
import Object3DSection from './Object3DSection';

interface ContentPageProps {
  onBack: () => void;
}

interface ContentColumnProps {
  number: number;
  isDark: boolean;
  title: string;
  description: string;
}

function ContentColumn({
  number,
  isDark,
  title,
  description,
}: ContentColumnProps) {
  return (
    <div
      style={{
        width: "320px",
        paddingBottom: "32px",
        background: isDark
          ? "rgba(123,123,123,1)"
          : "rgba(217,217,217,1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: isDark ? "#fff" : "#000",
        boxSizing: "border-box",
        paddingTop: "24px",
        fontFamily: "'Roboto Mono', monospace",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "257px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "48px",
            fontWeight: 600,
            lineHeight: "72px",
            letterSpacing: "-1.1%",
          }}
        >
          {number}
        </div>
        <div
          style={{
            width: "257px",
            height: "469px",
            borderRadius: "15px",
            background:
              "linear-gradient(180deg,#4C4C4C 0%,#B2B2B2 100%)",
          }}
        />
      </div>
      <h3
        style={{
          marginTop: "30px",
          marginBottom: "8px",
          fontSize: "28px",
          fontWeight: 600,
          lineHeight: "34px",
          textAlign: "center",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          width: "226px",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: 500,
          lineHeight: "24px",
          margin: 0,
          color: isDark
            ? "rgba(255,255,255,.95)"
            : "rgba(0,0,0,.85)",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function ContentPage({ onBack }: ContentPageProps) {
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalOverflow = document.body.style.overflow;

    document.body.style.backgroundColor = '#ffffff';
    document.body.style.overflow = 'auto'; 

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const columnsData = [
    { number: 1, isDark: false, title: 'lorem ipsum', description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsum' },
    { number: 2, isDark: true, title: 'lorem ipsum', description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsum' },
    { number: 3, isDark: false, title: 'lorem ipsum', description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsum' },
    { number: 4, isDark: true, title: 'lorem ipsum', description: 'lorem ipsum lorem ipsum lorem ipsum lorem ipsum' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Roboto Mono', monospace",
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          height: '149px',
          backgroundColor: 'rgba(217, 217, 217, 1)',
          flexShrink: 0
        }}
      />

      <div
        style={{
          flexGrow: 1,
          backgroundColor: '#ffffff',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <h2
          style={{
            fontSize: '64px',
            fontWeight: 600,
            lineHeight: '80px',
            color: '#000000',
            margin: '4px 0 0 0',
            fontFamily: "'Roboto Mono', monospace",
            flexShrink: 0
          }}
        >
          CONTENT
        </h2>

        <div
          style={{
            width: '100%',
            marginTop: '60px',
            paddingBottom: '80px',
            paddingLeft: '90px',
            paddingRight: '90px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'stretch'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'center',
              width: '100%',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)'
            }}
          >
            {columnsData.map((col) => (
              <ContentColumn
                key={col.number}
                number={col.number}
                isDark={col.isDark}
                title={col.title}
                description={col.description}
              />
            ))}
          </div>
        </div>

        <Object3DSection />
      </div>
    </div>
  );
}