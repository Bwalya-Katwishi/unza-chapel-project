import { AvailabilityCalendar } from "@/components/availability-calendar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Availability calendar" };

export default async function CalendarPage() {
  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  }).catch(() => []);

  return (
    <div className="page-shell">
      <div className="container">
        <div className="page-title">
          <p className="meta">Public calendar</p>
          <h1>Availability</h1>
          <p className="lede">
            Reserved and pending blocks are shown without private titles or applicant details.
            An apparently free slot does not guarantee that a booking will be approved.
          </p>
        </div>
        <div className="panel" style={{ marginBottom: "1rem" }}>
          <p className="meta">Facilities in scope</p>
          <ul>
            {facilities.map((f) => (
              <li key={f.id}>{f.name}</li>
            ))}
          </ul>
        </div>
        <AvailabilityCalendar />
      </div>
    </div>
  );
}
