import { RecurrenceFrequency } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { expandRecurrence } from "@/lib/bookings/recurrence";

describe("recurrence expansion", () => {
  it("creates weekly thursday slots across a date range", () => {
    const slots = expandRecurrence({
      frequency: RecurrenceFrequency.WEEKLY,
      weekdays: [4],
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      startTimeLocal: "17:00",
      endTimeLocal: "19:00",
    });

    expect(slots.length).toBeGreaterThan(3);
    expect(slots.every((s) => s.date.getDay() === 4)).toBe(true);
    expect(slots[0].startTime.getHours()).toBe(17);
    expect(slots[0].endTime.getHours()).toBe(19);
  });

  it("respects exception dates", () => {
    const slots = expandRecurrence({
      frequency: RecurrenceFrequency.WEEKLY,
      weekdays: [4],
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      startTimeLocal: "17:00",
      endTimeLocal: "19:00",
      exceptions: ["2026-01-08"],
    });

    expect(slots.some((s) => s.date.toISOString().startsWith("2026-01-08"))).toBe(false);
  });

  it("supports custom dates", () => {
    const slots = expandRecurrence({
      frequency: RecurrenceFrequency.CUSTOM_DATES,
      customDates: ["2026-03-01", "2026-03-15"],
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      startTimeLocal: "10:00",
      endTimeLocal: "12:00",
    });
    expect(slots).toHaveLength(2);
  });
});
