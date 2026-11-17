import CompetitionType from '@/features/compe-list/CompetitionType';
import type { CompetitionCardProps } from '@/features/compe-list/CompetitionCard';
import { getAllCompetitions } from '@/features/competition/data';
import { registerEnabled } from '@/features/competition/status';

export const metadata = {
  title: 'Competition Types | ITB Insight',
  description: 'Explore all competition types available at ITB Insight',
};

const deadlineFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

/**
 * Cards come from the same data as /competition/[slug] (src/features/competition/data.ts),
 * so title, description, deadline and the register button never drift from the detail page.
 * The register button follows the detail page's "Register Now": open only when
 * registerEnabled (registerUrl + REGISTER_OPEN_<code>=true), otherwise the card links to the
 * detail page instead.
 */
export default async function CompetitionListPage() {
  const competitions = await getAllCompetitions();

  const cards: CompetitionCardProps[] = competitions.map((c) => {
    const open = registerEnabled(c);
    return {
      slug: c.slug,
      title: c.title,
      description: c.description,
      registrationDeadline: deadlineFormat.format(new Date(c.registration.closes)),
      iconPath: c.iconSrc,
      iconAlt: c.title,
      registerUrl: open ? c.registerUrl : null,
      titleGradient: `linear-gradient(180deg, ${c.titleFrom} 0%, ${c.titleTo} 100%)`,
    };
  });

  return <CompetitionType competitions={cards} />;
}
