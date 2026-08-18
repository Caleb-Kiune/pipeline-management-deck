import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { data: session } = await betterFetch<any>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: request.headers,
    }
  );

  const isAuthPage = request.nextUrl.pathname === "/";
  const isProtected = request.nextUrl.pathname.startsWith("/pipeline") || request.nextUrl.pathname.startsWith("/dashboard");

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && isAuthPage) {
    const role = session.user?.role;
    if (role === "MANAGEMENT" || role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/pipeline", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
