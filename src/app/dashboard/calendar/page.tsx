import { auth } from "@/lib/auth/config";
import { getManagedAuthorities, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AuthorityCalendarPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  const authorities = getManagedAuthorities(ctx);

  const from = new Date();
  const to = new Date();
  to.setMonth(to.getMonth() + 4);

  const bookings = await prisma.booking.findMany({
    where: {
      ...(authorities.length ? { authority: { in: authorities } } : { applicantId: session!.user!.id }),
      startTime: { lt: to },
      endTime: { gt: from },
      status: {
        in: [
          BookingStatus.APPROVED,
          BookingStatus.SUBMITTED,
          BookingStatus.UNDER_REVIEW,
          BookingStatus.CHANGES_REQUESTED,
        ],
      },
    },
    include: { facility: true, series: true },
    orderBy: { startTime: "asc" },
    take: 200,
  });

  const closures = await prisma.facilityClosure.findMany({
    where: {
      facility: authorities.length ? { bookingAuthority: { in: authorities } } : undefined,
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    include: { facility: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Authority calendar</h1>
      <p className="lede">
        Semester/year view of reservations and closures in your managed authorities, including recurring
        occurrences.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Facility</th>
            <th>Title / closure</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.startTime.toLocaleString("en-ZM")}</td>
              <td>{b.facility.name}</td>
              <td>
                {b.title}
                {b.series ? ` (series ${b.series.reference})` : ""}
              </td>
              <td>{b.status}</td>
            </tr>
          ))}
          {closures.map((c) => (
            <tr key={c.id}>
              <td>{c.startsAt.toLocaleString("en-ZM")}</td>
              <td>{c.facility.name}</td>
              <td>Closure: {c.title}</td>
              <td>CLOSED</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && closures.length === 0 && (
        <div className="empty">No scheduled items in the next four months for your scope.</div>
      )}
    </div>
  );
}
