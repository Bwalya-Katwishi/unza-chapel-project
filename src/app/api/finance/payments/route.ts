import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getManagedAuthorities, loadAccessContext } from "@/lib/auth/permissions";
import { recordVerifiedPayment } from "@/lib/finance/fees";

const schema = z.object({
  obligationId: z.string().min(1),
  amountZmw: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
  verified: z.literal(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await loadAccessContext(session.user.id);
  if (getManagedAuthorities(ctx).length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await recordVerifiedPayment({
      ...parsed.data,
      recordedById: session.user.id,
      verified: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 400 },
    );
  }
}
