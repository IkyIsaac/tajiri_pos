


import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("ktc_token")?.value;
  console.log("Middleware triggered for:", pathname, "Token:", token);

  const isLoginRoute = pathname === "/login";
  const isPublicRoute = isLoginRoute || pathname.startsWith("/_next");

  // If on /login and already logged in, redirect to /user
  if (isLoginRoute && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If on protected route and not logged in, redirect to /login
  const isProtectedRoute = !isPublicRoute && !pathname.startsWith("/api");
  if (isProtectedRoute && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}


