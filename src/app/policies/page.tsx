import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking policies" };

export default async function PoliciesPage() {
  const policies = await prisma.bookingPolicy
    .findMany({ where: { isPublished: true }, orderBy: { title: "asc" } })
    .catch(() => []);

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-title">
          <p className="meta">Policies</p>
          <h1>Booking policies</h1>
        </div>
        {policies.length === 0 ? (
          <div className="empty">No published policies yet. Seed the database for placeholder policy text.</div>
        ) : (
          policies.map((policy) => (
            <article key={policy.id} className="panel" style={{ marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
              <h2 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{policy.title}</h2>
              <p>{policy.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
