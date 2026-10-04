'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import styles from './CompetitionType.module.css';
import CompetitionCard from './CompetitionCard';
import Navbar from '@/shared/components/Navbar/NavbarHifi/NavbarHifi';
import Footer from '@/shared/components/Footer/FooterHifi/FooterHifi';
import DashboardSidebar from '@/shared/components/DashboardSidebar/DashboardSidebar';

const NAVBAR_HEIGHT = 92;
const MOBILE_NAVBAR_HEIGHT = 60;
const DECOR_1 = '/deco/decor1.png';
const DECOR_2 = '/deco/decor2.png';
const DECOR_3 = '/deco/decor3.png';
const DECOR_4 = '/deco/decor4.png';

interface Competition {
  id: string;
  title: string;
  description: string;
  registrationDeadline: string;
  iconPath: string;
  iconAlt: string;
  buttonText: string;
  buttonDisabled?: boolean;
  gradientBackground: string;
  titleGradient: string;
}

const OPEN_CARD_BG =
  'linear-gradient(0deg, rgba(172, 199, 255, 0.5) 0%, rgba(81, 126, 218, 0.5) 99.04%)';

const competitions: Competition[] = [
  {
    id: 'safety-rescue',
    title: 'Safety and Rescue Robot Competition',
    description: 'Penjelasan singkat lomba Lorem ipsum dolor sit amet yadayada',
    registrationDeadline: 'XX Bulan 2026',
    iconPath: '/images/icon-sar.png',
    iconAlt: 'Safety and Rescue',
    buttonText: 'Registrasi',
    gradientBackground: OPEN_CARD_BG,
    titleGradient: 'linear-gradient(0deg, #FFAAAA 0%, #FFE4EC 100%)',
  },
  {
    id: 'microdrone',
    title: 'Microdrone Obstacle Race',
    description: 'Penjelasan singkat lomba Lorem ipsum dolor sit amet yadayada',
    registrationDeadline: 'XX Bulan 2026',
    iconPath: '/images/mor.png',
    iconAlt: 'Microdrone',
    buttonText: 'Registrasi',
    gradientBackground: OPEN_CARD_BG,
    titleGradient: 'linear-gradient(180deg, #E9DBF9 0%, #C08CFF 100%)',
  },
  {
    id: 'business-plan',
    title: 'Business Plan Competition',
    description: 'Penjelasan singkat lomba Lorem ipsum dolor sit amet yadayada',
    registrationDeadline: 'XX Bulan 2026',
    iconPath: '/images/icon-bpc.png',
    iconAlt: 'Business Plan',
    buttonText: 'Registrasi',
    gradientBackground: OPEN_CARD_BG,
    titleGradient: 'linear-gradient(0deg, #76DF62 0%, #D0FFC7 100%)',
  },
  {
    id: 'olimpiade',
    title: 'Olimpiade Engineering',
    description: 'Penjelasan singkat lomba Lorem ipsum dolor sit amet yadayada',
    registrationDeadline: 'CLOSED',
    iconPath: '/images/icon-olimpiade.png',
    iconAlt: 'Olimpiade',
    buttonText: 'CLOSED',
    buttonDisabled: true,
    gradientBackground: 'rgba(255, 255, 255, 0.2)',
    titleGradient:
      'linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))',
  },
];

export default function CompetitionType() {
  const [isSolid, setIsSolid] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSolid(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={styles.container}
      style={
        { '--mobile-navbar-height': `${MOBILE_NAVBAR_HEIGHT}px` } as CSSProperties
      }
    >
      <div className={styles.decorLayer} aria-hidden="true">
        <div className={`${styles.decor1} ${styles.desktopOnly}`}>
          <Image src={DECOR_1} alt="" fill sizes="50vw" style={{ objectFit: 'contain' }} />
        </div>
        <div className={`${styles.decor2} ${styles.desktopOnly}`}>
          <Image src={DECOR_2} alt="" fill sizes="100vw" style={{ objectFit: 'contain' }} />
        </div>
        <div className={`${styles.mDecor3} ${styles.mobileOnly}`}>
          <Image src={DECOR_3} alt="" fill sizes="260px" style={{ objectFit: 'contain' }} />
        </div>
        <div className={`${styles.mDecor1a} ${styles.mobileOnly}`}>
          <Image src={DECOR_1} alt="" fill sizes="640px" style={{ objectFit: 'contain' }} />
        </div>
        <div className={`${styles.mDecor4} ${styles.mobileOnly}`}>
          <Image src={DECOR_4} alt="" fill sizes="360px" style={{ objectFit: 'contain' }} />
        </div>
        <div className={`${styles.mDecor1b} ${styles.mobileOnly}`}>
          <Image src={DECOR_1} alt="" fill sizes="640px" style={{ objectFit: 'contain' }} />
        </div>
      </div>

      <Navbar isSolid={isSolid} />
      <DashboardSidebar
        topOffset={NAVBAR_HEIGHT}
        mobileMode="dropdown"
        mobileTopOffset={MOBILE_NAVBAR_HEIGHT}
        translucent
      />

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>
            <h1 className={styles.pageTitle}>
              <span className={styles.titleWord}>COMPETITION</span>{' '}
              <span className={styles.titleWord}>TYPE</span>
            </h1>

            <div className={styles.cardsGrid}>
              {competitions.map((competition) => (
                <CompetitionCard key={competition.id} {...competition} />
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}