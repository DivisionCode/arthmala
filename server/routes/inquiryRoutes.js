import express from 'express';
import {
  createInquiry,
  listInquiries,
  updateInquiryStatus,
  updateInquiryOrder,
  addInquiryNote,
  deleteInquiryNote,
} from '../controllers/inquiryController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { inquiryLimiter, adminAuthLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', inquiryLimiter, createInquiry);

// Admin-only
router.get('/', adminAuthLimiter, requireAdmin, listInquiries);
router.patch('/:id/status', adminAuthLimiter, requireAdmin, updateInquiryStatus);
router.patch('/:id/order', adminAuthLimiter, requireAdmin, updateInquiryOrder);
router.post('/:id/notes', adminAuthLimiter, requireAdmin, addInquiryNote);
router.delete('/:id/notes/:noteId', adminAuthLimiter, requireAdmin, deleteInquiryNote);

export default router;
