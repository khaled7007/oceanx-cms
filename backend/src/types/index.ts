import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export type ContentStatus = 'draft' | 'published';

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
  created_by?: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title_en: string;
  title_ar?: string;
  sections?: object[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  status: ContentStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type?: string;
  size?: number;
  tags?: string[];
  uploaded_by?: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  headline_en: string;
  headline_ar?: string;
  body_en?: string;
  body_ar?: string;
  source?: string;
  publish_date?: string;
  cover_image?: string;
  status: ContentStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
