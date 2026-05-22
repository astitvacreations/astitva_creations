import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/logo.png');

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
         .font('Times-Roman')
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
           
        // Top Right: Premium WEDDING Photography & Cinematic Films Quotation
        const mainEventName = (quote.selectedEvents && quote.selectedEvents[0] || 'wedding').toUpperCase();
        
        doc.fillColor(COLOR_GOLD)
           .fontSize(12)
           .font('Times-Italic')
           .text('Premium', doc.page.width - 300, headerY, { align: 'right', width: 250 });
           
        doc.fontSize(28)
           .font('Times-Bold')
           .text(mainEventName, doc.page.width - 300, headerY + 14, { align: 'right', width: 250 });
           
        doc.fontSize(10)
           .font('Helvetica')
           .text('Photography & Cinematic Films Quotation', doc.page.width - 300, headerY + 44, { align: 'right', width: 250 });

        const formattedDate = new Date(quote.createdAt || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '-');
        doc.fontSize(9)
           .text(`Date : ${formattedDate}`, doc.page.width - 300, headerY + 58, { align: 'right', width: 250 });

        doc.moveTo(50, headerY + 75).lineTo(doc.page.width - 50, headerY + 75).lineWidth(0.5).stroke(COLOR_GOLD);
      };

      // --- PAGE 2: ESTIMATION SUMMARY ---
      doc.addPage();
      drawInnerHeader(2);

      // Proposal Subtitle Y
      doc.y = 135;

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('CUSTOM QUOTATION PROPOSAL', 50, doc.y, { characterSpacing: 0.5 });

      const dateStr = new Date(quote.createdAt || Date.now()).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      doc.fillColor(COLOR_GOLD)
         .fontSize(8)
         .font('Helvetica')
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
         .font('Helvetica-Bold')
         .text('CLIENT DETAILS', 60, coordsY + 10);

      doc.fillColor(COLOR_WHITE)
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text(quote.customerName, 60, coordsY + 28);
         
      doc.font('Helvetica')
         .fillColor(COLOR_GRAY)
         .text('Email: ', 60, coordsY + 45, { continued: true })
         .fillColor(COLOR_WHITE)
         .text(quote.email);
         
      doc.fillColor(COLOR_GRAY)
         .text('Phone: ', 60, coordsY + 60, { continued: true })
         .fillColor(COLOR_WHITE)
         .text(quote.phone);

      // Shoot Coordinates Card
      doc.rect(310, coordsY, 235, 95)
         .fill(COLOR_LIGHT_GRAY)
         .rect(310, coordsY, 235, 95)
         .lineWidth(0)
         .stroke(COLOR_LIGHT_GRAY);

      doc.fillColor(COLOR_GOLD)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('SHOOT LOGISTICS', 320, coordsY + 10);

      const eventDateStr = quote.eventDate ? new Date(quote.eventDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';
         
      doc.fillColor(COLOR_GRAY)
         .font('Helvetica')
         .text(`Date: `, 320, coordsY + 28, { continued: true })
         .font('Helvetica-Bold')
         .fillColor(COLOR_WHITE)
         .text(eventDateStr);
         
      doc.fillColor(COLOR_GRAY)
         .font('Helvetica')
         .text(`Location: `, 320, coordsY + 45, { continued: true })
         .font('Helvetica-Bold')
         .fillColor(COLOR_WHITE)
         .text(quote.location || 'N/A');

      doc.y = coordsY + 115;

      // --- ITEMISED SERVICES TABLE ---
      doc.fillColor(COLOR_GOLD)
         .fontSize(10)
         .font('Helvetica-Bold')
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
         .font('Helvetica-Bold')
         .text('EVENT / SERVICE DESCRIPTION', 60, tableStartY + 6)
         .text('TOTAL COST', 460, tableStartY + 6, { width: 75, align: 'right' });

      doc.y = tableStartY + 20;

      // A helper function to check if the next row will overflow the current page.
      // If it does, we draw borders for the current page table segment and start a new table page.
      const checkPageBreak = (neededHeight) => {
        if (doc.y + neededHeight > doc.page.height - 100) {
          // 1. Draw vertical borders for the current page table segment
          doc.moveTo(50, tableStartY).lineTo(50, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);
          doc.moveTo(545, tableStartY).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);
          // Draw bottom border for the current page table segment
          doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_GOLD);

          // 2. Add new page and draw header
          doc.addPage();
          drawInnerHeader(2);

          // 3. Reset table start y
          doc.y = 135;
          tableStartY = doc.y;

          // 4. Draw Table Header on the new page
          doc.rect(50, tableStartY, 495, 20)
             .fill(COLOR_LIGHT_GRAY)
             .rect(50, tableStartY, 495, 20)
             .lineWidth(0)
             .stroke(COLOR_LIGHT_GRAY);

          doc.fillColor(COLOR_GOLD)
             .fontSize(8)
             .font('Helvetica-Bold')
             .text('EVENT / SERVICE DESCRIPTION', 60, tableStartY + 6)
             .text('TOTAL COST', 460, tableStartY + 6, { width: 75, align: 'right' });

          doc.y = tableStartY + 20;
          tableStartY = doc.y;
        }
      };

      // Render coverages
      const events = quote.selectedEvents || [];
      const configs = quote.eventConfigs || {};

      events.forEach((evt) => {
        const config = configs[evt] || {};
        const duration = config.duration || 'Half Day';
        const subOption = config.option || config.haldiOption || config.godumraiOption || '';
        
        checkPageBreak(18);

        // Draw Event Row Header
        doc.rect(50, doc.y, 495, 18)
           .fill(COLOR_LIGHT_GRAY);

        doc.fillColor(COLOR_GOLD)
           .fontSize(8)
           .font('Helvetica-Bold')
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
               .font('Helvetica')
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
           .font('Helvetica-Bold')
           .text(`Pre-Wedding Shoot Style: ${quote.preWedding.style}`, 60, currentY + 5)
           .font('Helvetica')
           .text(`Rs. ${(quote.preWedding.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y += 16;
      }

      // Render post prod editing
      if (quote.postProduction && quote.postProduction.editing) {
        checkPageBreak(16);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
        
        const currentY = doc.y;
        doc.fillColor(COLOR_GOLD)
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text(`Film Post-Production Editing: ${quote.postProduction.editing}`, 60, currentY + 5)
           .font('Helvetica')
           .text(`Rs. ${(quote.postProduction.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y += 16;
      }

      // Render album
      if (quote.album && quote.album.albumType) {
        checkPageBreak(16);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
        
        const currentY = doc.y;
        doc.fillColor(COLOR_GOLD)
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text(`Luxury Print Album: ${quote.album.albumType} (${quote.album.sheets || 0} Sheets)`, 60, currentY + 5)
           .font('Helvetica')
           .text(`Rs. ${(quote.album.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
        doc.y += 16;
      }

      // Render Addons
      const addOns = quote.addOns || {};
      Object.keys(addOns).forEach((key) => {
        const addon = addOns[key];
        if (addon.selected) {
          checkPageBreak(16);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke(COLOR_CHARCOAL);
          
          const currentY = doc.y;
          doc.fillColor(COLOR_GOLD)
             .fontSize(8.5)
             .font('Helvetica')
             .text(`${addon.name}`, 60, currentY + 5)
             .text(`Rs. ${(addon.cost || 0).toLocaleString()}/-`, 460, currentY + 5, { width: 75, align: 'right' });
          doc.y += 16;
        }
      });

      // Bottom border of the table
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0).stroke(COLOR_LIGHT_GRAY);
      doc.y += 15;

      // Ensure we don't break page overflow when drawing totals (allow more space if discount is present)
      const hasDiscount = quote.discount && quote.discount > 0;
      const totalBoxHeight = hasDiscount ? 75 : 38;
      const neededTotalSpace = hasDiscount ? 150 : 120;
      
      if (doc.y > doc.page.height - neededTotalSpace) {
        doc.addPage();
        drawInnerHeader(2);
        doc.y = 130;
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
           .font('Helvetica-Bold')
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
           .font('Helvetica-Bold')
           .text('ESTIMATED TOTAL PROPOSAL COST:', 70, totalBoxY + 15, { characterSpacing: 0.5 });

        doc.fillColor(COLOR_GOLD)
           .fontSize(16)
           .font('Helvetica-Bold')
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
           .font('Helvetica-Bold')
           .text('SPECIAL CLIENT REQUESTS / NOTES:', 50, doc.y);
        
        doc.fillColor(COLOR_GOLD)
           .fontSize(8)
           .font('Helvetica-Oblique')
           .text(quote.notes, 50, doc.y + 12, { width: 495, lineGap: 2 });
      }

      // --- PAGE 3: SHOOTING APPROACH & TERMS & CONDITIONS ---
      doc.addPage();
      
      // Center-aligned title & paragraphs
      doc.y = 55;

      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('Times-Bold')
         .text('Our Shooting Approach', { align: 'center', paragraphGap: 12 });

      const approachParagraphs = [
        "We follow a storytellingstyleapproach thatfocusesonrealemotions, natural moments and ritual depth.",
        "Our photography captures genuine expressions and family reactions with clean and timeless framing.",
        "Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.",
        "All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design."
      ];

      doc.fontSize(11)
         .font('Times-Roman');

      approachParagraphs.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 4, paragraphGap: 8 });
      });

      doc.moveDown(0.8);

      doc.fillColor(COLOR_GOLD)
         .fontSize(18)
         .font('Times-Bold')
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
         .font('Times-Roman');

      termsText.forEach((p) => {
        doc.text(p, { align: 'center', lineGap: 4, paragraphGap: 8 });
      });

      doc.moveDown(1.2);
      const signatureY = doc.y;
      doc.fillColor(COLOR_GOLD)
         .fontSize(11)
         .font('Times-Italic')
         .text('Team', doc.page.width - 150, signatureY, { align: 'right', width: 100 });
      doc.fontSize(22)
         .font('Times-Bold')
         .text('Astitva', doc.page.width - 150, signatureY + 12, { align: 'right', width: 100 });


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
         .font('Times-Bold')
         .text('ANDHRA PRADESH', 100, p4CenterY + 130, { width: 180, align: 'center' });
      doc.text('TELANGANA', doc.page.width - 280, p4CenterY + 130, { width: 180, align: 'center' });

      // Contact info at bottom center
      doc.fillColor(COLOR_GOLD)
         .fontSize(12)
         .font('Times-Italic')
         .text('Contact details', 50, p4CenterY + 175, { align: 'center', width: 495 })
         .moveDown(0.4)
         .fontSize(9)
         .font('Times-Roman')
         .text('Phone : +919182028835', { align: 'center' })
         .text('Email: official@astitvacreations.com', { align: 'center' })
         .moveDown(0.8)
         .text('www.astitvacreations.com', { align: 'center' });


      // --- DRAW ESTIMATION PAGE DECORATIVE BOTTOM LINES ---
      // Clean modern brand styling requires no page-edge borders or page number footers.
      const pages = doc.bufferedPageRange();
      const termsPageIndex = pages.count - 2;

      for (let i = 1; i < termsPageIndex; i++) {
        doc.switchToPage(i);
        doc.moveTo(50, doc.page.height - 45)
           .lineTo(doc.page.width - 50, doc.page.height - 45)
           .lineWidth(0.5)
           .stroke(COLOR_GOLD);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
