import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Optimistic route guard. Pages and server actions still re-check against the DB.
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("lm_session")?.value;
  let role: string | null = null;
  if (token && process.env.SESSION_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET), { algorithms: ["HS256"] });
      role = (payload.role as string) ?? "USER";
    } catch {}
  }
  const { pathname } = req.nextUrl;
  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/account", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account/:path*"] };
