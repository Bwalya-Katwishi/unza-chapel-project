import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Public availability feed — never exposes private titles or applicant details.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const facilityId = searchParams.get("facilityId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      ...(facilityId ? { facilityId } : {}),
      startTime: { lt: new Date(to) },
      endTime: { gt: new Date(from) },
      status: {
        in: [
          BookingStatus.APPROVED,
          BookingStatus.SUBMITTED,
          BookingStatus.UNDER_REVIEW,
          BookingStatus.CHANGES_REQUESTED,
        ],
      },
    },
    select: {
      id: true,
      facilityId: true,
      startTime: true,
      endTime: true,
      status: true,
      publicLabel: true,
    },
  });

  const closures = await prisma.facilityClosure.findMany({
    where: {
      ...(facilityId ? { facilityId } : {}),
      startsAt: { lt: new Date(to) },
      endsAt: { gt: new Date(from) },
    },
    select: { id: true, facilityId: true, title: true, startsAt: true, endsAt: true },
  });

  const events = [
    ...bookings.map((b) => ({
      id: b.id,
      facilityId: b.facilityId,
      start: b.startTime,
      end: b.endTime,
      display:
        b.status === BookingStatus.APPROVED
          ? "Reserved"
          : "Pending review",
      status: b.status,
      kind: "booking" as const,
    })),
    ...closures.map((c) => ({
      id: c.id,
      facilityId: c.facilityId,
      start: c.startsAt,
      end: c.endsAt,
      display: "Closed",
      status: "CLOSURE",
      kind: "closure" as const,
    })),
  ];

  return NextResponse.json({
    events,
    notice:
      "Public calendar hides private event details. Available appearance does not guarantee approval.",
  });
}
