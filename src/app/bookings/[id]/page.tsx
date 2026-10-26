import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking
    .findUnique({
      where: { id },
      include: {
        facility: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    })
    .catch(() => null);

  if (!booking) notFound();

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-title">
          <p className="meta">Booking reference</p>
          <h1>{booking.reference}</h1>
          <p className="lede">
            {booking.facility.name} · {BOOKING_STATUS_LABELS[booking.status]}
          </p>
        </div>
        <div className="panel">
          <p><strong>Title:</strong> {booking.title}</p>
          <p>
            <strong>When:</strong>{" "}
            {booking.startTime.toLocaleString("en-ZM")} – {booking.endTime.toLocaleTimeString("en-ZM")}
          </p>
          <p><strong>Authority:</strong> {booking.authority.replaceAll("_", " ")}</p>
          <p className="alert">
            Status updates appear below. Confirmed reservations require authorised approval unless an
            automatic approval policy is configured for that facility.
          </p>
          <h3>Timeline</h3>
          <ul>
            {booking.timeline.map((event) => (
              <li key={event.id}>
                <strong>{event.label}</strong> — {event.detail}{" "}
                <span className="meta">{event.createdAt.toLocaleString("en-ZM")}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/bookings" className="btn btn-ghost">
            Open in dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
