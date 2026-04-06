import { Router } from 'express';
import { listMedia, uploadMedia, updateMediaTags, deleteMedia } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listMedia);
router.post('/upload', upload.single('file'), uploadMedia);
router.patch('/:id/tags', updateMediaTags);
router.delete('/:id', deleteMedia);

export default router;
