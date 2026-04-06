import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

const getPagination = (req: AuthRequest) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  return { page, limit, offset: (page - 1) * limit };
};

export const listArticles = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPagination(req);
  const search = (req.query.search as string) || '';
  const status = req.query.status as string;
  const category = req.query.category as string;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(title_en ILIKE $${idx} OR title_ar ILIKE $${idx} OR author ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status && ['draft','published'].includes(status)) {
      conditions.push(`status = $${idx}`); params.push(status); idx++;
    }
    if (category) {
      conditions.push(`category ILIKE $${idx}`); params.push(`%${category}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM articles ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT id, title_en, title_ar, author, category, cover_image, status, featured, created_at, updated_at
       FROM articles ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );

    res.json({ data: dataResult.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

export const getArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Article not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch article' }); }
};

export const createArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, body_en, body_ar, author, category, cover_image, status, featured } = req.body;
  if (!title_en) { res.status(400).json({ error: 'English title is required' }); return; }

  try {
    const result = await query(
      `INSERT INTO articles (title_en,title_ar,body_en,body_ar,author,category,cover_image,status,featured,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title_en, title_ar||null, body_en||null, body_ar||null, author||null,
       category||null, cover_image||null, status||'draft', featured||false, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create article' }); }
};

export const updateArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, body_en, body_ar, author, category, cover_image, status, featured } = req.body;
  try {
    const exists = await query('SELECT id FROM articles WHERE id = $1', [req.params.id]);
    if (!exists.rows[0]) { res.status(404).json({ error: 'Article not found' }); return; }

    const result = await query(
      `UPDATE articles SET title_en=$1,title_ar=$2,body_en=$3,body_ar=$4,author=$5,
       category=$6,cover_image=$7,status=$8,featured=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [title_en, title_ar||null, body_en||null, body_ar||null, author||null,
       category||null, cover_image||null, status||'draft', featured||false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update article' }); }
};

export const deleteArticle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM articles WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Article not found' }); return; }
    res.json({ message: 'Article deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete article' }); }
};

export const toggleArticleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `UPDATE articles SET status=CASE WHEN status='draft' THEN 'published' ELSE 'draft' END, updated_at=NOW()
       WHERE id=$1 RETURNING id,status`,
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Article not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to toggle status' }); }
};
