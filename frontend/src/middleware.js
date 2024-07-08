import { NextResponse } from "next/server";
import {ACCESS_TOKEN_KEY, REGISTER_ROUTE} from "@/uitils/static-const";


export async function middleware(request) {
  if (!request.cookies.get(ACCESS_TOKEN_KEY) && !request.nextUrl.pathname.startsWith(REGISTER_ROUTE)) {
    return Response.redirect(new URL(REGISTER_ROUTE, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
