import mongoose from 'mongoose';

const galleryAuditLogSchema = new mongoose.Schema(
  {
    galleryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientGallery',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: [
        'Published',
        'Viewed',
        'SelectionChanged',
        'Submitted',
        'ExportedCSV',
        'ExportedLightroom',
        'DownloadedZIP',
        'Reopened',
        'Synced'
      ],
      required: true,
      index: true
    },
    performedBy: {
      type: String,
      default: 'Anonymous'
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Optional 180-day TTL index on createdAt
galleryAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const GalleryAuditLog = mongoose.model('GalleryAuditLog', galleryAuditLogSchema);
export default GalleryAuditLog;

