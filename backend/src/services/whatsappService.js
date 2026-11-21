/**
 * WhatsApp Cloud API Integration Service
 * Sends automated notification messages to clients and studio administrators.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

export const sendWhatsAppMessage = async (to, text) => {
  const token = process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Mock - No credentials] -> To: ${to}\nMessage: ${text}\n--------------------`);
    return { success: true, mocked: true };
  }

  // Normalize phone number (digits only, e.g. 919876543210)
  const cleanPhone = String(to).replace(/\D/g, '');

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: text }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp Cloud API Error]:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[WhatsApp Network Error]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Gallery Ready / Published WhatsApp Notification to Client
 */
export const notifyClientGalleryPublished = async (gallery) => {
  if (!gallery.clientPhone) return;

  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const galleryUrl = `${domain}/gallery/${gallery.galleryId}`;
  const pinText = gallery.accessPin ? `\n🔐 *Access PIN:* ${gallery.accessPin}` : '';
  const expiryText = gallery.settings?.expiresAt
    ? `\n⏳ *Selection Deadline:* ${new Date(gallery.settings.expiresAt).toLocaleDateString('en-IN')}`
    : '';

  const message = 
`✨ *Astitva Creations - Your Private Gallery is Ready!*

Hello ${gallery.clientName},
The photos from your *${gallery.eventName}* have been uploaded and curated.

🔗 *View & Select Your Photos:*
${galleryUrl}${pinText}${expiryText}

📋 *Instructions:*
- Browse through the photos and click the heart/select icon on your favorites.
- Attach any retouching requests or comments per photo.
- When done, click *"Submit Selections"* to lock your choices for editing.

Warm regards,
*Team Astitva Creations*`;

  return sendWhatsAppMessage(gallery.clientPhone, message);
};

/**
 * 2. Selection Submitted WhatsApp Alert to Admins & Client Confirmation
 */
export const notifySelectionSubmitted = async (gallery, stats) => {
  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const adminExportUrl = `${domain}/admin/gallery/${gallery._id}`;

  // Admin Notification
  const adminPhone = process.env.ADMIN_WHATSAPP || process.env.WHATSAPP_NUMBER || '919505878486';
  const adminMessage =
`🔔 *New Gallery Selections Submitted!*

*Client:* ${gallery.clientName}
*Event:* ${gallery.eventName}
*Selected Count:* ${stats.selectedCount}${gallery.settings?.maxSelectionsAllowed ? ` / ${gallery.settings.maxSelectionsAllowed}` : ''}
*Total Photos in Gallery:* ${stats.totalCount}
${gallery.submissionNotes ? `*Client Notes:* "${gallery.submissionNotes}"\n` : ''}
📥 *Admin Portal Link:*
${adminExportUrl}`;

  await sendWhatsAppMessage(adminPhone, adminMessage);

  // Client Confirmation
  if (gallery.clientPhone) {
    const clientConfirm =
`✅ *Selections Received!*

Dear ${gallery.clientName},
Thank you for submitting your selections for *${gallery.eventName}* (${stats.selectedCount} photos selected).

Our post-production team has received your submission and will begin album design & premium retouching. We will notify you once the drafts are ready!

Warm regards,
*Team Astitva Creations*`;

    await sendWhatsAppMessage(gallery.clientPhone, clientConfirm);
  }
};

/**
 * 3. Reminder WhatsApp Notifications (7-Day & 3-Day Expiry)
 */
export const notifyGalleryReminder = async (gallery, type = '7day') => {
  if (!gallery.clientPhone) return;

  const domain = process.env.FRONTEND_URL || 'https://astitvacreations.com';
  const galleryUrl = `${domain}/gallery/${gallery.galleryId}`;

  let message = '';
  if (type === '7day') {
    message =
`📸 *Friendly Reminder - Astitva Creations*

Hello ${gallery.clientName},
We hope you enjoyed viewing your *${gallery.eventName}* photos!

We noticed you haven't finalized your selections yet. Please visit your private gallery link below to select your favorites so our editing team can begin:
${galleryUrl}

Need assistance? Reply to this message anytime!`;
  } else if (type === '3day_exp') {
    const expiryDate = gallery.settings?.expiresAt ? new Date(gallery.settings.expiresAt).toLocaleDateString('en-IN') : 'soon';
    message =
`⚠️ *Urgent - Selection Deadline Approaching!*

Hello ${gallery.clientName},
Your private gallery for *${gallery.eventName}* is set to expire on *${expiryDate}*.

Please lock in and submit your photo selections before the deadline:
${galleryUrl}

Thank you,
*Team Astitva Creations*`;
  }

  if (message) {
    return sendWhatsAppMessage(gallery.clientPhone, message);
  }
};

/**
 * 4. Send Document (PDF) via WhatsApp Cloud API
 */
export const sendWhatsAppDocument = async (to, documentUrl, filename, caption = '') => {
  const token = process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Document Mock] -> To: ${to}\nLink: ${documentUrl}\nFilename: ${filename}\nCaption: ${caption}\n--------------------`);
    return { success: true, mocked: true };
  }

  const cleanPhone = String(to).replace(/\D/g, '');

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'document',
        document: {
          link: documentUrl,
          caption: caption || '',
          filename: filename || 'document.pdf'
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp Cloud API Document Error]:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[WhatsApp Network Error]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 5. Event Quotation / Agreement Sharing via WhatsApp
 * Strictly follows dynamic caption & message body rules without displaying price.
 */
export const notifyEventQuotationPDF = async (event, targetVersion, customPhone) => {
  const phone = customPhone || event.phone;
  if (!phone) {
    return { success: false, message: 'No client phone number available.' };
  }

  const domain = (process.env.FRONTEND_URL || 'https://astitvacreations.com').replace(/\/$/, '');
  const studioName = 'Astitva Creations';
  const isAgreement = Boolean(targetVersion?.isAgreement);
  const versionLabel = targetVersion?.quotationNumber || String(targetVersion?.versionNumber || '1');
  const isVersionedAgreement = isAgreement && versionLabel && versionLabel !== '1' && versionLabel !== '1.0';
  const eventName = event.eventName || 'Event';
  const clientName = event.customerName || 'Client';

  // 1. Document Caption: Do NOT include the price in the caption or WhatsApp text message.
  const caption = isAgreement
    ? (isVersionedAgreement 
        ? `${eventName} photo and videography final agreement (version ${versionLabel})` 
        : `${eventName} photo and videography agreement`)
    : `${eventName} photo and videography quotation`;

  // 2. WhatsApp Message Body: Do NOT include the price in the caption or WhatsApp text message.
  const messageBody = isAgreement
    ? `✨ *${eventName} Photo and Videography Final Agreement ${isVersionedAgreement ? `(Version ${versionLabel}) ` : ''}from ${studioName}* ✨\n\nDear *${clientName}*, we have prepared your finalized agreement${isVersionedAgreement ? ` (Version ${versionLabel}) with updated requirements` : ''}.\n\n🔗 View Agreement PDF Online: ${domain}/api/events/${event._id}/agreement.pdf`
    : `✨ *${eventName} Photo and Videography Quotation (${versionLabel}) from ${studioName}* ✨\n\nDear *${clientName}*, we have prepared your quotation (${versionLabel}).\n\n🔗 View Quotation PDF Online: ${domain}/api/events/${event._id}/quotation-${versionLabel}.pdf`;

  const pdfUrl = isAgreement
    ? `${domain}/api/events/${event._id}/agreement.pdf`
    : `${domain}/api/events/${event._id}/quotation-${versionLabel}.pdf`;

  const safeClient = String(clientName).trim().replace(/[^a-zA-Z0-9]/g, '_');
  const safeEvent = String(eventName).trim().replace(/[^a-zA-Z0-9]/g, '_');
  const filename = isAgreement
    ? (isVersionedAgreement 
        ? `${safeClient}_${safeEvent}_Final_Agreement_v${versionLabel}.pdf` 
        : `${safeClient}_${safeEvent}_Agreement.pdf`)
    : `${safeClient}_${safeEvent}_Quotation_${versionLabel}.pdf`;

  // Send WhatsApp text message notification
  const textResult = await sendWhatsAppMessage(phone, messageBody);

  // Attempt direct PDF document dispatch if credentials exist
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      await sendWhatsAppDocument(phone, pdfUrl, filename, caption);
    } catch (docErr) {
      console.warn('[WhatsApp Document dispatch warning]:', docErr.message);
    }
  }

  return {
    success: true,
    textResult,
    isAgreement,
    versionLabel,
    caption,
    messageBody,
    pdfUrl,
    filename
  };
};

export default {
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  notifyClientGalleryPublished,
  notifySelectionSubmitted,
  notifyGalleryReminder,
  notifyEventQuotationPDF
};

