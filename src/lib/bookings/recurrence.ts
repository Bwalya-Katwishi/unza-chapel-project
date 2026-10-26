import { RecurrenceFrequency } from "@prisma/client";
import { addDays, addMonths, addWeeks, eachDayOfInterval, isBefore, isEqual, parseISO, startOfDay } from "date-fns";

export type RecurrenceInput = {
  frequency: RecurrenceFrequency;
  weekdays?: number[];
  customDates?: Date[] | string[];
  startDate: Date | string;
  endDate: Date | string;
  startTimeLocal: string; // HH:mm
  endTimeLocal: string; // HH:mm
  exceptions?: Array<Date | string>;
};

export type OccurrenceSlot = {
  date: Date;
  startTime: Date;
  endTime: Date;
};

function asDate(value: Date | string) {
  return value instanceof Date ? startOfDay(value) : startOfDay(parseISO(value));
}

function combine(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function exceptionSet(exceptions: Array<Date | string> = []) {
  return new Set(exceptions.map((e) => asDate(e).toISOString()));
}

export function expandRecurrence(input: RecurrenceInput): OccurrenceSlot[] {
  const start = asDate(input.startDate);
  const end = asDate(input.endDate);
  const skip = exceptionSet(input.exceptions);
  const slots: OccurrenceSlot[] = [];

  const pushIfValid = (day: Date) => {
    if (isBefore(day, start) || isBefore(end, day)) return;
    if (skip.has(day.toISOString())) return;
    slots.push({
      date: day,
      startTime: combine(day, input.startTimeLocal),
      endTime: combine(day, input.endTimeLocal),
    });
  };

  if (input.frequency === RecurrenceFrequency.CUSTOM_DATES) {
    for (const raw of input.customDates ?? []) {
      pushIfValid(asDate(raw));
    }
    return slots;
  }

  if (input.frequency === RecurrenceFrequency.SELECTED_WEEKDAYS) {
    const days = eachDayOfInterval({ start, end });
    const weekdays = new Set(input.weekdays ?? []);
    for (const day of days) {
      if (weekdays.has(day.getDay())) pushIfValid(day);
    }
    return slots;
  }

  let cursor = start;
  let guard = 0;
  while ((isBefore(cursor, end) || isEqual(cursor, end)) && guard < 800) {
    if (input.frequency === RecurrenceFrequency.DAILY) {
      pushIfValid(cursor);
      cursor = addDays(cursor, 1);
    } else if (input.frequency === RecurrenceFrequency.WEEKLY) {
      const weekdays = input.weekdays?.length ? input.weekdays : [start.getDay()];
      for (const wd of weekdays) {
        const delta = (wd - cursor.getDay() + 7) % 7;
        const day = addDays(cursor, delta);
        if (!isBefore(day, start) && !isBefore(end, day)) pushIfValid(day);
      }
      cursor = addWeeks(startOfDay(cursor), 1);
      // align to series start weekday basis
      if (cursor.getDay() !== start.getDay()) {
        cursor = addDays(cursor, (start.getDay() - cursor.getDay() + 7) % 7);
      }
    } else if (input.frequency === RecurrenceFrequency.FORTNIGHTLY) {
      pushIfValid(cursor);
      cursor = addWeeks(cursor, 2);
    } else if (input.frequency === RecurrenceFrequency.MONTHLY) {
      pushIfValid(cursor);
      cursor = addMonths(cursor, 1);
    } else {
      break;
    }
    guard += 1;
  }

  // Deduplicate
  const seen = new Set<string>();
  return slots.filter((s) => {
    const key = s.startTime.toISOString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
