import Image from "next/image";
import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { Button, EmptyState, Pill } from "@/components/ui";
import { buildMeetingSchedule, facebookUrl } from "@/lib/communities";
import { telHref, whatsappHref } from "@/lib/contact";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await prisma.organisation.findFirst({
    where: { slug, isPublic: true, profileStatus: ContentStatus.PUBLISHED },
    include: {
      events: {
        where: { isPublic: true, status: ContentStatus.PUBLISHED },
        orderBy: { startsAt: "asc" },
        take: 5,
      },
      announcements: {
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: 5,
      },
      articles: {
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: 5,
      },
    },
  });
  if (!org) notFound();

  const schedule = buildMeetingSchedule(org.meetingDays, org.meetingTimes);
  const callLink = org.publicPhone ? telHref(org.publicPhone) : null;
  const waLink = org.publicPhone ? whatsappHref(org.publicPhone) : null;
  const fbLink = facebookUrl(org.socialLinks);
  const hasContact =
    Boolean(org.publicEmail) ||
    Boolean(callLink) ||
    Boolean(waLink) ||
    Boolean(org.website) ||
    Boolean(fbLink);

  return (
    <div className="page-shell community-profile">
      <div className="container">
        <div className="community-hero">
          <div className="community-hero-cover">
            {org.coverImageUrl ? (
              <Image
                src={org.coverImageUrl}
                alt={`${org.name} cover photo`}
                fill
                priority
                sizes="100vw"
                className="community-hero-cover-img"
              />
            ) : (
              <div className="community-hero-cover-fallback" aria-hidden />
            )}
          </div>

          <div className="community-hero-identity">
            {org.logoUrl ? (
              <div className="community-hero-logo">
                <Image
                  src={org.logoUrl}
                  alt={`${org.name} logo`}
                  width={96}
                  height={96}
                  className="community-hero-logo-img"
                />
              </div>
            ) : null}

            <div className="community-hero-copy">
              <div className="community-hero-pills">
                {org.isSideChapelAccount ? <Pill>Side chapel</Pill> : <Pill>Community</Pill>}
                {org.affiliation ? <Pill>{org.affiliation}</Pill> : null}
              </div>
              <h1>{org.name}</h1>
              {org.description ? <p className="lede">{org.description}</p> : null}
            </div>
          </div>
        </div>

        <div className="community-layout">
          <div className="community-main">
            {org.mission ? (
              <section className="community-block">
                <h2>About</h2>
                <p>{org.mission}</p>
                {org.vision ? (
                  <>
                    <h3>Vision</h3>
                    <p>{org.vision}</p>
                  </>
                ) : null}
              </section>
            ) : org.vision ? (
              <section className="community-block">
                <h2>Vision</h2>
                <p>{org.vision}</p>
              </section>
            ) : null}

            {schedule.length > 0 ? (
              <section className="community-block">
                <h2>Meeting times</h2>
                <ul className="schedule-list">
                  {schedule.map((row) => (
                    <li key={`${row.day}-${row.detail}`}>
                      <strong>{row.day}</strong>
                      <span>{row.detail}</span>
                    </li>
                  ))}
                </ul>
                {org.visitorInfo ? <p className="visitor-note">{org.visitorInfo}</p> : null}
              </section>
            ) : org.visitorInfo ? (
              <section className="community-block">
                <h2>Visitor information</h2>
                <p>{org.visitorInfo}</p>
              </section>
            ) : null}

            {org.events.length > 0 ? (
              <section className="community-block">
                <h2>Upcoming events</h2>
                <ul className="profile-simple-list">
                  {org.events.map((event) => (
                    <li key={event.id}>
                      <strong>{event.title}</strong>
                      <span>{event.startsAt.toLocaleString("en-ZM")}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {org.articles.length > 0 ? (
              <section className="community-block">
                <h2>Stories</h2>
                <div className="profile-story-grid">
                  {org.articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="profile-story-card ui-card--interactive"
                    >
                      <div className="profile-story-media">
                        {article.coverImageUrl ? (
                          <Image
                            src={article.coverImageUrl}
                            alt=""
                            fill
                            sizes="(max-width: 720px) 100vw, 40vw"
                            className="profile-story-img"
                          />
                        ) : (
                          <div className="profile-story-fallback" aria-hidden />
                        )}
                      </div>
                      <div className="profile-story-body">
                        <h3>{article.title}</h3>
                        {article.summary ? <p>{article.summary}</p> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {org.announcements.length > 0 ? (
              <section className="community-block">
                <h2>Announcements</h2>
                <ul className="profile-simple-list">
                  {org.announcements.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      {item.summary ? <span>{item.summary}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {!org.mission &&
            !org.vision &&
            schedule.length === 0 &&
            !org.visitorInfo &&
            org.events.length === 0 &&
            org.articles.length === 0 &&
            org.announcements.length === 0 ? (
              <EmptyState title="More details coming soon" />
            ) : null}
          </div>

          <aside className="community-aside">
            <div className="community-contact-card">
              <h2>Contact</h2>
              {hasContact ? (
                <>
                  {org.publicPhone ? <p className="contact-line">{org.publicPhone}</p> : null}
                  {org.publicEmail ? <p className="contact-line">{org.publicEmail}</p> : null}
                  <div className="contact-actions">
                    {waLink ? (
                      <Button href={waLink} variant="primary" target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </Button>
                    ) : null}
                    {callLink ? (
                      <Button href={callLink} variant="secondary">
                        Call
                      </Button>
                    ) : null}
                    {org.publicEmail ? (
                      <Button href={`mailto:${org.publicEmail}`} variant="ghost">
                        Email
                      </Button>
                    ) : null}
                    {fbLink ? (
                      <Button href={fbLink} variant="ghost" target="_blank" rel="noopener noreferrer">
                        Facebook
                      </Button>
                    ) : null}
                    {org.website ? (
                      <Button href={org.website} variant="ghost" target="_blank" rel="noopener noreferrer">
                        Website
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="contact-muted">No public contact details published yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
