import { NextRequest, NextResponse } from "next/server";
import { API_URL, PUBLIC_API_URL } from "@/lib/api-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const targets = Array.from(new Set([API_URL, PUBLIC_API_URL].filter(Boolean)));

  try {
    const payload = await request.json();
    const body = JSON.stringify(payload);
    const errors: string[] = [];

    for (const target of targets) {
      try {
        const response = await fetch(`${target}/ai/chat`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(30000)
        });

        const data = await response.json().catch(() => null);
        if (response.ok) {
          return NextResponse.json(data || { message: "Respons Sobat Stella kosong" });
        }

        return NextResponse.json(
          data || { message: `Backend Sobat Stella merespons status ${response.status}` },
          { status: response.status }
        );
      } catch (error: any) {
        errors.push(`${target}: ${error?.message || "tidak bisa dihubungi"}`);
      }
    }

    return NextResponse.json(
      {
        message: "Frontend tidak bisa menghubungi backend Sobat Stella. Periksa API_INTERNAL_URL, service backend, dan firewall server.",
        detail: errors.join(" | ")
      },
      { status: 502 }
    );
  } catch {
    return NextResponse.json({ message: "Payload Sobat Stella tidak valid." }, { status: 400 });
  }
}
