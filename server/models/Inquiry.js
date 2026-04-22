import mongoose from 'mongoose';

const inquiryItemSchema = new mongoose.Schema(
  {
    artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
    title: { type: String, required: true },
    image: String,
    category: String,
    price: Number,
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ORDER_STATUSES = ['received', 'in_progress', 'shipped', 'delivered'];

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true }
);

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    whatsapp: { type: String, trim: true, maxlength: 40 },
    preferredContact: {
      type: String,
      enum: ['email', 'whatsapp', 'phone', 'any'],
      default: 'any',
    },
    budget: { type: String, trim: true, maxlength: 80 },
    timeline: { type: String, trim: true, maxlength: 80 },
    message: { type: String, trim: true, maxlength: 2000 },
    items: { type: [inquiryItemSchema], default: [] },
    status: {
      type: String,
      enum: ['new', 'contacted', 'quoted', 'closed'],
      default: 'new',
      index: true,
    },
    source: { type: String, default: 'web' },
    notes: { type: [noteSchema], default: [] },

    // Quote workflow — populated when status moves to "quoted"
    quotedPrice: { type: Number, min: 0 },
    quotedMessage: { type: String, trim: true, maxlength: 2000, default: '' },
    quotedAt: { type: Date },

    // Order tracking — populated once a quote is accepted and this becomes a real order.
    // The tracking token gives the customer a public, unguessable URL to watch progress.
    trackingToken: { type: String, unique: true, sparse: true, index: true },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: null },
    orderETA: { type: Date },
    orderTimeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Inquiry', inquirySchema);
