import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createRecurringSeries } from "@/lib/bookings/service";
import { recurringSeriesSchema } from "@/lib/validation/booking";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = recurringSeriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const result = await createRecurringSeries({
      facilityId: data.facilityId,
      organisationId: data.organisationId,
      createdById: session.user.id,
      title: data.title,
      description: data.description,
      eventType: data.eventType,
      frequency: data.frequency,
      weekdays: data.weekdays,
      customDates: data.customDates?.map((d) => new Date(d)),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTimeLocal: data.startTimeLocal,
      endTimeLocal: data.endTimeLocal,
      setupMinutes: data.setupMinutes,
      cleanupMinutes: data.cleanupMinutes,
      expectedAttendance: data.expectedAttendance,
      academicPeriod: data.academicPeriod,
      applicantName: data.applicantName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      exceptionDates: data.exceptionDates?.map((d) => new Date(d)),
    });

    return NextResponse.json({
      seriesId: result.series.id,
      reference: result.series.reference,
      occurrenceCount: result.occurrenceCount,
      conflictReport: result.conflictReport,
      notice:
        "Series created. Conflicting occurrences are flagged individually as Changes Requested for administrator review.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create series";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
