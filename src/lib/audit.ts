import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      summary: input.summary,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? undefined,
    },
  });
}
