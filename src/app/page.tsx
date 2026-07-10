'use client';

import { useState } from 'react';
// Pastikan path import ini sesuai dengan letak asli file ExhibitionPage & ContentPage kamu!
import ExhibitionPage from '@/features/exhibition/ExhibitionPage'; 
import ContentPage from '@/features/exhibition/ContentPage';

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: '100vh', 
        backgroundColor: '#ffffff', 
        margin: 0, 
        padding: 0, 
        position: 'relative'
      }}
    >
      {!showContent ? (
        <ExhibitionPage onExplore={() => setShowContent(true)} />
      ) : (
        <ContentPage onBack={() => setShowContent(false)} />
      )}
    </div>
  );
}