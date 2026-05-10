import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmailOtp, sendWhatsAppOtp } from '../utils/otpSender.js';

// Cache OTPs for 5 minutes (300 seconds)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const generateOtp = () => {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    const otp = generateOtp();
    const identifier = email ? email.toLowerCase() : phone;

    // Store in cache
    otpCache.set(identifier, otp);

    // Send OTP
    if (email) {
      await sendEmailOtp(identifier, otp);
    } else if (phone) {
      await sendWhatsAppOtp(identifier, otp);
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Request Error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    
    if (!otp || (!email && !phone)) {
      return res.status(400).json({ error: 'Identifier and OTP are required' });
    }

    const identifier = email ? email.toLowerCase() : phone;
    const cachedOtp = otpCache.get(identifier);

    if (!cachedOtp) {
      return res.status(400).json({ error: 'OTP expired or invalid' });
    }

    if (cachedOtp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // OTP is valid. Clear it from cache
    otpCache.del(identifier);

    // Find or create user
    let user = await User.findOne(email ? { email: identifier } : { phone: identifier });
    
    if (!user) {
      user = new User(email ? { email: identifier } : { phone: identifier });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_arthmala_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};
