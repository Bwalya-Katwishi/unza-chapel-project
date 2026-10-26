import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { getManagedAuthorities, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ReviewActions } from "@/components/review-actions";

export const dynamic = "force-dynamic";

export default async function DashboardBookingsPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  const authorities = getManagedAuthorities(ctx);

  const bookings = await prisma.booking.findMany({
    where: authorities.length
      ? { authority: { in: authorities } }
      : {
          OR: [
            { applicantId: session!.user!.id },
            { organisation: { members: { some: { userId: session!.user!.id } } } },
          ],
        },
    include: { facility: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const canReview = authorities.length > 0;

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Bookings</h1>
      <p className="lede">
        Lists are filtered by booking authority or your applicant/organisation membership. Cross-authority
        records are excluded at query level.
      </p>
      {bookings.length === 0 ? (
        <div className="empty">No bookings in your scope.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Facility</th>
              <th>When</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <Link href={`/dashboard/bookings/${booking.id}`}>{booking.reference}</Link>
                </td>
                <td>{booking.facility.name}</td>
                <td>{booking.startTime.toLocaleString("en-ZM")}</td>
                <td>
                  <span
                    className={`badge ${
                      booking.status === BookingStatus.APPROVED
                        ? "approved"
                        : booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.CANCELLED
                          ? "rejected"
                          : "pending"
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td>{canReview ? <ReviewActions bookingId={booking.id} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
