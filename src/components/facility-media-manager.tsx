"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { facilityCoverUrl } from "@/lib/media/facilities";
import type { FacilityCode } from "@prisma/client";

type FacilityMedia = {
  id: string;
  name: string;
  code: FacilityCode;
  coverImageUrl: string | null;
  galleryUrls: string[];
};

export function FacilityMediaManager({ facility }: { facility: FacilityMedia }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cover = facilityCoverUrl(facility);
  const gallery = facility.galleryUrls.length
    ? facility.galleryUrls
    : [cover];

  async function upload(file: File, role: "cover" | "gallery") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("role", role);
      const res = await fetch(`/api/facilities/${facility.id}/media`, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage(role === "cover" ? "Cover photo updated." : "Gallery photo added.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function setCover(url: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/facilities/${facility.id}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageUrl: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not set cover");
      setMessage("Cover photo updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set cover");
    } finally {
      setBusy(false);
    }
  }

  async function remove(url: string) {
    if (!confirm("Remove this photo from the listing?")) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/facilities/${facility.id}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove photo");
      setMessage("Photo removed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel facility-media-card">
      <div className="facility-media-preview" style={{ backgroundImage: `url(${cover})` }} />
      <div>
        <p className="meta">{facility.code.replaceAll("_", " ")}</p>
        <h3>{facility.name}</h3>
        <p className="lede" style={{ marginBottom: "1rem" }}>
          Upload a cover photo and optional gallery images for this listing. Only your authority’s spaces appear here.
        </p>

        <div className="form-grid two" style={{ marginBottom: "1rem" }}>
          <label>
            Replace cover photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "cover");
                e.target.value = "";
              }}
            />
          </label>
          <label>
            Add gallery photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "gallery");
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {message && <div className="alert">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="media-thumb-grid">
          {gallery.map((url) => (
            <div key={url} className="media-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
              <div className="media-thumb-actions">
                {url === cover ? (
                  <span className="badge">Cover</span>
                ) : (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void setCover(url)}>
                    Make cover
                  </button>
                )}
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void remove(url)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
