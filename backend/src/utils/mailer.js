import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Fallback
dotenv.config(); // Load standard .env if present
import { generateQuotationPDF, generateEventInvoicePDF, generatePaymentReceiptPDF } from './pdfGenerator.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'info@astitvacreations.com';

/**
 * Sends a luxury quotation confirmation to the client and a lead alert to the admin
 * @param {Object} quoteRequest - The saved QuoteRequest document
 */
export const sendQuotationEmails = async (quoteRequest) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Mailer Warning: RESEND_API_KEY is missing. Emails will not be sent.');
    return;
  }

  const {
    customerName,
    email,
    phone,
    eventDate,
    location,
    notes,
    selectedEvents,
    eventConfigs,
    preWedding,
    postProduction,
    album,
    extraAlbums = [],
    deliverables = [],
    complimentaries = [],
    addOns,
    appliedOffer,
    discount = 0,
    discountType = 'amount',
    discountValue = 0,
    estimatedPrice,
    deliveryTimeline,
    terms
  } = quoteRequest;

  // Generate luxury proposal PDF buffer
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateQuotationPDF(quoteRequest);
  } catch (pdfErr) {
    console.error('Error generating PDF for email attachment:', pdfErr);
  }

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Build events/services text lists
  let eventSummaryRows = '';
  selectedEvents.forEach((evt) => {
    const config = eventConfigs?.[evt] || {};
    let subServicesList = 'None Selected';
    if (config.services) {
      if (Array.isArray(config.services)) {
        subServicesList = config.services.join(', ');
      } else if (typeof config.services === 'object') {
        subServicesList = Object.keys(config.services)
          .map((s) => {
            const svcDetail = config.services[s];
            const qty = (typeof svcDetail === 'object' && svcDetail !== null) ? (svcDetail.qty || 0) : (typeof svcDetail === 'number' ? svcDetail : 1);
            return qty > 0 ? `${s} (${qty}x)` : null;
          })
          .filter(Boolean)
          .join(', ');
      }
    }
    if (!subServicesList) {
      subServicesList = 'None Selected';
    }

    eventSummaryRows += `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 12px; color: #fff; font-weight: bold; text-transform: uppercase;">${evt}</td>
        <td style="padding: 12px; color: #A1A1A1;">${config.duration || 'Half Day'}</td>
        <td style="padding: 12px; color: #A1A1A1;">${subServicesList}</td>
      </tr>
    `;
  });

  // Build Add-ons list
  let addOnSummaryRows = '';
  if (addOns) {
    Object.keys(addOns).forEach((key) => {
      const addon = addOns[key];
      if (addon.selected) {
        addOnSummaryRows += `
          <tr style="border-bottom: 1px solid #222;">
            <td style="padding: 12px; color: #fff;">${addon.name}</td>
            <td style="padding: 12px; color: #A1A1A1; text-align: right;">${addon.qty || 1}</td>
            <td style="padding: 12px; color: [var(--color-gold)]; text-align: right; font-weight: bold;">₹${addon.cost?.toLocaleString()}/-</td>
          </tr>
        `;
      }
    });
  }

  // Client HTML Email Content
  const clientHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
      <style>
        @font-face {
          font-family: 'The Seasons';
          src: url('${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/fonts/The Seasons Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505;">
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #0B0B0B; color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #1c1c1c; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- Luxury Branded Header -->
      <div style="background-color: #000000; padding: 40px 20px; text-align: center; border-bottom: 1px solid #1c1c1c;">
        <img src="${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/logo.png" alt="Astitva Creations" style="max-height: 80px; width: auto; margin-bottom: 10px;" />
        <p style="color: #666; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">CINEMATIC PHOTOGRAPHY & VIDEOGRAPHY</p>
      </div>

      <!-- Welcome Statement -->
      <div style="padding: 40px 30px 20px 30px;">
        <h2 style="font-size: 20px; font-weight: 400; color: #fff; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">Quotation Proposal</h2>
        <p style="color: #A1A1A1; font-size: 15px; line-height: 1.6;">Dear ${customerName},</p>
        <p style="color: #A1A1A1; font-size: 15px; line-height: 1.6;">Thank you for requesting a customized quotation from Astitva Creations. We are excited to capture your beautiful celebrations. Below is the complete breakdown of your custom visual package:</p>
      </div>

      <!-- Quotation Breakdown Table -->
      <div style="padding: 0 30px;">
        <h3 style="color: #B19247; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 15px;">Selected Coverages</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #222; color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
              <th style="padding: 8px 12px;">Event</th>
              <th style="padding: 8px 12px;">Duration</th>
              <th style="padding: 8px 12px;">Services Requested</th>
            </tr>
          </thead>
          <tbody>
            ${eventSummaryRows}
          </tbody>
        </table>
      </div>

      <!-- Packages Table -->
      <div style="padding: 20px 30px 0 30px;">
        <h3 style="color: #B19247; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 15px;">Deliverables & Styles</h3>
        <table style="width: 100%; font-size: 13px; color: #A1A1A1;">
          ${preWedding?.style ? `<tr><td style="padding: 6px 0; color: #fff;">Pre-Wedding Style:</td><td style="text-align: right; color: #B19247;">${preWedding.style}</td></tr>` : ''}
          ${postProduction?.editing ? `<tr><td style="padding: 6px 0; color: #fff;">Film Editing Style:</td><td style="text-align: right; color: #B19247;">${postProduction.editing}</td></tr>` : ''}
          ${album?.albumType ? `<tr><td style="padding: 6px 0; color: #fff;">Primary Photo Album:</td><td style="text-align: right; color: #B19247;">${album.albumType} (${album.sheets} Sheets)</td></tr>` : ''}
          ${Array.isArray(extraAlbums) && extraAlbums.length > 0 ? extraAlbums.map((ea, i) => `<tr><td style="padding: 6px 0; color: #fff;">Extra Album #${i + 1}:</td><td style="text-align: right; color: #B19247;">${ea.albumType} (${ea.sheets} Sheets)</td></tr>`).join('') : ''}
          ${Array.isArray(deliverables) && deliverables.length > 0 ? `<tr><td style="padding: 6px 0; color: #fff; vertical-align: top;">Deliverables:</td><td style="text-align: right; color: #B19247; line-height: 1.4;">${deliverables.join('<br>• ')}</td></tr>` : ''}
          ${Array.isArray(complimentaries) && complimentaries.length > 0 ? `<tr><td style="padding: 6px 0; color: #fff; vertical-align: top;">Complimentary Gifts:</td><td style="text-align: right; color: #B19247; line-height: 1.4;">${complimentaries.join('<br>🎁 ')}</td></tr>` : ''}
        </table>
      </div>

      <!-- Add-ons Summary -->
      ${addOnSummaryRows ? `
      <div style="padding: 20px 30px 0 30px;">
        <h3 style="color: #B19247; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #222; padding-bottom: 8px; margin-bottom: 15px;">Add-On Coverages</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #222; color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
              <th style="padding: 8px 12px;">Add-on</th>
              <th style="padding: 8px 12px; text-align: right;">Qty</th>
              <th style="padding: 8px 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${addOnSummaryRows}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Delivery Timeline & Location -->
      <div style="padding: 30px; margin: 30px; background-color: #111111; border: 1px solid #1c1c1c;">
        <table style="width: 100%; font-size: 13px; color: #A1A1A1; border-spacing: 0 10px;">
          <tr>
            <td style="font-weight: bold; color: #fff; width: 120px; text-transform: uppercase; letter-spacing: 0.5px;">Shoot Date:</td>
            <td>${formattedDate}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Location:</td>
            <td>${location}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Timeline:</td>
            <td>${deliveryTimeline || '8 - 12 Weeks'}</td>
          </tr>
          ${notes ? `<tr><td style="font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Your Notes:</td><td style="line-height: 1.4;">${notes}</td></tr>` : ''}
        </table>
      </div>

      <!-- Applied discounts -->
      ${appliedOffer?.title ? `
        <div style="padding: 0 30px; text-align: right; color: #22c55e; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
          Applied Promotion: ${appliedOffer.title} (-₹${appliedOffer.discountValue?.toLocaleString()})
        </div>
      ` : ''}

      <!-- Estimated Price display -->
      <div style="background-color: #000; padding: 25px 30px; border-top: 1px solid #1c1c1c; border-bottom: 1px solid #1c1c1c; margin-top: 30px;">
        ${discount > 0 ? `
          <!-- Green discount alert banner -->
          <div style="background-color: rgba(34, 197, 94, 0.05); border: 1px dashed #22c55e; padding: 15px; margin-bottom: 20px; text-align: center; color: #22c55e; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-family: sans-serif;">
            ✨ A special administrative discount of ${discountType === 'percentage' ? `${discountValue}% (₹${discount.toLocaleString()}/-)` : `₹${discount.toLocaleString()}/-`} has been applied to your quotation!
          </div>
          
          <table style="width: 100%; font-size: 13px; border-collapse: collapse; text-align: right;">
            <tr>
              <td style="padding: 6px 0; text-align: left; color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Base Proposal Estimate:</td>
              <td style="padding: 6px 0; text-decoration: line-through; font-family: monospace; color: #888;">₹${estimatedPrice?.toLocaleString()}/-</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; text-align: left; color: #666; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Administrative Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}:</td>
              <td style="padding: 6px 0; color: #22c55e; font-weight: bold; font-family: monospace;">-₹${discount?.toLocaleString()}/-</td>
            </tr>
            <tr style="border-top: 1px solid #222;">
              <td style="padding: 12px 0 0 0; text-align: left; color: #fff; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Revised Grand Total:</td>
              <td style="padding: 12px 0 0 0; color: #B19247; font-size: 26px; font-weight: bold; font-family: monospace;">₹${(estimatedPrice - discount)?.toLocaleString()}/-</td>
            </tr>
          </table>
        ` : `
          <div style="text-align: center;">
            <span style="display: block; color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Estimated Grand Total</span>
            <span style="color: #B19247; font-size: 28px; font-weight: bold; font-family: monospace;">₹${estimatedPrice?.toLocaleString()}/-</span>
          </div>
        `}
      </div>

      <!-- Terms & Conditions Summary -->
      <div style="padding: 30px; font-size: 11px; color: #555; line-height: 1.5; border-bottom: 1px solid #1c1c1c;">
        <span style="display: block; color: #888; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Key Terms</span>
        <ul style="margin: 0; padding-left: 15px;">
          ${terms?.map(t => `<li style="margin-bottom: 4px;">${t}</li>`).join('') || `
            <li>Prices listed are base estimates and subject to final negotiation.</li>
            <li>50% advance payment required to lock booking dates.</li>
            <li>Travel and lodging costs for shoots outside our base city are to be borne by the client.</li>
          `}
        </ul>
      </div>

      <!-- Contact CTAs / Footer -->
      <div style="padding: 40px 30px; text-align: center; background-color: #000000; font-size: 12px; color: #666;">
        <p style="margin: 0 0 15px 0;">Need immediate changes to your plan? Contact our creative directors directly:</p>
        <div style="margin-bottom: 25px;">
          <a href="tel:+919505878486" style="background-color: #B19247; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-right: 10px; border-radius: 2px;">Call Studio</a>
          <a href="https://wa.me/919505878486" style="border: 1px solid #B19247; color: #B19247; padding: 11px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border-radius: 2px;">WhatsApp Us</a>
        </div>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Astitva Creations. Crafted in Premium Cinema.</p>
      </div>

    </div>
    </body>
    </html>
  `;

  // Admin Notification HTML Email Content
  const adminHtml = `
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #F8F9FA; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E9ECEF;">
      <h2 style="font-family: 'The Seasons', 'Playfair Display', Georgia, serif; color: #B19247; border-bottom: 2px solid #B19247; padding-bottom: 10px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">New Quote Request Alert</h2>
      <p style="font-size: 15px;">A new luxury proposal query has been generated via the website's Interactive Quote Builder!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; width: 150px;">Client Name:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${customerName}</td></tr>
        <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;"><a href="mailto:${email}">${email}</a></td></tr>
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Mobile:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;"><a href="tel:${phone}">${phone}</a></td></tr>
        <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Shoot Date:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${formattedDate}</td></tr>
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Location:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${location}</td></tr>
        ${discount > 0 ? `
          <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; width: 150px;">Base Price:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; text-decoration: line-through; color: #777;">₹${estimatedPrice?.toLocaleString()}/-</td></tr>
          <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; color: #22c55e; font-weight: bold;">-₹${discount?.toLocaleString()}/-</td></tr>
          <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Final Price:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; color: #B19247; font-weight: bold; font-size: 16px;">₹${(estimatedPrice - discount)?.toLocaleString()}/-</td></tr>
        ` : `
          <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; width: 150px;">Estimated Total:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; color: #B19247; font-weight: bold; font-size: 16px;">₹${estimatedPrice?.toLocaleString()}/-</td></tr>
        `}
        ${notes ? `<tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; vertical-align: top;">Notes:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; line-height: 1.4;">${notes}</td></tr>` : ''}
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/admin/quotes" style="background-color: #B19247; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border-radius: 3px;">Open Admin Panel</a>
      </div>
      
      <p style="font-size: 12px; color: #6C757D; text-align: center; margin-top: 40px; border-top: 1px solid #E9ECEF; padding-top: 20px;">Astitva Creations Admin Notification System</p>
    </div>
  `;

  // Prepare attachments if PDF generation succeeded
  const attachments = [];
  if (pdfBuffer) {
    const safeName = (customerName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    attachments.push({
      filename: `Astitva_Creations_Proposal_${safeName}.pdf`,
      content: pdfBuffer,
    });
  }

  // Send to client only if valid email is provided
  if (email && email.includes('@')) {
    try {
      const clientResponse = await resend.emails.send({
        from: `Astitva Creations <${fromEmail}>`,
        to: email,
        subject: `${discount > 0 ? '[REVISED] ' : ''}Your Custom Quotation Proposal - Astitva Creations`,
        html: clientHtml,
        attachments
      });
      if (clientResponse.error) console.error(`Failed to send email to client ${email}:`, clientResponse.error);
      else console.log(`Confirmation email sent successfully to client: ${email}`);
    } catch (err) {
      console.error(`Failed to send email to client ${email}:`, err);
    }
  }

  try {
    const adminResponse = await resend.emails.send({
      from: `Astitva Creations Portal <${fromEmail}>`,
      to: process.env.EMAIL_USER || 'astitvacreations1008@gmail.com', 
      subject: `${discount > 0 ? '🔄 [REVISED] ' : '🚨 '}Alert: Quote for ${customerName || 'Client'} ${discount > 0 ? `(₹${(estimatedPrice - discount).toLocaleString()}/-)` : ''}`,
      html: adminHtml,
      attachments
    });
    if (adminResponse.error) console.error('Failed to send email notification to administrator:', adminResponse.error);
    else console.log('Lead notification email sent successfully to administrator.');
  } catch (err) {
    console.error('Failed to send email notification to administrator:', err);
  }
};

export const sendLeadEmails = async (lead) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Mailer Warning: RESEND_API_KEY is missing. Lead email will not be sent.');
    return;
  }

  const { customerName, email, phone, eventDate, location, notes, source } = lead;

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'N/A';

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
      <style>
        @font-face {
          font-family: 'The Seasons';
          src: url('${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/fonts/The Seasons Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505;">
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #050505; color: #EAEAEA; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/logo.png" alt="Astitva Creations" style="max-height: 80px; width: auto;" />
      </div>
      <h2 style="font-family: 'The Seasons', 'Playfair Display', Georgia, serif; font-weight: 400; color: #B19247; border-bottom: 2px solid #222; padding-bottom: 10px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">New Landing Page Lead Alert</h2>
      <p style="font-size: 15px; color: #FFF;">A new lead has been captured directly from a landing page form!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="background-color: #111;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; width: 150px; color: #FFF;">Client Name:</td><td style="padding: 10px; border-bottom: 1px solid #222;">${customerName}</td></tr>
        <tr style="background-color: #0B0B0B;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; color: #FFF;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #222;"><a href="mailto:${email}" style="color: #B19247;">${email}</a></td></tr>
        <tr style="background-color: #111;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; color: #FFF;">Mobile:</td><td style="padding: 10px; border-bottom: 1px solid #222;"><a href="tel:${phone}" style="color: #B19247;">${phone}</a></td></tr>
        <tr style="background-color: #0B0B0B;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; color: #FFF;">Shoot Date:</td><td style="padding: 10px; border-bottom: 1px solid #222;">${formattedDate}</td></tr>
        <tr style="background-color: #111;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; color: #FFF;">Location:</td><td style="padding: 10px; border-bottom: 1px solid #222;">${location || 'N/A'}</td></tr>
        <tr style="background-color: #0B0B0B;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; color: #FFF;">Source page:</td><td style="padding: 10px; border-bottom: 1px solid #222; text-transform: uppercase; font-weight: bold;">${source}</td></tr>
        ${notes ? `<tr style="background-color: #111;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #222; vertical-align: top; color: #FFF;">Message:</td><td style="padding: 10px; border-bottom: 1px solid #222; line-height: 1.4;">${notes}</td></tr>` : ''}
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/admin/leads" style="background-color: #B19247; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border-radius: 3px;">Open Leads Manager</a>
      </div>
      
      <p style="font-size: 12px; color: #6C757D; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">Astitva Creations Admin Notification System</p>
    </div>
    </body>
    </html>
  `;

  const clientHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
      <style>
        @font-face {
          font-family: 'The Seasons';
          src: url('${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/fonts/The Seasons Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505;">
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #050505; color: #FFFFFF; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/logo.png" alt="Astitva Creations" style="max-height: 80px; width: auto;" />
      </div>
      <h2 style="font-family: 'The Seasons', 'Playfair Display', Georgia, serif; font-weight: 400; letter-spacing: 1px; color: #FFFFFF;">Thank you for reaching out, ${customerName}.</h2>
      <p style="color: #EAEAEA; line-height: 1.6;">We have received your inquiry and our team will review your details shortly.</p>
      <p style="color: #EAEAEA; line-height: 1.6;">Our lead coordinator will contact you at <strong style="color: #B19247;">${phone}</strong> or via email to discuss your vision in detail.</p>
      <br/>
      <p style="color: #EAEAEA;">Best regards,<br/><strong style="color: #B19247;">Team Astitva Creations</strong></p>
    </div>
    </body>
    </html>
  `;

  try {
    const clientResponse = await resend.emails.send({
      from: `Astitva Creations <${fromEmail}>`,
      to: email,
      subject: `We've received your inquiry! - Astitva Creations`,
      html: clientHtml
    });
    if (clientResponse.error) console.error(`Failed to send lead email to client ${email}:`, clientResponse.error);
    else console.log(`Lead confirmation email sent successfully to client: ${email}`);
  } catch (err) {
    console.error(`Failed to send lead email to client ${email}:`, err);
  }

  try {
    const adminResponse = await resend.emails.send({
      from: `Astitva Creations Portal <${fromEmail}>`,
      to: process.env.EMAIL_USER || 'astitvacreations1008@gmail.com',
      subject: `🚨 Alert: New Lead captured from landing page (${customerName})`,
      html: adminHtml
    });
    if (adminResponse.error) console.error('Failed to send email notification to administrator:', adminResponse.error);
    else console.log('Lead notification email sent successfully to administrator.');
  } catch (err) {
    console.error('Failed to send email notification to administrator:', err);
  }
};

/**
 * Sends a 6-digit OTP to the admin for secure login or password reset
 * @param {string} email - The admin email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} type - 'login' or 'reset'
 */
export const sendAdminOtpEmail = async (email, otp, type = 'login') => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Mailer Warning: RESEND_API_KEY is missing. OTP emails will not be sent.');
    return;
  }

  const actionText = type === 'reset'
    ? 'to reset your password'
    : 'to securely log in to the admin portal';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
      <style>
        @font-face {
          font-family: 'The Seasons';
          src: url('${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/fonts/The Seasons Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505;">
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #050505; color: #E0E0E0; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${process.env.FRONTEND_URL || 'https://www.astitvacreations.com'}/logo.png" alt="Astitva Creations" style="max-height: 80px; width: auto; margin-bottom: 10px;" />
        <h2 style="font-family: 'The Seasons', 'Playfair Display', Georgia, serif; color: #B19247; font-weight: 400; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-size: 16px;">Admin Portal</h2>
      </div>
      <p style="font-size: 16px; color: #A1A1A1;">Hello Admin,</p>
      <p style="font-size: 16px; color: #A1A1A1; line-height: 1.5;">Please use the following One-Time Password (OTP) ${actionText}. This OTP is valid for the next 5 minutes.</p>
      <div style="text-align: center; margin: 40px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #000; background-color: #B19247; border-radius: 4px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #555;">If you did not request this OTP, please ignore this email or check your account security.</p>
    </div>
    </body>
    </html>
  `;

  const subject = type === 'reset' 
    ? 'Admin Password Reset OTP - Astitva Creations' 
    : 'Admin Secure Login OTP - Astitva Creations';

  try {
    const response = await resend.emails.send({
      from: `Astitva Security <${fromEmail}>`,
      to: email,
      subject,
      html
    });

    if (response.error) {
      console.error('Resend Error:', response.error);
      throw new Error(`Resend failed to send: ${response.error.message}`);
    }

    console.log(`Resend OTP sent successfully to ${email}`);
  } catch (error) {
    console.error('Failed to send OTP via Resend:', error);
    throw error;
  }
};

export const sendEventInvoiceEmail = async (event) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Mailer Warning: RESEND_API_KEY is missing. Emails will not be sent.');
    return;
  }

  if (!event.email) {
    console.warn('Mailer Warning: Event does not have an email address.');
    return;
  }

  let pdfBuffer = null;
  try {
    pdfBuffer = await generateEventInvoicePDF(event);
  } catch (pdfErr) {
    console.error('Error generating Event PDF for email attachment:', pdfErr);
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const attachments = [];
  if (pdfBuffer) {
    const safeName = (event.customerName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    attachments.push({
      filename: `Astitva_Creations_Invoice_${safeName}.pdf`,
      content: pdfBuffer,
    });
  }

  const html = `
    <div style="background-color: #050505; color: #FFFFFF; font-family: 'Arial', sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #B19247; font-size: 24px; font-weight: normal; margin: 0; letter-spacing: 2px;">ASTITVA CREATIONS</h1>
      </div>
      <div style="background-color: #111111; border: 1px solid #222222; border-radius: 8px; padding: 30px;">
        <h2 style="color: #B19247; font-size: 20px; font-weight: normal; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">Hello ${event.customerName},</h2>
        <p style="color: #A1A1A1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for choosing Astitva Creations for your event on ${formattedDate}.
          Attached to this email, you will find your official invoice and receipt outlining the services rendered and payment details.
        </p>
        <div style="border-top: 1px solid #222222; border-bottom: 1px solid #222222; padding: 20px 0; margin-bottom: 20px;">
          <p style="color: #A1A1A1; font-size: 14px; margin: 5px 0;"><strong>Total Amount:</strong> ₹${event.finalTotal || 0}</p>
          <p style="color: #A1A1A1; font-size: 14px; margin: 5px 0;"><strong>Amount Paid:</strong> ₹${event.paidAmount || 0}</p>
          <p style="color: #B19247; font-size: 14px; margin: 5px 0;"><strong>Pending Amount:</strong> ₹${(event.finalTotal || 0) - (event.paidAmount || 0)}</p>
        </div>
        <p style="color: #A1A1A1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          We truly look forward to capturing your beautiful moments.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: `Astitva Creations <${fromEmail}>`,
      to: event.email,
      subject: 'Your Event Invoice - Astitva Creations',
      html,
      attachments
    });

    if (response.error) {
      console.error('Resend Error:', response.error);
      throw new Error(`Resend failed to send: ${response.error.message}`);
    }

    console.log(`Event invoice sent successfully to ${event.email}`);
  } catch (error) {
    console.error('Failed to send event invoice via Resend:', error);
    throw error;
  }
};

/**
 * Dispatches an official digital payment receipt PDF to the client's email
 * @param {Object} event - The parent Event document
 * @param {Object} payment - The specific payment installment subdocument
 * @param {Object} studioInfo - Studio metadata from Settings
 */
export const sendPaymentReceiptEmail = async (event, payment, studioInfo = {}) => {
  const clientEmail = event.email;
  if (!clientEmail) {
    console.warn('[Mailer] Cannot send payment receipt: No email on event');
    return { success: false, reason: 'No email address on event' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mailer Warning] RESEND_API_KEY is missing. Payment receipt email skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  let pdfBuffer = null;
  try {
    pdfBuffer = await generatePaymentReceiptPDF(payment, event, studioInfo);
  } catch (pdfErr) {
    console.error('Error generating Payment Receipt PDF for email attachment:', pdfErr);
  }

  const receiptNum = payment.receiptNumber ? `#${payment.receiptNumber}` : 'Payment';
  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Astitva_Creations_Receipt_${payment.receiptNumber || payment.paymentId}.pdf`,
      content: pdfBuffer
    });
  }

  const formattedDate = payment.date 
    ? new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; }
        @media only screen and (max-width: 480px) {
          .email-wrapper { padding: 14px 8px !important; }
          .email-card { padding: 16px 12px !important; }
          .email-box { padding: 12px 10px !important; }
          .text-sm-mobile { font-size: 11px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-wrapper" style="background-color: #050505; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px 12px; max-width: 580px; width: 100%; margin: 0 auto; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B19247; font-size: 22px; font-weight: normal; margin: 0; letter-spacing: 2px;">ASTITVA CREATIONS</h1>
          <p style="color: #A1A1A1; font-size: 10px; margin-top: 5px; letter-spacing: 1px;">LUXURY WEDDING & EVENT CINEMATOGRAPHY</p>
        </div>

        <div class="email-card" style="background-color: #111114; border: 1px solid #26262a; border-radius: 12px; padding: 22px 16px; box-sizing: border-box; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid #222222; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #B19247; font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Payment Receipt Confirmation</h2>
            <p style="color: #666666; font-size: 11px; margin: 4px 0 0 0;">Receipt ${receiptNum} • ${formattedDate}</p>
          </div>

          <p style="color: #CCCCCC; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Hello <strong style="color: #FFFFFF;">${event.customerName || 'Client'}</strong>,<br/>
            We have received and reconciled your payment installment of <strong style="color: #D4AF37;">₹${Number(payment.amount || 0).toLocaleString('en-IN')}</strong> for <em>${event.eventName || "your celebration"}</em>.
          </p>

          <!-- Transaction Details -->
          <div class="email-box" style="background-color: #16161a; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 44%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Payment Mode:</td>
                <td style="color: #FFFFFF; width: 56%; font-weight: bold; text-align: right; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3;">${payment.paymentType || 'UPI'}</td>
              </tr>
              ${payment.receiverUpiId ? `
              <tr>
                <td style="color: #888888; width: 44%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Studio UPI ID:</td>
                <td style="color: #D4AF37; width: 56%; font-family: monospace; font-size: 11px; text-align: right; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-all; overflow-wrap: anywhere;">${payment.receiverUpiId}</td>
              </tr>` : ''}
              ${payment.utrNumber ? `
              <tr>
                <td style="color: #888888; width: 44%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Bank Ref / UTR:</td>
                <td style="color: #B19247; width: 56%; font-family: monospace; font-size: 11px; text-align: right; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-all; overflow-wrap: anywhere;">${payment.utrNumber}</td>
              </tr>` : ''}
              <tr>
                <td style="color: #888888; width: 44%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Received By:</td>
                <td style="color: #FFFFFF; width: 56%; text-align: right; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${payment.receivedBy || 'Studio Team'}</td>
              </tr>
            </table>
          </div>

          <!-- Account Balance Summary -->
          <div class="email-box" style="background-color: #0c0c0e; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 52%; padding: 6px 4px 6px 0; vertical-align: middle;">Package Net Total:</td>
                <td style="color: #FFFFFF; width: 48%; text-align: right; padding: 6px 0 6px 4px; vertical-align: middle; word-break: break-word;">₹${Number(event.netPayable || event.totalAmount || event.finalTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 1px solid #1a1a20; border-bottom: 1px solid #1a1a20;">
                <td style="color: #D4AF37; font-weight: bold; width: 52%; padding: 9px 4px 9px 0; vertical-align: middle;">This Installment:</td>
                <td style="color: #D4AF37; font-weight: bold; font-size: 14px; width: 48%; text-align: right; padding: 9px 0 9px 4px; vertical-align: middle;">+ ₹${Number(payment.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 52%; padding: 6px 4px 6px 0; vertical-align: middle;">Total Paid to Date:</td>
                <td style="color: #B19247; font-weight: bold; width: 48%; text-align: right; padding: 6px 0 6px 4px; vertical-align: middle;">₹${Number(event.paidAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #D4AF37; font-weight: bold; width: 52%; padding: 6px 4px 6px 0; vertical-align: middle;">Remaining Balance:</td>
                <td style="color: #D4AF37; font-weight: bold; font-size: 13px; width: 48%; text-align: right; padding: 6px 0 6px 4px; vertical-align: middle;">₹${Number(event.pendingAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <p style="color: #888888; font-size: 11px; line-height: 1.5; margin: 0;">
            Attached to this email is your official digital payment receipt PDF for your personal records.<br/>
            Thank you for choosing Astitva Creations.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #555555; font-size: 10px; line-height: 1.4;">
          © ${new Date().getFullYear()} Astitva Creations • Andhra Pradesh & Telangana, India • www.astitvacreations.com
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: `Astitva Creations <${fromEmail}>`,
      to: clientEmail,
      subject: `Payment Receipt ${receiptNum} - Astitva Creations`,
      html,
      attachments
    });

    if (response.error) {
      console.error('[Resend Payment Receipt Error]:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`Payment receipt email sent successfully to ${clientEmail}`);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send payment receipt email via Resend:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Dispatches an Event Assignment Brief Email to an assigned team member on the date of assignment
 * @param {Object} event - Event document
 * @param {Object} assignment - EventCrewAssignment document
 * @param {Object} teamMember - TeamMember document
 */
export const sendCrewAssignmentEmail = async (event, assignment, teamMember) => {
  const memberEmail = teamMember?.email?.trim();
  if (!memberEmail) {
    console.log(`[Mailer Info] No email for team member ${teamMember?.name || 'Unknown'}. Assignment email skipped.`);
    return { success: false, reason: 'No crew email provided' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mailer Warning] RESEND_API_KEY missing. Crew assignment email skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  const memberName = teamMember.name || 'Team Member';
  const clientName = event.customerName || event.clientName || 'Valued Client';
  const eventName = event.eventName || "Celebration Shoot";
  const eventDate = event.eventDate || event.date;
  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date to be confirmed';

  const location = event.location || event.venue || 'Venue details will be shared on group';
  const roles = (assignment.assignedRoles || []).join(', ') || 'Crew Member';
  const subEvents = (assignment.subEventsCovered || []).join(', ') || 'Full Event Coverage';
  const allottedBudget = Number(assignment.allottedBudget || 0);

  const sFee = Number(assignment.shootFee || 0);
  const pFee = Number(assignment.photoEditFee || 0);
  const vFee = Number(assignment.videoEditFee || 0);
  const aFee = Number(assignment.allowanceFee || 0);

  let feeRows = '';
  if (sFee > 0) feeRows += `<tr><td style="color: #888888; padding: 4px 0;">• Shoot Day Fee:</td><td style="color: #FFFFFF; text-align: right; padding: 4px 0;">₹${sFee.toLocaleString('en-IN')}</td></tr>`;
  if (pFee > 0) feeRows += `<tr><td style="color: #888888; padding: 4px 0;">• Photo Editing Fee:</td><td style="color: #FFFFFF; text-align: right; padding: 4px 0;">₹${pFee.toLocaleString('en-IN')}</td></tr>`;
  if (vFee > 0) feeRows += `<tr><td style="color: #888888; padding: 4px 0;">• Video Editing Fee:</td><td style="color: #FFFFFF; text-align: right; padding: 4px 0;">₹${vFee.toLocaleString('en-IN')}</td></tr>`;
  if (aFee > 0) feeRows += `<tr><td style="color: #888888; padding: 4px 0;">• Travel & Gear Allowance:</td><td style="color: #FFFFFF; text-align: right; padding: 4px 0;">₹${aFee.toLocaleString('en-IN')}</td></tr>`;

  const isEditingAssignment = assignment.assignmentCategory === 'PhotoEdit' || 
                              assignment.assignmentCategory === 'VideoEdit' ||
                              (assignment.assignedRoles || []).every(r => ['Photo Editor', 'Video Editor', 'Photo Edit', 'Video Edit'].includes(r));

  const protocolsBlock = isEditingAssignment ? '' : `
          <!-- Studio Protocols Checklist -->
          <div style="background-color: #16161a; border-left: 3px solid #B19247; padding: 12px; margin-bottom: 16px; font-size: 11px; color: #CCCCCC; line-height: 1.5; box-sizing: border-box;">
            <strong style="color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">Important Studio Protocols:</strong>
            • Please report at the venue at least 45 minutes prior to the scheduled call time.<br/>
            • Ensure all camera bodies, lenses, flashes, and gimbals are cleaned and batteries 100% charged.<br/>
            • Professional studio attire (all black / smart formal) is mandatory at client venues.<br/>
            • Immediately backup raw footage to studio hard drives / cloud post shoot.
          </div>
  `;

  const footerNote = isEditingAssignment
    ? 'Please review your editing task instructions and coordinate with the studio team for raw footage transfer.<br/>For queries or clarifications, contact the studio manager.'
    : 'A 24-hour reminder will be dispatched to your email and WhatsApp on the day before the shoot.<br/>For queries or emergencies, contact the studio manager immediately.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; }
        @media only screen and (max-width: 480px) {
          .email-wrapper { padding: 14px 8px !important; }
          .email-card { padding: 16px 12px !important; }
          .email-box { padding: 12px 10px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-wrapper" style="background-color: #050505; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px 12px; max-width: 580px; width: 100%; margin: 0 auto; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B19247; font-size: 22px; font-weight: normal; margin: 0; letter-spacing: 2px;">ASTITVA CREATIONS</h1>
          <p style="color: #A1A1A1; font-size: 10px; margin-top: 5px; letter-spacing: 1px;">CREW WORK ALLOCATION & TASK BRIEF</p>
        </div>

        <div class="email-card" style="background-color: #111114; border: 1px solid #26262a; border-radius: 12px; padding: 22px 16px; box-sizing: border-box; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid #222222; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #34D399; font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">Event Assignment Confirmed</h2>
            <p style="color: #666666; font-size: 11px; margin: 4px 0 0 0;">Assigned on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>

          <p style="color: #CCCCCC; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Hello <strong style="color: #FFFFFF;">${memberName}</strong>,<br/>
            You have been allocated to the production crew for <strong style="color: #B19247;">${eventName}</strong> (${clientName}). Please review your task scope and event itinerary below:
          </p>

          <!-- Event Summary Box -->
          <div class="email-box" style="background-color: #16161a; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Client:</td>
                <td style="color: #FFFFFF; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${clientName}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Event / Occasion:</td>
                <td style="color: #FFFFFF; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${eventName}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Shoot Date:</td>
                <td style="color: #34D399; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Venue / Location:</td>
                <td style="color: #FFFFFF; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${location}</td>
              </tr>
            </table>
          </div>

          <!-- Role & Scope Allocation -->
          <div class="email-box" style="background-color: #16161a; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
            <h3 style="color: #B19247; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Role & Scope of Work</h3>
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Assigned Role(s):</td>
                <td style="color: #38BDF8; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${roles}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Sub-events:</td>
                <td style="color: #FFFFFF; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${subEvents}</td>
              </tr>
              ${assignment.workScopeDescription ? `
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Instructions:</td>
                <td style="color: #FCD34D; width: 62%; font-style: italic; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.4; word-break: break-word;">"${assignment.workScopeDescription}"</td>
              </tr>` : ''}
            </table>
          </div>

          ${protocolsBlock}

          <p style="color: #888888; font-size: 11px; line-height: 1.5; margin: 0;">
            ${footerNote}
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #555555; font-size: 10px; line-height: 1.4;">
          © ${new Date().getFullYear()} Astitva Creations • Andhra Pradesh & Telangana, India • www.astitvacreations.com
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: `Astitva Creations Crew <${fromEmail}>`,
      to: memberEmail,
      subject: `Crew Assignment: ${eventName} (${formattedDate}) - Astitva Creations`,
      html
    });

    if (response.error) {
      console.error('[Resend Crew Assignment Error]:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`Crew assignment email sent successfully to ${memberName} (${memberEmail})`);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send crew assignment email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 2. Dispatches a 24-Hour Pre-Event Reminder Email to an assigned team member on the previous day of the event
 * @param {Object} event - Event document
 * @param {Object} assignment - EventCrewAssignment document
 * @param {Object} teamMember - TeamMember document
 */
export const sendCrewPreEventReminderEmail = async (event, assignment, teamMember) => {
  const memberEmail = teamMember?.email?.trim();
  if (!memberEmail) {
    console.log(`[Mailer Info] No email for team member ${teamMember?.name || 'Unknown'}. Pre-event reminder email skipped.`);
    return { success: false, reason: 'No crew email provided' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mailer Warning] RESEND_API_KEY missing. Pre-event reminder email skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  const memberName = teamMember.name || 'Team Member';
  const clientName = event.customerName || event.clientName || 'Valued Client';
  const eventName = event.eventName || "Celebration Shoot";
  const eventDate = event.eventDate || event.date;
  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Tomorrow';

  const location = event.location || event.venue || 'Venue details on studio WhatsApp';
  const roles = (assignment.assignedRoles || []).join(', ') || 'Crew Member';
  const subEvents = (assignment.subEventsCovered || []).join(', ') || 'Full Event Coverage';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; }
        @media only screen and (max-width: 480px) {
          .email-wrapper { padding: 14px 8px !important; }
          .email-card { padding: 16px 12px !important; }
          .email-box { padding: 12px 10px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-wrapper" style="background-color: #050505; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px 12px; max-width: 580px; width: 100%; margin: 0 auto; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B19247; font-size: 22px; font-weight: normal; margin: 0; letter-spacing: 2px;">ASTITVA CREATIONS</h1>
          <p style="color: #A1A1A1; font-size: 10px; margin-top: 5px; letter-spacing: 1px;">24-HOUR PRE-EVENT OPERATIONAL BRIEFING</p>
        </div>

        <div class="email-card" style="background-color: #111114; border: 1px solid #26262a; border-radius: 12px; padding: 22px 16px; box-sizing: border-box; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid #222222; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="background-color: #F59E0B; color: #000000; font-weight: bold; font-size: 10px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">URGENT REMINDER</span>
            <h2 style="color: #FBBF24; font-size: 16px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">Shoot Tomorrow: ${eventName}</h2>
            <p style="color: #888888; font-size: 11px; margin: 4px 0 0 0;">Event Date: ${formattedDate}</p>
          </div>

          <p style="color: #CCCCCC; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Hello <strong style="color: #FFFFFF;">${memberName}</strong>,<br/>
            This is your official 24-hour operational briefing for tomorrow's shoot for <strong style="color: #B19247;">${clientName}</strong>. Please review your call-time and gear checklist:
          </p>

          <!-- Itinerary Box -->
          <div class="email-box" style="background-color: #16161a; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Shoot Date:</td>
                <td style="color: #FBBF24; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">TOMORROW (${formattedDate})</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Client:</td>
                <td style="color: #FFFFFF; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${clientName}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Venue / Location:</td>
                <td style="color: #34D399; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${location}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Your Assigned Role:</td>
                <td style="color: #38BDF8; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${roles}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Sub-events:</td>
                <td style="color: #FFFFFF; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${subEvents}</td>
              </tr>
              ${assignment.workScopeDescription ? `
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Special Notes:</td>
                <td style="color: #FCD34D; width: 62%; font-style: italic; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.4; word-break: break-word;">"${assignment.workScopeDescription}"</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Mandatory Pre-Shoot Gear Checklist -->
          <div class="email-box" style="background-color: #0c0c0e; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
            <h3 style="color: #B19247; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Tonight's Mandatory Preparation Checklist</h3>
            <table style="width: 100%; max-width: 100%; font-size: 11px; color: #CCCCCC; line-height: 1.6; table-layout: fixed;">
              <tr><td style="padding: 3px 0; word-break: break-word;"><strong style="color: #34D399;">✓</strong> Charge all camera batteries (minimum 3 full batteries) + power banks</td></tr>
              <tr><td style="padding: 3px 0; word-break: break-word;"><strong style="color: #34D399;">✓</strong> Format and test high-speed memory cards (V60/V90 recommended)</td></tr>
              <tr><td style="padding: 3px 0; word-break: break-word;"><strong style="color: #34D399;">✓</strong> Clean lenses, sensors, and ensure speedlight / flash batteries are fresh</td></tr>
              <tr><td style="padding: 3px 0; word-break: break-word;"><strong style="color: #34D399;">✓</strong> Balance and calibrate gimbals, drones, and wireless microphones</td></tr>
              <tr><td style="padding: 3px 0; word-break: break-word;"><strong style="color: #34D399;">✓</strong> Professional studio dress code (all black attire) prepared</td></tr>
            </table>
          </div>

          <p style="color: #888888; font-size: 11px; line-height: 1.5; margin: 0;">
            Let's create timeless visuals tomorrow! Please acknowledge this email or confirm your availability on the studio WhatsApp group.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #555555; font-size: 10px; line-height: 1.4;">
          © ${new Date().getFullYear()} Astitva Creations • Andhra Pradesh & Telangana, India • www.astitvacreations.com
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: `Astitva Creations Alerts <${fromEmail}>`,
      to: memberEmail,
      subject: `Shoot Reminder Tomorrow: ${eventName} - Astitva Creations`,
      html
    });

    if (response.error) {
      console.error('[Resend Pre-Event Reminder Error]:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`Pre-event reminder email sent successfully to ${memberName} (${memberEmail})`);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send pre-event reminder email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 3. Dispatches an Event Unassignment / Stand-Down Email to a team member
 * @param {Object} event - Event document
 * @param {Object} assignment - EventCrewAssignment document
 * @param {Object} teamMember - TeamMember document
 */
export const sendCrewUnassignmentEmail = async (event, assignment, teamMember) => {
  const memberEmail = teamMember?.email?.trim();
  if (!memberEmail) {
    console.log(`[Mailer Info] No email for team member ${teamMember?.name || 'Unknown'}. Unassignment email skipped.`);
    return { success: false, reason: 'No crew email provided' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mailer Warning] RESEND_API_KEY missing. Crew unassignment email skipped.');
    return { success: false, reason: 'RESEND_API_KEY missing' };
  }

  const memberName = teamMember.name || 'Team Member';
  const clientName = event?.customerName || event?.clientName || 'Client';
  const eventName = event?.eventName || "Celebration Shoot";
  const eventDate = event?.eventDate || event?.date;
  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Scheduled Date';

  const roles = (assignment?.assignedRoles || []).join(', ') || 'Crew Member';
  const category = assignment?.assignmentCategory || 'Crew';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; }
        @media only screen and (max-width: 480px) {
          .email-wrapper { padding: 14px 8px !important; }
          .email-card { padding: 16px 12px !important; }
          .email-box { padding: 12px 10px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-wrapper" style="background-color: #050505; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px 12px; max-width: 580px; width: 100%; margin: 0 auto; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B19247; font-size: 22px; font-weight: normal; margin: 0; letter-spacing: 2px;">ASTITVA CREATIONS</h1>
          <p style="color: #A1A1A1; font-size: 10px; margin-top: 5px; letter-spacing: 1px;">CREW SCHEDULE UPDATE & STAND-DOWN</p>
        </div>

        <div class="email-card" style="background-color: #111114; border: 1px solid #26262a; border-radius: 12px; padding: 22px 16px; box-sizing: border-box; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid #222222; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="background-color: #DC2626; color: #FFFFFF; font-weight: bold; font-size: 10px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">UNASSIGNMENT NOTICE</span>
            <h2 style="color: #F87171; font-size: 16px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">Assignment Cancelled: ${eventName}</h2>
            <p style="color: #888888; font-size: 11px; margin: 4px 0 0 0;">Updated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>

          <p style="color: #CCCCCC; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
            Hello <strong style="color: #FFFFFF;">${memberName}</strong>,<br/>
            This is an official notification to inform you that your crew assignment for <strong style="color: #B19247;">${eventName}</strong> (${clientName}) has been cancelled / stood down. You are no longer scheduled for this event.
          </p>

          <!-- Assignment Details Box -->
          <div class="email-box" style="background-color: #16161a; border: 1px solid #222226; border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; box-sizing: border-box; width: 100%;">
            <table style="width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Client:</td>
                <td style="color: #FFFFFF; width: 62%; font-weight: bold; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${clientName}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Event / Occasion:</td>
                <td style="color: #FFFFFF; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${eventName}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Event Date:</td>
                <td style="color: #94A3B8; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="color: #888888; width: 38%; padding: 6px 4px 6px 0; vertical-align: top; line-height: 1.3;">Cancelled Role:</td>
                <td style="color: #F87171; font-weight: bold; width: 62%; padding: 6px 0 6px 4px; vertical-align: top; line-height: 1.3; word-break: break-word;">${roles} (${category})</td>
              </tr>
            </table>
          </div>

          <p style="color: #888888; font-size: 11px; line-height: 1.5; margin: 0;">
            Your calendar for this date is now released for other assignments or personal bookings.<br/>
            Thank you for your understanding. For any questions, please contact the studio management.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #555555; font-size: 10px; line-height: 1.4;">
          © ${new Date().getFullYear()} Astitva Creations • Andhra Pradesh & Telangana, India • www.astitvacreations.com
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: `Astitva Creations Alerts <${fromEmail}>`,
      to: memberEmail,
      subject: `Assignment Stand-Down: ${eventName} (${formattedDate}) - Astitva Creations`,
      html
    });

    if (response.error) {
      console.error('[Resend Crew Unassignment Error]:', response.error);
      return { success: false, error: response.error };
    }

    console.log(`Crew unassignment email sent successfully to ${memberName} (${memberEmail})`);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send crew unassignment email:', error);
    return { success: false, error: error.message };
  }
};



