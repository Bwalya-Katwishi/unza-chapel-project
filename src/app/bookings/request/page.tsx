import { BookingForm } from "@/components/booking-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking request" };

export default async function BookingRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  const params = await searchParams;
  const facilities = await prisma.facility
    .findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })
    .catch(() => []);

  const initial = facilities.find((f) => f.slug === params.facility)?.id;

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="page-title">
          <p className="meta">Bookings</p>
          <h1>Request a facility</h1>
          <p className="lede">
            Your request is routed to the correct booking authority. Organisation profiles are optional —
            individuals may book without publishing a community page.
          </p>
        </div>
        <BookingForm facilities={facilities} initialFacilityId={initial} />
      </div>
    </div>
  );
}
