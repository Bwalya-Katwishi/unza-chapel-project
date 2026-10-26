"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FacilityOption = { id: string; name: string; slug: string };

const EVENT_TYPES = [
  "WEDDING",
  "CONCERT",
  "PRAYER_NIGHT",
  "WORSHIP_SERVICE",
  "CONFERENCE",
  "FELLOWSHIP_MEETING",
  "OTHER",
] as const;

export function BookingForm({
  facilities,
  initialFacilityId,
}: {
  facilities: FacilityOption[];
  initialFacilityId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const date = String(form.get("requestedDate"));
    const startLocal = String(form.get("startLocal"));
    const endLocal = String(form.get("endLocal"));

    const payload = {
      facilityId: String(form.get("facilityId")),
      eventType: String(form.get("eventType")),
      title: String(form.get("title")),
      description: String(form.get("description")),
      requestedDate: date,
      startTime: new Date(`${date}T${startLocal}:00`).toISOString(),
      endTime: new Date(`${date}T${endLocal}:00`).toISOString(),
      setupMinutes: Number(form.get("setupMinutes") || 0),
      cleanupMinutes: Number(form.get("cleanupMinutes") || 0),
      expectedAttendance: form.get("expectedAttendance")
        ? Number(form.get("expectedAttendance"))
        : undefined,
      equipmentNeeds: String(form.get("equipmentNeeds") || "") || undefined,
      layoutNeeds: String(form.get("layoutNeeds") || "") || undefined,
      applicantName: String(form.get("applicantName")),
      contactEmail: String(form.get("contactEmail")),
      contactPhone: String(form.get("contactPhone") || "") || undefined,
      termsAccepted: form.get("termsAccepted") === "on",
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Validation failed");
      return;
    }
    router.push(`/bookings/${data.id}?ref=${data.reference}`);
  }

  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}
      <label>
        Facility
        <select name="facilityId" required defaultValue={initialFacilityId || ""}>
          <option value="" disabled>
            Select a facility
          </option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid two">
        <label>
          Event type
          <select name="eventType" required defaultValue="FELLOWSHIP_MEETING">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Expected attendance
          <input name="expectedAttendance" type="number" min={1} />
        </label>
      </div>
      <label>
        Event title
        <input name="title" required minLength={3} />
      </label>
      <label>
        Description
        <textarea name="description" required minLength={10} />
      </label>
      <div className="form-grid two">
        <label>
          Date
          <input name="requestedDate" type="date" required />
        </label>
        <label>
          Setup / cleanup (minutes)
          <div className="form-grid two">
            <input name="setupMinutes" type="number" min={0} defaultValue={30} />
            <input name="cleanupMinutes" type="number" min={0} defaultValue={30} />
          </div>
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Start time
          <input name="startLocal" type="time" required />
        </label>
        <label>
          End time
          <input name="endLocal" type="time" required />
        </label>
      </div>
      <label>
        Equipment needs
        <textarea name="equipmentNeeds" />
      </label>
      <label>
        Layout needs
        <textarea name="layoutNeeds" />
      </label>
      <div className="form-grid two">
        <label>
          Applicant name
          <input name="applicantName" required />
        </label>
        <label>
          Contact phone
          <input name="contactPhone" />
        </label>
      </div>
      <label>
        Contact email
        <input name="contactEmail" type="email" required />
      </label>
      <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <input name="termsAccepted" type="checkbox" required />
        I accept the applicable booking policies. Approval is not guaranteed by availability.
      </label>
      <button className="btn btn-gold" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit booking request"}
      </button>
    </form>
  );
}
