import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
