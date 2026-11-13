import jwt from 'jsonwebtoken';
import ClientGallery from '../models/ClientGallery.js';
import GalleryMedia from '../models/GalleryMedia.js';
import GalleryAuditLog from '../models/GalleryAuditLog.js';
import { scanDriveFolder, streamDriveMedia } from '../services/googleDriveService.js';
import {
  generateLightroomSearchString,
  generateCSVReport,
  streamSelectionsZIP,
  streamBulkSubmittedZIP
} from '../services/galleryExportService.js';
import {
  notifyClientGalleryPublished,
  notifySelectionSubmitted
} from '../services/whatsappService.js';
import {
  sendGalleryPublishedEmail,
  sendSelectionSubmittedEmail
} from '../services/galleryEmailService.js';

// Helper to create client JWT token
const generateClientToken = (galleryId, clientEmail) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign(
    {
      galleryId,
      clientEmail: clientEmail || '',
      role: 'client'
    },
    secret,
    { expiresIn: '30d' }
  );
};

// =========================================================================
// ADMIN CONTROLLERS
// =========================================================================

/**
 * @desc    Create new Client Gallery & index photos from Google Drive
 * @route   POST /api/client-gallery
 * @access  Admin
 */
export const createGallery = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      eventName,
      eventDate,
      folderLink,
      accessPin,
      subEvents = [],
      settings = {},
      status = 'Draft'
    } = req.body;

    if (!clientName) {
      return res.status(400).json({ success: false, message: 'Client name is required.' });
    }

    const folderId = ClientGallery.extractFolderId(folderLink);
    const normalizedPhone = ClientGallery.normalizePhone(clientPhone);

    // Create gallery document
    const gallery = await ClientGallery.create({
      clientName,
      clientEmail: clientEmail?.toLowerCase()?.trim() || '',
      clientPhone: normalizedPhone,
      eventName: eventName || 'Photography & Cinematography',
      eventDate: eventDate || null,
      folderLink: folderLink || '',
      folderId,
      accessPin: accessPin?.trim() || '',
      subEvents,
      settings: {
        maxSelectionsAllowed: settings.maxSelectionsAllowed ? Number(settings.maxSelectionsAllowed) : null,
        minSelectionsRequired: settings.minSelectionsRequired ? Number(settings.minSelectionsRequired) : 0,
        isSelectionLocked: false,
        allowClientDownloads: settings.allowClientDownloads !== false,
        watermarkEnabled: Boolean(settings.watermarkEnabled),
        watermarkText: settings.watermarkText || 'Astitva Creations',
        expiresAt: settings.expiresAt || null
      },
      status
    });

    let indexedCount = 0;

    // Scan main folder if provided
    if (folderId) {
      try {
        const driveFiles = await scanDriveFolder(folderId);
        if (driveFiles.length > 0) {
          const mediaDocs = driveFiles.map((file, idx) => ({
            galleryId: gallery._id,
            name: file.name,
            storageId: file.storageId,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            thumbnailUrl: file.thumbnailUrl,
            fullResUrl: file.fullResUrl,
            displayOrder: idx
          }));
          await GalleryMedia.insertMany(mediaDocs, { ordered: false });
          indexedCount += mediaDocs.length;
        }
      } catch (scanErr) {
        console.warn(`[Gallery Create] Folder scan warning for ${gallery._id}:`, scanErr.message);
      }
    }

    // Scan any sub-event folders
    if (Array.isArray(subEvents) && subEvents.length > 0) {
      for (const sub of subEvents) {
        const subFolderId = ClientGallery.extractFolderId(sub.folderId);
        if (subFolderId && subFolderId !== folderId) {
          try {
            const subFiles = await scanDriveFolder(subFolderId);
            if (subFiles.length > 0) {
              const subDocs = subFiles.map((f, idx) => ({
                galleryId: gallery._id,
                subEventId: sub.id,
                name: f.name,
                storageId: f.storageId,
                mimeType: f.mimeType,
                fileSize: f.fileSize,
                thumbnailUrl: f.thumbnailUrl,
                fullResUrl: f.fullResUrl,
                displayOrder: 10000 + idx
              }));
              await GalleryMedia.insertMany(subDocs, { ordered: false });
              indexedCount += subDocs.length;
            }
          } catch (e) {
            console.warn(`Sub-event folder scan error (${sub.name}):`, e.message);
          }
        }
      }
    }

    // Log audit
    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: status === 'Published' ? 'Published' : 'Viewed',
      performedBy: req.admin?.email || 'Admin',
      metadata: { initialMediaCount: indexedCount }
    });

    // If directly created as Published, dispatch notifications
    if (status === 'Published') {
      await notifyClientGalleryPublished(gallery);
      await sendGalleryPublishedEmail(gallery);
    }

    return res.status(201).json({
      success: true,
      message: `Gallery created successfully with ${indexedCount} indexed photos.`,
      data: gallery
    });
  } catch (error) {
    console.error('Create Gallery Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    List all galleries with media & selection counts
 * @route   GET /api/client-gallery
 * @access  Admin
 */
export const getGalleries = async (req, res) => {
  try {
    const { search, status, sort = 'newest' } = req.query;

    const query = {};
    if (status) query.status = status;

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientName: regex },
        { clientEmail: regex },
        { clientPhone: regex },
        { eventName: regex },
        { galleryId: regex }
      ];
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const galleries = await ClientGallery.find(query).sort(sortOption).lean();

    // Aggregate photo counts and selection counts per gallery
    const galleryIds = galleries.map((g) => g._id);
    const mediaCounts = await GalleryMedia.aggregate([
      { $match: { galleryId: { $in: galleryIds } } },
      {
        $group: {
          _id: '$galleryId',
          totalPhotos: { $sum: 1 },
          selectedPhotos: {
            $sum: { $cond: [{ $eq: ['$isSelected', true] }, 1, 0] }
          }
        }
      }
    ]);

    const countMap = {};
    mediaCounts.forEach((c) => {
      countMap[c._id.toString()] = {
        totalPhotos: c.totalPhotos,
        selectedPhotos: c.selectedPhotos
      };
    });

    const enrichedGalleries = galleries.map((g) => ({
      ...g,
      totalPhotos: countMap[g._id.toString()]?.totalPhotos || 0,
      selectedPhotos: countMap[g._id.toString()]?.selectedPhotos || 0
    }));

    return res.status(200).json({ success: true, count: enrichedGalleries.length, data: enrichedGalleries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get complete gallery details with all media and selection states
 * @route   GET /api/client-gallery/:id
 * @access  Admin
 */
export const getGalleryById = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    const media = await GalleryMedia.find({ galleryId: gallery._id }).sort({ displayOrder: 1, name: 1 });
    const auditLogs = await GalleryAuditLog.find({ galleryId: gallery._id }).sort({ createdAt: -1 }).limit(50);

    const selectedCount = media.filter((m) => m.isSelected).length;

    return res.status(200).json({
      success: true,
      data: {
        gallery,
        media,
        selectedCount,
        totalPhotos: media.length,
        auditLogs
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update gallery metadata, settings, expiry, PIN, or sub-events
 * @route   PUT /api/client-gallery/:id
 * @access  Admin
 */
export const updateGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    const prevStatus = gallery.status;

    // Updatable fields
    const {
      clientName,
      clientEmail,
      clientPhone,
      eventName,
      eventDate,
      folderLink,
      accessPin,
      subEvents,
      settings,
      status
    } = req.body;

    if (clientName !== undefined) gallery.clientName = clientName;
    if (clientEmail !== undefined) gallery.clientEmail = clientEmail?.toLowerCase()?.trim();
    if (clientPhone !== undefined) gallery.clientPhone = ClientGallery.normalizePhone(clientPhone);
    if (eventName !== undefined) gallery.eventName = eventName;
    if (eventDate !== undefined) gallery.eventDate = eventDate;
    if (accessPin !== undefined) gallery.accessPin = accessPin?.trim();
    if (subEvents !== undefined) gallery.subEvents = subEvents;

    if (folderLink !== undefined) {
      gallery.folderLink = folderLink;
      gallery.folderId = ClientGallery.extractFolderId(folderLink);
    }

    if (settings) {
      gallery.settings = {
        ...gallery.settings,
        ...settings
      };
    }

    if (status !== undefined) {
      gallery.status = status;
    }

    await gallery.save();

    // If transitioned to Published, trigger alerts
    if (prevStatus !== 'Published' && gallery.status === 'Published') {
      await notifyClientGalleryPublished(gallery);
      await sendGalleryPublishedEmail(gallery);
      await GalleryAuditLog.create({
        galleryId: gallery._id,
        action: 'Published',
        performedBy: req.admin?.email || 'Admin'
      });
    }

    return res.status(200).json({ success: true, data: gallery });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Incremental cloud sync: rescan storage folder, preserve selections and comments
 * @route   PUT /api/client-gallery/:id/sync
 * @access  Admin
 */
export const syncGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    if (!gallery.folderId) {
      return res.status(400).json({ success: false, message: 'No Google Drive folder configured for this gallery.' });
    }

    // 1. Fetch current remote files from Google Drive
    const remoteFiles = await scanDriveFolder(gallery.folderId);
    const remoteStorageIds = new Set(remoteFiles.map((f) => f.storageId));

    // 2. Fetch existing local media for this gallery
    const existingMedia = await GalleryMedia.find({ galleryId: gallery._id });
    const existingMap = new Map(existingMedia.map((m) => [m.storageId, m]));

    let addedCount = 0;
    let removedCount = 0;
    const toInsert = [];

    // Add new files
    remoteFiles.forEach((rf, idx) => {
      if (!existingMap.has(rf.storageId)) {
        toInsert.push({
          galleryId: gallery._id,
          name: rf.name,
          storageId: rf.storageId,
          mimeType: rf.mimeType,
          fileSize: rf.fileSize,
          thumbnailUrl: rf.thumbnailUrl,
          fullResUrl: rf.fullResUrl,
          displayOrder: idx
        });
        addedCount++;
      }
    });

    if (toInsert.length > 0) {
      await GalleryMedia.insertMany(toInsert);
    }

    // Remove deleted files
    for (const em of existingMedia) {
      if (!remoteStorageIds.has(em.storageId)) {
        await GalleryMedia.findByIdAndDelete(em._id);
        removedCount++;
      }
    }

    // 3. Re-sort displayOrder
    const finalMedia = await GalleryMedia.find({ galleryId: gallery._id });
    finalMedia.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const bulkOps = finalMedia.map((item, idx) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { displayOrder: idx } }
      }
    }));

    if (bulkOps.length > 0) {
      await GalleryMedia.bulkWrite(bulkOps);
    }

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'Synced',
      performedBy: req.admin?.email || 'Admin',
      metadata: { addedCount, removedCount, totalRemaining: finalMedia.length }
    });

    return res.status(200).json({
      success: true,
      message: `Sync complete: ${addedCount} added, ${removedCount} removed. Total: ${finalMedia.length}`,
      data: {
        added: addedCount,
        removed: removedCount,
        total: finalMedia.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reopen a submitted gallery to allow client revisions
 * @route   PUT /api/client-gallery/:id/reopen
 * @access  Admin
 */
export const reopenGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    gallery.status = 'Selecting';
    gallery.settings.isSelectionLocked = false;
    gallery.reopenedAt = new Date();
    await gallery.save();

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'Reopened',
      performedBy: req.admin?.email || 'Admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Gallery unlocked. Client can now modify and resubmit their selections.',
      data: gallery
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete gallery, media records, and audit logs
 * @route   DELETE /api/client-gallery/:id
 * @access  Admin
 */
export const deleteGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    await GalleryMedia.deleteMany({ galleryId: gallery._id });
    await GalleryAuditLog.deleteMany({ galleryId: gallery._id });
    await ClientGallery.findByIdAndDelete(gallery._id);

    return res.status(200).json({ success: true, message: 'Gallery and all associated records deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Export selection report in CSV format
 * @route   GET /api/client-gallery/:id/export-csv
 * @access  Admin
 */
export const exportCSV = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    const media = await GalleryMedia.find({ galleryId: gallery._id }).sort({ displayOrder: 1, name: 1 });
    const csvContent = generateCSVReport(gallery, media);

    const safeClient = (gallery.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeEvent = (gallery.eventName || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeClient}_${safeEvent}_selections.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'ExportedCSV',
      performedBy: req.admin?.email || 'Admin'
    });

    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Export Adobe Lightroom filter query snippet
 * @route   GET /api/client-gallery/:id/export-lightroom
 * @access  Admin
 */
export const exportLightroom = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    const media = await GalleryMedia.find({ galleryId: gallery._id, isSelected: true }).sort({ name: 1 });
    const result = generateLightroomSearchString(media);

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'ExportedLightroom',
      performedBy: req.admin?.email || 'Admin',
      metadata: { count: media.length }
    });

    // If query ?download=txt, send as downloadable text snippet
    if (req.query.download === 'txt') {
      const safeClient = (gallery.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeClient}_lightroom_filter.txt"`);
      return res.send(result.lightroomQuery);
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Stream high-resolution selected photos as a ZIP archive
 * @route   GET /api/client-gallery/:id/download-selections
 * @access  Admin
 */
export const downloadSelectionsZIP = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    const selectedMedia = await GalleryMedia.find({ galleryId: gallery._id, isSelected: true }).sort({
      displayOrder: 1,
      name: 1
    });

    if (selectedMedia.length === 0) {
      return res.status(400).json({ success: false, message: 'No photos have been selected in this gallery.' });
    }

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'DownloadedZIP',
      performedBy: req.admin?.email || 'Admin',
      metadata: { count: selectedMedia.length }
    });

    await streamSelectionsZIP(gallery, selectedMedia, res);
  } catch (error) {
    console.error('Download selections ZIP error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * @desc    Manually dispatch access link via WhatsApp & Email
 * @route   POST /api/client-gallery/:id/send-link
 * @access  Admin
 */
export const sendAccessLink = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    await notifyClientGalleryPublished(gallery);
    await sendGalleryPublishedEmail(gallery);

    return res.status(200).json({
      success: true,
      message: `Access link dispatched to ${gallery.clientName} via WhatsApp (${gallery.clientPhone || 'N/A'}) & Email (${gallery.clientEmail || 'N/A'}).`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Bulk multi-client selections ZIP export across date range
 * @route   GET /api/client-gallery/download-all-submitted
 * @access  Admin
 */
export const downloadAllSubmitted = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'Submitted' };

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.submittedAt = { $gte: new Date(startDate), $lte: end };
    }

    const submittedGalleries = await ClientGallery.find(query);
    if (submittedGalleries.length === 0) {
      return res.status(404).json({ success: false, message: 'No submitted galleries found for export.' });
    }

    const galleriesWithMedia = [];
    for (const g of submittedGalleries) {
      const media = await GalleryMedia.find({ galleryId: g._id, isSelected: true });
      if (media.length > 0) {
        galleriesWithMedia.push({ gallery: g, media });
      }
    }

    if (galleriesWithMedia.length === 0) {
      return res.status(404).json({ success: false, message: 'No selected photos found in submitted galleries.' });
    }

    await streamBulkSubmittedZIP(galleriesWithMedia, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// =========================================================================
// CLIENT & PUBLIC CONTROLLERS
// =========================================================================

/**
 * @desc    Client portal verification by email/phone & optional PIN
 * @route   POST /api/client-gallery/verify
 * @access  Public
 */
export const verifyClientAccess = async (req, res) => {
  try {
    const { identifier, pin } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide an email or phone number.' });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = ClientGallery.normalizePhone(identifier);

    // Find galleries matching email or phone
    const galleries = await ClientGallery.find({
      $and: [
        { status: { $ne: 'Archived' } },
        {
          $or: [
            { clientEmail: cleanInput },
            { clientPhone: cleanPhone }
          ]
        }
      ]
    }).lean();

    if (galleries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active photo gallery found for the provided email or phone number.'
      });
    }

    // Filter by PIN if pin is set on galleries
    const verifiedGalleries = [];
    for (const g of galleries) {
      // Check expiration
      if (g.settings?.expiresAt && new Date() > new Date(g.settings.expiresAt)) {
        continue;
      }

      if (g.accessPin) {
        if (!pin || pin.trim() !== g.accessPin.trim()) {
          continue; // PIN didn't match
        }
      }

      // Generate client token
      const token = generateClientToken(g._id, g.clientEmail);
      verifiedGalleries.push({
        galleryId: g.galleryId,
        id: g._id,
        clientName: g.clientName,
        eventName: g.eventName,
        eventDate: g.eventDate,
        status: g.status,
        token
      });
    }

    if (verifiedGalleries.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Access PIN or gallery has expired. Please contact studio.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Verified ${verifiedGalleries.length} active gallery profile(s).`,
      galleries: verifiedGalleries
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Magic Link / Public slug gallery loader
 * @route   GET /api/client-gallery/access/:galleryId
 * @access  Public (Magic Token / Slug)
 */
export const getPublicGallery = async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { pin } = req.query;

    const gallery = await ClientGallery.findOne({ galleryId });
    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found or link has changed.' });
    }

    if (gallery.status === 'Archived') {
      return res.status(403).json({ success: false, message: 'This gallery has been archived by the studio.' });
    }

    if (gallery.settings?.expiresAt && new Date() > new Date(gallery.settings.expiresAt)) {
      return res.status(403).json({
        success: false,
        message: 'This gallery link expired. Please contact Astitva Creations to extend access.'
      });
    }

    // Enforce Access PIN if configured
    if (gallery.accessPin) {
      const providedPin = pin || req.headers['x-access-pin'];
      if (!providedPin || providedPin.trim() !== gallery.accessPin.trim()) {
        return res.status(401).json({
          success: false,
          pinRequired: true,
          message: 'Access PIN required to view this private collection.'
        });
      }
    }

    // Fetch media items sorted
    const media = await GalleryMedia.find({ galleryId: gallery._id })
      .select('name storageId mimeType thumbnailUrl fullResUrl displayOrder isSelected rating clientComment subEventId selectedAt')
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const selectedCount = media.filter((m) => m.isSelected).length;

    // Issue client session token for fast subsequent requests
    const clientToken = generateClientToken(gallery._id, gallery.clientEmail);

    // Audit log
    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'Viewed',
      performedBy: gallery.clientName || 'Client',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    });

    return res.status(200).json({
      success: true,
      token: clientToken,
      data: {
        galleryId: gallery.galleryId,
        id: gallery._id,
        clientName: gallery.clientName,
        eventName: gallery.eventName,
        eventDate: gallery.eventDate,
        subEvents: gallery.subEvents || [],
        settings: gallery.settings,
        status: gallery.status,
        submittedAt: gallery.submittedAt,
        totalPhotos: media.length,
        selectedCount,
        media
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Streaming proxy for media thumbnails & previews with LRU memory caching
 * @route   GET /api/client-gallery/media/:storageId
 * @access  Public / Client
 */
export const getMediaProxy = async (req, res) => {
  const { storageId } = req.params;
  const { sz = 'preview' } = req.query; // 'thumb' | 'preview' | 'full'

  if (!storageId) {
    return res.status(400).json({ success: false, message: 'Storage ID is required.' });
  }

  return streamDriveMedia(storageId, sz, res);
};

/**
 * @desc    Batch toggle selection of photos
 * @route   PUT /api/client-gallery/:id/select
 * @access  Client (Authenticated via clientGalleryAuth)
 */
export const toggleSelection = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const gallery = req.gallery || await ClientGallery.findById(galleryId);

    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    if (gallery.settings?.isSelectionLocked || gallery.status === 'Submitted') {
      return res.status(403).json({
        success: false,
        message: 'Selection is locked. You have already submitted your final choices.'
      });
    }

    const { selectedStorageIds = [], unselectedStorageIds = [], storageId, isSelected } = req.body;

    // Normalizing batch vs single toggle
    const selectList = [...selectedStorageIds];
    const unselectList = [...unselectedStorageIds];

    if (storageId !== undefined && isSelected !== undefined) {
      if (isSelected) selectList.push(storageId);
      else unselectList.push(storageId);
    }

    // Atomic quota enforcement
    if (selectList.length > 0 && gallery.settings?.maxSelectionsAllowed) {
      const maxAllowed = gallery.settings.maxSelectionsAllowed;
      const currentSelectedCount = await GalleryMedia.countDocuments({
        galleryId: gallery._id,
        isSelected: true,
        storageId: { $nin: selectList }
      });

      if (currentSelectedCount + selectList.length > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Maximum selection limit reached (${maxAllowed} photos allowed). Please unselect some items before adding more.`
        });
      }
    }

    const bulkOps = [];

    if (selectList.length > 0) {
      bulkOps.push({
        updateMany: {
          filter: { galleryId: gallery._id, storageId: { $in: selectList } },
          update: { $set: { isSelected: true, selectedAt: new Date() } }
        }
      });
    }

    if (unselectList.length > 0) {
      bulkOps.push({
        updateMany: {
          filter: { galleryId: gallery._id, storageId: { $in: unselectList } },
          update: { $set: { isSelected: false, selectedAt: null } }
        }
      });
    }

    if (bulkOps.length > 0) {
      await GalleryMedia.bulkWrite(bulkOps);
    }

    // Advance status to 'Selecting' if in 'Published'
    if (gallery.status === 'Published') {
      gallery.status = 'Selecting';
      await gallery.save();
    }

    const updatedSelectedCount = await GalleryMedia.countDocuments({
      galleryId: gallery._id,
      isSelected: true
    });

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'SelectionChanged',
      performedBy: gallery.clientName || 'Client',
      metadata: {
        added: selectList.length,
        removed: unselectList.length,
        currentTotal: updatedSelectedCount
      }
    });

    return res.status(200).json({
      success: true,
      selectedCount: updatedSelectedCount,
      message: 'Selections updated successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Save client retouching comment or rating for a specific photo
 * @route   PUT /api/client-gallery/:id/media/:storageId/note
 * @access  Client
 */
export const saveMediaNote = async (req, res) => {
  try {
    const { id: galleryId, storageId } = req.params;
    const { clientComment, rating } = req.body;

    const media = await GalleryMedia.findOne({ galleryId, storageId });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Photo not found in gallery.' });
    }

    if (clientComment !== undefined) media.clientComment = clientComment.trim();
    if (rating !== undefined) media.rating = Math.max(0, Math.min(5, Number(rating)));

    await media.save();

    return res.status(200).json({ success: true, data: media });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Final submission & lock of client selections
 * @route   PUT /api/client-gallery/:id/submit
 * @access  Client
 */
export const submitSelections = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const gallery = req.gallery || await ClientGallery.findById(galleryId);

    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    if (gallery.settings?.isSelectionLocked || gallery.status === 'Submitted') {
      return res.status(400).json({ success: false, message: 'Selections have already been submitted.' });
    }

    const { submissionNotes = '' } = req.body;

    const selectedMedia = await GalleryMedia.find({ galleryId: gallery._id, isSelected: true });
    const selectedCount = selectedMedia.length;
    const totalCount = await GalleryMedia.countDocuments({ galleryId: gallery._id });

    // Validate minimum selections requirement
    const minRequired = gallery.settings?.minSelectionsRequired || 0;
    if (selectedCount < minRequired) {
      return res.status(400).json({
        success: false,
        message: `Please select at least ${minRequired} photos before submitting (currently selected: ${selectedCount}).`
      });
    }

    if (selectedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'You have not selected any photos yet. Please select photos before submitting.'
      });
    }

    // Lock gallery
    gallery.status = 'Submitted';
    gallery.settings.isSelectionLocked = true;
    gallery.submittedAt = new Date();
    gallery.submissionNotes = submissionNotes;
    await gallery.save();

    const stats = { selectedCount, totalCount };

    // Trigger notifications in parallel
    await notifySelectionSubmitted(gallery, stats);
    await sendSelectionSubmittedEmail(gallery, stats);

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'Submitted',
      performedBy: gallery.clientName || 'Client',
      metadata: { count: selectedCount, notes: submissionNotes }
    });

    return res.status(200).json({
      success: true,
      message: 'Your selections have been successfully submitted to Astitva Creations!',
      data: {
        galleryId: gallery.galleryId,
        selectedCount,
        submittedAt: gallery.submittedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Client download of selected high-res photos
 * @route   GET /api/client-gallery/:id/client-download
 * @access  Client (only if allowClientDownloads: true)
 */
export const clientDownloadZIP = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const gallery = req.gallery || await ClientGallery.findById(galleryId);

    if (!gallery) {
      return res.status(404).json({ success: false, message: 'Gallery not found.' });
    }

    if (!gallery.settings?.allowClientDownloads) {
      return res.status(403).json({
        success: false,
        message: 'High-resolution direct downloads are not permitted for this gallery.'
      });
    }

    const selectedMedia = await GalleryMedia.find({ galleryId: gallery._id, isSelected: true });
    if (selectedMedia.length === 0) {
      return res.status(400).json({ success: false, message: 'No selected photos available to download.' });
    }

    await GalleryAuditLog.create({
      galleryId: gallery._id,
      action: 'DownloadedZIP',
      performedBy: gallery.clientName || 'Client',
      metadata: { count: selectedMedia.length }
    });

    await streamSelectionsZIP(gallery, selectedMedia, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  syncGallery,
  reopenGallery,
  deleteGallery,
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
};

