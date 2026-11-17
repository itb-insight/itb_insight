import styles from './CompetitionType.module.css';
import CompetitionCard, { type CompetitionCardProps } from './CompetitionCard';

export default function CompetitionType({
  competitions,
}: {
  competitions: CompetitionCardProps[];
}) {
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
                <CompetitionCard key={competition.slug} {...competition} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
