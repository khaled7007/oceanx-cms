import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const listPages = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || '';

  try {
    const params: unknown[] = [];
    let where = '';
    if (search) {
      where = 'WHERE title_en ILIKE $1 OR slug ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM pages ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    params.push(limit, offset);
    const idx = params.length;

    const dataResult = await query(
      `SELECT id, slug, title_en, title_ar, meta_title, status, created_at, updated_at
       FROM pages ${where} ORDER BY created_at DESC LIMIT $${idx-1} OFFSET $${idx}`,
      params
    );

    res.json({ data: dataResult.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch pages' }); }
};

export const getPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM pages WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch page' }); }
};

export const createPage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug, title_en, title_ar, sections, meta_title, meta_description, meta_keywords, status } = req.body;
  if (!slug || !title_en) { res.status(400).json({ error: 'Slug and English title are required' }); return; }

  try {
    const result = await query(
      `INSERT INTO pages (slug,title_en,title_ar,sections,meta_title,meta_description,meta_keywords,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [slug, title_en, title_ar||null, JSON.stringify(sections||[]),
       meta_title||null, meta_description||null, meta_keywords||null, status||'draft', req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'A page with this slug already exists' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to create page' });
    }
  }
};

export const updatePage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug, title_en, title_ar, sections, meta_title, meta_description, meta_keywords, status } = req.body;
  try {
    const exists = await query('SELECT id FROM pages WHERE id=$1', [req.params.id]);
    if (!exists.rows[0]) { res.status(404).json({ error: 'Page not found' }); return; }

    const result = await query(
      `UPDATE pages SET slug=$1,title_en=$2,title_ar=$3,sections=$4,meta_title=$5,
       meta_description=$6,meta_keywords=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [slug, title_en, title_ar||null, JSON.stringify(sections||[]),
       meta_title||null, meta_description||null, meta_keywords||null, status||'draft', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'A page with this slug already exists' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to update page' });
    }
  }
};

export const deletePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM pages WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json({ message: 'Page deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete page' }); }
};

export const togglePageStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `UPDATE pages SET status=CASE WHEN status='draft' THEN 'published' ELSE 'draft' END,updated_at=NOW()
       WHERE id=$1 RETURNING id,status`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to toggle status' }); }
};
