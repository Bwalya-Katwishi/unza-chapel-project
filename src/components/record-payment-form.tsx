"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RecordPaymentForm({
  obligations,
}: {
  obligations: Array<{ id: string; description: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/finance/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obligationId: form.get("obligationId"),
        amountZmw: Number(form.get("amountZmw")),
        method: form.get("method"),
        reference: form.get("reference") || undefined,
        notes: form.get("notes") || undefined,
        verified: true,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Recorded. Receipt ${data.receipt?.receiptNo}` : data.error || "Failed");
    if (res.ok) router.refresh();
  }

  if (obligations.length === 0) return null;

  return (
    <form className="panel form-grid two" onSubmit={onSubmit}>
      <h3 style={{ gridColumn: "1 / -1" }}>Record verified payment</h3>
      {message && <div className="alert" style={{ gridColumn: "1 / -1" }}>{message}</div>}
      <label>
        Obligation
        <select name="obligationId" required>
          {obligations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.description}
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount (ZMW)
        <input name="amountZmw" type="number" min={0.01} step="0.01" required />
      </label>
      <label>
        Method
        <select name="method" defaultValue="BANK_TRANSFER">
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="MOBILE_MONEY">Mobile money</option>
          <option value="CHEQUE">Cheque</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label>
        Payment reference
        <input name="reference" />
      </label>
      <label style={{ gridColumn: "1 / -1" }}>
        Notes
        <textarea name="notes" />
      </label>
      <button className="btn btn-navy" type="submit">
        Save verified payment
      </button>
    </form>
  );
}
