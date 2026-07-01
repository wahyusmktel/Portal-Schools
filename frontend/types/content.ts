export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage: string;
  category: string;
  status?: "published" | "draft" | string;
  publishedAt: string;
  authorName: string;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  publishedAt: string;
};

export type Agenda = {
  id: number;
  title: string;
  location: string;
  startsAt: string;
};

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
  principalTitle: string;
  principalMessage: string;
  principalImage: string;
  headerLogo?: string;
  socialMedia?: Array<{ label: string; value: string }>;
  partnerLinks?: Array<{ label: string; value: string }>;
  footerLogo?: string;
  footerText?: string;
  stats: Array<{ label: string; value: string }>;
};
