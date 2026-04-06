import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [reports, articles, pages, news, services, media] = await Promise.all([
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='published') as published,
        COUNT(*) FILTER (WHERE status='draft') as draft
        FROM reports`),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='published') as published,
        COUNT(*) FILTER (WHERE status='draft') as draft,
        COUNT(*) FILTER (WHERE featured=true) as featured
        FROM articles`),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='published') as published
        FROM pages`),
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='published') as published
        FROM news`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE active=true) as active FROM services`),
      query(`SELECT COUNT(*) as total, pg_size_pretty(SUM(size)) as total_size FROM media`),
    ]);

    const recentActivity = await query(`
      SELECT 'report' as type, title_en as title, status, created_at FROM reports
      UNION ALL
      SELECT 'article', title_en, status, created_at FROM articles
      UNION ALL
      SELECT 'news', headline_en, status, created_at FROM news
      ORDER BY created_at DESC LIMIT 10
    `);

    res.json({
      counts: {
        reports: reports.rows[0],
        articles: articles.rows[0],
        pages: pages.rows[0],
        news: news.rows[0],
        services: services.rows[0],
        media: media.rows[0],
      },
      recent_activity: recentActivity.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
