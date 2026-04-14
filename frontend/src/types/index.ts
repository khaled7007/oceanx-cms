export type ContentStatus = 'draft' | 'published';

export enum ReportStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface Bilingual {
  en: string;
  ar?: string;
}

export interface BilingualArray {
  en: string[];
  ar: string[];
}

export interface Report {
  id: string;
  title: Bilingual;
  categories: string[];
  date?: string;
  status: ReportStatus;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportDto {
  title: Bilingual;
  categories: string[];
  date?: string;
  status: ReportStatus;
  file_url?: string;
}

export type UpdateReportDto = Partial<CreateReportDto>;

export interface Article {
  id: string;
  title: Bilingual;
  body?: Bilingual;
  categories: string[];
  date?: string;
  cover_image?: string;
  status: ContentStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: Bilingual;
  sections?: ContentSection[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface ContentSection {
  type: string;
  title?: Bilingual;
  body?: Bilingual;
  [key: string]: unknown;
}

export interface Media {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type?: string;
  size?: number;
  uploaded_from: string;
  visible: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  title: Bilingual;
  overview?: Bilingual;
  description?: Bilingual;
  img?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  headline: Bilingual;
  body?: Bilingual;
  source?: string;
  date?: string;
  publish_date?: string;
  cover_image?: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export enum CompetencyCategory {
  BoardOfDirectors = 'Board of Directors',
  ConsultingTeam = 'Consulting Team',
}

export interface Competency {
  id: string;
  name: Bilingual;
  position: Bilingual;
  photo?: string;
  category: CompetencyCategory;
  department?: Bilingual;
  overview?: Bilingual;
  experience: BilingualArray;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  counts: {
    reports: { total: string; published: string; draft: string };
    articles: { total: string; published: string; draft: string; featured: string };
    pages: { total: string; published: string };
    news: { total: string; published: string };
    services: { total: string; active: string };
    media: { total: string; total_size: string };
  };
  recent_activity: Array<{
    type: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

export interface Partner {
  id: string;
  name: Bilingual;
  img: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: Bilingual;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  img: string;
  uploaded_from: string;
  visible: boolean;
  created_at: string;
}
