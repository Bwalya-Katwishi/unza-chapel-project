import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { reviewBooking } from "@/lib/bookings/service";
import { reviewBookingSchema } from "@/lib/validation/booking";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = reviewBookingSchema.safeParse({ ...body, bookingId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = await reviewBooking({
      bookingId: id,
      actorId: session.user.id,
      action: parsed.data.action,
      comment: parsed.data.comment,
    });
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    const status = message.startsWith("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
