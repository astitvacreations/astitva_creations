import mongoose from 'mongoose';

const galleryMediaSchema = new mongoose.Schema(
  {
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientGallery',
      required: true,
      index: true
    },
    subEventId: {
      type: String,
      default: '',
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    storageId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    fullResUrl: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isSelected: {
      type: Boolean,
      default: false,
      index: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    clientComment: {
      type: String,
      default: '',
      trim: true
    },
    selectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast client query and selection filters
galleryMediaSchema.index({ galleryId: 1, isSelected: 1 });
galleryMediaSchema.index({ galleryId: 1, displayOrder: 1 });
galleryMediaSchema.index({ galleryId: 1, storageId: 1 }, { unique: true });

export const GalleryMedia = mongoose.model('GalleryMedia', galleryMediaSchema);
export default GalleryMedia;

