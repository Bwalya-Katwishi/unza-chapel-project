import Link from "next/link";
import { BookingAuthority, type Facility } from "@prisma/client";
import { AUTHORITY_LABELS } from "@/lib/constants";
import { facilityCoverUrl } from "@/lib/media/facilities";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facilities" };

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ capacity?: string; authority?: string }>;
}) {
  const params = await searchParams;
  const capacity = params.capacity ? Number(params.capacity) : undefined;

  let facilities: Facility[] = [];
  try {
    const authority =
      params.authority && Object.values(BookingAuthority).includes(params.authority as BookingAuthority)
        ? (params.authority as BookingAuthority)
        : undefined;
    facilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        ...(capacity ? { capacity: { gte: capacity } } : {}),
        ...(authority ? { bookingAuthority: authority } : {}),
      },
      orderBy: { name: "asc" },
    });
  } catch {
    facilities = [];
  }

  return (
    <div className="page-shell">
      <div className="container">
        <div className="page-title">
          <p className="meta">Directory</p>
          <h1>Chapel facilities</h1>
          <p className="lede">
            Filter and open a facility for capacity, amenities, authority, policies and availability.
          </p>
        </div>

        <form className="panel form-grid two" style={{ marginBottom: "1.5rem" }}>
          <label>
            Minimum capacity
            <input type="number" name="capacity" defaultValue={params.capacity || ""} min={1} />
          </label>
          <label>
            Booking authority
            <select name="authority" defaultValue={params.authority || ""}>
              <option value="">All</option>
              <option value="OVERALL_CHAPLAINCY">Overall Chaplaincy</option>
              <option value="CATHOLIC_SIDE_CHAPEL">Catholic Side Chapel</option>
              <option value="UCC_PROTESTANT_SIDE_CHAPEL">UCC / Protestant Side Chapel</option>
            </select>
          </label>
          <button className="btn btn-navy" type="submit">Apply filters</button>
        </form>

        {facilities.length === 0 ? (
          <div className="empty">No facilities found. Seed the database to load the five chapel spaces.</div>
        ) : (
          <div className="grid-3">
            {facilities.map((facility) => (
              <article key={facility.id} className="panel">
                <div
                  className="facility-card-media"
                  style={{ backgroundImage: `url(${facilityCoverUrl(facility)})` }}
                  role="img"
                  aria-label={`${facility.name} photograph`}
                />
                <p className="meta">{AUTHORITY_LABELS[facility.bookingAuthority]}</p>
                <h3>{facility.name}</h3>
                <p>{facility.description.slice(0, 180)}…</p>
                <p className="meta">Capacity: {facility.capacity ?? "To be confirmed"}</p>
                <Link href={`/facilities/${facility.slug}`} className="btn btn-ghost">
                  View details
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
