"use client";

import { API_URL } from "@/lib/api";

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

export function getCookie(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : "";
}
