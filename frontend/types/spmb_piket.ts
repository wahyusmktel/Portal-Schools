export type SpmbPiketMember = {
  order: number;
  name: string;
  notes?: string;
};

export type SpmbPiketDate = {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "26 Sep 2026"
};

export type SpmbPiketGroup = {
  id: number;
  academicYear: string;
  groupNumber: number;
  groupName: string;
  dayName: string;
  timeRange: string;
  dates: SpmbPiketDate[];
  members: SpmbPiketMember[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};
