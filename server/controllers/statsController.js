import Inquiry from '../models/Inquiry.js';
import Artwork from '../models/Artwork.js';

function dayKey(d) {
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalInquiries, newCount, contactedCount, quotedCount, closedCount, recentInquiries, totalArtworks] =
      await Promise.all([
        Inquiry.countDocuments({}),
        Inquiry.countDocuments({ status: 'new' }),
        Inquiry.countDocuments({ status: 'contacted' }),
        Inquiry.countDocuments({ status: 'quoted' }),
        Inquiry.countDocuments({ status: 'closed' }),
        Inquiry.find({ createdAt: { $gte: since30 } })
          .select('createdAt items')
          .lean(),
        Artwork.countDocuments({}),
      ]);

    // Inquiries-per-day bucketed (30 days)
    const perDay = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      perDay[dayKey(d)] = 0;
    }
    for (const inq of recentInquiries) {
      const k = dayKey(inq.createdAt);
      if (k in perDay) perDay[k] += 1;
    }
    const daily = Object.entries(perDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));

    // Popular products (from inquiry items, last 30d)
    const productCount = new Map();
    const categoryCount = new Map();
    for (const inq of recentInquiries) {
      for (const item of inq.items || []) {
        if (item.artworkId) {
          const key = String(item.artworkId);
          const entry = productCount.get(key) || {
            artworkId: key,
            title: item.title,
            image: item.image,
            category: item.category,
            inquiries: 0,
            qty: 0,
          };
          entry.inquiries += 1;
          entry.qty += Number(item.quantity) || 1;
          productCount.set(key, entry);
        }
        if (item.category) {
          categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
        }
      }
    }
    const topProducts = [...productCount.values()]
      .sort((a, b) => b.inquiries - a.inquiries)
      .slice(0, 6);

    const topCategories = [...categoryCount.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 7-day summary
    const last7 = recentInquiries.filter((i) => new Date(i.createdAt) >= since7).length;
    const prior7 = recentInquiries.filter(
      (i) => new Date(i.createdAt) >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
             new Date(i.createdAt) < since7
    ).length;

    // Inquiries still marked "new" older than 48h — worth nudging.
    const ageCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const aging = await Inquiry.find({
      status: 'new',
      createdAt: { $lt: ageCutoff },
    })
      .select('name email createdAt items')
      .sort({ createdAt: 1 })
      .limit(6)
      .lean();

    // Pipeline: totals quoted vs closed in the last 30 days (by quotedAt).
    const quotedRecent = await Inquiry.find({
      status: { $in: ['quoted', 'closed'] },
      quotedAt: { $gte: since30 },
    })
      .select('quotedPrice status quotedAt items')
      .lean();

    let quotedAmount = 0;
    let quotedRecentCount = 0;
    let closedAmount = 0;
    let closedRecentCount = 0;

    // Breakdown by primary category (first item's category).
    // Inquiries with no items bucket to "Unassigned".
    const byCategory = new Map(); // cat -> { quoted, closed, quotedCount, closedCount }
    function bump(cat, field, amount) {
      const e = byCategory.get(cat) || {
        quoted: 0, closed: 0, quotedCount: 0, closedCount: 0,
      };
      e[field] += amount;
      byCategory.set(cat, e);
    }

    for (const inq of quotedRecent) {
      const p = Number(inq.quotedPrice) || 0;
      quotedAmount += p;
      quotedRecentCount += 1;
      const cat = (Array.isArray(inq.items) && inq.items[0]?.category) || 'Unassigned';
      bump(cat, 'quoted', p);
      bump(cat, 'quotedCount', 1);
      if (inq.status === 'closed') {
        closedAmount += p;
        closedRecentCount += 1;
        bump(cat, 'closed', p);
        bump(cat, 'closedCount', 1);
      }
    }

    const conversionRate =
      quotedRecentCount > 0
        ? Math.round((closedRecentCount / quotedRecentCount) * 100)
        : 0;

    const pipelineByCategory = [...byCategory.entries()]
      .map(([category, e]) => ({
        category,
        quotedAmount: e.quoted,
        closedAmount: e.closed,
        quotedCount: e.quotedCount,
        closedCount: e.closedCount,
      }))
      .sort((a, b) => b.quotedAmount - a.quotedAmount);

    res.json({
      totals: {
        inquiries: totalInquiries,
        artworks: totalArtworks,
        new: newCount,
        contacted: contactedCount,
        quoted: quotedCount,
        closed: closedCount,
      },
      last7,
      prior7,
      daily,
      topProducts,
      topCategories,
      aging,
      pipeline: {
        quotedAmount,
        quotedCount: quotedRecentCount,
        closedAmount,
        closedCount: closedRecentCount,
        conversionRate,
        byCategory: pipelineByCategory,
      },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
};
