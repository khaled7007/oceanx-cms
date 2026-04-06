import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const listNews = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || '';
  const status = req.query.status as string;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(headline_en ILIKE $${idx} OR headline_ar ILIKE $${idx} OR source ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status && ['draft','published'].includes(status)) {
      conditions.push(`status=$${idx}`); params.push(status); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM news ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT id, headline_en, headline_ar, source, publish_date, cover_image, status, created_at, updated_at
       FROM news ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json({ data: dataResult.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch news' }); }
};

export const getNewsItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM news WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'News item not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch news item' }); }
};

export const createNews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { headline_en, headline_ar, body_en, body_ar, source, publish_date, cover_image, status } = req.body;
  if (!headline_en) { res.status(400).json({ error: 'English headline is required' }); return; }

  try {
    const result = await query(
      `INSERT INTO news (headline_en,headline_ar,body_en,body_ar,source,publish_date,cover_image,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [headline_en, headline_ar||null, body_en||null, body_ar||null,
       source||null, publish_date||null, cover_image||null, status||'draft', req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create news' }); }
};

export const updateNews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { headline_en, headline_ar, body_en, body_ar, source, publish_date, cover_image, status } = req.body;
  try {
    const exists = await query('SELECT id FROM news WHERE id=$1', [req.params.id]);
    if (!exists.rows[0]) { res.status(404).json({ error: 'News item not found' }); return; }

    const result = await query(
      `UPDATE news SET headline_en=$1,headline_ar=$2,body_en=$3,body_ar=$4,source=$5,
       publish_date=$6,cover_image=$7,status=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [headline_en, headline_ar||null, body_en||null, body_ar||null,
       source||null, publish_date||null, cover_image||null, status||'draft', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update news' }); }
};

export const deleteNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM news WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'News item not found' }); return; }
    res.json({ message: 'News item deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete news' }); }
};

export const toggleNewsStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `UPDATE news SET status=CASE WHEN status='draft' THEN 'published' ELSE 'draft' END,updated_at=NOW()
       WHERE id=$1 RETURNING id,status`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'News item not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to toggle status' }); }
};
