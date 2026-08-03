import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Redirect to the selected license if it exists
  if (request.nextUrl.pathname === "/") {
    const license = request.cookies.get("selected-license")?.value;
    if (license) {
      return NextResponse.redirect(new URL(`/${license}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
