import { Router } from 'express';
import {
  listPages, getPage, createPage, updatePage, deletePage, togglePageStatus,
} from '../controllers/pages.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listPages);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);
router.patch('/:id/toggle-status', togglePageStatus);

export default router;
