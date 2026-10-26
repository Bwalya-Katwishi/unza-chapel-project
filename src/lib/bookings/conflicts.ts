import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConflictHit = {
  type: "booking" | "closure" | "operating_hours" | "hold";
  message: string;
  startTime?: Date;
  endTime?: Date;
  bookingId?: string;
  reference?: string;
};

function withBuffers(start: Date, end: Date, setupMinutes: number, cleanupMinutes: number) {
  const bufferedStart = new Date(start.getTime() - setupMinutes * 60_000);
  const bufferedEnd = new Date(end.getTime() + cleanupMinutes * 60_000);
  return { bufferedStart, bufferedEnd };
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function findConflicts(input: {
  facilityId: string;
  startTime: Date;
  endTime: Date;
  setupMinutes?: number;
  cleanupMinutes?: number;
  excludeBookingId?: string;
}): Promise<ConflictHit[]> {
  const facility = await prisma.facility.findUniqueOrThrow({
    where: { id: input.facilityId },
    include: {
      operatingHours: true,
      closures: {
        where: {
          startsAt: { lt: input.endTime },
          endsAt: { gt: input.startTime },
        },
      },
    },
  });

  const setup = input.setupMinutes ?? facility.setupBufferMinutes;
  const cleanup = input.cleanupMinutes ?? facility.cleanupBufferMinutes;
  const { bufferedStart, bufferedEnd } = withBuffers(
    input.startTime,
    input.endTime,
    setup,
    cleanup,
  );

  const conflicts: ConflictHit[] = [];

  const day = input.startTime.getDay();
  const hours = facility.operatingHours.find((h) => h.dayOfWeek === day);
  if (hours?.isClosed) {
    conflicts.push({
      type: "operating_hours",
      message: "Facility is marked closed on this day of the week.",
      startTime: input.startTime,
      endTime: input.endTime,
    });
  } else if (hours) {
    const [openH, openM] = hours.openTime.split(":").map(Number);
    const [closeH, closeM] = hours.closeTime.split(":").map(Number);
    const open = new Date(input.startTime);
    open.setHours(openH, openM, 0, 0);
    const close = new Date(input.startTime);
    close.setHours(closeH, closeM, 0, 0);
    if (input.startTime < open || input.endTime > close) {
      conflicts.push({
        type: "operating_hours",
        message: `Requested time is outside operating hours (${hours.openTime}–${hours.closeTime}).`,
        startTime: input.startTime,
        endTime: input.endTime,
      });
    }
  }

  for (const closure of facility.closures) {
    if (overlaps(bufferedStart, bufferedEnd, closure.startsAt, closure.endsAt)) {
      conflicts.push({
        type: "closure",
        message: `Facility closure: ${closure.title}`,
        startTime: closure.startsAt,
        endTime: closure.endsAt,
      });
    }
  }

  const blockingStatuses: BookingStatus[] = [
    BookingStatus.APPROVED,
    BookingStatus.UNDER_REVIEW,
  ];

  const existing = await prisma.booking.findMany({
    where: {
      facilityId: input.facilityId,
      status: { in: blockingStatuses },
      ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
      startTime: { lt: bufferedEnd },
      endTime: { gt: bufferedStart },
    },
    select: {
      id: true,
      reference: true,
      startTime: true,
      endTime: true,
      setupMinutes: true,
      cleanupMinutes: true,
      status: true,
      title: true,
    },
  });

  for (const booking of existing) {
    const other = withBuffers(
      booking.startTime,
      booking.endTime,
      booking.setupMinutes || facility.setupBufferMinutes,
      booking.cleanupMinutes || facility.cleanupBufferMinutes,
    );
    if (overlaps(bufferedStart, bufferedEnd, other.bufferedStart, other.bufferedEnd)) {
      conflicts.push({
        type: "booking",
        message: `Conflicts with ${booking.status.toLowerCase()} booking ${booking.reference}`,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.id,
        reference: booking.reference,
      });
    }
  }

  return conflicts;
}

/**
 * Attempts to lock the facility row and re-check conflicts inside a transaction
 * before approving, reducing double-booking races.
 */
export async function assertNoConflictsOrThrow(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    facilityId: string;
    startTime: Date;
    endTime: Date;
    setupMinutes: number;
    cleanupMinutes: number;
    excludeBookingId?: string;
  },
) {
  await tx.$executeRaw`SELECT id FROM "Facility" WHERE id = ${input.facilityId} FOR UPDATE`;

  const facility = await tx.facility.findUniqueOrThrow({
    where: { id: input.facilityId },
  });

  const setup = input.setupMinutes || facility.setupBufferMinutes;
  const cleanup = input.cleanupMinutes || facility.cleanupBufferMinutes;
  const bufferedStart = new Date(input.startTime.getTime() - setup * 60_000);
  const bufferedEnd = new Date(input.endTime.getTime() + cleanup * 60_000);

  const clash = await tx.booking.findFirst({
    where: {
      facilityId: input.facilityId,
      status: BookingStatus.APPROVED,
      ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
      startTime: { lt: bufferedEnd },
      endTime: { gt: bufferedStart },
    },
  });

  if (clash) {
    throw new Error(`Time slot conflicts with approved booking ${clash.reference}`);
  }

  const closure = await tx.facilityClosure.findFirst({
    where: {
      facilityId: input.facilityId,
      startsAt: { lt: bufferedEnd },
      endsAt: { gt: bufferedStart },
    },
  });

  if (closure) {
    throw new Error(`Time slot conflicts with facility closure: ${closure.title}`);
  }
}
