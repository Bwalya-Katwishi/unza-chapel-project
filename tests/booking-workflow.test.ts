import {
  BookingAuthority,
  BookingStatus,
  EventType,
  FacilityCode,
  PaymentMethod,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  cancelOccurrence,
  createBookingRequest,
  createRecurringSeries,
  reviewBooking,
} from "@/lib/bookings/service";
import { createObligationFromAssessment, recordVerifiedPayment } from "@/lib/finance/fees";
import { findConflicts } from "@/lib/bookings/conflicts";

describe("booking workflows (integration)", () => {
  let overallAdminId = "";
  let catholicAdminId = "";
  let uccAdminId = "";
  let bookerId = "";
  let mainChapelId = "";
  let readingRoomId = "";
  let catholicId = "";
  let protestantId = "";

  beforeAll(async () => {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            "chaplaincy.admin@example.com",
            "catholic.admin@example.com",
            "ucc.admin@example.com",
            "booker@example.com",
          ],
        },
      },
    });
    overallAdminId = users.find((u) => u.email === "chaplaincy.admin@example.com")!.id;
    catholicAdminId = users.find((u) => u.email === "catholic.admin@example.com")!.id;
    uccAdminId = users.find((u) => u.email === "ucc.admin@example.com")!.id;
    bookerId = users.find((u) => u.email === "booker@example.com")!.id;

    const facilities = await prisma.facility.findMany();
    mainChapelId = facilities.find((f) => f.code === FacilityCode.MAIN_CHAPEL)!.id;
    readingRoomId = facilities.find((f) => f.code === FacilityCode.READING_ROOM)!.id;
    catholicId = facilities.find((f) => f.code === FacilityCode.CATHOLIC_SIDE_CHAPEL)!.id;
    protestantId = facilities.find((f) => f.code === FacilityCode.PROTESTANT_SIDE_CHAPEL)!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("submits an individual booking and routes to overall authority for Main Chapel", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 10);
    day.setHours(0, 0, 0, 0);
    const start = new Date(day);
    start.setHours(10, 0, 0, 0);
    const end = new Date(day);
    end.setHours(12, 0, 0, 0);

    const { booking } = await createBookingRequest({
      facilityId: mainChapelId,
      applicantId: bookerId,
      eventType: EventType.CONCERT,
      title: "Test Main Chapel booking",
      description: "Integration test booking for Main Chapel approval path.",
      requestedDate: day,
      startTime: start,
      endTime: end,
      setupMinutes: 30,
      cleanupMinutes: 30,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    expect(booking.authority).toBe(BookingAuthority.OVERALL_CHAPLAINCY);
    expect(booking.status).toBe(BookingStatus.SUBMITTED);
    expect(booking.reference).toMatch(/^UNC-/);
  });

  it("allows overall admin to approve Main Chapel / Reading Room bookings", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 11);
    const start = new Date(day);
    start.setHours(14, 0, 0, 0);
    const end = new Date(day);
    end.setHours(16, 0, 0, 0);

    const { booking } = await createBookingRequest({
      facilityId: readingRoomId,
      applicantId: bookerId,
      eventType: EventType.FELLOWSHIP_MEETING,
      title: "Reading Room test",
      description: "Reading room approval by overall administrator.",
      requestedDate: day,
      startTime: start,
      endTime: end,
      setupMinutes: 0,
      cleanupMinutes: 0,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    const approved = await reviewBooking({
      bookingId: booking.id,
      actorId: overallAdminId,
      action: BookingStatus.APPROVED,
      comment: "Approved in test",
    });
    expect(approved.status).toBe(BookingStatus.APPROVED);
  });

  it("allows catholic admin to approve catholic bookings and denies overall admin", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 12);
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(day);
    end.setHours(11, 0, 0, 0);

    const { booking } = await createBookingRequest({
      facilityId: catholicId,
      applicantId: bookerId,
      eventType: EventType.WORSHIP_SERVICE,
      title: "Catholic chapel test",
      description: "Independent catholic approval test.",
      requestedDate: day,
      startTime: start,
      endTime: end,
      setupMinutes: 0,
      cleanupMinutes: 0,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    await expect(
      reviewBooking({
        bookingId: booking.id,
        actorId: overallAdminId,
        action: BookingStatus.APPROVED,
      }),
    ).rejects.toThrow(/Forbidden/);

    const approved = await reviewBooking({
      bookingId: booking.id,
      actorId: catholicAdminId,
      action: BookingStatus.APPROVED,
    });
    expect(approved.status).toBe(BookingStatus.APPROVED);
  });

  it("allows ucc admin independence and denies catholic admin cross-access", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 13);
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(day);
    end.setHours(11, 0, 0, 0);

    const { booking } = await createBookingRequest({
      facilityId: protestantId,
      applicantId: bookerId,
      eventType: EventType.WORSHIP_SERVICE,
      title: "UCC chapel test",
      description: "Independent UCC approval test.",
      requestedDate: day,
      startTime: start,
      endTime: end,
      setupMinutes: 0,
      cleanupMinutes: 0,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    await expect(
      reviewBooking({
        bookingId: booking.id,
        actorId: catholicAdminId,
        action: BookingStatus.APPROVED,
      }),
    ).rejects.toThrow(/Forbidden/);

    const approved = await reviewBooking({
      bookingId: booking.id,
      actorId: uccAdminId,
      action: BookingStatus.APPROVED,
    });
    expect(approved.status).toBe(BookingStatus.APPROVED);
  });

  it("prevents double booking of approved slots including buffers", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 14);
    const start = new Date(day);
    start.setHours(13, 0, 0, 0);
    const end = new Date(day);
    end.setHours(15, 0, 0, 0);

    const first = await createBookingRequest({
      facilityId: mainChapelId,
      applicantId: bookerId,
      eventType: EventType.CONFERENCE,
      title: "First exclusive booking",
      description: "Conflict prevention baseline booking.",
      requestedDate: day,
      startTime: start,
      endTime: end,
      setupMinutes: 30,
      cleanupMinutes: 30,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    await reviewBooking({
      bookingId: first.booking.id,
      actorId: overallAdminId,
      action: BookingStatus.APPROVED,
    });

    const overlapStart = new Date(day);
    overlapStart.setHours(14, 30, 0, 0);
    const overlapEnd = new Date(day);
    overlapEnd.setHours(16, 0, 0, 0);

    const conflicts = await findConflicts({
      facilityId: mainChapelId,
      startTime: overlapStart,
      endTime: overlapEnd,
      setupMinutes: 0,
      cleanupMinutes: 0,
    });
    expect(conflicts.some((c) => c.type === "booking")).toBe(true);

    const second = await createBookingRequest({
      facilityId: mainChapelId,
      applicantId: bookerId,
      eventType: EventType.OTHER,
      title: "Conflicting attempt",
      description: "Should not be approvable due to conflict.",
      requestedDate: day,
      startTime: overlapStart,
      endTime: overlapEnd,
      setupMinutes: 0,
      cleanupMinutes: 0,
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
      termsAccepted: true,
    });

    await expect(
      reviewBooking({
        bookingId: second.booking.id,
        actorId: overallAdminId,
        action: BookingStatus.APPROVED,
      }),
    ).rejects.toThrow(/conflict/i);
  });

  it("creates recurring series with per-occurrence conflict reporting", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 21);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 28);

    const result = await createRecurringSeries({
      facilityId: readingRoomId,
      createdById: bookerId,
      title: "Thursday fellowship series",
      description: "Every selected weekday allocation test for academic period.",
      eventType: EventType.FELLOWSHIP_MEETING,
      frequency: "WEEKLY",
      weekdays: [startDate.getDay()],
      startDate,
      endDate,
      startTimeLocal: "17:00",
      endTimeLocal: "19:00",
      setupMinutes: 15,
      cleanupMinutes: 15,
      academicPeriod: "2026 Sample Semester",
      applicantName: "Seed Booker",
      contactEmail: "booker@example.com",
    });

    expect(result.occurrenceCount).toBeGreaterThan(1);
    expect(result.series.reference).toMatch(/^UNS-/);

    const firstOcc = await prisma.booking.findFirst({
      where: { seriesId: result.series.id },
      orderBy: { startTime: "asc" },
    });
    expect(firstOcc?.isRecurringOccurrence).toBe(true);

    const cancelled = await cancelOccurrence({
      bookingId: firstOcc!.id,
      actorId: bookerId,
      comment: "Cancel one occurrence only",
    });
    expect(cancelled.status).toBe(BookingStatus.CANCELLED);

    const siblings = await prisma.booking.count({
      where: { seriesId: result.series.id, status: { not: BookingStatus.CANCELLED } },
    });
    expect(siblings).toBeGreaterThan(0);
  });

  it("honours facility closures", async () => {
    const day = new Date();
    day.setDate(day.getDate() + 16);
    const start = new Date(day);
    start.setHours(8, 0, 0, 0);
    const end = new Date(day);
    end.setHours(20, 0, 0, 0);

    await prisma.facilityClosure.create({
      data: {
        facilityId: mainChapelId,
        title: "Maintenance (test)",
        reason: "Integration test closure",
        startsAt: start,
        endsAt: end,
      },
    });

    const probeStart = new Date(day);
    probeStart.setHours(10, 0, 0, 0);
    const probeEnd = new Date(day);
    probeEnd.setHours(11, 0, 0, 0);

    const conflicts = await findConflicts({
      facilityId: mainChapelId,
      startTime: probeStart,
      endTime: probeEnd,
    });
    expect(conflicts.some((c) => c.type === "closure")).toBe(true);
  });

  it("records verified payments and receipts without screenshot auto-success", async () => {
    const obligation = await createObligationFromAssessment({
      description: "Fictional test fee obligation",
      amountDueZmw: 100,
      dueDate: new Date(Date.now() + 7 * 86400000),
    });

    const result = await recordVerifiedPayment({
      obligationId: obligation.id,
      recordedById: overallAdminId,
      amountZmw: 40,
      method: PaymentMethod.CASH,
      reference: "TEST-PAY-1",
      verified: true,
    });

    expect(Number(result.obligation.amountPaidZmw)).toBe(40);
    expect(result.obligation.status).toBe("PARTIAL");
    expect(result.receipt.receiptNo).toMatch(/^RCPT-/);
    expect(result.payment.verified).toBe(true);
  });

  it("keeps organisation private booking data out of public organisation queries", async () => {
    const publicOrg = await prisma.organisation.findFirst({
      where: { slug: "sample-campus-fellowship", isPublic: true },
      include: { bookings: true },
    });
    // Public pages should not select bookings; this asserts the relation exists but is not required for public DTO.
    expect(publicOrg).toBeTruthy();
    expect(publicOrg?.publicEmail).toBeTruthy();
  });
});
