import express from 'express';
import { upload, videoUpload, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.status(200).json({ message: 'Upload successful', url: req.file.path, public_id: req.file.filename });
});

router.post('/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
  const filesData = req.files.map(file => ({ url: file.path, public_id: file.filename }));
  res.status(200).json({ message: 'Upload successful', urls: filesData });
});

import fs from 'fs';

router.post('/video', videoUpload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video uploaded' });
  
  try {
    // Use upload_large for chunked uploading, bypassing the 100MB direct upload limit
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(req.file.path, {
        resource_type: 'video',
        folder: 'astitva_creations/videos',
        chunk_size: 6000000 // 6MB chunks
      }, (error, res) => {
        if (error) reject(error);
        else {
          console.log("Cloudinary upload_large response:", res);
          resolve(res);
        }
      });
    });

    // Clean up local temp file
    try { await fs.promises.unlink(req.file.path); } catch (e) { console.error('Failed to cleanup temp video file:', e); }

    res.status(200).json({ message: 'Video uploaded successfully', url: result.secure_url || result.url, public_id: result.public_id, raw_result: result });
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    try { await fs.promises.unlink(req.file.path); } catch (e) {}
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
});

router.delete('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'No URL provided' });
  try {
    const parts = url.split('/');
    const filenameWithExt = parts.pop();
    const folderIndex = parts.indexOf('upload');
    const folderPath = folderIndex !== -1 ? parts.slice(folderIndex + 2).join('/') : '';
    const filename = filenameWithExt.split('.')[0];
    const public_id = folderPath ? `${folderPath}/${filename}` : filename;

    await cloudinary.uploader.destroy(public_id);
    res.status(200).json({ message: 'Image deleted from Cloudinary successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image from Cloudinary', error: error.message });
  }
});

router.post('/delete-multiple', async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ message: 'No urls provided' });
  try {
    const publicIds = urls.map(url => {
      const parts = url.split('/');
      const filenameWithExt = parts.pop();
      const folderIndex = parts.indexOf('upload');
      const folderPath = folderIndex !== -1 ? parts.slice(folderIndex + 2).join('/') : '';
      const filename = filenameWithExt.split('.')[0];
      return folderPath ? `${folderPath}/${filename}` : filename;
    });
    
    await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id)));
    res.status(200).json({ message: 'Images deleted from Cloudinary successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete images from Cloudinary', error: error.message });
  }
});

export default router;
