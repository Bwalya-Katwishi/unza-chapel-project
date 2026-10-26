import Link from "next/link";
import { SiteMobileNav } from "@/components/site-mobile-nav";
import { Button } from "@/components/ui";
import { NAV_PRIMARY } from "@/lib/constants";
import { auth } from "@/lib/auth/config";

export async function SiteHeader() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <header className="site-header">
      <div className="container header-bar">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/unza-chapel-logo.jpg" alt="UNZA Chapel logo" className="brand-logo" width={44} height={44} />
          <span className="brand-text">
            <strong>UNZA Chapel</strong>
            <small>University of Zambia</small>
          </span>
        </Link>

        <nav className="nav-desktop" aria-label="Primary">
          {NAV_PRIMARY.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions header-actions--desktop">
          <Button href="/bookings/request" variant="primary">
            Book a space
          </Button>
          <Button href={signedIn ? "/dashboard" : "/auth/sign-in"} variant="ghost">
            {signedIn ? "Dashboard" : "Sign in"}
          </Button>
        </div>

        <div className="header-actions header-actions--mobile">
          <SiteMobileNav signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
