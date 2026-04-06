import { Router } from 'express';
import {
  listArticles, getArticle, createArticle, updateArticle, deleteArticle, toggleArticleStatus,
} from '../controllers/articles.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listArticles);
router.get('/:id', getArticle);
router.post('/', createArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);
router.patch('/:id/toggle-status', toggleArticleStatus);

export default router;
