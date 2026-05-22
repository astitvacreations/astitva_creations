import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { FeedbackToken } from '../models/FeedbackToken.js';
import { Testimonial } from '../models/Testimonial.js';

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const requestFeedbackEmail = async (req, res) => {
  try {
    const { clientName, clientEmail, eventType } = req.body;
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Save to DB
    await FeedbackToken.create({
      email: clientEmail.toLowerCase().trim(),
      clientName,
      eventType,
      token,
      expiresAt
    });

    // Generate the verification link
    const verificationLink = `${process.env.FRONTEND_URL}/feedback?token=${token}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: `Share your experience with Astitva Creations`,
      html: `
        <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #000; color: #fff; border: 1px solid #222;">
          <h1 style="color: #B19247; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Astitva Creations</h1>
          <p style="font-size: 18px; line-height: 1.6;">Dear ${clientName},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #A1A1A1;">It was an honor to capture your ${eventType}. We would love to hear your thoughts on the experience.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationLink}" style="background-color: #B19247; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Leave a Testimonial</a>
          </div>
          <p style="font-size: 14px; color: #555; text-align: center;">This link will expire in 7 days.</p>
          <p style="font-size: 12px; color: #333; text-align: center;">&copy; ${new Date().getFullYear()} Astitva Creations</p>
        </div>
      `
    };

    // Trigger email sending in the background (Non-blocking)
    if (process.env.EMAIL_PASS) {
      transporter.sendMail(mailOptions).catch(err => {
        console.error('Background Email Dispatch Error:', err);
      });
    }

    // Respond immediately so the UI feels instant
    res.status(200).json({ 
      success: true, 
      message: 'Feedback request generated! Email is being sent in the background.',
      token 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateFeedbackToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for verification.' });
    }

    const feedbackToken = await FeedbackToken.findOne({ 
      token, 
      email: email.toLowerCase().trim()
    });

    if (!feedbackToken) {
      return res.status(404).json({ success: false, message: 'Email verification failed.' });
    }

    if (feedbackToken.isUsed) {
      return res.status(400).json({ success: false, message: 'You have already submitted your feedback.' });
    }

    if (feedbackToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This secure link has expired.' });
    }

    res.status(200).json({ success: true, data: feedbackToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { token, author, text, rating, event } = req.body;
    
    // Validate token again
    const feedbackToken = await FeedbackToken.findOne({ 
      token, 
      isUsed: false, 
      expiresAt: { $gt: new Date() } 
    });

    if (!feedbackToken) {
      return res.status(404).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Create Testimonial with accurate submission date
    await Testimonial.create({
      author,
      text,
      rating,
      event: event || feedbackToken.eventType,
      isActive: true,
      createdAt: new Date() // Ensures date of the review submit is captured
    });

    // Mark token as used
    feedbackToken.isUsed = true;
    await feedbackToken.save();

    res.status(200).json({ success: true, message: 'Testimonial submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
