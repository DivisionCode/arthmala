import express from 'express';
import { upload, handleUpload, handleUploadError } from '../controllers/uploadController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post(
  '/',
  uploadLimiter,
  requireAdmin,
  upload.single('file'),
  handleUpload,
  handleUploadError
);

export default router;
