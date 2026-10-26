import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { addDays, format, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { Badge, Button, Card, EmptyState, Section } from "@/components/ui";
import { APP_TIMEZONE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type WeekItem = {
  key: string;
  kind: "event" | "weekly";
  timeLabel: string;
  title: string;
  organisationName?: string | null;
  organisationSlug?: string | null;
  venue?: string | null;
};

function dayKeyInLusaka(date: Date) {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

function lusakaWindow(now = new Date()) {
  const zonedNow = toZonedTime(now, APP_TIMEZONE);
  const todayLocal = startOfDay(zonedNow);
  const weekEndLocal = addDays(todayLocal, 7);
  return {
    rangeStart: fromZonedTime(todayLocal, APP_TIMEZONE),
    rangeEnd: fromZonedTime(weekEndLocal, APP_TIMEZONE),
    days: Array.from({ length: 7 }, (_, i) => {
      const localDay = addDays(todayLocal, i);
      return {
        key: format(localDay, "yyyy-MM-dd"),
        label: format(localDay, "EEEE d MMM"),
        weekday: format(localDay, "EEEE"),
      };
    }),
  };
}

function meetingMatchesDay(meetingDays: string[], weekday: string) {
  const target = weekday.toLowerCase();
  return meetingDays.some((d) => d.trim().toLowerCase() === target);
}

export async function ThisWeekAtChapel() {
  const { rangeStart, rangeEnd, days } = lusakaWindow();

  let events: Array<{
    id: string;
    title: string;
    startsAt: Date;
    location: string | null;
    organisation: { name: string; slug: string } | null;
  }> = [];
  let organisations: Array<{
    id: string;
    name: string;
    slug: string;
    meetingDays: string[];
    meetingTimes: string | null;
  }> = [];

  try {
    const [eventRows, orgRows] = await Promise.all([
      prisma.communityEvent.findMany({
        where: {
          isPublic: true,
          status: ContentStatus.PUBLISHED,
          startsAt: { gte: rangeStart, lt: rangeEnd },
        },
        orderBy: { startsAt: "asc" },
        include: {
          organisation: { select: { name: true, slug: true } },
        },
      }),
      prisma.organisation.findMany({
        where: {
          isPublic: true,
          profileStatus: ContentStatus.PUBLISHED,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          meetingDays: true,
          meetingTimes: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);
    events = eventRows;
    organisations = orgRows.filter((org) => org.meetingDays.length > 0);
  } catch {
    // DB may be offline during local bootstrap; render empty week.
  }

  const byDay = new Map<string, WeekItem[]>();
  for (const day of days) byDay.set(day.key, []);

  for (const event of events) {
    const key = dayKeyInLusaka(event.startsAt);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    bucket.push({
      key: `event-${event.id}`,
      kind: "event",
      timeLabel: formatInTimeZone(event.startsAt, APP_TIMEZONE, "HH:mm"),
      title: event.title,
      organisationName: event.organisation?.name,
      organisationSlug: event.organisation?.slug,
      venue: event.location,
    });
  }

  for (const day of days) {
    for (const org of organisations) {
      if (!meetingMatchesDay(org.meetingDays, day.weekday)) continue;
      byDay.get(day.key)!.push({
        key: `weekly-${org.id}-${day.key}`,
        kind: "weekly",
        timeLabel: org.meetingTimes?.trim() || "Time TBA",
        title: org.name,
        organisationName: org.name,
        organisationSlug: org.slug,
        venue: null,
      });
    }
  }

  for (const day of days) {
    byDay.get(day.key)!.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "event" ? -1 : 1;
      return a.timeLabel.localeCompare(b.timeLabel);
    });
  }

  return (
    <Section
      id="this-week"
      eyebrow="This week"
      title="This week at the chapel"
      subtitle="Public events and weekly community meetings for the next seven days (Africa/Lusaka)."
      action={
        <Button href="/communities" variant="ghost">
          All communities
        </Button>
      }
    >
      <div className="this-week-list">
        {days.map((day) => {
          const items = byDay.get(day.key) ?? [];
          return (
            <Card key={day.key} as="article" className="this-week-day">
              <p className="ui-eyebrow" style={{ marginBottom: "0.75rem" }}>
                {day.label}
              </p>
              {items.length === 0 ? (
                <EmptyState title="Nothing listed yet" />
              ) : (
                <ul className="this-week-items">
                  {items.map((item) => (
                    <li key={item.key}>
                      <div className="this-week-item-meta">
                        <span className="ui-eyebrow" style={{ margin: 0 }}>
                          {item.timeLabel}
                        </span>
                        {item.kind === "weekly" ? <Badge tone="gold">Weekly</Badge> : null}
                      </div>
                      <strong>
                        {item.organisationSlug && item.kind === "weekly" ? (
                          <Link href={`/communities/${item.organisationSlug}`}>{item.title}</Link>
                        ) : (
                          item.title
                        )}
                      </strong>
                      {item.organisationName && item.kind === "event" ? (
                        <p>
                          {item.organisationSlug ? (
                            <Link href={`/communities/${item.organisationSlug}`}>
                              {item.organisationName}
                            </Link>
                          ) : (
                            item.organisationName
                          )}
                        </p>
                      ) : null}
                      {item.venue ? <p className="ui-eyebrow">{item.venue}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <p className="ui-subtitle" style={{ marginTop: "1.5rem" }}>
        Looking for a fellowship? <Link href="/communities">Browse the community directory</Link>.
      </p>
    </Section>
  );
}
