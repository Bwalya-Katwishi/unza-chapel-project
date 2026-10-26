import { AuditAction, BookingAuthority } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth/config";
import { isSuperAdmin, loadAccessContext } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string().min(1),
  authority: z.nativeEnum(BookingAuthority),
  reason: z.string().min(15).max(2000),
  facilityId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await loadAccessContext(session.user.id);
  if (!isSuperAdmin(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const grant = await prisma.exceptionalAccessGrant.create({
    data: {
      userId: parsed.data.userId,
      authority: parsed.data.authority,
      facilityId: parsed.data.facilityId,
      reason: parsed.data.reason,
      grantedById: session.user.id,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: AuditAction.PERMISSION_GRANT,
    entityType: "ExceptionalAccessGrant",
    entityId: grant.id,
    summary: `Granted exceptional access to ${parsed.data.authority}`,
    metadata: { reason: parsed.data.reason, userId: parsed.data.userId },
  });

  return NextResponse.json({ grant });
}
