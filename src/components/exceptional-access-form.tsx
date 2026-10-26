"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ExceptionalAccessForm({
  users,
}: {
  users: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/exceptional-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.get("userId"),
        authority: form.get("authority"),
        reason: form.get("reason"),
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Grant recorded and audited." : data.error || "Failed");
    if (res.ok) router.refresh();
  }

  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      <h3>Grant exceptional cross-authority access</h3>
      {message && <div className="alert">{message}</div>}
      <label>
        User
        <select name="userId" required>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Authority
        <select name="authority" required>
          <option value="OVERALL_CHAPLAINCY">Overall Chaplaincy</option>
          <option value="CATHOLIC_SIDE_CHAPEL">Catholic Side Chapel</option>
          <option value="UCC_PROTESTANT_SIDE_CHAPEL">UCC / Protestant Side Chapel</option>
        </select>
      </label>
      <label>
        Justification (required)
        <textarea name="reason" required minLength={15} placeholder="Explain why exceptional access is required." />
      </label>
      <button className="btn btn-navy" type="submit">
        Grant and log
      </button>
    </form>
  );
}
