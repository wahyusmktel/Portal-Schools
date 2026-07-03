const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const serverApiUrl = process.env.API_INTERNAL_URL || process.env.API_URL || publicApiUrl;

function normalizeApiUrl(value: string): string {
  return value.replace(/\/$/, "");
}

export const PUBLIC_API_URL = normalizeApiUrl(publicApiUrl);
export const API_URL = normalizeApiUrl(typeof window === "undefined" ? serverApiUrl : publicApiUrl);

