import Link from 'next/link';
import styles from './EventCard.module.css';
import { isDisabledMapHref } from '@/lib/maps';

export interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  /** null = event not open yet (Coming Soon): the button is rendered disabled */
  buttonHref: string | null;
  buttonLabel: string;
}

export default function EventCard({
  title,
  description,
  date,
  location,
  buttonHref,
  buttonLabel,
}: EventCardProps) {
  // Same rule as the /event button: no link yet, or the map while maps are disabled.
  const disabled = buttonHref === null || isDisabledMapHref(buttonHref);

  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description} title={description}>
            {description}
          </p>
        </div>

        <div className={styles.bottom}>
          <p className={styles.schedule}>
            <span>{date}</span>
            <span>{location}</span>
          </p>

          {disabled ? (
            <span
              aria-disabled="true"
              title="Coming Soon"
              className={`${styles.button} ${styles.buttonDisabled}`}
            >
              {buttonLabel}
            </span>
          ) : (
            <Link href={buttonHref} className={styles.button} aria-label={`${buttonLabel}: ${title}`}>
              {buttonLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
