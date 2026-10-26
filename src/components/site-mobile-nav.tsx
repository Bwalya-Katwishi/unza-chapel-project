"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { NAV_MORE, NAV_PRIMARY } from "@/lib/constants";

type SiteMobileNavProps = {
  signedIn: boolean;
};

export function SiteMobileNav({ signedIn }: SiteMobileNavProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-menu-toggle"
        aria-expanded={open}
        aria-controls="site-mobile-sheet"
        onClick={() => setOpen(true)}
      >
        Menu
      </button>

      {open ? (
        <div
          id="site-mobile-sheet"
          className="nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="nav-sheet-top">
            <p id={titleId} className="ui-eyebrow" style={{ margin: 0, color: "var(--accent)" }}>
              Menu
            </p>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <nav className="nav-sheet-links" aria-label="Mobile">
            {NAV_PRIMARY.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <p className="ui-eyebrow" style={{ marginTop: "1.5rem" }}>
              More
            </p>
            {NAV_MORE.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link
              href={signedIn ? "/dashboard" : "/auth/sign-in"}
              onClick={() => setOpen(false)}
              className="nav-sheet-account"
            >
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
