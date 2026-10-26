import {
  AuditAction,
  BookingStatus,
  type EventType,
  type RecurrenceFrequency,
} from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { assertCanApproveBooking, loadAccessContext, type AccessContext } from "@/lib/auth/permissions";
import { assertNoConflictsOrThrow, findConflicts } from "@/lib/bookings/conflicts";
import { expandRecurrence } from "@/lib/bookings/recurrence";
import { generateBookingReference, generateSeriesReference } from "@/lib/bookings/reference";
import { notifyUser } from "@/lib/notifications/notify";
import { prisma } from "@/lib/prisma";

async function addTimeline(bookingId: string, label: string, detail?: string) {
  return prisma.bookingTimelineEvent.create({
    data: { bookingId, label, detail },
  });
}

export async function createBookingRequest(input: {
  facilityId: string;
  applicantId?: string | null;
  organisationId?: string | null;
  eventType: EventType;
  title: string;
  description: string;
  requestedDate: Date;
  startTime: Date;
  endTime: Date;
  setupMinutes: number;
  cleanupMinutes: number;
  expectedAttendance?: number;
  equipmentNeeds?: string;
  layoutNeeds?: string;
  applicantName: string;
  contactEmail: string;
  contactPhone?: string;
  termsAccepted: boolean;
}) {
  const facility = await prisma.facility.findUniqueOrThrow({
    where: { id: input.facilityId },
  });

  if (!input.termsAccepted) {
    throw new Error("You must accept the applicable booking terms.");
  }

  const conflicts = await findConflicts({
    facilityId: input.facilityId,
    startTime: input.startTime,
    endTime: input.endTime,
    setupMinutes: input.setupMinutes,
    cleanupMinutes: input.cleanupMinutes,
  });

  const booking = await prisma.booking.create({
    data: {
      reference: generateBookingReference(),
      facilityId: facility.id,
      applicantId: input.applicantId ?? undefined,
      organisationId: input.organisationId ?? undefined,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      requestedDate: input.requestedDate,
      startTime: input.startTime,
      endTime: input.endTime,
      setupMinutes: input.setupMinutes,
      cleanupMinutes: input.cleanupMinutes,
      expectedAttendance: input.expectedAttendance,
      equipmentNeeds: input.equipmentNeeds,
      layoutNeeds: input.layoutNeeds,
      applicantName: input.applicantName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      termsAccepted: true,
      status: BookingStatus.SUBMITTED,
      authority: facility.bookingAuthority,
      publicLabel: "Pending review",
    },
  });

  await addTimeline(booking.id, "Submitted", "Booking request received and routed to the responsible authority.");

  await writeAuditLog({
    actorId: input.applicantId,
    action: AuditAction.CREATE,
    entityType: "Booking",
    entityId: booking.id,
    summary: `Booking ${booking.reference} submitted for ${facility.name}`,
  });

  const admins = await prisma.userRole.findMany({
    where: {
      role: {
        code: {
          in:
            facility.bookingAuthority === "OVERALL_CHAPLAINCY"
              ? ["OVERALL_CHAPLAINCY_ADMIN"]
              : facility.bookingAuthority === "CATHOLIC_SIDE_CHAPEL"
                ? ["CATHOLIC_SIDE_CHAPEL_ADMIN"]
                : ["UCC_PROTESTANT_SIDE_CHAPEL_ADMIN"],
        },
      },
    },
    include: { user: true },
  });

  for (const admin of admins) {
    await notifyUser({
      userId: admin.userId,
      email: admin.user.email,
      title: `New booking request ${booking.reference}`,
      body: `${input.applicantName} requested ${facility.name} for "${input.title}".`,
      linkUrl: `/dashboard/bookings/${booking.id}`,
    });
  }

  if (input.applicantId) {
    await notifyUser({
      userId: input.applicantId,
      email: input.contactEmail,
      title: `Booking submitted ${booking.reference}`,
      body: `Your request for ${facility.name} was submitted and is awaiting review.`,
      linkUrl: `/dashboard/bookings/${booking.id}`,
    });
  }

  return { booking, preliminaryConflicts: conflicts };
}

export async function reviewBooking(input: {
  bookingId: string;
  actorId: string;
  action: Extract<
    BookingStatus,
    "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED"
  >;
  comment?: string;
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: input.bookingId },
    include: { facility: true, applicant: true },
  });

  const ctx = await loadAccessContext(input.actorId);
  assertCanApproveBooking(ctx, booking);

  if (input.action === BookingStatus.APPROVED) {
    return prisma.$transaction(async (tx) => {
      await assertNoConflictsOrThrow(tx, {
        facilityId: booking.facilityId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        setupMinutes: booking.setupMinutes,
        cleanupMinutes: booking.cleanupMinutes,
        excludeBookingId: booking.id,
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.APPROVED,
          publicLabel: "Reserved",
        },
      });

      await tx.bookingApproval.create({
        data: {
          bookingId: booking.id,
          actorId: input.actorId,
          action: BookingStatus.APPROVED,
          comment: input.comment,
        },
      });

      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: booking.id,
          label: "Approved",
          detail: input.comment || "Approved by the responsible booking authority.",
        },
      });

      return updated;
    }).then(async (updated) => {
      await writeAuditLog({
        actorId: input.actorId,
        action: AuditAction.APPROVE,
        entityType: "Booking",
        entityId: booking.id,
        summary: `Approved booking ${booking.reference}`,
        metadata: { comment: input.comment },
      });

      if (booking.applicantId) {
        await notifyUser({
          userId: booking.applicantId,
          email: booking.contactEmail,
          title: `Booking approved ${booking.reference}`,
          body: `Your booking for ${booking.facility.name} was approved.`,
          linkUrl: `/dashboard/bookings/${booking.id}`,
        });
      }

      return updated;
    });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: input.action,
      publicLabel:
        input.action === BookingStatus.CANCELLED
          ? "Cancelled"
          : input.action === BookingStatus.REJECTED
            ? "Unavailable"
            : "Pending review",
    },
  });

  await prisma.bookingApproval.create({
    data: {
      bookingId: booking.id,
      actorId: input.actorId,
      action: input.action,
      comment: input.comment,
    },
  });

  await addTimeline(booking.id, input.action.replaceAll("_", " "), input.comment);

  await writeAuditLog({
    actorId: input.actorId,
    action:
      input.action === BookingStatus.REJECTED
        ? AuditAction.REJECT
        : input.action === BookingStatus.CANCELLED
          ? AuditAction.CANCEL
          : AuditAction.UPDATE,
    entityType: "Booking",
    entityId: booking.id,
    summary: `${input.action} booking ${booking.reference}`,
  });

  if (booking.applicantId) {
    await notifyUser({
      userId: booking.applicantId,
      email: booking.contactEmail,
      title: `Booking update ${booking.reference}`,
      body: `Status changed to ${input.action.replaceAll("_", " ")}.`,
      linkUrl: `/dashboard/bookings/${booking.id}`,
    });
  }

  return updated;
}

export async function createRecurringSeries(input: {
  facilityId: string;
  organisationId?: string | null;
  createdById?: string | null;
  title: string;
  description: string;
  eventType: EventType;
  frequency: RecurrenceFrequency;
  weekdays?: number[];
  customDates?: Date[];
  startDate: Date;
  endDate: Date;
  startTimeLocal: string;
  endTimeLocal: string;
  setupMinutes: number;
  cleanupMinutes: number;
  expectedAttendance?: number;
  academicPeriod?: string;
  applicantName: string;
  contactEmail: string;
  contactPhone?: string;
  exceptionDates?: Date[];
}) {
  const facility = await prisma.facility.findUniqueOrThrow({
    where: { id: input.facilityId },
  });

  const occurrences = expandRecurrence({
    frequency: input.frequency,
    weekdays: input.weekdays,
    customDates: input.customDates,
    startDate: input.startDate,
    endDate: input.endDate,
    startTimeLocal: input.startTimeLocal,
    endTimeLocal: input.endTimeLocal,
    exceptions: input.exceptionDates,
  });

  if (occurrences.length === 0) {
    throw new Error("No occurrences were generated for the requested recurrence rule.");
  }

  const conflictReport: Array<{
    date: string;
    conflicts: Awaited<ReturnType<typeof findConflicts>>;
  }> = [];

  for (const occ of occurrences) {
    const conflicts = await findConflicts({
      facilityId: facility.id,
      startTime: occ.startTime,
      endTime: occ.endTime,
      setupMinutes: input.setupMinutes,
      cleanupMinutes: input.cleanupMinutes,
    });
    if (conflicts.length) {
      conflictReport.push({ date: occ.date.toISOString().slice(0, 10), conflicts });
    }
  }

  const series = await prisma.$transaction(async (tx) => {
    const created = await tx.recurringBookingSeries.create({
      data: {
        reference: generateSeriesReference(),
        facilityId: facility.id,
        organisationId: input.organisationId ?? undefined,
        createdById: input.createdById ?? undefined,
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        frequency: input.frequency,
        weekdays: input.weekdays ?? [],
        customDates: input.customDates ?? [],
        startDate: input.startDate,
        endDate: input.endDate,
        startTimeLocal: input.startTimeLocal,
        endTimeLocal: input.endTimeLocal,
        setupMinutes: input.setupMinutes,
        cleanupMinutes: input.cleanupMinutes,
        expectedAttendance: input.expectedAttendance,
        status: BookingStatus.SUBMITTED,
        authority: facility.bookingAuthority,
        academicPeriod: input.academicPeriod,
        renewalReminderAt: new Date(input.endDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        expiresAt: input.endDate,
        rule: {
          create: {
            interval: input.frequency === "FORTNIGHTLY" ? 2 : 1,
            notes: "Generated from portal recurrence expander",
          },
        },
        exceptions: {
          create: (input.exceptionDates ?? []).map((date) => ({
            date,
            reason: "Excluded date",
          })),
        },
      },
    });

    for (const occ of occurrences) {
      const hasConflict = conflictReport.some(
        (c) => c.date === occ.date.toISOString().slice(0, 10),
      );
      await tx.booking.create({
        data: {
          reference: generateBookingReference("UNO"),
          facilityId: facility.id,
          applicantId: input.createdById ?? undefined,
          organisationId: input.organisationId ?? undefined,
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          requestedDate: occ.date,
          startTime: occ.startTime,
          endTime: occ.endTime,
          setupMinutes: input.setupMinutes,
          cleanupMinutes: input.cleanupMinutes,
          expectedAttendance: input.expectedAttendance,
          applicantName: input.applicantName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          termsAccepted: true,
          status: hasConflict ? BookingStatus.CHANGES_REQUESTED : BookingStatus.SUBMITTED,
          authority: facility.bookingAuthority,
          isRecurringOccurrence: true,
          seriesId: created.id,
          occurrenceDate: occ.date,
          publicLabel: "Pending review",
          notesInternal: hasConflict ? "Conflict detected at submission" : undefined,
        },
      });
    }

    return created;
  });

  await writeAuditLog({
    actorId: input.createdById,
    action: AuditAction.CREATE,
    entityType: "RecurringBookingSeries",
    entityId: series.id,
    summary: `Recurring series ${series.reference} created with ${occurrences.length} occurrences`,
    metadata: { conflictCount: conflictReport.length },
  });

  return {
    series,
    occurrenceCount: occurrences.length,
    conflictReport,
  };
}

export async function cancelOccurrence(input: {
  bookingId: string;
  actorId: string;
  comment?: string;
  ctx?: AccessContext;
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: input.bookingId },
  });

  if (!booking.isRecurringOccurrence) {
    throw new Error("Booking is not a recurring occurrence.");
  }

  const ctx = input.ctx ?? (await loadAccessContext(input.actorId));
  const isOwner = booking.applicantId === input.actorId;
  if (!isOwner) {
    assertCanApproveBooking(ctx, booking);
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CANCELLED, publicLabel: "Cancelled" },
  });

  await addTimeline(booking.id, "Occurrence cancelled", input.comment);
  await writeAuditLog({
    actorId: input.actorId,
    action: AuditAction.CANCEL,
    entityType: "Booking",
    entityId: booking.id,
    summary: `Cancelled occurrence ${booking.reference}`,
  });

  return updated;
}
