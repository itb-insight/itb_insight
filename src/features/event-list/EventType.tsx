'use client';

import styles from './EventType.module.css';
import EventCard, { type EventCardProps } from './EventCard';

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
  return (
    <div className={styles.container}>
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
      </div>
    </div>
  );
}