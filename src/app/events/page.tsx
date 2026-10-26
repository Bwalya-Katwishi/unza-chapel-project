import Image from "next/image";
import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community events" };

export default async function EventsPage() {
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

  const events = await prisma.communityEvent
    .findMany({
      where: {
        isPublic: true,
        status: ContentStatus.PUBLISHED,
        endsAt: { gte: recentCutoff },
      },
      include: { organisation: true },
      orderBy: { startsAt: "desc" },
    })
    .catch(() => []);

  const upcoming = events.filter((e) => e.endsAt >= now);
  const recent = events.filter((e) => e.endsAt < now);

  function EventList({ items }: { items: typeof events }) {
    if (items.length === 0) return <div className="empty">None to show right now.</div>;
    return (
      <>
        {items.map((event) => (
          <article key={event.id} className="editorial-item event-list-item">
            {event.coverImageUrl && (
              <div className="event-list-thumb">
                <Image src={event.coverImageUrl} alt="" width={220} height={280} />
              </div>
            )}
            <div>
              <p className="meta">
                {event.startsAt.toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" })}
                {event.endsAt < now ? " · Past event" : ""}
              </p>
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
              <p className="meta">
                {event.organisation?.name || "Chaplaincy"} · {event.location || "Location TBA"}
              </p>
            </div>
          </article>
        ))}
      </>
    );
  }

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="page-title">
          <p className="meta">Calendar</p>
          <h1>Community events</h1>
          <p className="lede">
            Worship, service, and campus life at the UNZA Christian Centre — including current works and recent gatherings.
          </p>
        </div>

        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--brown-deep)" }}>Happening now & upcoming</h2>
          <EventList items={upcoming} />
        </section>

        <section>
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--brown-deep)" }}>Recent</h2>
          <EventList items={recent} />
        </section>
      </div>
    </div>
  );
}
