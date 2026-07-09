import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/login") {
    const session = request.cookies.get("session_token")?.value;
    if (!session) {
      return NextResponse.next();
    }

    return redirectAuthenticatedUser(request, pathname);
  }

  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("session_token")?.value;
    if (!session) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return validateDashboardSession(request, pathname);
  }

  return NextResponse.next();
}

async function redirectAuthenticatedUser(request: NextRequest, pathname: string) {
  const user = await fetchCurrentUser(request);
  if (!user) {
    return NextResponse.next();
  }
  if (user.role === "admin-spmb") {
    return NextResponse.redirect(new URL("/dashboard/spmb", request.url));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

async function validateDashboardSession(request: NextRequest, pathname: string) {
  const user = await fetchCurrentUser(request);
  if (!user) {
    const response = NextResponse.redirect(new URL("/dashboard/login", request.url));
    response.cookies.delete("session_token");
    response.cookies.delete("csrf_token");
    return response;
  }
  if (user.role === "admin-spmb" && pathname !== "/dashboard/spmb") {
    return NextResponse.redirect(new URL("/dashboard/spmb", request.url));
  }

  return NextResponse.next();
}

async function fetchCurrentUser(request: NextRequest): Promise<{ role?: string } | null> {
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
      return null;
    }
    return (await response.json()) as { role?: string };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
