import Artwork from '../models/Artwork.js';

function escapeXml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function publicBase() {
  return (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export const sitemap = async (req, res) => {
  try {
    const base = publicBase();
    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/products', priority: '0.9', changefreq: 'daily' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
    ];

    const artworks = await Artwork.find({}, { _id: 1, updatedAt: 1 }).lean();

    const urls = [
      ...staticRoutes.map(
        (r) => `
  <url>
    <loc>${escapeXml(base + r.path)}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      ),
      ...artworks.map(
        (a) => `
  <url>
    <loc>${escapeXml(`${base}/products/${a._id}`)}</loc>
    <lastmod>${new Date(a.updatedAt || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('<error>sitemap generation failed</error>');
  }
};

export const robots = (req, res) => {
  const base = publicBase();
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(body);
};
