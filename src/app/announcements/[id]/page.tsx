import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.announcement.findFirst({
    where: { id, status: ContentStatus.PUBLISHED },
  });
  if (!item) notFound();

  const relatedArticle =
    item.title.toLowerCase().includes("borehole")
      ? await prisma.article.findFirst({
          where: { slug: "unza-christian-centre-borehole", status: ContentStatus.PUBLISHED },
        })
      : null;

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="page-title">
          <p className="meta">Announcement</p>
          <h1>{item.title}</h1>
        </div>
        <article className="panel article-body">{item.body}</article>
        {relatedArticle && (
          <p style={{ marginTop: "1.25rem" }}>
            <Link href={`/articles/${relatedArticle.slug}`} className="btn btn-gold">
              Read the full article with photos
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
