import { Router } from 'express';
import {
  listReports, getReport, createReport, updateReport, deleteReport, toggleReportStatus,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', listReports);
router.get('/:id', getReport);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);
router.patch('/:id/toggle-status', toggleReportStatus);

export default router;
