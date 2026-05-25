import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Fallback
dotenv.config(); // Load standard .env if present
import { generateQuotationPDF } from './pdfGenerator.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a luxury quotation confirmation to the client and a lead alert to the admin
 * @param {Object} quoteRequest - The saved QuoteRequest document
 */
export const sendQuotationEmails = async (quoteRequest) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Mailer Warning: Email credentials are missing. Emails will not be sent.');
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
    <div style="font-family: 'Outfit', 'Inter', 'Helvetica Neue', sans-serif; background-color: #0B0B0B; color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #1c1c1c; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- Luxury Branded Header -->
      <div style="background-color: #000000; padding: 40px 20px; text-align: center; border-bottom: 1px solid #1c1c1c;">
        <h1 style="color: #B19247; font-size: 26px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 10px 0;">ASTITVA CREATIONS</h1>
        <p style="color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">CINEMATIC PHOTOGRAPHY & VIDEOGRAPHY</p>
      </div>

      <!-- Welcome Statement -->
      <div style="padding: 40px 30px 20px 30px;">
        <h2 style="font-size: 20px; font-weight: 400; color: #fff; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">Quotation Proposal</h2>
        <p style="color: #A1A1A1; font-size: 15px; line-height: 1.6;">Dear ${customerName},</p>
        <p style="color: #A1A1A1; font-size: 15px; line-height: 1.6;">Thank you for requesting a customized quotation from Astitva Creations. We are thrilled at the prospect of capturing your beautiful celebrations. Below is the complete breakdown of your custom visual package:</p>
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
          ${album?.albumType ? `<tr><td style="padding: 6px 0; color: #fff;">Luxury Photo Album:</td><td style="text-align: right; color: #B19247;">${album.albumType} (${album.sheets} Sheets)</td></tr>` : ''}
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
  `;

  // Admin Notification HTML Email Content
  const adminHtml = `
    <div style="font-family: sans-serif; background-color: #F8F9FA; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E9ECEF;">
      <h2 style="color: #B19247; border-bottom: 2px solid #B19247; padding-bottom: 10px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">New Quote Request Alert</h2>
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
    const safeName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    attachments.push({
      filename: `Astitva_Creations_Proposal_${safeName}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  // Dispatch Client Email
  const clientMailOptions = {
    from: `"Astitva Creations" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${discount > 0 ? '[REVISED] ' : ''}Your Custom Quotation Proposal - Astitva Creations`,
    html: clientHtml,
    attachments
  };

  // Dispatch Admin Email
  const adminMailOptions = {
    from: `"Astitva Creations Portal" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Sends directly to astitvacreations1008@gmail.com
    subject: `${discount > 0 ? '🔄 [REVISED] ' : '🚨 '}Alert: Quote for ${customerName} ${discount > 0 ? `(₹${(estimatedPrice - discount).toLocaleString()}/-)` : ''}`,
    html: adminHtml,
    attachments
  };


  // Send in background without blocking server responses
  transporter.sendMail(clientMailOptions)
    .then(() => console.log(`Confirmation email sent successfully to client: ${email}`))
    .catch((err) => console.error(`Failed to send email to client ${email}:`, err));

  transporter.sendMail(adminMailOptions)
    .then(() => console.log('Lead notification email sent successfully to administrator.'))
    .catch((err) => console.error('Failed to send email notification to administrator:', err));
};

export const sendLeadEmails = async (lead) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Mailer Warning: Email credentials are missing. Lead email will not be sent.');
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
    <div style="font-family: sans-serif; background-color: #F8F9FA; color: #333; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E9ECEF;">
      <h2 style="color: #B19247; border-bottom: 2px solid #B19247; padding-bottom: 10px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">New Landing Page Lead Alert</h2>
      <p style="font-size: 15px;">A new lead has been captured directly from a landing page form!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; width: 150px;">Client Name:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${customerName}</td></tr>
        <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;"><a href="mailto:${email}">${email}</a></td></tr>
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Mobile:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;"><a href="tel:${phone}">${phone}</a></td></tr>
        <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Shoot Date:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${formattedDate}</td></tr>
        <tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Location:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF;">${location || 'N/A'}</td></tr>
        <tr style="background-color: #F8F9FA;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF;">Source page:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; text-transform: uppercase; font-weight: bold;">${source}</td></tr>
        ${notes ? `<tr style="background-color: #FFF;"><td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #E9ECEF; vertical-align: top;">Message:</td><td style="padding: 10px; border-bottom: 1px solid #E9ECEF; line-height: 1.4;">${notes}</td></tr>` : ''}
      </table>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/admin/leads" style="background-color: #B19247; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border-radius: 3px;">Open Leads Manager</a>
      </div>
      
      <p style="font-size: 12px; color: #6C757D; text-align: center; margin-top: 40px; border-top: 1px solid #E9ECEF; padding-top: 20px;">Astitva Creations Admin Notification System</p>
    </div>
  `;

  const adminMailOptions = {
    from: `"Astitva Creations Portal" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `🚨 Alert: New Lead captured from landing page (${customerName})`,
    html: adminHtml
  };

  const clientHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E9ECEF;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #B19247; text-transform: uppercase; letter-spacing: 2px;">Astitva Creations</h1>
      </div>
      <h2 style="color: #333;">Thank you for reaching out, ${customerName}!</h2>
      <p style="color: #555; line-height: 1.6;">We have successfully received your inquiry. Our team is thrilled at the prospect of working with you and will review your details shortly.</p>
      <p style="color: #555; line-height: 1.6;">Our lead coordinator will be in touch with you at <strong>${phone}</strong> or via this email address to discuss your vision in detail.</p>
      <br/>
      <p style="color: #555;">Best Regards,<br/><strong>Team Astitva Creations</strong></p>
    </div>
  `;

  const clientMailOptions = {
    from: `"Astitva Creations" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `We've received your inquiry! - Astitva Creations`,
    html: clientHtml
  };

  transporter.sendMail(clientMailOptions)
    .then(() => console.log(`Lead confirmation email sent successfully to client: ${email}`))
    .catch((err) => console.error(`Failed to send lead email to client ${email}:`, err));

  transporter.sendMail(adminMailOptions)
    .then(() => console.log('Lead notification email sent successfully to administrator.'))
    .catch((err) => console.error('Failed to send email notification to administrator:', err));
};

/**
 * Sends a 6-digit OTP to the admin for secure login or password reset
 * @param {string} email - The admin email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} type - 'login' or 'reset'
 */
export const sendAdminOtpEmail = async (email, otp, type = 'login') => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Mailer Warning: Email credentials are missing. OTP emails will not be sent.');
    return;
  }

  const subject = type === 'reset' 
    ? 'Admin Password Reset OTP - Astitva Creations' 
    : 'Admin Secure Login OTP - Astitva Creations';

  const actionText = type === 'reset'
    ? 'to reset your password'
    : 'to securely log in to the admin portal';

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #050505; color: #E0E0E0; padding: 40px; max-w: 600px; margin: 0 auto; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #B19247; text-transform: uppercase; letter-spacing: 2px;">Astitva Admin Portal</h1>
      </div>
      <p style="font-size: 16px; color: #A1A1A1;">Hello Admin,</p>
      <p style="font-size: 16px; color: #A1A1A1; line-height: 1.5;">Please use the following One-Time Password (OTP) ${actionText}. This OTP is valid for the next 5 minutes.</p>
      <div style="text-align: center; margin: 40px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #000; background-color: #B19247; border-radius: 4px;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #555;">If you did not request this OTP, please ignore this email or check your account security.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Astitva Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    throw error;
  }
};
