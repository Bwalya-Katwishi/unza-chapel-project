import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHORITY_LABELS } from "@/lib/constants";
import { facilityCoverUrl, facilityGalleryUrls } from "@/lib/media/facilities";
import { prisma } from "@/lib/prisma";
import { AvailabilityCalendar } from "@/components/availability-calendar";

export const dynamic = "force-dynamic";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: { feeConfigs: { where: { isActive: true } } },
  }).catch(() => null);

  if (!facility) notFound();

  const cover = facilityCoverUrl(facility);
  const gallery = facilityGalleryUrls(facility);

  return (
    <div className="page-shell">
      <div className="container">
        <div className="page-title facility-hero">
          <p className="meta">{AUTHORITY_LABELS[facility.bookingAuthority]}</p>
          <h1>{facility.name}</h1>
          <p className="lede">{facility.description}</p>
        </div>

        <div className="split-list">
          <div className="panel">
            <div
              className="facility-detail-media"
              style={{ backgroundImage: `url(${cover})` }}
              role="img"
              aria-label={`${facility.name} cover photograph`}
            />
            {gallery.length > 1 && (
              <div className="facility-gallery" aria-label="Additional photographs">
                {gallery.slice(0, 6).map((url) => (
                  <span
                    key={url}
                    style={{ backgroundImage: `url(${url})` }}
                    role="img"
                    aria-label={`${facility.name} gallery photograph`}
                  />
                ))}
              </div>
            )}
            <p><strong>Capacity:</strong> {facility.capacity ?? "To be confirmed"}</p>
            <p><strong>Location:</strong> {facility.locationNote || "Not supplied"}</p>
            <p><strong>Amenities:</strong> {facility.amenities.join(", ") || "Not listed"}</p>
            <p><strong>Equipment:</strong> {facility.equipment.join(", ") || "Not listed"}</p>
            <h3>Booking policy</h3>
            <p>{facility.bookingPolicyText}</p>
            <h3>Fees</h3>
            <p>{facility.feeNotice}</p>
            <ul>
              {facility.feeConfigs.map((fee) => (
                <li key={fee.id}>
                  {fee.label}: ZMW {Number(fee.amountZmw).toFixed(2)}
                  {fee.isEstimate ? " (estimate)" : ""} — {fee.notes}
                </li>
              ))}
            </ul>
            <Link href={`/bookings/request?facility=${facility.slug}`} className="btn btn-gold">
              Request this facility
            </Link>
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--brown-deep)" }}>Availability</h2>
            <p className="lede">
              Public view only. Reserved and pending blocks hide private event details.
              An open slot does not guarantee approval.
            </p>
            <AvailabilityCalendar facilityId={facility.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
