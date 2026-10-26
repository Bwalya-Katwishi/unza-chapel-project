import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/recurring", label: "Recurring" },
  { href: "/dashboard/calendar", label: "Authority calendar" },
  { href: "/dashboard/facilities", label: "Facility photos" },
  { href: "/dashboard/finance", label: "Finance" },
  { href: "/dashboard/communities", label: "Communities" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/admin", label: "Admin / audit" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?callbackUrl=/dashboard");

  return (
    <div className="dashboard-layout">
      <aside className="dash-nav">
        <p className="meta" style={{ color: "var(--red-soft)" }}>Signed in</p>
        <strong style={{ display: "block", marginBottom: "1rem" }}>{session.user.name || session.user.email}</strong>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link href="/api/auth/signout">Sign out</Link>
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
