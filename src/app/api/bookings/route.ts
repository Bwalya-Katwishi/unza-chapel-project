import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createBookingRequest } from "@/lib/bookings/service";
import { bookingRequestSchema } from "@/lib/validation/booking";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await auth();
    const data = parsed.data;

    const result = await createBookingRequest({
      facilityId: data.facilityId,
      applicantId: session?.user?.id,
      organisationId: data.organisationId,
      eventType: data.eventType,
      title: data.title,
      description: data.description,
      requestedDate: new Date(data.requestedDate),
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      setupMinutes: data.setupMinutes,
      cleanupMinutes: data.cleanupMinutes,
      expectedAttendance: data.expectedAttendance,
      equipmentNeeds: data.equipmentNeeds,
      layoutNeeds: data.layoutNeeds,
      applicantName: data.applicantName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      termsAccepted: data.termsAccepted,
    });

    return NextResponse.json({
      reference: result.booking.reference,
      id: result.booking.id,
      status: result.booking.status,
      preliminaryConflicts: result.preliminaryConflicts,
      notice:
        "Submission received. A publicly available slot does not guarantee approval. Preliminary conflicts are informational until authority review.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
