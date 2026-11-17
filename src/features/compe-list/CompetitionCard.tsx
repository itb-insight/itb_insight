import Link from 'next/link';
import Image from 'next/image';
import styles from './CompetitionCard.module.css';
import { externalLinkProps } from '@/features/competition/format';

const OPEN_CARD_BG =
  'linear-gradient(0deg, rgba(172, 199, 255, 0.5) 0%, rgba(81, 126, 218, 0.5) 99.04%)';
const CLOSED_CARD_BG = 'rgba(255, 255, 255, 0.2)';

export interface CompetitionCardProps {
  slug: string;
  title: string;
  description: string;
  registrationDeadline: string;
  iconPath: string;
  iconAlt: string;
  /** Registration form, set only while registration is open (see status.ts registerEnabled). */
  registerUrl: string | null;
  titleGradient: string;
}

export default function CompetitionCard({
  slug,
  title,
  description,
  registrationDeadline,
  iconPath,
  iconAlt,
  registerUrl,
  titleGradient,
}: CompetitionCardProps) {
  const closed = registerUrl === null;

  return (
    <div
      className={`${styles.card} ${closed ? styles.cardDisabled : ''}`}
      style={{ background: closed ? CLOSED_CARD_BG : OPEN_CARD_BG }}
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

      <p className={styles.description} title={description}>
        {description}
      </p>

      <div className={styles.registrationUntil}>
        {closed ? (
          <span>Pendaftaran Ditutup</span>
        ) : (
          <>
            <span>Registration Until:</span>
            <span>{registrationDeadline}</span>
          </>
        )}
      </div>

      {closed ? (
        <Link href={`/competition/${slug}`} className={styles.button}>
          Lihat Detail
        </Link>
      ) : (
        <a href={registerUrl} {...externalLinkProps(registerUrl)} className={styles.button}>
          Registrasi
        </a>
      )}
    </div>
  );
}
