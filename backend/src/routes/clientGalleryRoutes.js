import express from 'express';
import {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
  syncGallery,
  reopenGallery,
  exportCSV,
  exportLightroom,
  downloadSelectionsZIP,
  sendAccessLink,
  downloadAllSubmitted,
  verifyClientAccess,
  getPublicGallery,
  getMediaProxy,
  toggleSelection,
  saveMediaNote,
  submitSelections,
  clientDownloadZIP
} from '../controllers/clientGalleryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { clientGalleryAuth } from '../middlewares/clientGalleryAuth.js';

const router = express.Router();

// =========================================================================
// 1. PUBLIC / CLIENT ACCESS & STREAMING
// =========================================================================

// Path B: Client Portal Verification (Email / Phone + Access PIN)
router.post('/verify', verifyClientAccess);

// Path A: Magic Token / Slug Access (GET /api/client-gallery/access/:galleryId)
router.get('/access/:galleryId', getPublicGallery);

// Zero-Latency Dual-Resolution Streaming Proxy (GET /api/client-gallery/media/:storageId?sz=thumb|preview|full)
router.get('/media/:storageId', getMediaProxy);

// =========================================================================
// 2. ADMIN BULK ACTIONS (Declared before /:id to prevent route shadowing)
// =========================================================================

// Bulk Multi-Client Selections Export (GET /api/client-gallery/download-all-submitted)
router.get('/download-all-submitted', protect, downloadAllSubmitted);

// =========================================================================
// 3. CLIENT PROOFING & SELECTION WORKFLOWS (Authenticated via Client JWT or Admin)
// =========================================================================

// Real-Time Selection Toggle (PUT /api/client-gallery/:id/select)
router.put('/:id/select', clientGalleryAuth, toggleSelection);

// Per-Image Retouching / Revision Note (PUT /api/client-gallery/:id/media/:storageId/note)
router.put('/:id/media/:storageId/note', clientGalleryAuth, saveMediaNote);

// Final Selection Submission (PUT /api/client-gallery/:id/submit)
router.put('/:id/submit', clientGalleryAuth, submitSelections);

// Client Full Selections Download (GET /api/client-gallery/:id/client-download)
router.get('/:id/client-download', clientGalleryAuth, clientDownloadZIP);

// =========================================================================
// 4. ADMIN CRUD & POST-PRODUCTION DELIVERABLES
// =========================================================================

// Base collection routes
router.route('/')
  .post(protect, createGallery)
  .get(protect, getGalleries);

// Single gallery item routes
router.route('/:id')
  .get(protect, getGalleryById)
  .put(protect, updateGallery)
  .delete(protect, deleteGallery);

// Incremental Google Drive Sync (PUT /api/client-gallery/:id/sync)
router.put('/:id/sync', protect, syncGallery);

// Reopen Submitted Gallery (PUT /api/client-gallery/:id/reopen)
router.put('/:id/reopen', protect, reopenGallery);

// Adobe Lightroom Search String Generator (GET /api/client-gallery/:id/export-lightroom)
router.get('/:id/export-lightroom', protect, exportLightroom);

// Selection CSV Report (GET /api/client-gallery/:id/export-csv)
router.get('/:id/export-csv', protect, exportCSV);

// High-Resolution Selections ZIP Archive (GET /api/client-gallery/:id/download-selections)
router.get('/:id/download-selections', protect, downloadSelectionsZIP);

// Manual WhatsApp / Email Access Link Dispatch (POST /api/client-gallery/:id/send-link)
router.post('/:id/send-link', protect, sendAccessLink);

export default router;

