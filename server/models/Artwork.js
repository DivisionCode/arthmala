import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
      enum: ['Lipan Art', 'Mandala', 'Embroidery', 'Crochet Art'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Virtual: every artwork exposes a unified `gallery` array [image, ...images]
artworkSchema.virtual('gallery').get(function () {
  const extras = Array.isArray(this.images) ? this.images : [];
  return [this.image, ...extras.filter(Boolean)];
});

artworkSchema.set('toJSON', { virtuals: true });
artworkSchema.set('toObject', { virtuals: true });

export default mongoose.model('Artwork', artworkSchema);
