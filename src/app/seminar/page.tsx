'use client';

import { useState } from 'react';
import SeminarLandingPage from '@/features/seminar/SeminarLandingPage';
import SeminarLearnMorePage from '@/features/seminar/SeminarLearnMore';
import { COLORS } from '@/features/seminar/data';

export default function Home() {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        margin: 0,
        padding: 0,
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {!showDetail ? (
        <SeminarLandingPage onLearnMore={() => setShowDetail(true)} />
      ) : (
        <SeminarLearnMorePage onBack={() => setShowDetail(false)} />
      )}
    </div>
  );
}