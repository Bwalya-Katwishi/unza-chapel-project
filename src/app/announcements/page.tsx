import Link from "next/link";
import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const items = await prisma.announcement
    .findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => []);

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-title">
          <p className="meta">Notices</p>
          <h1>Announcements</h1>
        </div>
        {items.map((item) => (
          <article key={item.id} className="editorial-item">
            <h3>
              <Link href={`/announcements/${item.id}`}>{item.title}</Link>
            </h3>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
