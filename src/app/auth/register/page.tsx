"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        password: form.get("password"),
        confirmPassword: form.get("confirmPassword"),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Registration failed");
      return;
    }
    router.push("/auth/sign-in");
  }

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="page-title">
          <p className="meta">Account</p>
          <h1>Registration</h1>
          <p className="lede">Create an individual booker account. Organisation profiles remain optional.</p>
        </div>
        <form className="panel form-grid" onSubmit={onSubmit}>
          {error && <div className="alert error">{error}</div>}
          <div className="form-grid two">
            <label>
              First name
              <input name="firstName" required />
            </label>
            <label>
              Last name
              <input name="lastName" required />
            </label>
          </div>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Phone
            <input name="phone" />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" required minLength={8} />
          </label>
          <button className="btn btn-navy" disabled={pending} type="submit">
            {pending ? "Creating…" : "Create account"}
          </button>
          <p>
            Already registered? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
