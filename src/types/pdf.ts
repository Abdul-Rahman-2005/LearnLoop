export interface PDF {
  id: string;
  uploader_roll_number: string;
  uploader_name: string;
  branch: string;
  subject_name: string;
  semester: number;
  unit: number;
  file_name: string;
  file_path: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  views_count: number;
  downloads_count: number;
  average_rating: number;
  ratings_count: number;
  ai_summary: string | null;
  ai_topics: string[] | null;
  upload_reference: string;
  created_at: string;
  updated_at: string;
}

export interface PDFRating {
  id: string;
  pdf_id: string;
  roll_number: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PDFReport {
  id: string;
  pdf_id: string;
  reporter_roll_number: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string | null;
  roll_number: string | null;
  student_name: string | null;
  branch: string | null;
  points: number;
  badge: 'newcomer' | 'contributor' | 'expert' | 'legend';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Biotechnology',
  'Aerospace',
  'Other'
] as const;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const UNITS = [1, 2, 3, 4, 5] as const;

export type Branch = typeof BRANCHES[number];
export type Semester = typeof SEMESTERS[number];
export type Unit = typeof UNITS[number];
