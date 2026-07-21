'use client';

import React from 'react';

export default function SeminarLearnMorePage({ onBack }: { onBack?: () => void }) {
  return (
    <div
      onClick={onBack}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'rgba(76, 76, 76, 1)',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        overflowX: 'hidden',
        cursor: onBack ? 'pointer' : 'default' 
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap'); body { margin: 0; padding: 0; }` }} />

      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ width: '1440px', position: 'relative', height: '1024px', cursor: 'default' }}
      >
        
        <h1
          style={{
            position: 'absolute',
            top: '104.59px',
            left: '489px',
            width: '462px',
            height: '80px',
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 600,
            fontSize: '64px',
            lineHeight: '80px',
            color: '#FFFFFF',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Tech Seminar
        </h1>

        <h2
          style={{
            position: 'absolute',
            top: '201.17px',
            left: '588.78px',
            width: '265px',
            height: '48px',
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 600,
            fontSize: '40px',
            lineHeight: '48px',
            color: '#FFFFFF',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Session details
        </h2>

        <div
          style={{
            position: 'absolute',
            top: '296.36px',
            left: '345.29px',
            width: '727.04px',
            height: '375.18px',
            borderRadius: '19px',
            background: 'rgba(217, 217, 217, 1)',
          }}
        />

        <p
          style={{
            position: 'absolute',
            top: '718.74px',
            left: '353.88px',
            width: '740.83px',
            height: '204px',
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 400,
            fontSize: '28px',
            lineHeight: '34px',
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          Each Tech Seminar session runs for about an hour, including a live Q&amp;A with the speaker. Slides and a short recap will be shared with registered attendees afterward, so you can revisit the material or catch up on a session you missed. Seating is first-come, first-served — arrive a few minutes early to grab a spot near the front.
        </p>

      </div>
    </div>
  );
}