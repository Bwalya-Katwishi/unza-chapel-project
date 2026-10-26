import Link from "next/link";
import { APP_NAME, NAV_MORE, NAV_PRIMARY } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>{APP_NAME}</h2>
          <p>
            University of Zambia Great East Road Campus, Lusaka — a calm place for worship,
            fellowship, and booking chapel spaces.
          </p>
          <p className="footer-note">
            Community details and photos were taken from public Facebook pages and are pending
            confirmation by each group.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <ul>
            {NAV_PRIMARY.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>More</h3>
          <ul>
            {NAV_MORE.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <h3 style={{ marginTop: "1.5rem" }}>Contact</h3>
          <p>Great East Road Campus, Lusaka</p>
          <p>
            <Link href="/contact">Contact the Chaplaincy</Link>
          </p>
          <p>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </p>
        </div>
      </div>
      <div className="container footer-base">
        <p>© {new Date().getFullYear()} UNZA Chapel & Community Portal.</p>
      </div>
    </footer>
  );
}
