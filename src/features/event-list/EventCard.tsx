'use client';

import styles from './EventCard.module.css';

export interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  buttonText?: string;
  onReminder?: (id: string) => void;
}

export default function EventCard({
  id,
  title,
  description,
  date,
  time,
  buttonText = 'Reminder',
  onReminder,
}: EventCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.bottom}>
          <p className={styles.schedule}>
            <span>{date}</span>
            <span>{time}</span>
          </p>

          <button
            type="button"
            className={styles.button}
            onClick={() => onReminder?.(id)}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}