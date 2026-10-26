"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RecurringForm({
  facilities,
  defaultName,
  defaultEmail,
}: {
  facilities: Array<{ id: string; name: string }>;
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const form = new FormData(e.currentTarget);
    const weekdays = form.getAll("weekdays").map((v) => Number(v));
    const payload = {
      facilityId: String(form.get("facilityId")),
      title: String(form.get("title")),
      description: String(form.get("description")),
      eventType: String(form.get("eventType")),
      frequency: String(form.get("frequency")),
      weekdays,
      startDate: String(form.get("startDate")),
      endDate: String(form.get("endDate")),
      startTimeLocal: String(form.get("startTimeLocal")),
      endTimeLocal: String(form.get("endTimeLocal")),
      setupMinutes: Number(form.get("setupMinutes") || 0),
      cleanupMinutes: Number(form.get("cleanupMinutes") || 0),
      academicPeriod: String(form.get("academicPeriod") || "") || undefined,
      applicantName: String(form.get("applicantName")),
      contactEmail: String(form.get("contactEmail")),
      termsAccepted: true,
    };

    const res = await fetch("/api/bookings/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Unable to create series");
      return;
    }
    setResult(
      `Created ${data.reference} with ${data.occurrenceCount} occurrences. Conflicting dates: ${data.conflictReport?.length || 0}.`,
    );
    router.refresh();
  }

  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      <h3>New recurring series</h3>
      {error && <div className="alert error">{error}</div>}
      {result && <div className="alert">{result}</div>}
      <label>
        Facility
        <select name="facilityId" required defaultValue="">
          <option value="" disabled>
            Select
          </option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input name="title" required defaultValue="Weekly fellowship (sample)" />
      </label>
      <label>
        Description
        <textarea name="description" required defaultValue="Recurring allocation request for development testing." />
      </label>
      <div className="form-grid two">
        <label>
          Event type
          <select name="eventType" defaultValue="FELLOWSHIP_MEETING">
            <option value="FELLOWSHIP_MEETING">Fellowship meeting</option>
            <option value="WORSHIP_SERVICE">Worship service</option>
            <option value="PRAYER_NIGHT">Prayer night</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Frequency
          <select name="frequency" defaultValue="WEEKLY">
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="FORTNIGHTLY">Fortnightly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="SELECTED_WEEKDAYS">Selected weekdays</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="meta">Weekdays (for weekly / selected weekdays)</legend>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, idx) => (
          <label key={label} style={{ display: "inline-flex", marginRight: "0.75rem", alignItems: "center", gap: "0.25rem" }}>
            <input type="checkbox" name="weekdays" value={idx} defaultChecked={idx === 4} />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="form-grid two">
        <label>
          Start date
          <input name="startDate" type="date" required />
        </label>
        <label>
          End date
          <input name="endDate" type="date" required />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Start time
          <input name="startTimeLocal" type="time" required defaultValue="17:00" />
        </label>
        <label>
          End time
          <input name="endTimeLocal" type="time" required defaultValue="19:00" />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Setup minutes
          <input name="setupMinutes" type="number" defaultValue={15} />
        </label>
        <label>
          Cleanup minutes
          <input name="cleanupMinutes" type="number" defaultValue={15} />
        </label>
      </div>
      <label>
        Academic period label
        <input name="academicPeriod" placeholder="e.g. 2026 Academic Year (label only)" />
      </label>
      <div className="form-grid two">
        <label>
          Applicant name
          <input name="applicantName" required defaultValue={defaultName} />
        </label>
        <label>
          Contact email
          <input name="contactEmail" type="email" required defaultValue={defaultEmail} />
        </label>
      </div>
      <button className="btn btn-gold" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create recurring series"}
      </button>
    </form>
  );
}
