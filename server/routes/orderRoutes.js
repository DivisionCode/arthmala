import express from 'express';
import { getPublicOrder } from '../controllers/inquiryController.js';

const router = express.Router();

// Public read-only tracking endpoint. Token is the access key.
router.get('/:token', getPublicOrder);

export default router;
