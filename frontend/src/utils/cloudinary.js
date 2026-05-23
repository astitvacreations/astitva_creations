export const getOptimizedUrl = (imageSource, width = null) => {
  if (!imageSource) return '';
  
  let url = typeof imageSource === 'object' ? imageSource.url : imageSource;
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const targetWidth = width || 1920;
    if (!url.includes('&w=')) {
      return `${url}&w=${targetWidth}`;
    }
    return url.replace(/&w=\d+/, `&w=${targetWidth}`);
  }

  if (!url.includes('res.cloudinary.com')) return url;

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url; 
  
  const beforeUpload = url.substring(0, uploadIndex + 8); 
  let afterUpload = url.substring(uploadIndex + 8);
  
  if (afterUpload.includes('/')) {
    const parts = afterUpload.split('/');
    // Strip out ANY existing Cloudinary transformations stored in the database
    if (parts[0].includes('f_') || parts[0].includes('q_') || parts[0].includes('w_') || parts[0].includes('c_') || parts[0].includes('fl_') || parts[0].includes('cs_')) {
      afterUpload = parts.slice(1).join('/');
    }
  }

  // 1. f_auto: Automatically delivers WebP or AVIF (cuts file size by 50-80% for INSTANT loading)
  // 2. q_auto: Instructs Cloudinary to intelligently compress images without noticeable visual degradation
  // 3. cs_srgb: Prevents Adobe RGB color profiles from looking "washed out" or dull in browsers
  let transformations = 'f_auto,q_auto,cs_srgb';
  
  // Apply a generous c_limit so we don't serve 10,000px files, but keep it high enough for Retina
  const targetWidth = width || 1920;
  transformations += `,w_${targetWidth},c_limit`;
  
  return `${beforeUpload}${transformations}/${afterUpload}`;
};
