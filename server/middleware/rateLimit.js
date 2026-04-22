import rateLimit from 'express-rate-limit';

// Inquiry POST — prevent flooding a designer's inbox. Allow 8 per 15 min per IP.
export const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many inquiries in a short time. Please try again in a few minutes.',
  },
});

// Upload POST — admin-only already, but extra belt: 60 per 10 min.
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit reached. Please wait and try again.' },
});

// Admin token validation attempts — prevent brute-force. 20 per 10 min per IP.
export const adminAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});
