import { agendas, announcements, articles, majors, schoolProfile } from "@/lib/fallback-data";
import type { Agenda, Announcement, Article, Major, SchoolProfile, Achievement, IndustryPartner, Alumni, AlumniStat, FAQ } from "@/types/content";

const API_URL = typeof window === "undefined" ? "http://127.0.0.1:8080/api/v1" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1");

async function getJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...init?.headers
      }
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getSchoolProfile(): Promise<SchoolProfile> {
  const profile = await getJson("/school-profile", schoolProfile);
  return {
    ...schoolProfile,
    ...profile,
    principalName: profile.principalName || schoolProfile.principalName,
    principalTitle: profile.principalTitle || schoolProfile.principalTitle,
    principalMessage: profile.principalMessage || schoolProfile.principalMessage,
    principalImage: profile.principalImage || schoolProfile.principalImage,
    stats: Array.isArray(profile.stats) && profile.stats.length > 0 ? profile.stats : schoolProfile.stats
  };
}

export async function getMajors(): Promise<Major[]> {
  const data = await getJson("/majors", majors);
  return (data || []).map((major, index) => ({
    ...majors[index % majors.length],
    ...major,
    coverImage: major.coverImage || majors[index % majors.length].coverImage,
    curriculum: Array.isArray(major.curriculum) ? major.curriculum : majors[index % majors.length].curriculum,
    careerProspects: Array.isArray(major.careerProspects)
      ? major.careerProspects
      : majors[index % majors.length].careerProspects
  }));
}

export async function getArticles(): Promise<Article[]> {
  const data = await getJson("/articles", articles);
  return data || [];
}

export function getArticle(slug: string): Promise<Article | null> {
  const fallback = articles.find((article) => article.slug === slug) || null;
  return getJson(`/articles/${slug}`, fallback);
}

export async function getAnnouncements(includeDrafts?: boolean): Promise<Announcement[]> {
  const url = includeDrafts ? "/announcements?all=true" : "/announcements";
  const data = await getJson(url, announcements);
  return data || [];
}

export async function getAgendas(): Promise<Agenda[]> {
  const data = await getJson("/agendas", agendas);
  return data || [];
}

export async function getAchievements(): Promise<Achievement[]> {
  const data = await getJson("/achievements", [] as Achievement[]);
  return data || [];
}

export async function getIndustryPartners(): Promise<IndustryPartner[]> {
  const data = await getJson("/industry-partners", [] as IndustryPartner[]);
  return data || [];
}

export async function getAlumni(): Promise<Alumni[]> {
  const data = await getJson("/alumni", [] as Alumni[]);
  return data || [];
}

export async function getAlumniStats(): Promise<AlumniStat[]> {
  const data = await getJson("/alumni/stats", [] as AlumniStat[]);
  return data || [];
}

export async function getFaqs(): Promise<FAQ[]> {
  const data = await getJson("/faqs", [] as FAQ[]);
  return data || [];
}

export { API_URL };
