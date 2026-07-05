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

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  eyebrow: string;
  primaryText: string;
  primaryUrl: string;
  secondText: string;
  secondUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WhyChooseUsItem = {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SchoolUVPItem = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  highlight: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TeachingModule = {
  id: number;
  title: string;
  slug: string;
  description: string;
  subject: string;
  gradeLevel: string;
  authorName: string;
  coverImage: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  viewCount: number;
  downloadCount: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  spmbAcademicYear?: string;
  headerLogo?: string;
  socialMedia?: Array<{ label: string; value: string }>;
  partnerLinks?: Array<{ label: string; value: string }>;
  footerLogo?: string;
  footerText?: string;
  stats: Array<{ label: string; value: string }>;
};

export type SpmbRegistration = {
  id: number;
  registrationNumber: string;
  fullName: string;
  whatsappNumber: string;
  currentAddress: string;
  previousSchool: string;
  infoSource: string;
  fatherName: string;
  motherName: string;
  selectedMajorId: number;
  selectedMajorName: string;
  academicYear: string;
  createdAt: string;
};
