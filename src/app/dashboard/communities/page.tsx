import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardCommunitiesPage() {
  const session = await auth();
  const memberships = await prisma.organisationMember.findMany({
    where: { userId: session!.user!.id },
    include: { organisation: true },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Communities</h1>
      <p className="lede">
        Organisation profiles are optional. Public publication requires moderation (`profileStatus`).
      </p>
      {memberships.length === 0 ? (
        <div className="empty">You are not linked to an organisation account yet.</div>
      ) : (
        <div className="grid-3">
          {memberships.map((m) => (
            <article key={m.id} className="panel">
              <p className="meta">{m.title || "Representative"}</p>
              <h3>{m.organisation.name}</h3>
              <p>Status: {m.organisation.profileStatus}</p>
              <p>Public: {m.organisation.isPublic ? "Yes" : "No"}</p>
              {m.organisation.isPublic && (
                <Link href={`/communities/${m.organisation.slug}`}>View public profile</Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
