import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { CommunityCard } from "@/components/community-card";
import { Button, Container, EmptyState } from "@/components/ui";
import {
  COMMUNITY_FILTERS,
  matchesCommunityFilter,
} from "@/lib/communities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communities" };

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;
  const activeFilter = filter || "all";

  const rows = await prisma.organisation
    .findMany({
      where: {
        isPublic: true,
        profileStatus: ContentStatus.PUBLISHED,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { affiliation: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        affiliation: true,
        coverImageUrl: true,
        logoUrl: true,
      },
    })
    .catch(() => []);

  const communities = rows.filter((org) =>
    matchesCommunityFilter(org.affiliation, activeFilter),
  );

  function filterHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (key !== "all") params.set("filter", key);
    const qs = params.toString();
    return qs ? `/communities?${qs}` : "/communities";
  }

  return (
    <div className="page-shell">
      <Container>
        <div className="page-title">
          <p className="ui-eyebrow">Directory</p>
          <h1>Our communities</h1>
          <p className="lede">
            Campus fellowships and chapel communities. Details from public pages are pending
            confirmation by each group.
          </p>
        </div>

        <form className="community-search" method="get">
          {activeFilter !== "all" ? (
            <input type="hidden" name="filter" value={activeFilter} />
          ) : null}
          <label className="community-search-label">
            <span className="sr-only">Search communities</span>
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search by name or affiliation…"
              aria-label="Search communities"
            />
          </label>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>

        <div className="filter-pills" role="navigation" aria-label="Filter by tradition">
          {COMMUNITY_FILTERS.map((item) => (
            <Link
              key={item.key}
              href={filterHref(item.key)}
              className={
                activeFilter === item.key ? "filter-pill filter-pill--active" : "filter-pill"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        {communities.length === 0 ? (
          <EmptyState title="No communities match this search">
            <p>
              Try another filter, or <Link href="/communities">clear search</Link>.
            </p>
          </EmptyState>
        ) : (
          <div className="community-card-grid">
            {communities.map((org) => (
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
      </Container>
    </div>
  );
}
