import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");
  const isApiAuthPage = req.nextUrl.pathname.startsWith("/api/auth");

  // Allow API auth routes
  if (isApiAuthPage) return NextResponse.next();

  // If user is on an auth page (signin/signup) and is already logged in, redirect to dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // If user is trying to access dashboard and is NOT logged in, redirect to signin
  if (isDashboardPage && !isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
