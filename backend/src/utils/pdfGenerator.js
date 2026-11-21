import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/logo.png');
const fontSeasons = path.resolve(__dirname, '../../../frontend/public/fonts/The Seasons Light.ttf');
const fontMontserrat = path.resolve(__dirname, '../../../frontend/public/fonts/montserrat.light.ttf');

/**
 * Dynamically generates a premium PDF proposal for a QuoteRequest
 * @param {Object} quote - The QuoteRequest document from MongoDB
 * @returns {Promise<Buffer>} - Resolves to a PDF file Buffer
 */
export const generateQuotationPDF = (quote) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.registerFont('TheSeasons', fontSeasons);
      doc.registerFont('Montserrat', fontMontserrat);

      // --- BRAND COLOR SYSTEM ---
      const COLOR_GOLD = '#B19247'; // Exact dominant gold color of the logo
      const COLOR_BLACK = '#0B0B0B';
      const COLOR_CHARCOAL = '#222222';
      const COLOR_WHITE = '#B19247'; // Clean white for card values and table items
      const COLOR_GRAY = '#B19247'; // Muted gray for labels
      const COLOR_LIGHT_GRAY = '#141414'; // Dark background card fill
      const COLOR_SECONDARY_TEXT = '#B19247';

      // Automatically fill new page backgrounds with rich black
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      });

      const centerY = doc.page.height / 2;
      const centerX = doc.page.width / 2;

      // --- PAGE 1: COVER PAGE ---
      const logoWidth = 240;
      const logoHeight = 240;
      const logoX = centerX - (logoWidth / 2);
      const logoY = centerY - (logoHeight / 2) - 20; // Centered properly without the text below
      
      try {
        doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
      } catch (err) {
        console.error('Error drawing cover logo image:', err);
      }

      // Premium Photography & Cinematic Films Quotation at the very bottom
      doc.fontSize(9)
         .font('TheSeasons')
         .text('Premium Photography & Cinematic Films Quotation', 50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });

      // Helper function to draw headers on subsequent pages
      const drawInnerHeader = (pageNum) => {
        const headerY = 40;
        
        // Draw larger logo image at top left
        try {
          doc.image(logoPath, 50, headerY - 15, { width: 90, height: 90 });
        } catch (err) {
          console.error('Error drawing header logo image:', err);
        }
           
        let mainEvent = 'wedding';
        if (quote.selectedEvents && quote.selectedEvents.length > 0) {
          const eventsList = quote.selectedEvents.map(e => e.toLowerCase());
          if (eventsList.includes('wedding')) mainEvent = 'wedding';
          else if (eventsList.includes('pre wedding') || eventsList.includes('pre-wedding')) mainEvent = 'pre wedding';
          else if (eventsList.includes('engagement')) mainEvent = 'engagement';
          else mainEvent = eventsList[0];
        }
        const mainEventName = mainEvent.toUpperCase();
        
        doc.fillColor(COLOR_GOLD)
           .fontSize(12)
           .font('TheSeasons')
           .text('Premium', doc.page.width - 300, headerY, { align: 'right', width: 250 });
           
        doc.fontSize(28)
           .font('TheSeasons')
           .text(mainEventName, doc.page.width - 300, headerY + 14, { align: 'right', width: 250 });
           
        doc.fontSize(10)
           .font('Montserrat')
           .text('Photography & Cinematic Films Quotation', doc.page.width - 300, headerY + 44, { align: 'right', width: 250 });

        const formattedDate = new Date(quote.createdAt || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '-');
        doc.fontSize(9)
           .text(`Date : ${formattedDate}`, doc.page.width - 300, headerY + 58, { align: 'right', width: 250 });

        doc.moveTo(50, headerY + 75).lineTo(doc.page.width - 50, headerY + 75).lineWidth(0.5).stroke(COLOR_GOLD);
      };

      // Array to keep track of which pages are summary pages
      const summaryPageIndexes = [];

      // --- PAGE 2: ESTIMATION SUMMARY ---
      doc.addPage();
      summaryPageIndexes.push(doc.bufferedPageRange().count - 1 || 1); // 0-based index
      drawInnerHeader(2);

      // Proposal Subtitle Y
      doc.y = 135;

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text('CUSTOM QUOTATION PROPOSAL', 50, doc.y, { characterSpacing: 0.5 });

      const dateStr = new Date(quote.createdAt || Date.now()).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      doc.fillColor(COLOR_GOLD)
         .fontSize(8)
         .font('Montserrat')
         .text(`Date: ${dateStr}`, doc.page.width - 150, doc.y, { align: 'right', width: 100 });

      doc.moveDown(1.5);

      // --- CLIENT & SHOOT COORDINATES CARDS ---
      const coordsY = doc.y;
      
      // Client Coordinates Card
      doc.rect(50, coordsY, 235, 95)
         .fill(COLOR_LIGHT_GRAY)
         .rect(50, coordsY, 235, 95)
         .lineWidth(0)
         .stroke(COLOR_LIGHT_GRAY);

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text('CLIENT DETAILS', 60, coordsY + 10);

      doc.fillColor(COLOR_WHITE)
         .fontSize(8.5)
         .font('Montserrat')
         .text(quote.customerName || 'Valued Client', 60, coordsY + 28);
         
      doc.font('Montserrat')
         .fillColor(COLOR_GRAY)
         .text('Email: ', 60, coordsY + 45, { continued: true })
         .fillColor(COLOR_WHITE)
         .text(quote.email || 'N/A');
         
      const rawPhone = quote.phone || '';
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const formattedPhone = phoneDigits.slice(-10);

      doc.fillColor(COLOR_GRAY)
         .text('Phone: ', 60, coordsY + 60, { continued: true })
         .fillColor(COLOR_WHITE)
         .text(formattedPhone);

      // Shoot Coordinates Card
      doc.rect(310, coordsY, 235, 95)
         .fill(COLOR_LIGHT_GRAY)
         .rect(310, coordsY, 235, 95)
         .lineWidth(0)
         .stroke(COLOR_LIGHT_GRAY);

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text('SHOOT LOGISTICS', 320, coordsY + 10);

      const eventDateStr = quote.eventDate ? new Date(quote.eventDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';
         
      doc.fillColor(COLOR_GRAY)
         .font('Montserrat')
         .text(`Date: `, 320, coordsY + 28, { continued: true })
         .font('Montserrat')
         .fillColor(COLOR_WHITE)
         .text(eventDateStr);
         
      doc.fillColor(COLOR_GRAY)
         .font('Montserrat')
         .text(`Location: `, 320, coordsY + 45, { continued: true })
         .font('Montserrat')
         .fillColor(COLOR_WHITE)
         .text(quote.location || 'N/A');

      doc.y = coordsY + 115;

      // --- ITEMISED SERVICES TABLE ---
      doc.fillColor(COLOR_GOLD)
         .fontSize(10)
         .font('Montserrat')
         .text('ITEMISED SERVICE BREAKDOWN', 50, doc.y);

      doc.moveDown(0.4);

      // Table Header
      let tableStartY = doc.y;
      doc.rect(50, tableStartY, 495, 20)
         .fill(COLOR_LIGHT_GRAY)
         .rect(50, tableStartY, 495, 20)
         .lineWidth(0)
         .stroke(COLOR_LIGHT_GRAY);

      doc.fillColor(COLOR_GOLD)
         .fontSize(8)
         .font('Montserrat')
         .text('EVENT / SERVICE DESCRIPTION', 60, tableStartY + 6)
         .text('TOTAL COST', 460, tableStartY + 6, { width: 75, align: 'right' });

      doc.y = tableStartY + 20;



      // A helper function to check if the next row will overflow the current page.
      const checkPageBreak = (neededHeight) => {
        if (doc.y + neededHeight > doc.page.height - 100) {
          // 1. Draw vertical borders for the current page table segment
          doc.moveTo(50, tableStartY).lineTo(50, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);
          doc.moveTo(545, tableStartY).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);
          // Draw bottom border for the current page table segment
          doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);

          doc.addPage();
          summaryPageIndexes.push(doc.bufferedPageRange().count - 1);
          doc.y = 50;

          // 3. Reset table start y (No header on subsequent summary pages)
          doc.y = 50;
          tableStartY = doc.y;

          // 4. Draw Table Header on the new page
          doc.rect(50, tableStartY, 495, 20)
             .fill(COLOR_LIGHT_GRAY)
             .rect(50, tableStartY, 495, 20)
             .lineWidth(0)
             .stroke(COLOR_LIGHT_GRAY);

          doc.fillColor(COLOR_GOLD)
             .fontSize(8)
             .font('Montserrat')
             .text('EVENT / SERVICE DESCRIPTION', 60, tableStartY + 6)
             .text('TOTAL COST', 460, tableStartY + 6, { width: 75, align: 'right' });

          doc.y = tableStartY + 20;
          tableStartY = doc.y;
        }
      };

      // Render coverages
      const events = quote.selectedEvents || [];
      const configs = quote.eventConfigs || {};

      events.forEach((evt, index) => {
        const config = configs[evt] || {};
        const duration = config.duration || 'Half Day';
        const subOption = config.option || config.haldiOption || config.godumraiOption || '';
        
        if (index > 0) {
          doc.y += 10;
        }
        
        checkPageBreak(18);

        // Draw Event Row Header
        doc.rect(50, doc.y, 495, 18)
           .fill(COLOR_LIGHT_GRAY);

        doc.fillColor(COLOR_GOLD)
           .fontSize(8)
           .font('Montserrat')
           .text(`${evt.toUpperCase()} (${duration.toUpperCase()})${subOption ? ` - ${subOption.toUpperCase()}` : ''}`, 60, doc.y + 5);

        doc.y += 18;

        // Render services inside this event
        const services = config.services || {};
        
        Object.keys(services).forEach((s) => {
          const svcDetail = services[s];
          let qty = 1;
          let price = 0;
          if (typeof svcDetail === 'object' && svcDetail !== null) {
            qty = svcDetail.qty || 0;
            price = svcDetail.price || 0;
          } else if (typeof svcDetail === 'number') {
            qty = svcDetail;
          }

          if (qty > 0) {
            checkPageBreak(16);

            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);

            const cost = price * qty;
            const currentY = doc.y;

            doc.fillColor(COLOR_WHITE)
               .fontSize(8.5)
               .font('Montserrat')
               .text(`  • ${s} (Qty: ${qty})`, 60, currentY + 5)
               .text(`Rs. ${cost.toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });

            doc.y += 16;
          }
        });
      });

      // Render pre-wedding
      if (quote.preWedding && quote.preWedding.style) {
        checkPageBreak(16);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
        
        const currentY = doc.y;
        doc.fillColor(COLOR_GOLD)
           .fontSize(8.5)
           .font('Montserrat')
           .text(`Pre-Wedding Shoot Style: ${quote.preWedding.style}`, 60, currentY + 5)
           .font('Montserrat')
           .text(`Rs. ${(quote.preWedding.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y += 16;
      }

      const postDeliverables = [];
      const complimentaries = [];

      // Render post prod editing
      if (quote.postProduction && quote.postProduction.editing) {
        doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat');
        const editingText = `Film Post-Production Editing: ${quote.postProduction.editing}`;
        const textHeight = doc.heightOfString(editingText, { width: 380 });
        checkPageBreak(textHeight + 10);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
        
        let currentY = doc.y;
        doc.fillColor(COLOR_GOLD).text(editingText, 60, currentY + 5, { width: 380 });
        doc.text(`Rs. ${(quote.postProduction.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y = currentY + textHeight + 10;
        
        const editingStr = quote.postProduction.editing.toLowerCase();
        if (editingStr.includes('documentary') || editingStr.includes('netflix')) {
          postDeliverables.push('• A 15 to 20-minute cinematic wedding documentary crafted in a Netflix-style storytelling format.');
          postDeliverables.push('• Standard Wedding Film: Full-length wedding archive with simple, clean edits.');
          postDeliverables.push('• Wedding Highlights Film: Creative cinematic montage capturing core emotional landmarks.');
          postDeliverables.push('• Promo Cut: Energetic, short, social-media-ready teaser.');
          postDeliverables.push('• Traditional Video: Complete chronologically archived coverage.');
        } else if (editingStr.includes('standard')) {
          postDeliverables.push('• Standard Wedding Film: Full-length wedding archive with simple, clean edits.');
          postDeliverables.push('• Wedding Highlights Film: Creative cinematic montage capturing core emotional landmarks.');
          postDeliverables.push('• Promo Cut: Energetic, short, social-media-ready teaser.');
          postDeliverables.push('• Traditional Video: Complete chronologically archived coverage.');
        }
      }

      // Render album
      if (quote.album && quote.album.albumType) {
        doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat');
        const totalSheetsText = quote.album.sheets ? ` + ${quote.album.sheets} Additional Sheets` : '';
        const albumText = `Luxury Print Album: ${quote.album.albumType}${totalSheetsText}`;
        const textHeight = doc.heightOfString(albumText, { width: 380 });
        checkPageBreak(textHeight + 10);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
        
        let currentY = doc.y;
        doc.fillColor(COLOR_GOLD).text(albumText, 60, currentY + 5, { width: 380 });
        doc.text(`Rs. ${(quote.album.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y = currentY + textHeight + 10;
        
        const albumStr = quote.album.albumType.toLowerCase();
        if (albumStr.includes('premium')) {
          complimentaries.push('• Table Photo Calendar');
          complimentaries.push('• Pocket Album');
          complimentaries.push('• Premium Acrylic Photo Frame');
        } else if (albumStr.includes('standard')) {
          complimentaries.push('• Wall Photo Calendar');
          complimentaries.push('• Photo Frame');
        } else if (albumStr.includes('basic')) {
          complimentaries.push('• Wall Photo Calendar');
        }
      }

      // Render Extra Albums if any
      if (Array.isArray(quote.extraAlbums) && quote.extraAlbums.length > 0) {
        quote.extraAlbums.forEach((extra, idx) => {
          if (extra && extra.albumType) {
            doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat');
            const totalSheetsText = extra.sheets ? ` + ${extra.sheets} Additional Sheets` : '';
            const albumText = `Extra Photo Album (${idx + 1}): ${extra.albumType}${totalSheetsText}`;
            const textHeight = doc.heightOfString(albumText, { width: 380 });
            checkPageBreak(textHeight + 10);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
            
            let currentY = doc.y;
            doc.fillColor(COLOR_GOLD).text(albumText, 60, currentY + 5, { width: 380 });
            doc.text(`Rs. ${(extra.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
            doc.y = currentY + textHeight + 10;
          }
        });
      }

      // Render Addons
      const addOns = quote.addOns || {};
      Object.keys(addOns).forEach((key) => {
        const addon = addOns[key];
        if (addon.selected) {
          doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat');
          const textHeight = doc.heightOfString(addon.name, { width: 380 });
          checkPageBreak(textHeight + 10);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
          
          const currentY = doc.y;
          doc.fillColor(COLOR_GOLD).text(`${addon.name}`, 60, currentY + 5, { width: 380 });
          doc.text(`Rs. ${(addon.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
          doc.y = currentY + textHeight + 10;
        }
      });

      // Print Deliverables and Complimentaries
      const finalDeliverables = (Array.isArray(quote.deliverables) && quote.deliverables.length > 0)
        ? quote.deliverables.map(d => d.trim().startsWith('•') ? d.trim() : `• ${d.trim()}`)
        : postDeliverables;

      const finalComplimentaries = (Array.isArray(quote.complimentaries) && quote.complimentaries.length > 0)
        ? quote.complimentaries.map(c => c.trim().startsWith('•') ? c.trim() : `• ${c.trim()}`)
        : [...new Set(complimentaries)];

      if (finalDeliverables.length > 0) {
        doc.y += 8;
        checkPageBreak(22 + finalDeliverables.length * 14);
        doc.fillColor(COLOR_GOLD)
           .fontSize(10)
           .font('Montserrat')
           .text('Deliverables:', 60, doc.y + 10);
        doc.y += 20;
        doc.fillColor(COLOR_GOLD) // Changed to gold to match theme
           .fontSize(8);
        finalDeliverables.forEach(d => {
          doc.text(d, 65, doc.y, { lineGap: 4, width: 450 });
        });
        doc.y += 8;
      }

      if (finalComplimentaries.length > 0) {
        doc.y += 8;
        checkPageBreak(22 + finalComplimentaries.length * 14);
        doc.fillColor(COLOR_GOLD)
           .fontSize(10)
           .font('Montserrat')
           .text('Complimentary Gifts:', 60, doc.y + 10);
        doc.y += 20;
        doc.fillColor(COLOR_GOLD) // Changed to gold to match theme
           .fontSize(8);
        finalComplimentaries.forEach(c => {
          doc.text(c, 65, doc.y, { lineGap: 4, width: 450 });
        });
        doc.y += 8;
      }

      // Check if user didn't add Additional Album Sheets
      const hasAdditionalAlbumSheets = (Number(quote.album?.sheets || 0) > 0) || 
        (Array.isArray(quote.extraAlbums) && quote.extraAlbums.some(e => Number(e.sheets || 0) > 0)) ||
        (typeof quote.album?.albumType === 'string' && /additional sheets/i.test(quote.album.albumType));

      if (!hasAdditionalAlbumSheets) {
        doc.y += 6;
        checkPageBreak(22);
        doc.fillColor(COLOR_GOLD)
           .fontSize(8.5)
           .font('Montserrat')
           .text('(* Note: If you want an album, it costs 500 rupees per each sheet.)', 60, doc.y, { width: 480 });
        doc.y += 10;
      }

      // Bottom border of the table
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0).stroke(COLOR_LIGHT_GRAY);
      doc.y += 15;

      // Ensure we don't break page overflow when drawing totals (allow more space if discount is present)
      const hasDiscount = quote.discount && quote.discount > 0;
      const totalBoxHeight = hasDiscount ? 75 : 38;
      const neededTotalSpace = hasDiscount ? 150 : 120;
      
      if (doc.y > doc.page.height - neededTotalSpace) {
        doc.addPage();
        summaryPageIndexes.push(doc.bufferedPageRange().count - 1);
        doc.y = 50;
      }

      // --- ESTIMATED GRAND TOTAL BOX ---
      const totalBoxY = doc.y;
      doc.rect(50, totalBoxY, 495, totalBoxHeight)
         .fill(COLOR_LIGHT_GRAY)
         .rect(50, totalBoxY, 495, totalBoxHeight)
         .lineWidth(0)
         .stroke(COLOR_LIGHT_GRAY);

      if (hasDiscount) {
        // Row 1: Base Proposal Estimate
        doc.fillColor(COLOR_GOLD)
           .fontSize(8.5)
           .font('Montserrat')
           .text('BASE PROPOSAL ESTIMATE:', 70, totalBoxY + 12, { letterSpacing: 0.5 });
        doc.text(`Rs. ${quote.estimatedPrice.toLocaleString()}/-`, 400, totalBoxY + 12, { width: 130, align: 'right' });

        // Row 2: Administrative Discount
        const discountLabel = quote.discountType === 'percentage' 
          ? `ADMINISTRATIVE DISCOUNT (${quote.discountValue}%):` 
          : 'ADMINISTRATIVE DISCOUNT:';
        doc.text(discountLabel, 70, totalBoxY + 30, { characterSpacing: 0.5 });
        doc.text(`-Rs. ${quote.discount.toLocaleString()}/-`, 400, totalBoxY + 30, { width: 130, align: 'right' });

        // Row 3: Final Estimated Total
        doc.fontSize(11)
           .text('FINAL ESTIMATED TOTAL COST:', 70, totalBoxY + 50, { characterSpacing: 0.5 });
        doc.fontSize(14)
           .text(`Rs. ${(quote.estimatedPrice - quote.discount).toLocaleString()}/-`, 400, totalBoxY + 49, { width: 130, align: 'right' });
      } else {
        doc.fillColor(COLOR_GOLD)
           .fontSize(9)
           .font('Montserrat')
           .text('ESTIMATED TOTAL PROPOSAL COST:', 70, totalBoxY + 15, { characterSpacing: 0.5 });

        doc.fillColor(COLOR_GOLD)
           .fontSize(16)
           .font('Montserrat')
           .text(`Rs. ${quote.estimatedPrice.toLocaleString()}/-`, 400, totalBoxY + 11, { width: 130, align: 'right' });
      }

      // Draw double gold horizontal lines below the total box dynamically scaled
      doc.moveTo(50, totalBoxY + totalBoxHeight + 8).lineTo(doc.page.width - 50, totalBoxY + totalBoxHeight + 8).lineWidth(0.5).stroke(COLOR_GOLD);
      doc.moveTo(50, totalBoxY + totalBoxHeight + 13).lineTo(doc.page.width - 50, totalBoxY + totalBoxHeight + 13).lineWidth(0.5).stroke(COLOR_GOLD);

      doc.y = totalBoxY + totalBoxHeight + 20;

      // Special notes if present
      if (quote.notes) {
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
          drawInnerHeader(2);
          doc.y = 130;
        }
        doc.fillColor(COLOR_GOLD)
           .fontSize(9)
           .font('Montserrat')
           .text('SPECIAL CLIENT REQUESTS / NOTES:', 50, doc.y);
        
        doc.fillColor(COLOR_GOLD)
           .fontSize(8)
           .font('Montserrat')
           .text(quote.notes, 50, doc.y + 12, { width: 495, lineGap: 2 });
      }

      // --- PAGE 3: SHOOTING APPROACH & TERMS & CONDITIONS ---
      doc.addPage();
      
      // Center-aligned title & paragraphs
      doc.y = 40;

      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('TheSeasons')
         .text('Our Shooting Approach', { align: 'center', paragraphGap: 12 });

      const approachParagraphs = [
        "We follow a storytelling style approach that focuses on real emotions, natural moments and ritual depth.",
        "Our photography captures genuine expressions and family reactions with clean and timeless framing.",
        "Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.",
        "All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design."
      ];

      doc.fontSize(11)
         .font('Montserrat');

      approachParagraphs.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 3, paragraphGap: 6 });
      });

      doc.moveDown(0.8);

      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('TheSeasons')
         .text('Kindly Note', { align: 'center', paragraphGap: 12 });

      const termsText = [
        "We truly look forward to being part of your special celebration.",
        "To ensure everything goes smoothly, we kindly request your support on the following:",
        "- For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.",
        "This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.",
        "Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.",
        "All data will be carefully transferred and handed over safely to you.",
        "- To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.",
        "- After the pre-wedding shoot, 20% of the remaining payment will be cleared.",
        "- Another 40% will be paid after the completion of all events.",
        "- The final 20% will be paid after album and video delivery.",
        "-- Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.",
        "- For wedding and other events, accommodation arrangements will be taken care of by the client.",
        "Our goal is to deliver your memories with care, clarity and commitment.",
        "We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.",
        "With gratitude,"
      ];

      doc.fontSize(11)
         .font('Montserrat');

      termsText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 3, paragraphGap: 5 });
      });

      doc.moveDown(0.5);
      // Ensure signature Y is absolutely positioned and safely above the 50px margin
      // doc.page.height is 841.89. Margin is 50. maxY is 791.89.
      // We set signatureY to min(doc.y, 750) so it never pushes below 750.
      const signatureY = Math.min(doc.y, 750);
      
      doc.fillColor(COLOR_GOLD)
         .fontSize(14)
         .font('TheSeasons')
         .text('Team', doc.page.width - 150, signatureY, { align: 'right', width: 100, lineBreak: false });
      doc.fontSize(22)
         .font('TheSeasons')
         .text('Astitva', doc.page.width - 150, signatureY + 14, { align: 'right', width: 100, lineBreak: false });


      // --- PAGE 4: BACK COVER (CONTACTS & LOCATIONS) ---
      doc.addPage();
      
      const p4CenterY = doc.page.height / 2;
      
      // Draw Logo Image (circular icon)
      try {
        doc.image(logoPath, centerX - 120, p4CenterY - 140, { width: 240, height: 240 });
      } catch (err) {
        console.error('Error drawing back cover logo image:', err);
      }

      // States list (ANDHRA PRADESH / TELANGANA)
      doc.fontSize(10)
         .font('Montserrat')
         .text('ANDHRA PRADESH', 100, p4CenterY + 130, { width: 180, align: 'center' });
      doc.text('TELANGANA', doc.page.width - 280, p4CenterY + 130, { width: 180, align: 'center' });

      // Contact info at bottom center
      doc.fillColor(COLOR_GOLD)
         .fontSize(14)
         .font('TheSeasons')
         .text('Contact details', 50, p4CenterY + 175, { align: 'center', width: 495 })
         .moveDown(0.4)
         .fontSize(9)
         .font('Montserrat')
         .text('Phone : +919182028835', { align: 'center' })
         .text('Email: official@astitvacreations.com', { align: 'center' })
         .moveDown(0.8)
         .text('www.astitvacreations.com', { align: 'center' });


      // --- DRAW ESTIMATION PAGE DECORATIVE BOTTOM LINES ---
      const pages = doc.bufferedPageRange();

      summaryPageIndexes.forEach((pageIndex, idx) => {
        const pageNumDisplay = idx + 1; // 1-based for the text
        doc.switchToPage(pageIndex);
        doc.moveTo(50, doc.page.height - 80)
           .lineTo(doc.page.width - 50, doc.page.height - 80)
           .lineWidth(0.5)
           .stroke(COLOR_GOLD);
           
        // Page numbers for summary pages
        // Drawn well above the 50px bottom margin (height - 70) to prevent text bounding box overflow
        doc.fillColor(COLOR_GOLD)
           .fontSize(8)
           .font('Montserrat')
           .text(`Page ${pageNumDisplay}`, 50, doc.page.height - 70, { align: 'right', width: 495, lineBreak: false });
      });

      // Important: switch back to the first page before ending so the PDF opens at the top!
      doc.switchToPage(0);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generateEventInvoicePDF = (event) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.registerFont('TheSeasons', fontSeasons);
      doc.registerFont('Montserrat', fontMontserrat);

      const COLOR_GOLD = '#B19247';
      const COLOR_BLACK = '#0B0B0B';
      const COLOR_CHARCOAL = '#222222';
      const COLOR_WHITE = '#FFFFFF';
      const COLOR_GRAY = '#888888';

      // Background logic for all pages
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      });

      const centerX = doc.page.width / 2;
      const centerY = doc.page.height / 2;

      // --- PAGE 1: COVER PAGE ---
      const logoWidth = 240;
      const logoHeight = 240;
      try {
        doc.image(logoPath, centerX - (logoWidth / 2), centerY - (logoHeight / 2) - 20, { width: logoWidth, height: logoHeight });
      } catch (err) {
        console.error('Error drawing cover logo image:', err);
      }

      // --- PAGE 2: CONTENT ---
      doc.addPage();
      
      // Header
      try {
        doc.image(logoPath, 50, 40, { width: 90, height: 90 });
      } catch (err) {
        console.error('Error drawing header logo image:', err);
      }

      doc.fillColor(COLOR_GOLD)
         .fontSize(24)
         .font('TheSeasons')
         .text('EVENT INVOICE', doc.page.width - 250, 60, { align: 'right', width: 200 });

      doc.fontSize(10)
         .font('Montserrat')
         .text(`Date: ${new Date().toLocaleDateString()}`, doc.page.width - 250, 90, { align: 'right', width: 200 });

      // Client Details
      doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('CLIENT DETAILS', 50, 150);
      doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text(`Name: ${event.customerName}`, 50, 170);
      doc.text(`Email: ${event.email || 'N/A'}`, 50, 185);
      doc.text(`Phone: ${event.phone}`, 50, 200);

      // Event Details
      doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('EVENT DETAILS', 300, 150);
      doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text(`Event: ${event.eventName}`, 300, 170);
      const eDate = new Date(event.eventDate).toLocaleDateString();
      doc.text(`Date: ${eDate}`, 300, 185);
      doc.text(`Status: ${event.status}`, 300, 200);

      // Divider
      doc.moveTo(50, 240).lineTo(doc.page.width - 50, 240).lineWidth(1).stroke(COLOR_CHARCOAL);

      let currentY = 270;
      
      // Helper to check page break
      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 50;
        }
      };

      // Sub Events & Services
      doc.fillColor(COLOR_GOLD).fontSize(16).font('TheSeasons').text('SERVICES RENDERED', 50, currentY);
      currentY += 30;

      if (event.subEvents && event.subEvents.length > 0) {
        event.subEvents.forEach(se => {
          checkPageBreak(30);
          doc.fillColor(COLOR_GOLD).fontSize(12).font('Montserrat').text(se.name.toUpperCase(), 50, currentY);
          currentY += 20;

          if (se.services && se.services.length > 0) {
            se.services.forEach(s => {
              checkPageBreak(20);
              doc.fillColor(COLOR_WHITE).fontSize(10).text(s.name, 70, currentY);
              doc.text(`Rs. ${s.price}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
              currentY += 20;
            });
          }
          currentY += 10;
        });
      } else {
         doc.fillColor(COLOR_WHITE).fontSize(10).text("No specialized services listed.", 50, currentY);
         currentY += 30;
      }

      // Deliverables
      if (event.deliverables && event.deliverables.length > 0) {
        checkPageBreak(30 + (event.deliverables.length * 15));
        currentY += 10;
        doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('DELIVERABLES', 50, currentY);
        currentY += 20;
        event.deliverables.forEach(item => {
          doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text(`• ${item}`, 70, currentY);
          currentY += 15;
        });
      }

      // Complimentaries
      if (event.complimentaries && event.complimentaries.length > 0) {
        checkPageBreak(30 + (event.complimentaries.length * 15));
        currentY += 10;
        doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('COMPLIMENTARIES', 50, currentY);
        currentY += 20;
        event.complimentaries.forEach(item => {
          doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text(`• ${item}`, 70, currentY);
          currentY += 15;
        });
      }

      // Check if user didn't add Additional Album Sheets
      const hasInvoiceAlbumSheets = Boolean(event.album?.enabled && Number(event.album?.sheets || 0) > 0);
      if (!hasInvoiceAlbumSheets) {
        checkPageBreak(25);
        currentY += 8;
        doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat')
           .text('(* Note: If you want an album, it costs 500 rupees per each sheet.)', 50, currentY, { width: 495 });
        currentY += 16;
      }

      // Divider
      checkPageBreak(100);
      currentY += 20;
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).lineWidth(1).stroke(COLOR_CHARCOAL);
      currentY += 20;

      // Totals
      const totalAmount = event.finalTotal || 0;
      const paidAmount = event.paidAmount || 0;
      const pendingAmount = totalAmount - paidAmount;
      const servicesTotal = (event.subEvents || []).flatMap(se => se.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
      const discount = (servicesTotal > totalAmount) ? (servicesTotal - totalAmount) : (event.discountAmount || 0);

      if (discount > 0) {
        const grossTotal = totalAmount + discount;
        doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat')
           .text('Gross Total:', doc.page.width - 250, currentY);
        doc.text(`Rs. ${grossTotal}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
        currentY += 20;

        doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat')
           .text('Discount:', doc.page.width - 250, currentY);
        doc.text(`- Rs. ${discount}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
        currentY += 20;
      }

      doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat')
         .text('Final Total:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${totalAmount}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
      currentY += 20;

      doc.text('Paid Amount:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${paidAmount}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
      currentY += 20;

      doc.fillColor(COLOR_GOLD).fontSize(12).font('TheSeasons')
         .text('Pending Amount:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${pendingAmount}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });


      // --- PAGE N-1: TERMS & CONDITIONS ---
      doc.addPage();
      
      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('TheSeasons')
         .text('Our Shooting Approach', 50, 60, { align: 'center', width: 495 });
         
      doc.moveDown(1);
      doc.fillColor(COLOR_GOLD)
         .fontSize(10)
         .font('Montserrat');
         
      const approachText = [
        "We follow a storytelling style approach that focuses on real emotions, natural moments and ritual depth.",
        "Our photography captures genuine expressions and family reactions with clean and timeless framing.",
        "Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.",
        "All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design."
      ];
      
      approachText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 5, paragraphGap: 10 });
      });
      
      doc.moveDown(1.5);
      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('TheSeasons')
         .text('Kindly Note', { align: 'center' });
         
      doc.moveDown(1);
      doc.fillColor(COLOR_GOLD)
         .fontSize(10)
         .font('Montserrat');
         
      const termsText = [
        "We truly look forward to being part of your special celebration.",
        "To ensure everything goes smoothly, we kindly request your support on the following:",
        "- For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.",
        "This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.",
        "Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.",
        "All data will be carefully transferred and handed over safely to you.",
        "- To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.",
        "- After the pre-wedding shoot, 20% of the remaining payment will be cleared.",
        "- Another 40% will be paid after the completion of all events.",
        "- The final 20% will be paid after album and video delivery.",
        "-- Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.",
        "- For wedding and other events, accommodation arrangements will be taken care of by the client.",
        "Our goal is to deliver your memories with care, clarity and commitment.",
        "We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.",
        "With gratitude,"
      ];
      
      termsText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 3, paragraphGap: 5 });
      });
      
      doc.moveDown(0.5);
      const signatureY = Math.min(doc.y, 750);
      
      doc.fillColor(COLOR_GOLD)
         .fontSize(14)
         .font('TheSeasons')
         .text('Team', doc.page.width - 150, signatureY, { align: 'right', width: 100, lineBreak: false });
      doc.fontSize(22)
         .font('TheSeasons')
         .text('Astitva', doc.page.width - 150, signatureY + 14, { align: 'right', width: 100, lineBreak: false });


      // --- PAGE N: BACK COVER ---
      doc.addPage();
      
      const p4CenterY = doc.page.height / 2;
      
      try {
        doc.image(logoPath, centerX - 120, p4CenterY - 140, { width: 240, height: 240 });
      } catch (err) {
        console.error('Error drawing back cover logo image:', err);
      }

      doc.fontSize(10)
         .font('Montserrat')
         .text('ANDHRA PRADESH', 100, p4CenterY + 130, { width: 180, align: 'center' });
      doc.text('TELANGANA', doc.page.width - 280, p4CenterY + 130, { width: 180, align: 'center' });

      doc.fillColor(COLOR_GOLD)
         .fontSize(14)
         .font('TheSeasons')
         .text('Contact details', 50, p4CenterY + 175, { align: 'center', width: 495 })
         .moveDown(0.4)
         .fontSize(9)
         .font('Montserrat')
         .text('Phone : +919182028835', { align: 'center' })
         .text('Email: official@astitvacreations.com', { align: 'center' })
         .moveDown(0.8)
         .text('www.astitvacreations.com', { align: 'center' });

      // Important: switch back to the first page before ending
      doc.switchToPage(0);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a dynamic quotation or agreement PDF based on the target version
 * Adheres strictly to the Single Agreement Rule, dynamic header titles, and sanitized filenames.
 */
export const generateEventQuotationPDF = (event, versionParam = null) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Resolve Target Version
      let targetVersion = null;
      if (Array.isArray(event.versions) && event.versions.length > 0) {
        if (versionParam !== null && versionParam !== undefined && versionParam !== '') {
          const cleanParam = String(versionParam).replace(/^Q/i, '').trim();
          targetVersion = event.versions.find(
            v => String(v.versionNumber) === cleanParam || String(v.quotationNumber) === cleanParam
          );
        }
        if (!targetVersion && event.agreementVersionNumber) {
          targetVersion = event.versions.find(v => v.versionNumber === event.agreementVersionNumber);
        }
        if (!targetVersion && event.activeVersionNumber) {
          targetVersion = event.versions.find(v => v.versionNumber === event.activeVersionNumber);
        }
        if (!targetVersion) {
          targetVersion = event.versions[event.versions.length - 1];
        }
      }

      // Fallback if no version snapshot exists
      if (!targetVersion) {
        targetVersion = {
          versionNumber: 1,
          quotationNumber: '1',
          versionName: 'Quotation 1 (Initial Quote)',
          isAgreement: false,
          date: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
          subEventList: (event.subEvents || []).map(se => ({
            name: se.name,
            services: (se.services || []).map(s => ({ name: s.name, price: s.price, quantity: s.quantity || 1 }))
          })),
          deliverables: (event.deliverables || []).map(d => ({ name: typeof d === 'string' ? d : d.name, price: 0 })),
          complimentries: (event.complimentaries || []).map(c => ({ name: typeof c === 'string' ? c : c.name, price: 0 })),
          addOns: [],
          album: { enabled: false, numberOfAlbums: 1, sheets: 0, pricePerSheet: 500 },
          totalAmount: event.finalTotal || 0,
          discount: event.discountAmount || 0,
          paidAmount: event.paidAmount || 0,
          pendingAmount: Math.max(0, (event.finalTotal || 0) - (event.paidAmount || 0))
        };
      }

      const isAgreement = Boolean(targetVersion.isAgreement);
      const versionTag = targetVersion.quotationNumber || String(targetVersion.versionNumber || '1');
      const isVersionedAgreement = isAgreement && versionTag && versionTag !== '1' && versionTag !== '1.0';
      const safeClient = String(event.customerName || 'Client').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const safeEvent = String(event.eventName || 'Event').trim().replace(/[^a-zA-Z0-9]/g, '_');
      
      const filename = isAgreement
        ? (isVersionedAgreement 
            ? `${safeClient}_${safeEvent}_Final_Agreement_v${versionTag}.pdf` 
            : `${safeClient}_${safeEvent}_Agreement.pdf`)
        : `${safeClient}_${safeEvent}_Quotation_${versionTag}.pdf`;

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({ pdfBuffer, filename, targetVersion, isAgreement });
      });

      doc.registerFont('TheSeasons', fontSeasons);
      doc.registerFont('Montserrat', fontMontserrat);

      const COLOR_GOLD = '#B19247';
      const COLOR_BLACK = '#0B0B0B';
      const COLOR_CHARCOAL = '#222222';
      const COLOR_WHITE = '#FFFFFF';
      const COLOR_GRAY = '#888888';
      const COLOR_LIGHT_GRAY = '#141414';

      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);
      });

      const centerX = doc.page.width / 2;
      const centerY = doc.page.height / 2;

      // --- PAGE 1: COVER PAGE ---
      const logoWidth = 240;
      const logoHeight = 240;
      try {
        doc.image(logoPath, centerX - (logoWidth / 2), centerY - (logoHeight / 2) - 20, { width: logoWidth, height: logoHeight });
      } catch (err) {
        console.error('Error drawing cover logo image:', err);
      }

      const coverFooterText = isAgreement
        ? (isVersionedAgreement
            ? `Premium Photography & Cinematic Films Final Agreement (Version ${versionTag})`
            : 'Premium Photography & Cinematic Films Agreement')
        : `Premium Photography & Cinematic Films Quotation (Q ${versionTag})`;

      doc.fillColor(COLOR_GOLD)
         .fontSize(10)
         .font('TheSeasons')
         .text(coverFooterText, 50, doc.page.height - 90, { align: 'center', width: doc.page.width - 100 });

      // --- PAGE 2: CONTENT ---
      doc.addPage();

      // Top logo
      try {
        doc.image(logoPath, 50, 40, { width: 90, height: 90 });
      } catch (err) {
        console.error('Error drawing header logo image:', err);
      }

      const eventNameUpper = String(event.eventName || 'EVENT').toUpperCase();
      const headerTitle = isAgreement
        ? (isVersionedAgreement ? `${eventNameUpper} FINAL AGREEMENT (VERSION ${versionTag})` : `${eventNameUpper} AGREEMENT`)
        : `${eventNameUpper} QUOTATION (Q ${versionTag})`;

      doc.fillColor(COLOR_GOLD)
         .fontSize(12)
         .font('TheSeasons')
         .text('Premium', doc.page.width - 320, 45, { align: 'right', width: 270 });

      doc.fontSize(22)
         .font('TheSeasons')
         .text(headerTitle, doc.page.width - 350, 60, { align: 'right', width: 300 });

      const dateDisplay = targetVersion.date 
        ? new Date(targetVersion.date).toLocaleDateString('en-GB').replace(/\//g, '-')
        : (event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-GB').replace(/\//g, '-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));

      doc.fontSize(9)
         .font('Montserrat')
         .text(`Date : ${dateDisplay}`, doc.page.width - 320, 88, { align: 'right', width: 270 });

      doc.moveTo(50, 115).lineTo(doc.page.width - 50, 115).lineWidth(0.5).stroke(COLOR_GOLD);

      // Subtitle
      doc.y = 135;
      const subTitle = isAgreement
        ? 'FINALIZED SHOOT AGREEMENT'
        : `CUSTOM QUOTATION PROPOSAL (VERSION ${versionTag})`;

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text(subTitle, 50, doc.y, { characterSpacing: 0.5 });

      doc.moveDown(1.5);

      // Client & Event Details Cards
      const coordsY = doc.y;

      // Client Card
      doc.rect(50, coordsY, 235, 80)
         .fill(COLOR_LIGHT_GRAY)
         .rect(50, coordsY, 235, 80)
         .lineWidth(0.5)
         .stroke(COLOR_CHARCOAL);

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text('CLIENT DETAILS', 65, coordsY + 12);

      doc.fillColor(COLOR_WHITE)
         .fontSize(9)
         .font('Montserrat')
         .text(`Name: ${event.customerName || 'Client'}`, 65, coordsY + 28);
      doc.text(`Email: ${event.email || 'N/A'}`, 65, coordsY + 44);
      doc.text(`Phone: ${event.phone || 'N/A'}`, 65, coordsY + 60);

      // Event Card
      doc.rect(doc.page.width - 285, coordsY, 235, 80)
         .fill(COLOR_LIGHT_GRAY)
         .rect(doc.page.width - 285, coordsY, 235, 80)
         .lineWidth(0.5)
         .stroke(COLOR_CHARCOAL);

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Montserrat')
         .text('EVENT DETAILS', doc.page.width - 270, coordsY + 12);

      doc.fillColor(COLOR_WHITE)
         .fontSize(9)
         .font('Montserrat')
         .text(`Event: ${event.eventName || 'N/A'}`, doc.page.width - 270, coordsY + 28);
      doc.text(`Date: ${dateDisplay}`, doc.page.width - 270, coordsY + 44);
      doc.text(`Location: ${event.location || 'Studio / On-Location'}`, doc.page.width - 270, coordsY + 60);

      let currentY = coordsY + 100;

      const checkPageBreak = (neededHeight) => {
        if (currentY + neededHeight > doc.page.height - 70) {
          doc.addPage();
          currentY = 50;
        }
      };

      // Services Rendered
      checkPageBreak(40);
      doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('SERVICES RENDERED', 50, currentY);
      currentY += 25;

      const subEvents = targetVersion.subEventList || [];
      if (subEvents.length > 0) {
        subEvents.forEach((se) => {
          checkPageBreak(30);
          doc.fillColor(COLOR_GOLD).fontSize(11).font('Montserrat').text(se.name.toUpperCase(), 50, currentY);
          currentY += 18;

          if (se.services && se.services.length > 0) {
            se.services.forEach((s) => {
              checkPageBreak(18);
              const qty = Number(s.quantity) > 1 ? ` (x${s.quantity})` : '';
              doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text(`• ${s.name}${qty}`, 65, currentY);
              const lineTotal = Number(s.price || 0) * (Number(s.quantity) || 1);
              doc.text(`Rs. ${lineTotal}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
              currentY += 18;
            });
          }
          currentY += 8;
        });
      } else {
        doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text('Standard Photography & Videography Coverage', 65, currentY);
        currentY += 20;
      }

      // Album details if enabled
      if (targetVersion.album?.enabled) {
        checkPageBreak(30);
        currentY += 5;
        doc.fillColor(COLOR_GOLD).fontSize(11).font('Montserrat').text('PHOTO ALBUM', 50, currentY);
        currentY += 18;
        const alb = targetVersion.album;
        const albCost = (Number(alb.sheets || 0) * Number(alb.pricePerSheet || 500) * Math.max(1, Number(alb.numberOfAlbums || 1)));
        doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat')
           .text(`• ${alb.numberOfAlbums || 1} Album(s) - ${alb.sheets || 0} Sheets (@ Rs. ${alb.pricePerSheet || 500}/sheet)`, 65, currentY);
        doc.text(`Rs. ${albCost}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
        currentY += 20;
      }

      // Add-ons
      if (targetVersion.addOns && targetVersion.addOns.length > 0) {
        checkPageBreak(30);
        currentY += 5;
        doc.fillColor(COLOR_GOLD).fontSize(11).font('Montserrat').text('ADD-ONS & EXTRAS', 50, currentY);
        currentY += 18;
        targetVersion.addOns.forEach((a) => {
          checkPageBreak(18);
          doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text(`• ${a.name}`, 65, currentY);
          doc.text(`Rs. ${a.price || 0}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
          currentY += 18;
        });
        currentY += 8;
      }

      // Deliverables
      const deliverables = targetVersion.deliverables || [];
      if (deliverables.length > 0) {
        checkPageBreak(30 + deliverables.length * 16);
        currentY += 10;
        doc.fillColor(COLOR_GOLD).fontSize(12).font('TheSeasons').text('DELIVERABLES', 50, currentY);
        currentY += 18;
        deliverables.forEach((item) => {
          doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text(`• ${typeof item === 'string' ? item : item.name}`, 65, currentY);
          currentY += 16;
        });
      }

      // Complimentaries
      const complimentaries = targetVersion.complimentries || [];
      if (complimentaries.length > 0) {
        checkPageBreak(30 + complimentaries.length * 16);
        currentY += 10;
        doc.fillColor(COLOR_GOLD).fontSize(12).font('TheSeasons').text('COMPLIMENTARIES', 50, currentY);
        currentY += 18;
        complimentaries.forEach((item) => {
          doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text(`• ${typeof item === 'string' ? item : item.name}`, 65, currentY);
          currentY += 16;
        });
      }

      // Check if user didn't add Additional Album Sheets
      const hasEventAlbumSheets = Boolean(targetVersion.album?.enabled && Number(targetVersion.album?.sheets || 0) > 0);
      if (!hasEventAlbumSheets) {
        checkPageBreak(25);
        currentY += 8;
        doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat')
           .text('(* Note: If you want an album, it costs 500 rupees per each sheet.)', 50, currentY, { width: 495 });
        currentY += 16;
      }

      // Financials Divider & Totals
      checkPageBreak(120);
      currentY += 15;
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).lineWidth(0.5).stroke(COLOR_CHARCOAL);
      currentY += 15;

      const totalGross = Number(targetVersion.totalAmount || 0);
      const discountVal = Number(targetVersion.discount || 0);
      const finalNet = Math.max(0, totalGross - discountVal);
      const paidVal = Number(targetVersion.paidAmount !== undefined ? targetVersion.paidAmount : (event.paidAmount || 0));
      const pendingVal = Math.max(0, finalNet - paidVal);

      if (discountVal > 0) {
        doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text('Gross Total:', doc.page.width - 250, currentY);
        doc.text(`Rs. ${totalGross}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
        currentY += 18;

        doc.fillColor(COLOR_WHITE).fontSize(9).font('Montserrat').text(`Discount (${targetVersion.discountPercentage || 0}%):`, doc.page.width - 250, currentY);
        doc.text(`- Rs. ${discountVal}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
        currentY += 18;
      }

      doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text('Final Total:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${finalNet}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
      currentY += 20;

      doc.text('Paid Amount:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${paidVal}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });
      currentY += 20;

      doc.fillColor(COLOR_GOLD).fontSize(12).font('TheSeasons').text('Pending Amount:', doc.page.width - 250, currentY);
      doc.text(`Rs. ${pendingVal}`, doc.page.width - 150, currentY, { align: 'right', width: 100 });

      // --- PAGE 3: TERMS & APPROACH ---
      doc.addPage();
      doc.fillColor(COLOR_GOLD).fontSize(18).font('TheSeasons').text('Our Shooting Approach', 50, 60, { align: 'center', width: 495 });
      doc.moveDown(1);
      doc.fillColor(COLOR_GOLD).fontSize(10).font('Montserrat');
      
      const approachText = [
        "We follow a storytelling style approach that focuses on real emotions, natural moments and ritual depth.",
        "Our photography captures genuine expressions and family reactions with clean and timeless framing.",
        "Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.",
        "All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design."
      ];
      approachText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 5, paragraphGap: 10 });
      });

      doc.moveDown(1.5);
      doc.fillColor(COLOR_GOLD).fontSize(18).font('TheSeasons').text('Kindly Note', { align: 'center' });
      doc.moveDown(1);
      doc.fillColor(COLOR_GOLD).fontSize(10).font('Montserrat');

      const termsText = [
        "We truly look forward to being part of your special celebration.",
        "To ensure everything goes smoothly, we kindly request your support on the following:",
        "- For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.",
        "This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.",
        "Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.",
        "All data will be carefully transferred and handed over safely to you.",
        "- To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.",
        "- After the pre-wedding shoot, 20% of the remaining payment will be cleared.",
        "- Another 40% will be paid after the completion of all events.",
        "- The final 20% will be paid after album and video delivery.",
        "- Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.",
        "- For wedding and other events, accommodation arrangements will be taken care of by the client.",
        "Our goal is to deliver your memories with care, clarity and commitment.",
        "We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.",
        "With gratitude,"
      ];
      termsText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 3, paragraphGap: 5 });
      });

      doc.moveDown(0.5);
      const signatureY = Math.min(doc.y, 750);
      doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('Team', doc.page.width - 150, signatureY, { align: 'right', width: 100, lineBreak: false });
      doc.fontSize(22).font('TheSeasons').text('Astitva', doc.page.width - 150, signatureY + 14, { align: 'right', width: 100, lineBreak: false });

      // --- PAGE 4: BACK COVER ---
      doc.addPage();
      const p4CenterY = doc.page.height / 2;
      try {
        doc.image(logoPath, centerX - 120, p4CenterY - 140, { width: 240, height: 240 });
      } catch (err) {
        console.error('Error drawing back cover logo image:', err);
      }

      doc.fontSize(10).font('Montserrat').text('ANDHRA PRADESH', 100, p4CenterY + 130, { width: 180, align: 'center' });
      doc.text('TELANGANA', doc.page.width - 280, p4CenterY + 130, { width: 180, align: 'center' });

      doc.fillColor(COLOR_GOLD).fontSize(14).font('TheSeasons').text('Contact details', 50, p4CenterY + 175, { align: 'center', width: 495 })
         .moveDown(0.4)
         .fontSize(9)
         .font('Montserrat')
         .text('Phone : +919182028835', { align: 'center' })
         .text('Email: official@astitvacreations.com', { align: 'center' })
         .moveDown(0.8)
         .text('www.astitvacreations.com', { align: 'center' });

      doc.switchToPage(0);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Dynamically generates a premium single-page digital PDF payment receipt
 * @param {Object} payment - The PaymentInstallment subdocument
 * @param {Object} event - The parent Event document
 * @param {Object} studioInfo - Studio metadata from Settings
 * @returns {Promise<Buffer>} - Resolves to PDF Buffer
 */
export const generatePaymentReceiptPDF = (payment, event, studioInfo = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.registerFont('TheSeasons', fontSeasons);
      doc.registerFont('Montserrat', fontMontserrat);

      const COLOR_GOLD = '#B19247';
      const COLOR_BLACK = '#0B0B0B';
      const COLOR_CARD = '#121214';
      const COLOR_BORDER = '#262626';
      const COLOR_WHITE = '#FFFFFF';
      const COLOR_MUTED = '#9E9E9E';
      const COLOR_GREEN = '#22C55E';

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_BLACK);

      // Gold Outer Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(1)
         .stroke(COLOR_GOLD);

      // Inner Border
      doc.rect(23, 23, doc.page.width - 46, doc.page.height - 46)
         .lineWidth(0.5)
         .stroke(COLOR_BORDER);

      let currentY = 40;

      // --- 1. HEADER: Logo + Studio Details ---
      try {
        doc.image(logoPath, 45, currentY, { width: 55, height: 55 });
      } catch (e) {
        console.error('Receipt logo error:', e);
      }

      const studioName = studioInfo.studioName || 'ASTITVA CREATIONS';
      doc.fillColor(COLOR_GOLD).fontSize(18).font('TheSeasons').text(studioName, 115, currentY);
      doc.fillColor(COLOR_MUTED).fontSize(8.5).font('Montserrat')
         .text('Luxury Wedding & Event Cinematography', 115, currentY + 22)
         .text(`Phone: ${studioInfo.whatsappNumber || '+91 91820 28835'} • Email: ${studioInfo.contactEmail || 'official@astitvacreations.com'}`, 115, currentY + 34)
         .text('Andhra Pradesh & Telangana, India • www.astitvacreations.com', 115, currentY + 46);

      currentY += 70;

      // Divider
      doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).lineWidth(0.5).stroke(COLOR_GOLD);
      currentY += 15;

      // Title Banner
      doc.rect(40, currentY, doc.page.width - 80, 28).fill(COLOR_CARD);
      doc.fillColor(COLOR_GOLD).fontSize(13).font('TheSeasons').text('PAYMENT RECEIPT / VOUCHER', 40, currentY + 7, { align: 'center', width: doc.page.width - 80 });
      currentY += 38;

      // --- 2. METADATA CARDS: Left (Receipt & Staff) + Right (Mode, UPI & UTR) ---
      const cardWidth = (doc.page.width - 95) / 2;
      const cardHeight = 90;

      // Left Card: Receipt Info
      doc.rect(40, currentY, cardWidth, cardHeight).fill(COLOR_CARD);
      doc.rect(40, currentY, cardWidth, cardHeight).lineWidth(0.5).stroke(COLOR_BORDER);

      const formattedDate = payment.date 
        ? new Date(payment.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('RECEIPT NUMBER', 50, currentY + 10);
      doc.fillColor(COLOR_GOLD).fontSize(10).font('Montserrat').text(`#${payment.receiptNumber || 'N/A'}`, 50, currentY + 22);

      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('PAYMENT ID', 50, currentY + 38);
      doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(payment.paymentId || 'N/A', 50, currentY + 48);

      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('DATE & TIME', 50, currentY + 62);
      doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(formattedDate, 50, currentY + 72);

      // Right Card: Payment Channel & Bank Reference
      const rightCardX = 40 + cardWidth + 15;
      doc.rect(rightCardX, currentY, cardWidth, cardHeight).fill(COLOR_CARD);
      doc.rect(rightCardX, currentY, cardWidth, cardHeight).lineWidth(0.5).stroke(COLOR_BORDER);

      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('PAYMENT METHOD', rightCardX + 10, currentY + 10);
      doc.fillColor(COLOR_WHITE).fontSize(9.5).font('Montserrat').text(payment.paymentType || 'UPI', rightCardX + 10, currentY + 22);

      if (payment.paymentType === 'UPI') {
        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('DESTINATION STUDIO UPI', rightCardX + 10, currentY + 38);
        doc.fillColor(COLOR_GOLD).fontSize(8.5).font('Montserrat').text(payment.receiverUpiId || 'astitvacreations@okhdfcbank', rightCardX + 10, currentY + 48);

        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('BANK REFERENCE (UTR / TXN ID)', rightCardX + 10, currentY + 62);
        doc.fillColor(COLOR_GREEN).fontSize(8.5).font('Montserrat').text(payment.utrNumber || 'N/A', rightCardX + 10, currentY + 72);
      } else {
        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('TRANSACTION REFERENCE / UTR', rightCardX + 10, currentY + 38);
        doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(payment.utrNumber || 'N/A', rightCardX + 10, currentY + 48);

        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('VERIFIED & RECEIVED BY', rightCardX + 10, currentY + 62);
        doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(payment.receivedBy || 'Staff Member', rightCardX + 10, currentY + 72);
      }

      currentY += cardHeight + 15;

      // --- 3. CLIENT & EVENT DETAILS CARD ---
      const clientBoxHeight = 55;
      doc.rect(40, currentY, doc.page.width - 80, clientBoxHeight).fill(COLOR_CARD);
      doc.rect(40, currentY, doc.page.width - 80, clientBoxHeight).lineWidth(0.5).stroke(COLOR_BORDER);

      const col1X = 55;
      const col2X = 200;
      const col3X = 360;

      // Client Name
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('CLIENT NAME', col1X, currentY + 10);
      doc.fillColor(COLOR_WHITE).fontSize(10).font('Montserrat').text(event.customerName || 'Client', col1X, currentY + 24, { width: 130 });

      // Phone
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('PHONE NUMBER', col1X, currentY + 38);
      doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(event.phone || 'N/A', col1X, currentY + 46);

      // Event Name
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('EVENT / OCCASION', col2X, currentY + 10);
      doc.fillColor(COLOR_GOLD).fontSize(10).font('TheSeasons').text(event.eventName || 'Event Celebration', col2X, currentY + 24, { width: 140 });

      // Shoot Date
      const shootDateStr = event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN') : 'TBD';
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('SHOOT DATE', col2X, currentY + 38);
      doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(shootDateStr, col2X, currentY + 46);

      // Receiver Officer
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('AUTHORIZED COLLECTOR', col3X, currentY + 10);
      doc.fillColor(COLOR_WHITE).fontSize(9.5).font('Montserrat').text(payment.receivedBy || 'Studio Team', col3X, currentY + 24);

      // Destination Label
      if (payment.receiverAccountLabel) {
        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('ACCOUNT LABEL', col3X, currentY + 38);
        doc.fillColor(COLOR_WHITE).fontSize(8).font('Montserrat').text(payment.receiverAccountLabel, col3X, currentY + 46);
      }

      currentY += clientBoxHeight + 20;

      // --- 4. FINANCIAL LEDGER STATEMENT ---
      doc.fillColor(COLOR_GOLD).fontSize(11).font('TheSeasons').text('ACCOUNT BALANCE STATEMENT', 40, currentY);
      currentY += 16;

      const grossTotal = Number(event.totalAmount || event.finalTotal || 0);
      const discount = Number(event.discount || event.discountAmount || 0);
      const netPayable = event.netPayable !== undefined ? event.netPayable : Math.max(0, grossTotal - discount);
      const totalPaid = Number(event.paidAmount || 0);
      const pendingAmount = event.pendingAmount !== undefined ? event.pendingAmount : Math.max(0, netPayable - totalPaid);

      // Financial Rows Container
      const finBoxY = currentY;
      const finBoxHeight = 150;
      doc.rect(40, finBoxY, doc.page.width - 80, finBoxHeight).fill(COLOR_CARD);
      doc.rect(40, finBoxY, doc.page.width - 80, finBoxHeight).lineWidth(0.5).stroke(COLOR_BORDER);

      const renderFinancialRow = (y, label, val, isHighlighted = false, color = COLOR_WHITE) => {
        doc.fillColor(COLOR_MUTED).fontSize(9).font('Montserrat').text(label, 60, y);
        doc.fillColor(color).fontSize(isHighlighted ? 12 : 10).font('Montserrat')
           .text(val, doc.page.width - 200, y, { align: 'right', width: 140 });
        doc.moveTo(55, y + 18).lineTo(doc.page.width - 55, y + 18).lineWidth(0.3).stroke(COLOR_BORDER);
      };

      let rowY = finBoxY + 10;
      renderFinancialRow(rowY, 'Gross Event / Package Value', `Rs. ${grossTotal.toLocaleString('en-IN')}`);
      rowY += 23;

      if (discount > 0) {
        renderFinancialRow(rowY, 'Special Discount / Waiver Applied', `- Rs. ${discount.toLocaleString('en-IN')}`, false, COLOR_GOLD);
        rowY += 23;
      }

      renderFinancialRow(rowY, 'Net Total Payable Fee', `Rs. ${netPayable.toLocaleString('en-IN')}`, true, COLOR_GOLD);
      rowY += 26;

      // Highlighted Amount Paid in this installment
      doc.rect(50, rowY - 4, doc.page.width - 100, 24).fill('#064e3b');
      doc.fillColor('#a7f3d0').fontSize(10).font('Montserrat').text('AMOUNT RECEIVED IN THIS INSTALLMENT', 60, rowY + 2);
      doc.fillColor('#34d399').fontSize(12).font('Montserrat').text(`+ Rs. ${Number(payment.amount || 0).toLocaleString('en-IN')}`, doc.page.width - 200, rowY + 2, { align: 'right', width: 140 });
      rowY += 28;

      renderFinancialRow(rowY, 'Total Amount Paid To Date', `Rs. ${totalPaid.toLocaleString('en-IN')}`, false, COLOR_GREEN);
      rowY += 23;

      renderFinancialRow(rowY, 'Remaining Balance Outstanding', `Rs. ${pendingAmount.toLocaleString('en-IN')}`, true, pendingAmount === 0 ? COLOR_GREEN : COLOR_GOLD);

      currentY = finBoxY + finBoxHeight + 15;

      // Note if present
      if (payment.note) {
        doc.rect(40, currentY, doc.page.width - 80, 28).fill(COLOR_CARD);
        doc.rect(40, currentY, doc.page.width - 80, 28).lineWidth(0.5).stroke(COLOR_BORDER);
        doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat').text('INSTALLMENT REMARKS / NOTES:', 50, currentY + 5);
        doc.fillColor(COLOR_WHITE).fontSize(8.5).font('Montserrat').text(payment.note, 50, currentY + 15, { width: doc.page.width - 100 });
        currentY += 36;
      }

      // --- 5. FOOTER & AUTHORIZED SIGNATURE ---
      const footerY = doc.page.height - 110;
      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).lineWidth(0.5).stroke(COLOR_BORDER);

      // Statement
      doc.fillColor(COLOR_MUTED).fontSize(7.5).font('Montserrat')
         .text('• This document is an official electronic payment receipt issued by Astitva Creations.', 45, footerY + 12)
         .text('• All payments are reconciled against studio destination accounts and banking UTR records.', 45, footerY + 22)
         .text('• Thank you for trusting Astitva Creations with your memorable celebration.', 45, footerY + 32);

      // Signature Placeholder
      const sigX = doc.page.width - 180;
      doc.fillColor(COLOR_GOLD).fontSize(9).font('TheSeasons').text('For ASTITVA CREATIONS', sigX, footerY + 12, { align: 'right', width: 135 });
      doc.fillColor(COLOR_WHITE).fontSize(13).font('TheSeasons').text('Team Astitva', sigX, footerY + 30, { align: 'right', width: 135 });
      doc.fillColor(COLOR_MUTED).fontSize(7).font('Montserrat').text('Authorized Accounts Seal', sigX, footerY + 46, { align: 'right', width: 135 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

