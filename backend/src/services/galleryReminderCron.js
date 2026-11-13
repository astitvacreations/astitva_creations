import cron from 'node-cron';
import ClientGallery from '../models/ClientGallery.js';
import GalleryMedia from '../models/GalleryMedia.js';
import { notifyGalleryReminder } from './whatsappService.js';
import { sendGalleryReminderEmail } from './galleryEmailService.js';

/**
 * Daily Background Scanner for Automated Reminders
 * Runs daily at 09:00 AM server time
 */
export const initGalleryReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Gallery Reminder Cron] Starting daily scan of active galleries...');
    try {
      const now = new Date();
      
      // Find galleries in 'Published' or 'Selecting' status
      const activeGalleries = await ClientGallery.find({
        status: { $in: ['Published', 'Selecting'] }
      });

      for (const gallery of activeGalleries) {
        // --- 1. Seven-day Inactivity Reminder ---
        // If 7 days have passed since creation/publishing and 0 selections have been made
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const publishedDate = gallery.createdAt;

        if (publishedDate <= sevenDaysAgo && !gallery.reminderLogs?.sevenDaySentAt) {
          const selectedCount = await GalleryMedia.countDocuments({
            galleryId: gallery._id,
            isSelected: true
          });

          if (selectedCount === 0) {
            console.log(`[Gallery Reminder Cron] Sending 7-day reminder to ${gallery.clientName} (${gallery.galleryId})`);
            await notifyGalleryReminder(gallery, '7day');
            await sendGalleryReminderEmail(gallery, '7day');

            gallery.reminderLogs = gallery.reminderLogs || {};
            gallery.reminderLogs.sevenDaySentAt = new Date();
            await gallery.save();
          }
        }

        // --- 2. Three-day Expiry Urgency Alert ---
        // If expiresAt is set, and current time is within 3 days of expiration
        if (gallery.settings?.expiresAt && !gallery.reminderLogs?.threeDayExpSentAt) {
          const expiresAt = new Date(gallery.settings.expiresAt);
          const threeDaysBeforeExpiry = new Date(expiresAt.getTime() - 3 * 24 * 60 * 60 * 1000);

          if (now >= threeDaysBeforeExpiry && now < expiresAt) {
            console.log(`[Gallery Reminder Cron] Sending 3-day expiry notice to ${gallery.clientName} (${gallery.galleryId})`);
            await notifyGalleryReminder(gallery, '3day_exp');
            await sendGalleryReminderEmail(gallery, '3day_exp');

            gallery.reminderLogs = gallery.reminderLogs || {};
            gallery.reminderLogs.threeDayExpSentAt = new Date();
            await gallery.save();
          }
        }
      }
      console.log(`[Gallery Reminder Cron] Completed scan of ${activeGalleries.length} active galleries.`);
    } catch (error) {
      console.error('[Gallery Reminder Cron Error]:', error);
    }
  });

  console.log('⏰ Client Gallery daily reminder cron job initialized (runs daily at 9:00 AM).');
};

export default initGalleryReminderCron;

