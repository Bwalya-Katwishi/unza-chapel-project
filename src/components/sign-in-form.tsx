"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(search.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}
      <label>
        Email
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <button className="btn btn-navy" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p>
        <Link href="/auth/register">Create an account</Link> ·{" "}
        <Link href="/auth/recover">Password recovery</Link>
      </p>
    </form>
  );
}
