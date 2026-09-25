import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isGuestOnlyRoute, isProtectedRoute } from "@/lib/auth/auth-routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No-account model: the site has no login. The old account routes
  // (/properties, /requests, /notifications) and the auth routes
  // (/login, /register, …) all redirect to home so there are no orphaned pages.
  if (isProtectedRoute(pathname) || isGuestOnlyRoute(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
