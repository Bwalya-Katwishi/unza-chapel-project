"use client";

import { useEffect, useState } from "react";

type CalEvent = {
  id: string;
  start: string;
  end: string;
  display: string;
  status: string;
  kind: string;
};

export function AvailabilityCalendar({ facilityId }: { facilityId?: string }) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 42);
    const qs = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      ...(facilityId ? { facilityId } : {}),
    });

    fetch(`/api/calendar?${qs}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load calendar");
        return res.json();
      })
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) return <div className="empty">Loading availability…</div>;
  if (error) return <div className="alert error">{error}</div>;

  return (
    <div>
      <div className="calendar-legend">
        <span><i className="dot available" /> Likely open (not a guarantee)</span>
        <span><i className="dot pending" /> Pending review</span>
        <span><i className="dot reserved" /> Reserved / closed</span>
      </div>
      {events.length === 0 ? (
        <div className="empty">No reserved or pending blocks in the next six weeks.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Public status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={`${event.kind}-${event.id}`}>
                <td>
                  {new Date(event.start).toLocaleString("en-ZM")} –{" "}
                  {new Date(event.end).toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>
                  <span className={`badge ${event.display === "Reserved" || event.display === "Closed" ? "rejected" : "pending"}`}>
                    {event.display}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
