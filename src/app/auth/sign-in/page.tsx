import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="page-title">
          <p className="meta">Account</p>
          <h1>Sign in</h1>
          <p className="lede">
            Authorised users access dashboards, approvals and organisation tools after sign-in.
          </p>
        </div>
        <Suspense fallback={<div className="empty">Loading sign-in…</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
