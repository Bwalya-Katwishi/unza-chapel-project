export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="page-title">
          <p className="meta">Visit</p>
          <h1>Contact and visitor information</h1>
          <p className="lede">Placeholder contacts only — replace with approved Chaplaincy details.</p>
        </div>
        <div className="panel">
          <p><strong>Office:</strong> Placeholder campus office location</p>
          <p><strong>Email:</strong> placeholder@example.com</p>
          <p><strong>Phone:</strong> placeholder</p>
          <p><strong>Hours:</strong> To be confirmed with the Chaplaincy office</p>
          <p className="alert">
            Booking questions for Side Chapels should go to the relevant Side Chapel administrators, not
            automatically to the overall Chaplaincy administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
