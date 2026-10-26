"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment: `${action} via dashboard` }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" disabled={busy} type="button" onClick={() => act("UNDER_REVIEW")}>
          Review
        </button>
        <button className="btn btn-navy" disabled={busy} type="button" onClick={() => act("APPROVED")}>
          Approve
        </button>
        <button className="btn btn-ghost" disabled={busy} type="button" onClick={() => act("REJECTED")}>
          Reject
        </button>
        <button className="btn btn-ghost" disabled={busy} type="button" onClick={() => act("CHANGES_REQUESTED")}>
          Changes
        </button>
      </div>
      {error && <span className="meta" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
