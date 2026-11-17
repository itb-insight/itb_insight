import EventType from '@/features/event-list/EventType';
import type { EventCardProps } from '@/features/event-list/EventCard';
import { getEvents } from '@/features/events/data';

export const metadata = {
  title: 'Event Types | ITB Insight',
  description: 'Explore all event types available at ITB Insight',
};

/** "Tech-\nXhibition" -> "Tech-Xhibition", "Insight\nFestival" -> "Insight Festival" */
function singleLine(title: string): string {
  return title.replace(/-\n/g, '-').replace(/\n/g, ' ');
}

/**
 * Cards come from the same data as /event (src/features/events/data.ts): title, description,
 * date, location and the button (label + link, Coming Soon when the event has no link yet).
 */
export default async function EventListPage() {
  const events = await getEvents();

  const cards: EventCardProps[] = events.map((e) => ({
    id: e.slug,
    title: singleLine(e.title),
    description: e.description,
    date: e.date ? `${e.day}, ${e.dateLabel}` : e.dateLabel,
    location: e.location,
    buttonHref: e.buttonHref,
    buttonLabel: e.buttonLabel,
  }));

  return <EventType events={cards} />;
}
