import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8) || '.jpg';
    const safe = crypto.randomBytes(10).toString('hex');
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only image files are allowed (jpg, png, webp, gif, avif).'));
    }
    cb(null, true);
  },
});

export const handleUpload = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const base =
    process.env.UPLOAD_BASE_URL?.replace(/\/$/, '') ||
    `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.status(201).json({
    ok: true,
    url,
    filename: req.file.filename,
    size: req.file.size,
    mime: req.file.mimetype,
  });
};

export const handleUploadError = (err, req, res, next) => {
  if (err && (err instanceof multer.MulterError || /image files/.test(err.message))) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};
