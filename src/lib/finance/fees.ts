import { AuditAction, FeeType, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { generateReceiptNumber } from "@/lib/bookings/reference";
import { prisma } from "@/lib/prisma";

export async function calculateEstimatedFees(facilityId: string, durationHours: number) {
  const configs = await prisma.facilityFeeConfig.findMany({
    where: { facilityId, isActive: true },
  });

  return configs.map((cfg) => {
    let amount = Number(cfg.amountZmw);
    if (cfg.feeType === FeeType.HOURLY) {
      amount = amount * Math.max(durationHours, 0);
    }
    return {
      feeType: cfg.feeType,
      label: cfg.label,
      amountZmw: amount,
      isEstimate: cfg.isEstimate,
      notes: cfg.notes,
    };
  });
}

export async function createObligationFromAssessment(input: {
  bookingId?: string;
  organisationId?: string;
  description: string;
  amountDueZmw: number;
  dueDate?: Date;
}) {
  return prisma.paymentObligation.create({
    data: {
      bookingId: input.bookingId,
      organisationId: input.organisationId,
      description: input.description,
      amountDueZmw: new Prisma.Decimal(input.amountDueZmw),
      dueDate: input.dueDate,
      status: PaymentStatus.PENDING,
    },
  });
}

/**
 * Only explicitly verified manual payments update balances.
 * Uploading a screenshot must never call this without verified=true set by an admin.
 */
export async function recordVerifiedPayment(input: {
  obligationId: string;
  recordedById: string;
  amountZmw: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  verified: true;
}) {
  if (!input.verified) {
    throw new Error("Payments must be explicitly verified by an authorised administrator.");
  }

  return prisma.$transaction(async (tx) => {
    const obligation = await tx.paymentObligation.findUniqueOrThrow({
      where: { id: input.obligationId },
    });

    const payment = await tx.paymentRecord.create({
      data: {
        obligationId: obligation.id,
        recordedById: input.recordedById,
        amountZmw: new Prisma.Decimal(input.amountZmw),
        method: input.method,
        reference: input.reference,
        notes: input.notes,
        verified: true,
      },
    });

    const amountPaid = Number(obligation.amountPaidZmw) + input.amountZmw;
    const amountDue = Number(obligation.amountDueZmw);
    let status: PaymentStatus = PaymentStatus.PARTIAL;
    if (amountPaid <= 0) status = PaymentStatus.PENDING;
    else if (amountPaid + 0.001 >= amountDue) status = PaymentStatus.PAID;
    else status = PaymentStatus.PARTIAL;

    const updated = await tx.paymentObligation.update({
      where: { id: obligation.id },
      data: {
        amountPaidZmw: new Prisma.Decimal(amountPaid),
        status,
      },
    });

    const receipt = await tx.receipt.create({
      data: {
        obligationId: obligation.id,
        receiptNo: generateReceiptNumber(),
        amountZmw: new Prisma.Decimal(input.amountZmw),
        notes: "Manual verified payment receipt (development placeholder numbering).",
      },
    });

    return { payment, obligation: updated, receipt };
  }).then(async (result) => {
    await writeAuditLog({
      actorId: input.recordedById,
      action: AuditAction.PAYMENT_RECORD,
      entityType: "PaymentObligation",
      entityId: input.obligationId,
      summary: `Recorded verified payment of ZMW ${input.amountZmw}`,
      metadata: { method: input.method, reference: input.reference },
    });
    return result;
  });
}
