'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import styles from './EventType.module.css';
import EventCard, { type EventCardProps } from './EventCard';
import Navbar from '@/shared/components/Navbar/NavbarHifi/NavbarHifi';
import Footer from '@/shared/components/Footer/FooterHifi/FooterHifi';
import DashboardSidebar from '@/shared/components/DashboardSidebar/DashboardSidebar';

const NAVBAR_HEIGHT = 92;
const MOBILE_NAVBAR_HEIGHT = 60;

const DECOR_1 = '/deco/decor1.png';
const DECOR_2 = '/deco/decor2.png';
const DECOR_3 = '/deco/decor3.png';
const DECOR_4 = '/deco/decor4.png';

const EVENT_DATE = 'Sabtu, 28 November 2026';
const EVENT_TIME_PLACEHOLDER = 'Pukul XX.XX - XX.XX';

const events: EventCardProps[] = [
  {
    id: 'insight-festival',
    title: 'Insight Festival',
    description: 'Festival sains dan teknologi dengan empat rangkaian acara utama.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'exhibition-manager',
    title: 'Exhibition Manager',
    description: 'Pameran karya civitas ITB dan teknologi inovatif industri.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'play-tech',
    title: 'Play-Tech',
    description: 'Permainan dan peraga interaktif untuk pengunjung festival.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'show-tech',
    title: 'Show-Tech',
    description: 'Peraga interaktif untuk menyampaikan ilmu TF ke masyarakat luas.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'insight-on-stage',
    title: 'Insight On Stage',
    description: 'Pertunjukan teknologi-artistik: drone light show, hologram, dan band.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'inspirates',
    title: 'Inspirates',
    description: 'Diseminasi ke sekolah untuk menginspirasi soal sains dan teknologi.',
    date: EVENT_DATE,
    time: EVENT_TIME_PLACEHOLDER,
  },
  {
    id: 'alumni-gathering',
    title: 'Alumni Gathering',
    description: 'Mempertemukan alumni dengan HMFT-ITB dan prodi',
    date: 'XX bulan 2026',
    time: 'Pukul 10.00 - 13.00',
  },
  {
    id: 'event-8',
    title: 'Nama Event',
    description: 'Penjelasan singkat event',
    date: 'XX bulan 2026',
    time: 'Pukul 10.00 - 13.00',
  },
];

export default function EventType() {
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
            <h1 className={styles.pageTitle}>EVENT TYPE</h1>

            <div className={styles.cardsGrid}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  onReminder={(id) => {
                    console.log('Reminder:', id);
                  }}
                />
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}