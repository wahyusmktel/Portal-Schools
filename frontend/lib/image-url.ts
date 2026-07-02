import { API_URL } from "@/lib/api-config";

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export function normalizeImageUrl(src?: string | null): string {
  const value = (src || "").trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("/uploads/")) {
    return `${API_ORIGIN}${value}`;
  }

  return value;
}
