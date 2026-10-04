'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './CompetitionCard.module.css';

interface CompetitionCardProps {
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

export default function CompetitionCard({
  id,
  title,
  description,
  registrationDeadline,
  iconPath,
  iconAlt,
  buttonText,
  buttonDisabled = false,
  gradientBackground,
  titleGradient,
}: CompetitionCardProps) {
  return (
    <div
      className={`${styles.card} ${buttonDisabled ? styles.cardDisabled : ''}`}
      style={{ background: gradientBackground }}
    >
      <div className={styles.iconContainer}>
        <Image
          src={iconPath}
          alt={iconAlt}
          width={111}
          height={130}
          className={styles.icon}
          priority={false}
        />
      </div>

      <h3 className={styles.title} style={{ backgroundImage: titleGradient }}>
        {title}
      </h3>

      <p className={styles.description}>{description}</p>

      <div className={styles.registrationUntil}>
        <span>Registration Until:</span>
        <span>{registrationDeadline}</span>
      </div>

      {buttonDisabled ? (
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDisabled}`}
          disabled
        >
          {buttonText}
        </button>
      ) : (
        <Link href={`/competition/${id}`} className={styles.button}>
          {buttonText}
        </Link>
      )}
    </div>
  );
}