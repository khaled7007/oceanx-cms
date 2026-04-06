import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

const getPagination = (req: AuthRequest) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const listReports = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPagination(req);
  const search = (req.query.search as string) || '';
  const status = req.query.status as string;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(title_en ILIKE $${idx} OR title_ar ILIKE $${idx} OR author ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status && (status === 'draft' || status === 'published')) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM reports ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT id, title_en, title_ar, author, publish_date, tags, cover_image, pdf_url, status, created_at, updated_at
       FROM reports ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, body_en, body_ar, author, publish_date, tags, pdf_url, cover_image, status } = req.body;

  if (!title_en) {
    res.status(400).json({ error: 'English title is required' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO reports (title_en, title_ar, body_en, body_ar, author, publish_date, tags, pdf_url, cover_image, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [title_en, title_ar || null, body_en || null, body_ar || null, author || null,
       publish_date || null, tags || [], pdf_url || null, cover_image || null,
       status || 'draft', req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, body_en, body_ar, author, publish_date, tags, pdf_url, cover_image, status } = req.body;

  try {
    const exists = await query('SELECT id FROM reports WHERE id = $1', [req.params.id]);
    if (!exists.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const result = await query(
      `UPDATE reports SET
        title_en=$1, title_ar=$2, body_en=$3, body_ar=$4, author=$5,
        publish_date=$6, tags=$7, pdf_url=$8, cover_image=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title_en, title_ar || null, body_en || null, body_ar || null, author || null,
       publish_date || null, tags || [], pdf_url || null, cover_image || null,
       status || 'draft', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM reports WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json({ message: 'Report deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

export const toggleReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `UPDATE reports SET status = CASE WHEN status='draft' THEN 'published' ELSE 'draft' END, updated_at=NOW()
       WHERE id=$1 RETURNING id, status`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
};
