import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  const items = await prisma.notification.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Notifications</h1>
      <p className="lede">
        In-app centre. Email delivery occurs only when `EMAIL_ENABLED=true` and SMTP is configured; otherwise
        messages are logged and marked as not sent.
      </p>
      {items.length === 0 ? (
        <div className="empty">No notifications.</div>
      ) : (
        <ul>
          {items.map((n) => (
            <li key={n.id} className="editorial-item">
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <p className="meta">
                {n.createdAt.toLocaleString("en-ZM")} · email {n.emailSent ? "sent" : "not sent"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
