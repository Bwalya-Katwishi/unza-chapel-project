import Image from "next/image";
import { ContentStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.article.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
  });
  if (!item) notFound();

  const gallery = item.galleryUrls.length
    ? item.galleryUrls
    : item.coverImageUrl
      ? [item.coverImageUrl]
      : [];

  return (
    <div className="page-shell">
      <div className="container article-layout">
        <div className="page-title">
          <p className="meta">Article</p>
          <h1>{item.title}</h1>
          {item.byline && <p className="article-byline">By {item.byline}</p>}
          {item.publishedAt && (
            <p className="meta">{item.publishedAt.toLocaleDateString("en-ZM", { dateStyle: "long" })}</p>
          )}
        </div>

        {item.coverImageUrl && (
          <figure className="article-hero-figure">
            <Image
              src={item.coverImageUrl}
              alt={item.photoCaption || item.title}
              width={1200}
              height={900}
              className="article-hero-image"
              priority
            />
            {item.photoCaption && <figcaption>{item.photoCaption}</figcaption>}
          </figure>
        )}

        <article className="panel article-body">{item.body}</article>

        {gallery.length > 1 && (
          <section className="article-gallery" aria-label="Photo gallery">
            <h2>Photos</h2>
            <div className="article-gallery-grid">
              {gallery.map((url, index) => (
                <figure key={url}>
                  <Image
                    src={url}
                    alt={`${item.title} — photo ${index + 1}`}
                    width={640}
                    height={800}
                  />
                </figure>
              ))}
            </div>
            {item.photoCaption && <p className="lede">{item.photoCaption}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
