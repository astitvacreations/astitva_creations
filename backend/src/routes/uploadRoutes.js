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

router.post('/video', videoUpload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video uploaded' });
  res.status(200).json({ message: 'Video uploaded successfully', url: req.file.path, public_id: req.file.filename });
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
