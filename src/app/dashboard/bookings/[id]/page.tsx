import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { canApproveBooking, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ReviewActions } from "@/components/review-actions";

export const dynamic = "force-dynamic";

export default async function DashboardBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      facility: true,
      timeline: { orderBy: { createdAt: "asc" } },
      approvals: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      organisation: true,
    },
  });
  if (!booking) notFound();

  const ctx = await loadAccessContext(session!.user!.id);
  const mayReview = canApproveBooking(ctx, booking);
  const isOwner = booking.applicantId === session!.user!.id;
  if (!mayReview && !isOwner) {
    notFound();
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>{booking.reference}</h1>
      <p className="lede">
        {booking.facility.name} · {booking.title} · Authority {booking.authority.replaceAll("_", " ")}
      </p>
      <div className="panel">
        <p><strong>Status:</strong> {booking.status}</p>
        <p>
          <strong>Schedule:</strong> {booking.startTime.toLocaleString("en-ZM")} –{" "}
          {booking.endTime.toLocaleTimeString("en-ZM")}
        </p>
        <p><strong>Applicant:</strong> {booking.applicantName} ({booking.contactEmail})</p>
        <p><strong>Organisation:</strong> {booking.organisation?.name || "None"}</p>
        <p>{booking.description}</p>
        {mayReview && <ReviewActions bookingId={booking.id} />}
      </div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h3>Timeline</h3>
        <ul>
          {booking.timeline.map((t) => (
            <li key={t.id}>
              <strong>{t.label}</strong> — {t.detail}{" "}
              <span className="meta">{t.createdAt.toLocaleString("en-ZM")}</span>
            </li>
          ))}
        </ul>
        <h3>Approvals / decisions</h3>
        <ul>
          {booking.approvals.map((a) => (
            <li key={a.id}>
              {a.action} by {a.actor.firstName} {a.actor.lastName}: {a.comment}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
