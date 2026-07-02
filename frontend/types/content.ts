export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage: string;
  category: string;
  status?: "published" | "draft" | string;
  thumbnailUrl?: string;
  viewCount?: number;
  publishedAt: string;
  authorName: string;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  status?: "draft" | "published";
  publishedAt: string;
};

export type Agenda = {
  id: number;
  title: string;
  location: string;
  startsAt: string;
};

export interface Achievement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  studentName: string;
  achievementLevel: string;
  achievedAt: string;
  createdAt: string;
}

export interface IndustryPartner {
  id: number;
  name: string;
  logoUrl: string;
  description: string;
  fieldOfIndustry: string;
  websiteUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface Alumni {
  id: number;
  name: string;
  graduationYear: number;
  currentStatus: string;
  companyOrUniversity: string;
  testimonial: string;
  imageUrl: string;
  createdAt: string;
}

export interface AlumniStat {
  status: string;
  count: number;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  createdAt: string;
}

export type Major = {
  id: number;
  name: string;
  slug: string;
  summary: string;
  icon: string;
  coverImage: string;
  curriculum: string[];
  careerProspects: string[];
};

export type SchoolProfile = {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  mapEmbedUrl: string;
  youtubeEmbedUrl?: string;
  principalName: string;
  principalTitle?: string;
  principalMessage?: string;
  principalImage?: string;
  vision?: string;
  mission?: string;
  spmbBrochureUrl?: string;
  headerLogo?: string;
  socialMedia?: Array<{ label: string; value: string }>;
  partnerLinks?: Array<{ label: string; value: string }>;
  footerLogo?: string;
  footerText?: string;
  stats: Array<{ label: string; value: string }>;
};
