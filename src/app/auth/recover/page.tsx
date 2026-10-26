export const metadata = { title: "Password recovery" };

export default function RecoverPage() {
  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="page-title">
          <p className="meta">Account</p>
          <h1>Password recovery</h1>
          <p className="lede">
            Recovery tokens and email delivery are wired through the notification layer. Configure SMTP
            (`EMAIL_ENABLED=true` and SMTP_* variables) before enabling self-service resets in production.
          </p>
        </div>
        <div className="panel">
          <p className="alert">
            For local development, use a seeded account and reset the password with a secure admin process
            described in the README. Do not claim email delivery without SMTP confirmation.
          </p>
          <form className="form-grid">
            <label>
              Account email
              <input type="email" name="email" required placeholder="you@example.com" />
            </label>
            <button className="btn btn-ghost" type="button" disabled title="Enable after SMTP configuration">
              Request reset link (requires email configuration)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
