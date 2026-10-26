import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { canApproveBooking, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ReviewActions } from "@/components/review-actions";

export const dynamic = "force-dynamic";

export default async function RecurringSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const series = await prisma.recurringBookingSeries.findUnique({
    where: { id },
    include: {
      facility: true,
      exceptions: true,
      occurrences: { orderBy: { startTime: "asc" } },
    },
  });
  if (!series) notFound();

  const ctx = await loadAccessContext(session!.user!.id);
  const mayReview = canApproveBooking(ctx, {
    authority: series.authority,
    facilityId: series.facilityId,
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{series.reference}</h1>
      <p className="lede">
        {series.title} · {series.facility.name} · {series.frequency} · {series.academicPeriod || "No period label"}
      </p>
      <div className="panel">
        <p>
          {series.startDate.toLocaleDateString("en-ZM")} → {series.endDate.toLocaleDateString("en-ZM")} ·{" "}
          {series.startTimeLocal}–{series.endTimeLocal}
        </p>
        <p>{series.description}</p>
        {series.exceptions.length > 0 && (
          <>
            <h3>Exceptions</h3>
            <ul>
              {series.exceptions.map((ex) => (
                <li key={ex.id}>
                  {ex.date.toLocaleDateString("en-ZM")}: {ex.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <table className="table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Occurrence</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {series.occurrences.map((occ) => (
            <tr key={occ.id}>
              <td>
                {occ.reference} · {occ.startTime.toLocaleString("en-ZM")}
              </td>
              <td>
                <span className="badge pending">{occ.status}</span>
              </td>
              <td>{mayReview ? <ReviewActions bookingId={occ.id} /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
