import express from 'express';
import { getStats } from '../controllers/statsController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { adminAuthLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/', adminAuthLimiter, requireAdmin, getStats);

export default router;
