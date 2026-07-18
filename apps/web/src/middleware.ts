import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/** Porovnanie odolné voči timing útokom (edge runtime nemá node:crypto). */
function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * /admin (v ľubovoľnom locale) chráni HTTP Basic auth; všetko ostatné
 * rieši next-intl locale routing. Plné prihlasovanie rieši fáza 10.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (/^(\/(sk|cs))?\/admin(\/|$)/.test(pathname)) {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;

    if (!user || !password) {
      return new NextResponse("Admin nie je nakonfigurovaný — nastav ADMIN_USER a ADMIN_PASSWORD.", {
        status: 503,
      });
    }

    const expected = `Basic ${btoa(`${user}:${password}`)}`;
    const provided = request.headers.get("authorization") ?? "";

    if (!timingSafeEqual(provided, expected)) {
      return new NextResponse("Prihlásenie vyžadované", {
        status: 401,
        headers: { "www-authenticate": 'Basic realm="App0 Admin", charset="UTF-8"' },
      });
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
