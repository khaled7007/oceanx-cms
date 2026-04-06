import { Router } from 'express';
import {
  listNews, getNewsItem, createNews, updateNews, deleteNews, toggleNewsStatus,
} from '../controllers/news.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listNews);
router.get('/:id', getNewsItem);
router.post('/', createNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);
router.patch('/:id/toggle-status', toggleNewsStatus);

export default router;
