import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const listServices = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  const search = (req.query.search as string) || '';

  try {
    const params: unknown[] = [];
    let where = '';
    if (search) {
      where = 'WHERE title_en ILIKE $1 OR title_ar ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM services ${where}`, params);
    const total = parseInt(countResult.rows[0].count);
    const idx = params.length + 1;
    params.push(limit, offset);

    const dataResult = await query(
      `SELECT id, title_en, title_ar, icon_url, image_url, order_index, active, created_at
       FROM services ${where} ORDER BY order_index ASC, created_at ASC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json({ data: dataResult.rows, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch services' }); }
};

export const getService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM services WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Service not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch service' }); }
};

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, description_en, description_ar, icon_url, image_url, order_index, active } = req.body;
  if (!title_en) { res.status(400).json({ error: 'English title is required' }); return; }

  try {
    const result = await query(
      `INSERT INTO services (title_en,title_ar,description_en,description_ar,icon_url,image_url,order_index,active,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title_en, title_ar||null, description_en||null, description_ar||null,
       icon_url||null, image_url||null, order_index||0, active!==false, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create service' }); }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title_en, title_ar, description_en, description_ar, icon_url, image_url, order_index, active } = req.body;
  try {
    const exists = await query('SELECT id FROM services WHERE id=$1', [req.params.id]);
    if (!exists.rows[0]) { res.status(404).json({ error: 'Service not found' }); return; }

    const result = await query(
      `UPDATE services SET title_en=$1,title_ar=$2,description_en=$3,description_ar=$4,
       icon_url=$5,image_url=$6,order_index=$7,active=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [title_en, title_ar||null, description_en||null, description_ar||null,
       icon_url||null, image_url||null, order_index||0, active!==false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update service' }); }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM services WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) { res.status(404).json({ error: 'Service not found' }); return; }
    res.json({ message: 'Service deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete service' }); }
};

export const toggleServiceActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'UPDATE services SET active=NOT active, updated_at=NOW() WHERE id=$1 RETURNING id,active',
      [req.params.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Service not found' }); return; }
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to toggle active state' }); }
};
