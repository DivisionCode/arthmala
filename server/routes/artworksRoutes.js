import express from 'express';
import {
  getAllArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  listCategories,
} from '../controllers/artworkController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getAllArtworks);
router.get('/categories', listCategories);
router.get('/:id', getArtworkById);

// Admin-only
router.post('/', requireAdmin, createArtwork);
router.patch('/:id', requireAdmin, updateArtwork);
router.delete('/:id', requireAdmin, deleteArtwork);

export default router;
