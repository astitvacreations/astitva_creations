import { Resend } from 'resend';
import nodemailer from 'nodemailer';

let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

// Fallback SMTP Transporter
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.EMAIL_FROM || 'contact@astitvacreations.com';

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: `Astitva Creations <${fromEmail}>`,
        to,
        subject,
        html
      });
      return { success: true, response };
    } catch (err) {
      console.warn('[Resend Gallery Email Error]:', err.message);
    }
  }

  const transporter = createTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Astitva Creations" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      return { success: true, info };
    } catch (err) {
      console.error('[Nodemailer Gallery Email Error]:', err.message);
    }
  }

  console.log(`[Gallery Email Mock - No Credentials] -> To: ${to} | Subject: ${subject}`);
  return { success: true, mocked: true };
};

/**
 * 1. Gallery Published Email to Client
 */
export const sendGalleryPublishedEmail = async (gallery) => {
  if (!gallery.clientEmail) return;

  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const galleryUrl = `${domain}/gallery/${gallery.galleryId}`;
  const pinSnippet = gallery.accessPin 
    ? `<div style="background: #141414; border: 1px solid #B19247; padding: 12px; margin: 16px 0; border-radius: 4px; text-align: center;">
         <span style="color: #A1A1A1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Access PIN:</span>
         <div style="color: #B19247; font-size: 20px; font-weight: bold; letter-spacing: 3px; margin-top: 4px;">${gallery.accessPin}</div>
       </div>`
    : '';

  const html = `
    <div style="background-color: #0b0b0b; color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #222222; border-radius: 8px; overflow: hidden; padding: 32px;">
        <h1 style="color: #B19247; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-top: 0; text-align: center;">Astitva Creations</h1>
        <p style="text-align: center; color: #A1A1A1; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #222; padding-bottom: 20px;">Client Gallery Proofing & Selection</p>
        
        <p style="font-size: 16px;">Hello <strong>${gallery.clientName}</strong>,</p>
        <p style="color: #cccccc;">We are thrilled to share the curated collection of photographs from your <strong>${gallery.eventName}</strong>.</p>
        
        ${pinSnippet}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${galleryUrl}" style="background-color: #B19247; color: #000000; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 4px; display: inline-block;">Open Private Gallery</a>
        </div>

        <div style="background: #141414; padding: 16px; border-radius: 4px; font-size: 13px; color: #aaaaaa; margin-top: 24px;">
          <strong style="color: #ffffff;">How to select your photos:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li>Click the heart/checkbox on images you want in your album.</li>
            <li>Add custom notes to individual photos for specific retouching.</li>
            <li>Click <em>"Submit Selections"</em> once you are satisfied.</li>
          </ul>
        </div>

        <p style="font-size: 11px; color: #666666; text-align: center; margin-top: 32px; border-top: 1px solid #222; padding-top: 16px;">
          © ${new Date().getFullYear()} Astitva Creations. All Rights Reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: gallery.clientEmail,
    subject: `✨ Your Private Photo Gallery is Ready - ${gallery.eventName}`,
    html
  });
};

/**
 * 2. Selection Submitted Email to Admin & Client
 */
export const sendSelectionSubmittedEmail = async (gallery, stats) => {
  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const adminUrl = `${domain}/admin/gallery/${gallery._id}`;

  // Admin Notification Email
  const adminEmail = process.env.EMAIL_USER || 'astitvacreations1008@gmail.com';
  const adminHtml = `
    <div style="background-color: #0b0b0b; color: #ffffff; font-family: Arial, sans-serif; padding: 30px 15px;">
      <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; padding: 24px; border-radius: 6px;">
        <h2 style="color: #22c55e; margin-top: 0; font-size: 18px;">✅ Gallery Selections Submitted</h2>
        <p><strong>Client:</strong> ${gallery.clientName} (${gallery.clientEmail} / ${gallery.clientPhone})</p>
        <p><strong>Event:</strong> ${gallery.eventName}</p>
        <p><strong>Selected Photos:</strong> ${stats.selectedCount} / ${stats.totalCount}</p>
        ${gallery.submissionNotes ? `<p><strong>Client Notes:</strong> <em>"${gallery.submissionNotes}"</em></p>` : ''}
        <div style="margin-top: 20px;">
          <a href="${adminUrl}" style="background: #B19247; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Open In Admin Portal</a>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `🚨 Selections Submitted: ${gallery.clientName} - ${gallery.eventName} (${stats.selectedCount} Photos)`,
    html: adminHtml
  });

  // Client Confirmation Email
  if (gallery.clientEmail) {
    const clientHtml = `
      <div style="background-color: #0b0b0b; color: #ffffff; font-family: Arial, sans-serif; padding: 30px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; padding: 24px; border-radius: 6px;">
          <h2 style="color: #B19247; margin-top: 0;">Selections Received!</h2>
          <p>Dear ${gallery.clientName},</p>
          <p>We have successfully received your <strong>${stats.selectedCount}</strong> selected photographs for <strong>${gallery.eventName}</strong>.</p>
          <p style="color: #aaa;">Our post-production team has begun processing your selections for color grading and album layout. We will reach out when the drafts are ready for preview.</p>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">Thank you for trusting Astitva Creations.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: gallery.clientEmail,
      subject: `✅ Selections Received - ${gallery.eventName}`,
      html: clientHtml
    });
  }
};

/**
 * 3. Reminder Email (7-Day & 3-Day Expiry)
 */
export const sendGalleryReminderEmail = async (gallery, type = '7day') => {
  if (!gallery.clientEmail) return;

  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const galleryUrl = `${domain}/gallery/${gallery.galleryId}`;

  const isUrgent = type === '3day_exp';
  const subject = isUrgent
    ? `⚠️ Urgency Notice: Photo Selection Deadline Approaching for ${gallery.eventName}`
    : `📸 Reminder: Photo Selection for ${gallery.eventName}`;

  const html = `
    <div style="background-color: #0b0b0b; color: #ffffff; font-family: Arial, sans-serif; padding: 30px 15px;">
      <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; padding: 24px; border-radius: 6px;">
        <h2 style="color: ${isUrgent ? '#ef4444' : '#B19247'}; margin-top: 0;">${isUrgent ? 'Selection Deadline Approaching' : 'Friendly Reminder'}</h2>
        <p>Dear ${gallery.clientName},</p>
        <p>${isUrgent 
          ? `Your private gallery for <strong>${gallery.eventName}</strong> will expire soon. Please finalize and submit your photo selections before the deadline.` 
          : `Don't forget to review and select your favorite photographs from <strong>${gallery.eventName}</strong> so our editing team can begin post-production.`}</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${galleryUrl}" style="background: #B19247; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Open Gallery & Select Photos</a>
        </div>
        <p style="color: #666; font-size: 11px;">Team Astitva Creations</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: gallery.clientEmail,
    subject,
    html
  });
};

export default {
  sendGalleryPublishedEmail,
  sendSelectionSubmittedEmail,
  sendGalleryReminderEmail
};

