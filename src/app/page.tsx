import Image from "next/image";
import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { CommunityCard } from "@/components/community-card";
import { ThisWeekAtChapel } from "@/components/ThisWeekAtChapel";
import { Button, EmptyState, Section } from "@/components/ui";
import { APP_NAME, CHAPEL_HERO_IMAGE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [articles, communities] = await Promise.all([
      prisma.article.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      prisma.organisation.findMany({
        where: { isPublic: true, profileStatus: ContentStatus.PUBLISHED },
        orderBy: { name: "asc" },
        take: 6,
        select: {
          id: true,
          name: true,
          slug: true,
          affiliation: true,
          coverImageUrl: true,
          logoUrl: true,
        },
      }),
    ]);
    return { articles, communities, dbReady: true as const };
  } catch {
    return { articles: [], communities: [], dbReady: false as const };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <section className="hero hero--home">
        <Image
          src={CHAPEL_HERO_IMAGE}
          alt="UNZA Chapel and Christian Centre exterior"
          fill
          priority
          className="hero-image"
          sizes="100vw"
        />
        <div className="hero-veil" aria-hidden />
        <div className="container hero-content">
          <p className="eyebrow">University of Zambia Chaplaincy</p>
          <h1>{APP_NAME}</h1>
          <p>A calm home for campus worship, community life, and booking chapel spaces.</p>
          <div className="hero-actions">
            <Button href="#this-week" variant="primary" className="btn-on-dark">
              See this week
            </Button>
            <Button href="/bookings/request" variant="ghost" className="btn-on-dark">
              Book a space
            </Button>
          </div>
        </div>
      </section>

      {!data.dbReady && (
        <div className="container" style={{ marginTop: "1.5rem" }}>
          <div className="alert error">
            Database is not connected yet. Configure PostgreSQL (see README), run migrations and seed,
            then refresh.
          </div>
        </div>
      )}

      <ThisWeekAtChapel />

      <Section
        className="ui-section--flush"
        eyebrow="Communities"
        title="Find a fellowship"
        subtitle="Campus Christian communities that gather at and around the chapel."
        action={
          <Button href="/communities" variant="ghost">
            View all
          </Button>
        }
      >
        {data.communities.length === 0 ? (
          <EmptyState title="No communities published yet" />
        ) : (
          <div className="community-card-grid">
            {data.communities.map((org) => (
              <CommunityCard
                key={org.id}
                slug={org.slug}
                name={org.name}
                affiliation={org.affiliation}
                coverImageUrl={org.coverImageUrl}
                logoUrl={org.logoUrl}
              />
            ))}
          </div>
        )}
      </Section>

      <Section
        className="ui-section--flush"
        eyebrow="Stories"
        title="Latest from the chapel"
        subtitle="Articles and photo stories from the Christian Centre community."
        action={
          <Button href="/articles" variant="ghost">
            All articles
          </Button>
        }
      >
        {data.articles.length === 0 ? (
          <EmptyState title="No stories published yet" />
        ) : (
          <div className="story-card-grid">
            {data.articles.map((item) => (
              <Link
                key={item.id}
                href={`/articles/${item.slug}`}
                className="story-card ui-card--interactive"
              >
                <div className="story-card-media">
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 720px) 100vw, 33vw"
                      className="story-card-img"
                    />
                  ) : (
                    <div className="story-card-fallback" aria-hidden />
                  )}
                </div>
                <div className="story-card-body">
                  {item.byline ? <p className="ui-eyebrow">By {item.byline}</p> : null}
                  <h3>{item.title}</h3>
                  {item.summary ? <p>{item.summary}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
