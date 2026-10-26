import { redirect } from "next/navigation";
import { FacilityMediaManager } from "@/components/facility-media-manager";
import { auth } from "@/lib/auth/config";
import {
  canEditFacilityListing,
  hasAnyAdminRole,
  isSuperAdmin,
  loadAccessContext,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardFacilitiesPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);

  if (!isSuperAdmin(ctx) && !hasAnyAdminRole(ctx)) {
    redirect("/dashboard");
  }

  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const managed = facilities.filter((f) => canEditFacilityListing(ctx, f));

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--brown-deep)" }}>
        Facility photos
      </h1>
      <p className="lede">
        Each booking authority manages imagery for its own listings. Upload cover and gallery
        photos that appear on the public facility pages.
      </p>

      {managed.length === 0 ? (
        <div className="empty">No facilities are assigned to your administrator role.</div>
      ) : (
        <div className="facility-media-list">
          {managed.map((facility) => (
            <FacilityMediaManager
              key={facility.id}
              facility={{
                id: facility.id,
                name: facility.name,
                code: facility.code,
                coverImageUrl: facility.coverImageUrl,
                galleryUrls: facility.galleryUrls,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
