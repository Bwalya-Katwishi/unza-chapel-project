import { EventType, RecurrenceFrequency } from "@prisma/client";
import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    facilityId: z.string().min(1),
    eventType: z.nativeEnum(EventType),
    title: z.string().min(3).max(160),
    description: z.string().min(10).max(5000),
    requestedDate: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    setupMinutes: z.number().int().min(0).max(240).default(0),
    cleanupMinutes: z.number().int().min(0).max(240).default(0),
    expectedAttendance: z.number().int().positive().optional(),
    equipmentNeeds: z.string().max(2000).optional(),
    layoutNeeds: z.string().max(2000).optional(),
    applicantName: z.string().min(2).max(120),
    organisationId: z.string().optional().nullable(),
    contactEmail: z.string().email(),
    contactPhone: z.string().max(40).optional(),
    termsAccepted: z.literal(true),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const recurringSeriesSchema = z
  .object({
    facilityId: z.string().min(1),
    organisationId: z.string().optional().nullable(),
    title: z.string().min(3).max(160),
    description: z.string().min(10).max(5000),
    eventType: z.nativeEnum(EventType),
    frequency: z.nativeEnum(RecurrenceFrequency),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
    customDates: z.array(z.string()).optional(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    startTimeLocal: z.string().regex(/^\d{2}:\d{2}$/),
    endTimeLocal: z.string().regex(/^\d{2}:\d{2}$/),
    setupMinutes: z.number().int().min(0).max(240).default(0),
    cleanupMinutes: z.number().int().min(0).max(240).default(0),
    expectedAttendance: z.number().int().positive().optional(),
    academicPeriod: z.string().max(80).optional(),
    applicantName: z.string().min(2).max(120),
    contactEmail: z.string().email(),
    contactPhone: z.string().max(40).optional(),
    termsAccepted: z.literal(true),
    exceptionDates: z.array(z.string()).optional(),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const reviewBookingSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED", "CANCELLED"]),
  comment: z.string().max(2000).optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type RecurringSeriesInput = z.infer<typeof recurringSeriesSchema>;
