import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(data || { message: "Respons Sobat Stella tidak valid" }, {
      status: response.status
    });
  } catch {
    return NextResponse.json(
      { message: "Koneksi ke Sobat Stella gagal. Coba beberapa saat lagi." },
      { status: 502 }
    );
  }
}
