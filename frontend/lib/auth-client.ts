"use client";

import { API_URL } from "@/lib/api-config";

export type LoginResult = {
  ok: boolean;
  message: string;
};

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Login gagal" }));
    return { ok: false, message: data.message || "Login gagal" };
  }

  return { ok: true, message: "Login berhasil" };
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Token": getCookie("csrf_token")
    }
  }).catch(() => undefined);
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const shouldAttachCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (shouldAttachCsrf && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", getCookie("csrf_token"));
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  return fetch(url, {
    ...init,
    credentials: "include",
    headers
  });
}

export async function responseMessage(response: Response | null | undefined, fallback: string): Promise<string> {
  if (!response) {
    return "Koneksi ke server gagal. Periksa jaringan atau sesi login.";
  }
  const data = await response.json().catch(() => null);
  return data?.message || fallback;
}

export function getCookie(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : "";
}
