import styles from './EventType.module.css';
import EventCard, { type EventCardProps } from './EventCard';

export default function EventType({ events }: { events: EventCardProps[] }) {
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>
            <h1 className={styles.pageTitle}>EVENT TYPE</h1>

            <div className={styles.cardsGrid}>
              {events.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
