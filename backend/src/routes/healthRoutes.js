import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/test-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Astitva Dev" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Astitva System: Email Test Success',
      text: 'If you are reading this, your email configuration (SMTP) is working perfectly!'
    });

    res.status(200).json({ success: true, message: 'Test email sent successfully to your own inbox!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  const status = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      VITE_API_URL: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api` : 'Not Set',
      MONGODB_URI: process.env.MONGODB_URI ? '******** (Atlas Cloud)' : 'Not Set',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not Set'
    }
  };
  res.status(200).json(status);
});

export default router;
