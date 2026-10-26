import { NextResponse } from "next/server";
import { RoleCode } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/booking";
import { writeAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const role = await prisma.role.findUnique({ where: { code: RoleCode.INDIVIDUAL_BOOKER } });
  if (!role) {
    return NextResponse.json({ error: "Roles not seeded. Run db:seed first." }, { status: 500 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      roles: {
        create: { roleId: role.id },
      },
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: AuditAction.CREATE,
    entityType: "User",
    entityId: user.id,
    summary: `Registered individual booker ${email}`,
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
