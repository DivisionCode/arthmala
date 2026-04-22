// Simple shared-secret auth for admin routes.
// Client sends the token in `x-admin-token` header; server compares constant-time.
import crypto from 'crypto';

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res
      .status(503)
      .json({ error: 'Admin access not configured. Set ADMIN_TOKEN in server .env.' });
  }
  const provided = req.get('x-admin-token') || '';
  if (!safeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}
