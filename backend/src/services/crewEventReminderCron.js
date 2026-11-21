import cron from 'node-cron';
import { Event } from '../models/Event.js';
import { EventCrewAssignment } from '../models/EventCrewAssignment.js';
import { sendCrewPreEventReminderEmail } from '../utils/mailer.js';
import { notifyCrewPreEventReminder } from './whatsappService.js';

/**
 * Scans events scheduled for tomorrow and dispatches 24-hour pre-event operational reminder emails and WhatsApp notices
 */
export const scanAndSendCrewReminders = async () => {
  console.log('[Crew Reminder Cron] Checking for events scheduled for tomorrow...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${yyyy}-${mm}-${dd}`;

    const startOfTomorrow = new Date(yyyy, tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
    const endOfTomorrow = new Date(yyyy, tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);

    // Search events occurring tomorrow
    const events = await Event.find({
      status: { $nin: ['CANCELLED', 'Cancelled'] },
      $or: [
        { eventDate: tomorrowStr },
        { date: tomorrowStr },
        { eventDate: { $regex: new RegExp(`^${tomorrowStr}`) } },
        { date: { $regex: new RegExp(`^${tomorrowStr}`) } },
        { eventDate: { $gte: startOfTomorrow, $lte: endOfTomorrow } }
      ]
    });

    if (!events || events.length === 0) {
      console.log(`[Crew Reminder Cron] No active events scheduled for tomorrow (${tomorrowStr}).`);
      return;
    }

    console.log(`[Crew Reminder Cron] Found ${events.length} event(s) scheduled for tomorrow (${tomorrowStr}). Processing crew reminders...`);

    let totalDispatched = 0;
    for (const event of events) {
      const assignments = await EventCrewAssignment.find({
        eventId: event._id,
        workStatus: { $ne: 'Cancelled' },
        preEventReminderSent: { $ne: true }
      }).populate('teamMemberId');

      for (const assignment of assignments) {
        const teamMember = assignment.teamMemberId;
        if (!teamMember) continue;

        console.log(`[Crew Reminder Cron] Sending 24h reminder to ${teamMember.name} for "${event.eventName || event.customerName}"`);

        // 1. Email Reminder
        if (teamMember.email) {
          try {
            await sendCrewPreEventReminderEmail(event, assignment, teamMember);
          } catch (mailErr) {
            console.error(`[Crew Reminder Cron Mail Error for ${teamMember.name}]:`, mailErr.message);
          }
        }

        // 2. WhatsApp Reminder
        if (teamMember.phone) {
          try {
            await notifyCrewPreEventReminder(assignment, event, teamMember);
          } catch (waErr) {
            console.error(`[Crew Reminder Cron WA Error for ${teamMember.name}]:`, waErr.message);
          }
        }

        assignment.preEventReminderSent = true;
        assignment.preEventReminderSentAt = new Date();
        await assignment.save();
        totalDispatched++;
      }
    }

    console.log(`[Crew Reminder Cron] Finished scanning. Dispatched reminders to ${totalDispatched} assigned crew member(s).`);
  } catch (error) {
    console.error('[Crew Reminder Cron Scan Error]:', error);
  }
};

/**
 * Initializes the daily cron job (runs daily at 8:00 AM server time)
 */
export const initCrewReminderCron = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Crew Reminder Cron] 08:00 AM Daily trigger fired.');
    await scanAndSendCrewReminders();
  });

  // Initial check after startup
  setTimeout(() => {
    scanAndSendCrewReminders().catch(() => {});
  }, 10000);

  console.log('⏰ Crew pre-event reminder cron job initialized (runs daily at 8:00 AM).');
};

export default initCrewReminderCron;
