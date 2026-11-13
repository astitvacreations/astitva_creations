import { google } from 'googleapis';
import fs from 'fs';
import { getCachedMedia, setCachedMedia } from './mediaCacheService.js';

let driveClient = null;

// Initialize Drive API Client with Service Account credentials
export const getDriveClient = () => {
  if (driveClient) return driveClient;

  let auth = null;

  // 1. Raw JSON Key in environment variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = typeof process.env.GOOGLE_SERVICE_ACCOUNT_KEY === 'string'
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  // 2. Client Email + Private Key directly in environment variables
  if (!auth) {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      // Handle escaped newlines in env variables
      privateKey = privateKey.replace(/\\n/g, '\n');
      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
    }
  }

  // 3. File path in GOOGLE_APPLICATION_CREDENTIALS
  if (!auth && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
    }
  }

  if (!auth) {
    console.warn('⚠️ Google Drive Service Account credentials not fully configured in .env. Service will run in mock/standby mode.');
    return null;
  }

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
};

// Retry wrapper with exponential backoff
export const withRetry = async (fn, maxRetries = 3, initialDelay = 500) => {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      // Check for rate limit or transient network errors (429, 500, 503, ETIMEDOUT)
      const status = error.status || error.code || (error.response && error.response.status);
      const isRetryable = status === 429 || status === 500 || status === 503 || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';

      if (!isRetryable || attempt >= maxRetries) {
        throw error;
      }

      console.warn(`[Drive API] Request failed with status ${status}. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2; // Exponential increase
    }
  }
};

/**
 * Scan and fetch all valid media files from a Google Drive folder.
 * Supports pagination (pageSize: 1000) and discovery.
 */
export const scanDriveFolder = async (folderId, options = {}) => {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive integration is not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in backend/.env.');
  }

  if (!folderId || typeof folderId !== 'string') {
    throw new Error('Invalid Google Drive folder ID.');
  }

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allFiles = [];
  let pageToken = null;

  do {
    const query = `'${folderId}' in parents and trashed = false`;
    const res = await withRetry(() =>
      drive.files.list({
        q: query,
        pageSize: 1000,
        pageToken: pageToken || undefined,
        fields: 'nextPageToken, files(id, name, mimeType, size, thumbnailLink, webContentLink, createdTime)',
        orderBy: 'name'
      })
    );

    const files = res.data.files || [];
    for (const f of files) {
      if (validMimeTypes.includes(f.mimeType)) {
        // Prepare optimized thumbnail URL from Google's CDN link if available
        let cdnThumbnail = f.thumbnailLink || '';
        if (cdnThumbnail && cdnThumbnail.includes('=s')) {
          cdnThumbnail = cdnThumbnail.replace(/=s\d+/, '=s400');
        } else if (cdnThumbnail) {
          cdnThumbnail = `${cdnThumbnail}=s400`;
        }

        allFiles.push({
          storageId: f.id,
          name: f.name,
          mimeType: f.mimeType,
          fileSize: parseInt(f.size || '0', 10),
          thumbnailUrl: cdnThumbnail,
          fullResUrl: `/api/client-gallery/media/${f.id}?sz=full`
        });
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  // Natural alphanumeric sort (e.g. IMG_1 before IMG_10)
  allFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return allFiles;
};

/**
 * Streams media from Google Drive with zero-latency proxy and caching
 */
export const streamDriveMedia = async (storageId, size = 'full', res) => {
  const cacheKey = `media_${storageId}_${size}`;
  const cached = getCachedMedia(cacheKey);

  // Serve from memory cache if available (0-5ms response)
  if (cached) {
    res.setHeader('Content-Type', cached.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('X-Cache-Status', 'HIT');
    return res.end(cached.buffer);
  }

  const drive = getDriveClient();
  if (!drive) {
    return res.status(500).json({ success: false, message: 'Drive service unavailable' });
  }

  // Set long-lived immutable cache headers
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  res.setHeader('X-Cache-Status', 'MISS');

  // If thumbnail or preview, fetch from Drive thumbnailLink or resized CDN
  if (size === 'thumb' || size === 'preview') {
    try {
      const fileMeta = await withRetry(() =>
        drive.files.get({
          fileId: storageId,
          fields: 'id, mimeType, thumbnailLink'
        })
      );

      const sDimension = size === 'thumb' ? 's400' : 's1600';
      let thumbUrl = fileMeta.data.thumbnailLink;
      if (thumbUrl) {
        if (thumbUrl.includes('=s')) {
          thumbUrl = thumbUrl.replace(/=s\d+/, `=${sDimension}`);
        } else {
          thumbUrl = `${thumbUrl}=${sDimension}`;
        }

        const thumbRes = await fetch(thumbUrl);
        if (thumbRes.ok) {
          const arrayBuf = await thumbRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const mimeType = fileMeta.data.mimeType || 'image/jpeg';

          // Cache in LRU memory cache
          setCachedMedia(cacheKey, buffer, mimeType);

          res.setHeader('Content-Type', mimeType);
          return res.end(buffer);
        }
      }
    } catch (e) {
      console.warn(`Drive thumbnail fetch fallback for ${storageId}:`, e.message);
    }
  }

  // Default: Stream the full media directly via chunked piping without filling RAM
  try {
    const streamRes = await withRetry(() =>
      drive.files.get(
        { fileId: storageId, alt: 'media' },
        { responseType: 'stream' }
      )
    );

    if (streamRes.data.headers && streamRes.data.headers['content-type']) {
      res.setHeader('Content-Type', streamRes.data.headers['content-type']);
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    // Pipe stream directly to client response
    streamRes.data.pipe(res);

    streamRes.data.on('error', (err) => {
      console.error(`Stream error for file ${storageId}:`, err);
      if (!res.headersSent) {
        res.status(500).end('Streaming error');
      }
    });
  } catch (error) {
    console.error(`Error requesting file stream for ${storageId}:`, error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({ success: false, message: 'Failed to stream media from storage' });
    }
  }
};

/**
 * Gets a readable stream for a specific Drive file (used by archiver for ZIP export)
 */
export const getDriveFileStream = async (storageId) => {
  const drive = getDriveClient();
  if (!drive) throw new Error('Drive client not initialized');

  const streamRes = await withRetry(() =>
    drive.files.get(
      { fileId: storageId, alt: 'media' },
      { responseType: 'stream' }
    )
  );

  return streamRes.data;
};

export default {
  getDriveClient,
  scanDriveFolder,
  streamDriveMedia,
  getDriveFileStream,
  withRetry
};

