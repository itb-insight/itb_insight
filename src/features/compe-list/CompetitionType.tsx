'use client';

import styles from './CompetitionType.module.css';
import CompetitionCard from './CompetitionCard';

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
    iconPath: '/assets/icon-sar.png',
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
    iconPath: '/assets/icon-mo.png',
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
    iconPath: '/assets/icon-bpc.png',
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
    iconPath: '/assets/icon-oe.png',
    iconAlt: 'Olimpiade',
    buttonText: 'CLOSED',
    buttonDisabled: true,
    gradientBackground: 'rgba(255, 255, 255, 0.2)',
    titleGradient:
      'linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))',
  },
];

export default function CompetitionType() {
  return (
    <div className={styles.container}>
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
      </div>
    </div>
  );
}