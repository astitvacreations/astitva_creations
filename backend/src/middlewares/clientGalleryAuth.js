import jwt from 'jsonwebtoken';
import ClientGallery from '../models/ClientGallery.js';
import Admin from '../models/Admin.js';

/**
 * Middleware to authenticate Client Gallery Access
 * Supports both Client JWT tokens and Admin JWT tokens (so admins can preview client views).
 */
export const clientGalleryAuth = async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.galleryToken) {
    token = req.cookies.galleryToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-gallery-token']) {
    token = req.headers['x-gallery-token'];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Client authentication token or PIN verification required.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret);

    // If request is from an authenticated admin
    if (decoded.id && !decoded.galleryId) {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        req.role = 'admin';
        return next();
      }
    }

    // Client session verification
    if (decoded.role === 'client' && decoded.galleryId) {
      const gallery = await ClientGallery.findById(decoded.galleryId);
      if (!gallery) {
        return res.status(404).json({ success: false, message: 'Gallery not found.' });
      }

      // Check if gallery is archived or expired
      if (gallery.status === 'Archived') {
        return res.status(403).json({ success: false, message: 'This gallery has been archived by the studio.' });
      }

      if (gallery.settings?.expiresAt && new Date() > new Date(gallery.settings.expiresAt)) {
        return res.status(403).json({ success: false, message: 'This gallery link has expired. Please contact studio.' });
      }

      req.client = decoded;
      req.gallery = gallery;
      req.role = 'client';
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid gallery authorization token.' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
};

export default clientGalleryAuth;
