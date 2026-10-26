import { redirect } from "next/navigation";
import { RoleCode } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { isSuperAdmin, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ExceptionalAccessForm } from "@/components/exceptional-access-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  if (!isSuperAdmin(ctx) && !ctx.roles.some((r) => r.role.code === RoleCode.OVERALL_CHAPLAINCY_ADMIN)) {
    redirect("/dashboard");
  }

  const [users, grants, audits, settings] = await Promise.all([
    prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.exceptionalAccessGrant.findMany({
      include: { user: true, grantedBy: true, facility: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.systemSetting.findMany(),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Admin & audit</h1>
      <p className="lede">
        Platform configuration, exceptional cross-authority grants (must be justified and logged), and audit
        history.
      </p>

      {isSuperAdmin(ctx) && (
        <ExceptionalAccessForm
          users={users.map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} <${u.email}>` }))}
        />
      )}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Users & roles</h3>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                  <div className="meta">{u.email}</div>
                </td>
                <td>{u.roles.map((r) => r.role.code).join(", ")}</td>
                <td>{u.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Exceptional access grants</h3>
        {grants.length === 0 ? (
          <div className="empty">No exceptional grants.</div>
        ) : (
          <ul>
            {grants.map((g) => (
              <li key={g.id}>
                {g.user.email} → {g.authority}
                {g.facility ? ` / ${g.facility.name}` : ""} · reason: {g.reason} · by {g.grantedBy.email}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Audit log</h3>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a.id}>
                <td>{a.createdAt.toLocaleString("en-ZM")}</td>
                <td>{a.action}</td>
                <td>{a.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>System settings</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(settings, null, 2)}</pre>
      </section>
    </div>
  );
}
