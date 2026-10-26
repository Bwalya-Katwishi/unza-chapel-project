import Link from "next/link";
import { BookingStatus, RoleCode } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { loadAccessContext, getManagedAuthorities, isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  const authorities = getManagedAuthorities(ctx);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const authorityFilter = authorities.length
    ? { authority: { in: authorities } }
    : { applicantId: session!.user!.id };

  const [pending, today, renewals, notifications, recentAudit] = await Promise.all([
    prisma.booking.count({
      where: {
        ...authorityFilter,
        status: { in: [BookingStatus.SUBMITTED, BookingStatus.UNDER_REVIEW] },
      },
    }),
    prisma.booking.findMany({
      where: {
        ...authorityFilter,
        startTime: { gte: todayStart, lte: todayEnd },
        status: { in: [BookingStatus.APPROVED, BookingStatus.UNDER_REVIEW, BookingStatus.SUBMITTED] },
      },
      include: { facility: true },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
    prisma.recurringBookingSeries.findMany({
      where: {
        ...(authorities.length ? { authority: { in: authorities } } : {}),
        renewalReminderAt: { lte: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
      },
      take: 5,
      orderBy: { renewalReminderAt: "asc" },
    }),
    prisma.notification.findMany({
      where: { userId: session!.user!.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    isSuperAdmin(ctx)
      ? prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 })
      : Promise.resolve([]),
  ]);

  const roleCodes = ctx.roles.map((r) => r.role.code);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Dashboard</h1>
      <p className="lede">
        Role-aware overview. Side-chapel administrators only see their authority. Overall administrators
        do not auto-approve Catholic or UCC bookings.
      </p>

      <div className="stat-row">
        <div className="stat">
          <span className="meta">Pending requests</span>
          <strong>{pending}</strong>
        </div>
        <div className="stat">
          <span className="meta">Today&apos;s items</span>
          <strong>{today.length}</strong>
        </div>
        <div className="stat">
          <span className="meta">Renewals soon</span>
          <strong>{renewals.length}</strong>
        </div>
        <div className="stat">
          <span className="meta">Unread-ish notices</span>
          <strong>{notifications.filter((n) => !n.readAt).length}</strong>
        </div>
      </div>

      <div className="split-list">
        <section className="panel">
          <h3>Today</h3>
          {today.length === 0 ? (
            <div className="empty">No bookings for today in your scope.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Facility</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {today.map((b) => (
                  <tr key={b.id}>
                    <td>{b.startTime.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      <Link href={`/dashboard/bookings/${b.id}`}>{b.facility.name}</Link>
                    </td>
                    <td>
                      <span className="badge pending">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h3>Your roles</h3>
          <ul>
            {roleCodes.map((code) => (
              <li key={code}>{code.replaceAll("_", " ")}</li>
            ))}
          </ul>
          <h3>Managed authorities</h3>
          {authorities.length === 0 ? (
            <p>No booking authority assigned (individual / organisation scope).</p>
          ) : (
            <ul>
              {authorities.map((a) => (
                <li key={a}>{a.replaceAll("_", " ")}</li>
              ))}
            </ul>
          )}
          {roleCodes.includes(RoleCode.PLATFORM_SUPER_ADMIN) && (
            <p className="alert">
              Super admin: exceptional cross-authority access must be explicitly granted, logged and justified
              under Admin / audit.
            </p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Notifications</h3>
        {notifications.length === 0 ? (
          <div className="empty">No notifications yet.</div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id}>
                <strong>{n.title}</strong> — {n.body}
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentAudit.length > 0 && (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <h3>Recent audit activity</h3>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.toLocaleString("en-ZM")}</td>
                  <td>{log.action}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
