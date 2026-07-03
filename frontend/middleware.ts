import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const session = request.cookies.get("session_token")?.value;
    if (!session) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname !== "/dashboard/spmb") {
      return restrictSpmbAdmin(request, pathname);
    }
  }

  return NextResponse.next();
}

async function restrictSpmbAdmin(request: NextRequest, pathname: string) {
  const apiUrl = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: request.headers.get("cookie") || ""
      }
    });
    if (!response.ok) {
      return NextResponse.next();
    }
    const data = (await response.json()) as { role?: string };
    if (data.role === "admin-spmb" && pathname !== "/dashboard/spmb") {
      return NextResponse.redirect(new URL("/dashboard/spmb", request.url));
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
