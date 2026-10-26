import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = [
  "/dashboard",
  "/api/bookings",
  "/api/admin",
  "/api/finance",
  "/api/facilities",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // Allow public booking creation endpoint for authenticated or guest flows handled in route
  if (pathname === "/api/bookings" && req.method === "POST") {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/auth/sign-in", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/bookings/:path*",
    "/api/admin/:path*",
    "/api/finance/:path*",
    "/api/facilities/:path*",
  ],
};
