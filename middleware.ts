import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Auth enforcement will be enabled after Supabase sessions are wired.
  return NextResponse.next({
    request
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/contacts/:path*", "/events/:path*", "/campaigns/:path*", "/cards/:path*", "/settings/:path*"]
};
