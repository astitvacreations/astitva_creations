import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Route Imports
import bookingRoutes from './routes/bookingRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import landingPageRoutes from './routes/landingPageRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://www.astitvacreations.com",
      "https://astitvacreations.com",
      "https://astitva-creations.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000 // 1000 requests per minute
});
app.use('/api', limiter);

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/landing-pages', landingPageRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);

// Resolve directories for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from frontend/dist
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Wildcard SPA route fallback for page refreshes
app.get(/^(.*)$/, (req, res) => {
  // If the path is an API path, return 404 instead of index.html
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API Route Not Found' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error', error: err });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

