import crypto from 'crypto';
import mongoose from 'mongoose';
import Inquiry from '../models/Inquiry.js';
import {
  sendInquiryEmail,
  sendInquiryConfirmation,
  sendQuoteEmail,
} from '../utils/mailer.js';

const VALID_ORDER_STATUS = ['received', 'in_progress', 'shipped', 'delivered'];

function generateTrackingToken() {
  // 24 random bytes → 32-char url-safe token. Collision-proof.
  return crypto.randomBytes(24).toString('base64url');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = ['new', 'contacted', 'quoted', 'closed'];

export const createInquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      whatsapp,
      preferredContact,
      budget,
      timeline,
      message,
      items,
      website, // honeypot — real users never fill this
      _formLoadedAt, // timestamp from client; suspiciously fast submits are bots
    } = req.body ?? {};

    // Honeypot: silently accept (200) so the bot thinks it worked,
    // but don't actually save or notify anyone.
    if (website && String(website).trim()) {
      console.warn('Honeypot tripped from', req.ip, '-- silently rejecting');
      return res.status(201).json({
        ok: true,
        message: 'Thank you. The designer will be in touch within 24 hours.',
      });
    }

    // Time-trap: if the form was submitted under 2 seconds after load, likely a bot.
    if (_formLoadedAt) {
      const elapsed = Date.now() - Number(_formLoadedAt);
      if (Number.isFinite(elapsed) && elapsed < 2000) {
        console.warn('Time-trap tripped (elapsed=' + elapsed + 'ms) from', req.ip);
        return res.status(201).json({
          ok: true,
          message: 'Thank you. The designer will be in touch within 24 hours.',
        });
      }
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!message && (!Array.isArray(items) || items.length === 0)) {
      return res
        .status(400)
        .json({ error: 'Add at least one item or tell us what you are looking for.' });
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      whatsapp,
      preferredContact,
      budget,
      timeline,
      message,
      items: Array.isArray(items) ? items : [],
    });

    // Fire both emails in parallel; neither blocks the response.
    sendInquiryEmail(inquiry).catch((err) =>
      console.error('Inquiry designer-email dispatch failed:', err?.message || err)
    );
    sendInquiryConfirmation(inquiry).catch((err) =>
      console.error('Inquiry customer-confirmation dispatch failed:', err?.message || err)
    );

    res.status(201).json({
      ok: true,
      id: inquiry._id,
      message: 'Thank you. The designer will be in touch within 24 hours.',
    });
  } catch (err) {
    console.error('Inquiry create error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
  }
};

export const listInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(inquiries);
  } catch (err) {
    console.error('Inquiry list error:', err);
    res.status(500).json({ error: 'Failed to load inquiries.' });
  }
};

export const addInquiryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body ?? {};
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inquiry id.' });
    }
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) {
      return res.status(400).json({ error: 'Note text is required.' });
    }
    if (clean.length > 2000) {
      return res.status(400).json({ error: 'Note is too long (max 2000 chars).' });
    }
    const updated = await Inquiry.findByIdAndUpdate(
      id,
      { $push: { notes: { text: clean, at: new Date() } } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Inquiry not found.' });
    res.status(201).json(updated);
  } catch (err) {
    console.error('Inquiry note add error:', err);
    res.status(500).json({ error: 'Failed to add note.' });
  }
};

export const deleteInquiryNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({ error: 'Invalid id.' });
    }
    const updated = await Inquiry.findByIdAndUpdate(
      id,
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json(updated);
  } catch (err) {
    console.error('Inquiry note delete error:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

export const updateInquiryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, orderETA, note } = req.body ?? {};
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inquiry id.' });
    }
    if (orderStatus && !VALID_ORDER_STATUS.includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const inq = await Inquiry.findById(id);
    if (!inq) return res.status(404).json({ error: 'Inquiry not found.' });

    // Ensure tracking token exists the first time the designer touches the order.
    if (!inq.trackingToken) {
      inq.trackingToken = generateTrackingToken();
    }

    // ETA update (independent of status change)
    if (orderETA !== undefined) {
      if (orderETA === null || orderETA === '') {
        inq.orderETA = undefined;
      } else {
        const d = new Date(orderETA);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Invalid orderETA.' });
        }
        inq.orderETA = d;
      }
    }

    // Status change → append to timeline
    if (orderStatus && orderStatus !== inq.orderStatus) {
      inq.orderStatus = orderStatus;
      inq.orderTimeline.push({
        status: orderStatus,
        at: new Date(),
        note: typeof note === 'string' ? note.trim().slice(0, 500) : '',
      });
    }

    await inq.save();
    res.json(inq.toObject());
  } catch (err) {
    console.error('Inquiry order update error:', err);
    res.status(500).json({ error: 'Failed to update order.' });
  }
};

export const getPublicOrder = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const inq = await Inquiry.findOne({ trackingToken: token }).lean();
    if (!inq || !inq.orderStatus) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Sanitize: the customer only needs their own first name + order details.
    // No email, phone, notes, message, or internal data goes on the public endpoint.
    const firstName =
      String(inq.name || '').trim().split(/\s+/)[0] || 'friend';

    res.set('Cache-Control', 'private, no-store');
    res.json({
      firstName,
      items: (inq.items || []).map((i) => ({
        title: i.title,
        image: i.image,
        category: i.category,
        quantity: i.quantity,
      })),
      orderStatus: inq.orderStatus,
      orderETA: inq.orderETA,
      orderTimeline: (inq.orderTimeline || []).map((t) => ({
        status: t.status,
        at: t.at,
      })),
      quotedPrice: inq.quotedPrice,
      confirmedAt: inq.quotedAt || inq.createdAt,
    });
  } catch (err) {
    console.error('Public order fetch error:', err);
    res.status(500).json({ error: 'Failed to load order.' });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, quotedPrice, quotedMessage } = req.body ?? {};
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid inquiry id.' });
    }
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    // Read current state so we can detect the "now quoted" transition.
    const existing = await Inquiry.findById(id).lean();
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });

    const update = { status };
    // Client explicitly opts in to sending the email (used for "Revise quote").
    const { revise } = req.body ?? {};

    if (status === 'quoted') {
      const priceNum = Number(quotedPrice);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res
          .status(400)
          .json({ error: 'A valid quoted price is required to mark as quoted.' });
      }
      update.quotedPrice = priceNum;
      update.quotedMessage = typeof quotedMessage === 'string' ? quotedMessage.trim() : '';
      update.quotedAt = new Date();
    }

    const updated = await Inquiry.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    // Fire the quote email on first transition into quoted, OR when the client
    // explicitly asks for a revision.
    const becameQuoted = status === 'quoted' && existing.status !== 'quoted';
    const shouldEmail = status === 'quoted' && (becameQuoted || !!revise);
    if (shouldEmail) {
      sendQuoteEmail(updated).catch((err) =>
        console.error('Quote email dispatch failed:', err?.message || err)
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('Inquiry status update error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};
