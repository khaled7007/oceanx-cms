import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const listMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || '';
  const type = req.query.type as string; // image | pdf

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(original_name ILIKE $${idx} OR $${idx} = ANY(tags))`);
      params.push(`%${search}%`); idx++;
    }
    if (type === 'image') {
      conditions.push(`mime_type ILIKE 'image/%'`);
    } else if (type === 'pdf') {
      conditions.push(`mime_type = 'application/pdf'`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) FROM media ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT * FROM media ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );

    res.json({ data: dataResult.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch media' }); }
};

export const uploadMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [];

  try {
    const result = await query(
      `INSERT INTO media (filename, original_name, url, mime_type, size, tags, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.file.filename, req.file.originalname, url, req.file.mimetype, req.file.size, tags, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to save media record' });
  }
};

export const updateMediaTags = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tags } = req.body;
  try {
    const result = await query(
      'UPDATE media SET tags=$1 WHERE id=$2 RETURNING *',
      [tags || [], req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Media not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update tags' }); }
};

export const deleteMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM media WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Media not found' }); return; }

    const filePath = path.join(__dirname, '../../uploads', result.rows[0].filename);
    fs.unlink(filePath, () => {});

    res.json({ message: 'Media deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete media' }); }
};
