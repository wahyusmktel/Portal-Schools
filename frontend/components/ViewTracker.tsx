"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const recordView = async () => {
      try {
        await fetch(`${API_URL}/articles/${slug}/view`, { method: "POST" });
      } catch (err) {
        // ignore
      }
    };
    
    // Only track if not previously tracked this session to avoid spam on fast refresh
    if (!sessionStorage.getItem(`viewed_${slug}`)) {
      recordView();
      sessionStorage.setItem(`viewed_${slug}`, "true");
    }
  }, [slug]);

  return null;
}
