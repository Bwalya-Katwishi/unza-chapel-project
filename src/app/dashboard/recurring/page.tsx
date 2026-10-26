import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getManagedAuthorities, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { RecurringForm } from "@/components/recurring-form";

export const dynamic = "force-dynamic";

export default async function RecurringDashboardPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  const authorities = getManagedAuthorities(ctx);
  const facilities = await prisma.facility.findMany({
    where: authorities.length ? { bookingAuthority: { in: authorities } } : { isActive: true },
    orderBy: { name: "asc" },
  });

  const series = await prisma.recurringBookingSeries.findMany({
    where: authorities.length
      ? { authority: { in: authorities } }
      : { createdById: session!.user!.id },
    include: { facility: true, occurrences: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Recurring allocations</h1>
      <p className="lede">
        Parent series with individually tracked occurrences. Conflicts are flagged per date rather than
        rejecting an entire academic-year request blindly.
      </p>
      <div className="split-list">
        <RecurringForm
          facilities={facilities.map((f) => ({ id: f.id, name: f.name }))}
          defaultName={session!.user!.name || ""}
          defaultEmail={session!.user!.email || ""}
        />
        <div className="panel">
          <h3>Series in scope</h3>
          {series.length === 0 ? (
            <div className="empty">No recurring series yet.</div>
          ) : (
            <ul>
              {series.map((s) => (
                <li key={s.id}>
                  <strong>{s.reference}</strong> — {s.title} ({s.facility.name}) ·{" "}
                  {s.occurrences.length} occurrences · {s.status}
                  <div>
                    <Link href={`/dashboard/recurring/${s.id}`}>Open allocation</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
