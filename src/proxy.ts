import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { env } from "~/env";

const maintenancePage = `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Przerwa techniczna | PPLka.pl</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      main { max-width: 36rem; text-align: center; }
      h1 { margin: 0 0 1rem; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.1; }
      p { margin: 0; color: #475569; font-size: 1.125rem; line-height: 1.7; }
      @media (prefers-color-scheme: dark) {
        body { background: #020617; color: #f8fafc; }
        p { color: #cbd5e1; }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Przerwa techniczna</h1>
      <p>PPLka.pl jest chwilowo niedostępna z powodu prac serwisowych. Wrócimy wkrótce.</p>
    </main>
  </body>
</html>`;

export function proxy(request: NextRequest) {
  if (env.MAINTENANCE_MODE) {
    return new NextResponse(maintenancePage, {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "3600",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

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
  matcher: "/((?!_next/static|_next/image|favicon.ico|serwist/).*)",
};
