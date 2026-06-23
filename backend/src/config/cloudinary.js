import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 600000 // 10 minutes timeout for large video uploads
});

// Image storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astitva_creations',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'raw', 'tiff'],
  },
});

import os from 'os';

// Video storage (use disk storage temporarily so we can upload in chunks)
const videoDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir()); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.mp4');
  }
});

export const upload = multer({ storage: storage });
export const videoUpload = multer({ storage: videoDiskStorage });
export { cloudinary };

