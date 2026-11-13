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

  // 3. File path in GOOGLE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS, or default local config
  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || './src/config/google-service-account.json';
  if (!auth && keyFilePath) {
    if (fs.existsSync(keyFilePath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
    }
  }

  // 4. Built-in studio service account fallback (ensures production works seamlessly)
  if (!auth) {
    try {
      const fallbackCreds = {
        type: "service_account",
        project_id: "cosmic-kayak-514617-q0",
        private_key_id: "2c27158c69d068a5d16eaeeb9fec85ce019410db",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDXC+KtgtG6S39k\nbHgFXyIPs3bwSfJNKrPm//YNAC3ETy/j3JJEK5+/PZ+T2KPjcSS2uL9JT2UiQsul\nD+ZNnRnR9XaM6BKX3xWlYKAKZvam/u2zYkP8zlRksOe61rZa+8UEYwlPIWnMpfcY\nWdCEZ7bByqTTZ/qwOpSWJOHgnD5Wmi+IYXwwwrIXSMRHGOWEuKqNFQEuEUKHyEpk\nqq3wDMRQKSF+Rc3ir7drUuKBlCOEEu9SYdyJMucS9C6OFuIL0MioTQCnkbR7Zt8L\nCtULfgGqsj935D0iOrwnStetMILVD6h/R55XAG/uv0T603ukENRXmucJQPryAcYU\nxk4X0XOHAgMBAAECggEAGA39dwDf+pGbuD0v4b3wqUafDSWLDoRdJ6pFuNI7zFk6\nl1JNeYWoXV6EcqfJkVVPJjHykmiTUf/xwqQi1AIOPipRw/+TpjGvPKwFyulrOWaL\nv+9D1qFdLFQ435vz6FKAXnYWN6fvqz4nWS3MFtDOec1JSa04YVfJgNAIWjUaqK9r\nGA750cKyVxmHjM/yrCHQHWVuA5G78zRgMVfq/JL6xnIhVx8jGoqdETLqk2zNryoZ\nexYzXEzT8tWh8mAjlWCJqMY4+w3nUhyzgYMSbXK32JBDkIXUuZhw06BCMQjNp0li\nFHVjQynV5QsXkgILkpLXb1dw8vRptPKu7NS5iYNSqQKBgQDrzb91zChs8XEl2Qjv\njpWFyZMjNKoGcg86eFfmTMngzLZGXYtxwDdFnK5ho8PUXlkcTclNm42yYVYdiKAC\njLbaR91bka54yIpjRUL+otZYiwUYj6mZKnHqD7G/+8FTd6XMG3Q1e16Q1+4O0qaf\n4UtKu5yqsjsea5yYtFBQRjAuyQKBgQDpdwMEODkptn1Uyvs62hudhlvsONcY/cvk\n3pny7axceIQP4Px+Dd2GgSLSC70xIka4OKIuTsWBQJ81hPI+mPHFT3OAJBw+/4eQ\nKjF2yeGr7kzRZKCK/wNc1Lom0jU1qL+btcxUlCVG8U0IF7ezlf0LTiuQjLr6tpWP\nFFVuqGMnzwKBgAHYhXQlmfdoWGtkbIZ7hj4a2tT+t4n/YJEjmgSKe1YQJCke2FWW\nnJgl5tOK1aCW8HmhPj8mRZCs5GCszhvXACNrRpdN56C4aSTnyON3YNgmlm6fyUMS\nqvubDdgj31qI6DpVyK4WfiICHrHtAjLkL5OxLkPDy2SskPg9CRfnxL7JAoGBAIu9\nY33UFUsFYvEs6cEpKZxY/o5e20inKLKeFrGUVzWmIQ3MEfV1YSIQC4KD6kMNjBza\nMSDcn1UlE+aZ49FaBGSgkLajZpDCrCa7So4aekxJv4sZ2wo3Z5DZ924jJhwvHDkc\nUOhTIBjdd8kfQSJp5WMt799+jLBiNxTEC/rHKUp7AoGAHgSsbEEQsxIGfF1NPjQq\nHA/XOJm9dyXx8mn16eSnAuAlnIGB/PUUi3rAEe/w4GNaoiSxdsGQbmL7qLzZyCzH\nCJHmpD41AFhd3dfNASLQYcJ78KiQ8nB6BSFq2mRFhV8ZoPLt0LwnqakFy9fJ9e1k\ndyQHcrlVcr2xlbgzrHt02aA=\n-----END PRIVATE KEY-----\n",
        client_email: "astitva-gallery-bot@cosmic-kayak-514617-q0.iam.gserviceaccount.com"
      };
      auth = new google.auth.GoogleAuth({
        credentials: fallbackCreds,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
    } catch (e) {
      console.error('Fallback credentials error:', e.message);
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
export const streamDriveMedia = async (storageId, size = 'full', res, storedThumbnailUrl = null) => {
  const cacheKey = `media_${storageId}_${size}`;
  const cached = getCachedMedia(cacheKey);

  // Serve from memory cache if available (0-5ms response)
  if (cached) {
    res.setHeader('Content-Type', cached.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.setHeader('X-Cache-Status', 'HIT');
    return res.end(cached.buffer);
  }

  // Set long-lived immutable cache headers
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  res.setHeader('X-Cache-Status', 'MISS');

  // If thumbnail or preview, fetch from Drive thumbnailLink or resized CDN
  if (size === 'thumb' || size === 'preview') {
    const sDimension = size === 'thumb' ? 's400' : 's1000';

    // 1. If storedThumbnailUrl is provided, bypass Drive API client entirely (30-50ms)
    if (storedThumbnailUrl) {
      try {
        let targetUrl = storedThumbnailUrl.includes('=s')
          ? storedThumbnailUrl.replace(/=s\d+/, `=${sDimension}`)
          : `${storedThumbnailUrl}=${sDimension}`;

        let thumbRes = await fetch(targetUrl);
        if (!thumbRes.ok && size === 'preview') {
          targetUrl = storedThumbnailUrl.includes('=s')
            ? storedThumbnailUrl.replace(/=s\d+/, '=s800')
            : storedThumbnailUrl;
          thumbRes = await fetch(targetUrl);
        }
        if (!thumbRes.ok) {
          thumbRes = await fetch(storedThumbnailUrl);
        }

        if (thumbRes.ok) {
          const arrayBuf = await thumbRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const mimeType = thumbRes.headers.get('content-type') || 'image/jpeg';

          // Cache in LRU memory cache
          setCachedMedia(cacheKey, buffer, mimeType);

          res.setHeader('Content-Type', mimeType);
          return res.end(buffer);
        }
      } catch (fastErr) {
        // Fallback to Drive API below
      }
    }

    // 2. Drive client fallback
    const drive = getDriveClient();
    if (drive) {
      try {
        const fileMeta = await withRetry(() =>
          drive.files.get({
            fileId: storageId,
            fields: 'id, mimeType, thumbnailLink'
          })
        );

        const rawThumb = fileMeta.data.thumbnailLink;
        if (rawThumb) {
          let targetUrl = rawThumb.includes('=s')
            ? rawThumb.replace(/=s\d+/, `=${sDimension}`)
            : `${rawThumb}=${sDimension}`;

          let thumbRes = await fetch(targetUrl);
          if (!thumbRes.ok && size === 'preview') {
            targetUrl = rawThumb.includes('=s') ? rawThumb.replace(/=s\d+/, '=s800') : rawThumb;
            thumbRes = await fetch(targetUrl);
          }
          if (!thumbRes.ok) {
            thumbRes = await fetch(rawThumb);
          }

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
  }

  // Default: Stream the full media directly via chunked piping without filling RAM
  const drive = getDriveClient();
  if (!drive) {
    return res.status(500).json({ success: false, message: 'Drive service unavailable' });
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

