import { Router } from 'express';
import {
  listServices, getService, createService, updateService, deleteService, toggleServiceActive,
} from '../controllers/services.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listServices);
router.get('/:id', getService);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.patch('/:id/toggle-active', toggleServiceActive);

export default router;
