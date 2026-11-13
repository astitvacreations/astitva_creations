import mongoose from 'mongoose';
import crypto from 'crypto';

const subEventSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      default: () => new mongoose.Types.ObjectId().toString() 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    folderId: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    displayOrder: { 
      type: Number, 
      default: 0 
    }
  },
  { _id: false }
);

const clientGallerySchema = new mongoose.Schema(
  {
    galleryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      default: () => crypto.randomBytes(5).toString('hex') // 10-char alphanumeric slug
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
    },
    clientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: ''
    },
    clientPhone: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    eventName: {
      type: String,
      trim: true,
      default: 'Photography & Cinematography'
    },
    eventDate: {
      type: Date
    },
    folderLink: {
      type: String,
      trim: true,
      default: ''
    },
    folderId: {
      type: String,
      index: true,
      trim: true,
      default: ''
    },
    accessPin: {
      type: String,
      trim: true,
      default: '' // Optional 4-6 digit passcode
    },
    subEvents: [subEventSchema],
    settings: {
      maxSelectionsAllowed: {
        type: Number,
        default: null // null or 0 means unlimited
      },
      minSelectionsRequired: {
        type: Number,
        default: 0
      },
      isSelectionLocked: {
        type: Boolean,
        default: false
      },
      allowClientDownloads: {
        type: Boolean,
        default: true
      },
      watermarkEnabled: {
        type: Boolean,
        default: false
      },
      watermarkText: {
        type: String,
        default: 'Astitva Creations'
      },
      expiresAt: {
        type: Date,
        default: null
      }
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Selecting', 'Submitted', 'Archived'],
      default: 'Draft',
      index: true
    },
    submittedAt: {
      type: Date
    },
    submissionNotes: {
      type: String,
      default: ''
    },
    reopenedAt: {
      type: Date
    },
    reminderLogs: {
      sevenDaySentAt: { type: Date, default: null },
      threeDayExpSentAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for media items
clientGallerySchema.virtual('media', {
  ref: 'GalleryMedia',
  localField: '_id',
  foreignField: 'galleryId'
});

// Virtual to determine if gallery is expired
clientGallerySchema.virtual('isExpired').get(function () {
  if (!this.settings?.expiresAt) return false;
  return new Date() > new Date(this.settings.expiresAt);
});

// Helper static to extract Google Drive folder ID from link or string
clientGallerySchema.statics.extractFolderId = function (link) {
  if (!link || typeof link !== 'string') return '';
  const trimmed = link.trim();
  // If it's already a clean ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  // Match drive.google.com/drive/folders/ID or id=ID or open?id=ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return trimmed;
};

// Normalize international phone format helper
clientGallerySchema.statics.normalizePhone = function (phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const ClientGallery = mongoose.model('ClientGallery', clientGallerySchema);
export default ClientGallery;
