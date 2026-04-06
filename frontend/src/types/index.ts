export type ContentStatus = 'draft' | 'published';

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

export interface Report {
  id: string;
  title_en: string;
  title_ar?: string;
  body_en?: string;
  body_ar?: string;
  author?: string;
  publish_date?: string;
  tags?: string[];
  pdf_url?: string;
  cover_image?: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title_en: string;
  title_ar?: string;
  body_en?: string;
  body_ar?: string;
  author?: string;
  category?: string;
  cover_image?: string;
  status: ContentStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title_en: string;
  title_ar?: string;
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
  title_en?: string;
  title_ar?: string;
  body_en?: string;
  body_ar?: string;
  [key: string]: unknown;
}

export interface Media {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type?: string;
  size?: number;
  tags?: string[];
  created_at: string;
}

export interface Service {
  id: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon_url?: string;
  image_url?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  headline_en: string;
  headline_ar?: string;
  body_en?: string;
  body_ar?: string;
  source?: string;
  publish_date?: string;
  cover_image?: string;
  status: ContentStatus;
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
