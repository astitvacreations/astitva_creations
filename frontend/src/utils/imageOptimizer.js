/**
 * Optimizes a Cloudinary image URL by injecting quality and format auto-optimization parameters.
 * If the URL is not a Cloudinary URL, it returns the original URL.
 * 
 * @param {string} url - The original image URL
 * @returns {string} - The optimized image URL
 */
export const optimizeImage = (url) => {
  if (!url) return '';
  if (url.includes('cloudinary.com/image/upload/') && !url.includes('q_auto,f_auto')) {
    return url.replace('/image/upload/', '/image/upload/q_auto,f_auto/');
  }
  return url;
};
