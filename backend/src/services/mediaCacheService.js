import { LRUCache } from 'lru-cache';

// High-performance in-memory binary/thumbnail buffer cache
// Max 500 entries, with max size limit (~150MB total) to protect RAM
const options = {
  max: 500,
  // Cache items for up to 30 days
  ttl: 1000 * 60 * 60 * 24 * 30,
  // Size calculation based on buffer length
  maxSize: 150 * 1024 * 1024,
  sizeCalculation: (value) => {
    return value?.buffer?.length || 1024;
  }
};

const mediaBufferCache = new LRUCache(options);

export const getCachedMedia = (cacheKey) => {
  return mediaBufferCache.get(cacheKey);
};

export const setCachedMedia = (cacheKey, buffer, mimeType) => {
  if (!buffer) return;
  mediaBufferCache.set(cacheKey, {
    buffer,
    mimeType: mimeType || 'image/jpeg'
  });
};

export const clearMediaCache = (prefix) => {
  if (!prefix) {
    mediaBufferCache.clear();
    return;
  }
  for (const key of mediaBufferCache.keys()) {
    if (key.startsWith(prefix)) {
      mediaBufferCache.delete(key);
    }
  }
};

export default {
  getCachedMedia,
  setCachedMedia,
  clearMediaCache
};

