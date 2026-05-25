import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { sendAdminOtpEmail } from '../utils/mailer.js';

// Generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT Cookie
const sendTokenResponse = (admin, statusCode, res) => {
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    data: {
      id: admin._id,
      email: admin.email
    }
  });
};

/**
 * @desc    Login Admin & Send OTP
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate OTP
    const otp = generateOTP();
    admin.otp = otp;
    admin.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await admin.save();

    // Send OTP via email
    await sendAdminOtpEmail(admin.email, otp, 'login');

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Verify OTP & Log In
 * @route   POST /api/auth/verify
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.otp || admin.otp !== otp || admin.otpExpiry < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP and set last login
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    admin.lastLogin = Date.now();
    await admin.save();

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal that the user does not exist
      return res.status(200).json({ success: true, message: 'If the email exists, an OTP has been sent.' });
    }

    // Generate OTP
    const otp = generateOTP();
    admin.otp = otp;
    admin.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins
    await admin.save();

    // Send reset OTP
    await sendAdminOtpEmail(admin.email, otp, 'reset');

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Reset Password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (!admin.otp || admin.otp !== otp || admin.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Reset password
    admin.password = newPassword;
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Log out admin / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, data: {} });
};

/**
 * @desc    Get current logged in admin
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
