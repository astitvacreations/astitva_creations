import { QuoteRequest } from '../models/QuoteRequest.js';
import { sendQuotationEmails } from '../utils/mailer.js';
import { generateQuotationPDF } from '../utils/pdfGenerator.js';

// @desc    Create new quote request & trigger emails
// @route   POST /api/bookings/quote
// @access  Public
export const createQuoteRequest = async (req, res) => {
  try {
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
      estimatedPrice,
      deliveryTimeline,
      terms
    } = req.body;

    // Create the quote request document
    const quote = await QuoteRequest.create({
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
      estimatedPrice,
      deliveryTimeline,
      terms: terms || [
        "We truly look forward to being part of your special celebration.",
        "To ensure everything goes smoothly, we kindly request your support on the following:",
        "For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.",
        "This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.",
        "Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.",
        "All data will be carefully transferred and handed over safely to you.",
        "To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.",
        "After the pre-wedding shoot, 20% of the remaining payment will be cleared.",
        "Another 40% will be paid after the completion of all events.",
        "The final 20% will be paid after album and video delivery.",
        "Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.",
        "For wedding and other events, accommodation arrangements will be taken care of by the client.",
        "Our goal is to deliver your memories with care, clarity and commitment.",
        "We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.",
        "With gratitude,\nTeam Astitva creations"
      ],
      status: 'PENDING'
    });

    // Await email sending so serverless function doesn't terminate early
    await sendQuotationEmails(quote);

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    console.error('Create Quote Controller Error:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

// @desc    Get all quote requests
// @route   GET /api/bookings
// @access  Admin
export const getBookings = async (req, res) => {
  try {
    const bookings = await QuoteRequest.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quote request status
// @route   PATCH /api/bookings/:id
// @access  Admin
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await QuoteRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Quote request not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete quote request
// @route   DELETE /api/bookings/:id
// @access  Admin
export const deleteBooking = async (req, res) => {
  try {
    const booking = await QuoteRequest.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Quote request not found' });
    res.status(200).json({ message: 'Quote request deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate and download Quote PDF
// @route   GET /api/bookings/:id/pdf
// @access  Public (so users can download it via link, and admin from portal)
export const getBookingPDF = async (req, res) => {
  try {
    const booking = await QuoteRequest.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Quote request not found' });
    }

    const pdfBuffer = await generateQuotationPDF(booking);
    
    const safeName = booking.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Astitva_Creations_Proposal_${safeName}.pdf`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF download:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

// @desc    Apply administrative discount & trigger revised emails
// @route   PATCH /api/bookings/:id/discount
// @access  Admin
export const applyDiscount = async (req, res) => {
  try {
    const { discountType, discountValue } = req.body;

    if (!['amount', 'percentage'].includes(discountType)) {
      return res.status(400).json({ success: false, message: 'Invalid discount type' });
    }

    if (typeof discountValue !== 'number' || discountValue < 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be a non-negative number' });
    }

    const booking = await QuoteRequest.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Quote request not found' });
    }

    let calculatedDiscount = 0;
    if (discountType === 'percentage') {
      calculatedDiscount = Math.round((booking.estimatedPrice * discountValue) / 100);
    } else {
      calculatedDiscount = discountValue;
    }

    if (calculatedDiscount > booking.estimatedPrice) {
      return res.status(400).json({ success: false, message: 'Discount cannot exceed the estimated total' });
    }

    booking.discountType = discountType;
    booking.discountValue = discountValue;
    booking.discount = calculatedDiscount;
    await booking.save();

    // Trigger revised confirmation & notification emails
    sendQuotationEmails(booking);

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Apply Discount Controller Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to apply discount' });
  }
};

// @desc    Update quote request entirely & trigger revised emails
// @route   PUT /api/bookings/:id
// @access  Admin
export const updateQuoteRequest = async (req, res) => {
  try {
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
      estimatedPrice,
      deliveryTimeline,
      terms,
      status,
      discountType,
      discountValue
    } = req.body;

    const booking = await QuoteRequest.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Quote request not found' });
    }

    // Update fields
    if (customerName !== undefined) booking.customerName = customerName;
    if (email !== undefined) booking.email = email;
    if (phone !== undefined) booking.phone = phone;
    if (eventDate !== undefined) booking.eventDate = eventDate;
    if (location !== undefined) booking.location = location;
    if (notes !== undefined) booking.notes = notes;
    if (selectedEvents !== undefined) booking.selectedEvents = selectedEvents;
    if (eventConfigs !== undefined) booking.eventConfigs = eventConfigs;
    if (preWedding !== undefined) booking.preWedding = preWedding;
    if (postProduction !== undefined) booking.postProduction = postProduction;
    if (album !== undefined) booking.album = album;
    if (addOns !== undefined) booking.addOns = addOns;
    if (estimatedPrice !== undefined) booking.estimatedPrice = estimatedPrice;
    if (deliveryTimeline !== undefined) booking.deliveryTimeline = deliveryTimeline;
    if (terms !== undefined) booking.terms = terms;
    if (status !== undefined) booking.status = status;

    // Recalculate discount if provided or if estimatedPrice changed
    const finalDiscountType = discountType !== undefined ? discountType : booking.discountType;
    const finalDiscountValue = discountValue !== undefined ? discountValue : booking.discountValue;

    if (finalDiscountType && finalDiscountValue !== undefined) {
      let calculatedDiscount = 0;
      if (finalDiscountType === 'percentage') {
        calculatedDiscount = Math.round((booking.estimatedPrice * finalDiscountValue) / 100);
      } else {
        calculatedDiscount = finalDiscountValue;
      }
      booking.discountType = finalDiscountType;
      booking.discountValue = finalDiscountValue;
      booking.discount = Math.min(calculatedDiscount, booking.estimatedPrice);
    }

    // Mark Mixed types as modified
    booking.markModified('eventConfigs');
    booking.markModified('addOns');

    await booking.save();

    // Trigger revised confirmation & notification emails with the new PDF attached
    sendQuotationEmails(booking);

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Update Quote Request Controller Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update quote request' });
  }
};

// @desc    Generate and download Quote PDF Preview (without saving to database)
// @route   POST /api/bookings/pdf-preview
// @access  Public
export const getBookingPDFPreview = async (req, res) => {
  try {
    const quoteData = req.body;
    
    // Default terms and conditions if not provided
    if (!quoteData.terms) {
      quoteData.terms = [
        "We truly look forward to being part of your special celebration.",
        "To ensure everything goes smoothly, we kindly request your support on the following:",
        "For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.",
        "This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.",
        "Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.",
        "All data will be carefully transferred and handed over safely to you.",
        "To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.",
        "After the pre-wedding shoot, 20% of the remaining payment will be cleared.",
        "Another 40% will be paid after the completion of all events.",
        "The final 20% will be paid after album and video delivery.",
        "Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.",
        "For wedding and other events, accommodation arrangements will be taken care of by the client.",
        "Our goal is to deliver your memories with care, clarity and commitment.",
        "We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.",
        "With gratitude,\nTeam Astitva creations"
      ];
    }

    const pdfBuffer = await generateQuotationPDF(quoteData);
    
    const safeName = (quoteData.customerName || 'Proposal').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Astitva_Creations_Proposal_${safeName}.pdf`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF preview' });
  }
};


