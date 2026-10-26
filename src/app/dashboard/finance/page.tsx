import { auth } from "@/lib/auth/config";
import { getManagedAuthorities, loadAccessContext } from "@/lib/auth/permissions";
import { formatZmw } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { RecordPaymentForm } from "@/components/record-payment-form";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  const session = await auth();
  const ctx = await loadAccessContext(session!.user!.id);
  const authorities = getManagedAuthorities(ctx);

  const obligations = await prisma.paymentObligation.findMany({
    where: authorities.length
      ? {
          OR: [
            { booking: { authority: { in: authorities } } },
            { organisationId: { not: null } },
          ],
        }
      : {
          OR: [
            { booking: { applicantId: session!.user!.id } },
            { organisation: { members: { some: { userId: session!.user!.id } } } },
          ],
        },
    include: {
      booking: true,
      payments: true,
      receipts: true,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)" }}>Finance</h1>
      <p className="lede">
        Currency defaults to ZMW. Sample fee configs are fictional. Screenshot uploads never mark a payment
        successful — only verified manual recording does.
      </p>
      {authorities.length > 0 && <RecordPaymentForm obligations={obligations.map((o) => ({ id: o.id, description: o.description }))} />}
      <table className="table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Due</th>
            <th>Paid</th>
            <th>Status</th>
            <th>Receipts</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((o) => (
            <tr key={o.id}>
              <td>{o.description}</td>
              <td>{formatZmw(Number(o.amountDueZmw))}</td>
              <td>{formatZmw(Number(o.amountPaidZmw))}</td>
              <td>{o.status}</td>
              <td>{o.receipts.map((r) => r.receiptNo).join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {obligations.length === 0 && <div className="empty">No payment obligations in scope yet.</div>}
    </div>
  );
}
