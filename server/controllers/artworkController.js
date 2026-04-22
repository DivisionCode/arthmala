import mongoose from 'mongoose';
import Artwork from '../models/Artwork.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });
const CACHE_KEY = 'artworks';

const ALLOWED_FIELDS = ['title', 'image', 'images', 'category', 'description', 'price'];
const VALID_CATEGORIES = ['Lipan Art', 'Mandala', 'Embroidery', 'Crochet Art'];

function pickFields(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

export const getAllArtworks = async (req, res) => {
  try {
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const artworks = await Artwork.find().lean();
    cache.set(CACHE_KEY, artworks);
    res.json(artworks);
  } catch (err) {
    console.error('Artwork fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch artworks.' });
  }
};

export const getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid artwork id.' });
    }
    const artwork = await Artwork.findById(id).lean();
    if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });
    res.json(artwork);
  } catch (err) {
    console.error('Artwork detail error:', err);
    res.status(500).json({ error: 'Failed to load artwork.' });
  }
};

export const createArtwork = async (req, res) => {
  try {
    const data = pickFields(req.body ?? {});
    if (!data.title || !data.image || !data.category || data.price === undefined) {
      return res
        .status(400)
        .json({ error: 'title, image, category, and price are required.' });
    }
    if (!VALID_CATEGORIES.includes(data.category)) {
      return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    const artwork = await Artwork.create(data);
    cache.del(CACHE_KEY);
    res.status(201).json(artwork);
  } catch (err) {
    console.error('Artwork create error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create artwork.' });
  }
};

export const updateArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid artwork id.' });
    }
    const data = pickFields(req.body ?? {});
    if (data.category && !VALID_CATEGORIES.includes(data.category)) {
      return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    const updated = await Artwork.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: 'Artwork not found.' });
    cache.del(CACHE_KEY);
    res.json(updated);
  } catch (err) {
    console.error('Artwork update error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update artwork.' });
  }
};

export const deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid artwork id.' });
    }
    const removed = await Artwork.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ error: 'Artwork not found.' });
    cache.del(CACHE_KEY);
    res.json({ ok: true, id });
  } catch (err) {
    console.error('Artwork delete error:', err);
    res.status(500).json({ error: 'Failed to delete artwork.' });
  }
};

export const listCategories = (req, res) => res.json(VALID_CATEGORIES);

export const invalidateArtworkCache = () => cache.del(CACHE_KEY);
