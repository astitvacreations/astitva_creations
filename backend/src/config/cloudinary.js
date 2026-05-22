import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000 // 2 minutes timeout for large file uploads
});

// Image storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astitva_creations',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'raw', 'tiff'],
  },
});

// Video storage
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'astitva_creations/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  },
});

export const upload = multer({ storage: storage });
export const videoUpload = multer({ storage: videoStorage });
export { cloudinary };

