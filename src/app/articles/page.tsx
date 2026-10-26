import Image from "next/image";
import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Articles and journals" };

export default async function ArticlesPage() {
  const items = await prisma.article
    .findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => []);

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="page-title">
          <p className="meta">Journals</p>
          <h1>Articles and journals</h1>
          <p className="lede">Stories and reflections from the UNZA Christian Centre community.</p>
        </div>
        {items.length === 0 ? (
          <div className="empty">No published articles yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="editorial-item article-list-item">
              {item.coverImageUrl && (
                <Link href={`/articles/${item.slug}`} className="article-list-thumb">
                  <Image src={item.coverImageUrl} alt="" width={280} height={210} />
                </Link>
              )}
              <div>
                <h3>
                  <Link href={`/articles/${item.slug}`}>{item.title}</Link>
                </h3>
                {item.byline && <p className="meta">By {item.byline}</p>}
                <p>{item.summary}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
