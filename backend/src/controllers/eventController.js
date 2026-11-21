import { Event } from '../models/Event.js';
import { PredefinedService } from '../models/PredefinedService.js';
import { Expense } from '../models/Expense.js';
import { generateEventInvoicePDF, generateEventQuotationPDF } from '../utils/pdfGenerator.js';
import { sendEventInvoiceEmail } from '../utils/mailer.js';
import { notifyEventQuotationPDF } from '../services/whatsappService.js';
import {
  ensureEventVersions,
  createNewVersion,
  restoreVersion,
  setAgreement
} from '../utils/quotationVersioning.js';

// =========================================================================
// PREDEFINED SERVICES (ADMIN)
// =========================================================================

export const getPredefinedServices = async (req, res) => {
  try {
    const services = await PredefinedService.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPredefinedService = async (req, res) => {
  try {
    const service = await PredefinedService.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePredefinedService = async (req, res) => {
  try {
    const service = await PredefinedService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePredefinedService = async (req, res) => {
  try {
    const service = await PredefinedService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// EVENT CRUD & SELF-HEALING HOOKS
// =========================================================================

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: -1 });
    // Self-healing: auto-seed Quotation 1 on any legacy unversioned events
    for (const evt of events) {
      if (!evt.versions || evt.versions.length === 0) {
        await ensureEventVersions(evt);
      }
    }
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await ensureEventVersions(event);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    await ensureEventVersions(event);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    await ensureEventVersions(event);

    // If subEvents or additional requirements are being modified, create a new progressive snapshot!
    const isUpdatingRequirements = Boolean(
      req.body.createRevision || 
      (req.body.subEvents && Array.isArray(req.body.subEvents) && req.body.subEvents.length > 0) ||
      req.body.deliverables || 
      req.body.complimentaries
    );

    if (isUpdatingRequirements && !req.body.skipVersionCreation) {
      const hadAgreement = Boolean(event.agreementVersionNumber);
      const isAgreementRequested = req.body.isAgreement !== undefined 
        ? Boolean(req.body.isAgreement) 
        : hadAgreement;

      const snapshot = await createNewVersion(event, {
        subEventList: req.body.subEvents || event.subEvents,
        deliverables: req.body.deliverables || event.deliverables,
        complimentries: req.body.complimentaries || event.complimentaries,
        addOns: req.body.addOns || [],
        album: req.body.album || { enabled: false },
        discount: req.body.discountAmount !== undefined ? req.body.discountAmount : event.discountAmount,
        discountPercentage: req.body.discountPercentage !== undefined ? req.body.discountPercentage : event.discountPercentage,
        totalAmount: req.body.finalTotal !== undefined ? req.body.finalTotal : event.finalTotal,
        note: req.body.revisionNote || req.body.note || (isAgreementRequested ? 'Updated final agreement with additional requirements' : 'Updated event requirements'),
        isAgreement: isAgreementRequested
      });

      // Update remaining event metadata (customer name, date, phone, email, notes, shootStatus, status, etc.)
      const allowedTopLevel = ['customerName', 'eventName', 'phone', 'email', 'eventDate', 'location', 'shootStatus', 'notes', 'status', 'slot', 'paidAmount'];
      allowedTopLevel.forEach(key => {
        if (req.body[key] !== undefined) event[key] = req.body[key];
      });

      await event.save();
      return res.status(200).json({ success: true, data: event, snapshot });
    }

    Object.assign(event, req.body);
    await event.save();

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    // Also delete associated expenses
    await Expense.deleteMany({ referenceId: event._id, onModel: 'Event' });

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// PROGRESSIVE QUOTATION VERSIONS WORKFLOW
// =========================================================================

/**
 * @desc    Create a new sequential quotation version snapshot (Quotation 2, 3...)
 * @route   POST /api/events/:id/versions
 * @access  Admin (Protected)
 */
export const createEventVersion = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const newSnapshot = await createNewVersion(event, req.body);
    res.status(201).json({
      success: true,
      message: `${newSnapshot.versionName} created successfully`,
      data: event,
      version: newSnapshot
    });
  } catch (error) {
    console.error('Create Event Version Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Restore any previous quotation version as the active quotation
 * @route   PUT /api/events/:id/versions/:vNum/restore
 * @access  Admin (Protected)
 */
export const restoreEventVersion = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const restoredVer = await restoreVersion(event, req.params.vNum);
    res.status(200).json({
      success: true,
      message: `${restoredVer.versionName || 'Quotation ' + restoredVer.quotationNumber} restored as active quotation`,
      data: event,
      version: restoredVer
    });
  } catch (error) {
    console.error('Restore Event Version Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Promote or unset a specific quotation version as the single active Agreement
 * @route   PUT /api/events/:id/versions/:vNum/set-agreement
 * @access  Admin (Protected)
 */
export const setAgreementVersion = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const unset = Boolean(req.body?.unset);
    await setAgreement(event, req.params.vNum, unset);

    const isNowAgreement = event.agreementVersionNumber === Number(req.params.vNum);
    res.status(200).json({
      success: true,
      message: isNowAgreement
        ? `Quotation ${req.params.vNum} finalized and selected as the Agreement.`
        : `Removed Agreement status from Quotation ${req.params.vNum}.`,
      data: event
    });
  } catch (error) {
    console.error('Set Agreement Version Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// =========================================================================
// DYNAMIC PDF GENERATION PIPELINE
// =========================================================================

/**
 * @desc    Download PDF for active Quotation or finalized Agreement
 * @route   GET /api/events/:id/download-pdf
 * @access  Public / Client / Admin
 */
export const downloadEventPDF = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await ensureEventVersions(event);
    const targetVersionParam = req.query.version || null;
    const { pdfBuffer, filename } = await generateEventQuotationPDF(event, targetVersionParam);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Event PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

/**
 * @desc    Download the finalized Agreement PDF directly
 * @route   GET /api/events/:id/agreement.pdf
 * @access  Public / Client / Admin
 */
export const getAgreementPDF = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await ensureEventVersions(event);

    const agreementVer = event.versions?.find(v => v.isAgreement || v.versionNumber === event.agreementVersionNumber);
    if (!agreementVer && !event.agreementVersionNumber) {
      return res.status(404).json({
        success: false,
        message: 'No finalized agreement found for this event. Please select a quotation version as agreement first.'
      });
    }

    const { pdfBuffer, filename } = await generateEventQuotationPDF(
      event,
      agreementVer?.versionNumber || event.agreementVersionNumber
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Get Agreement PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Agreement PDF' });
  }
};

/**
 * @desc    Download a specific quotation version PDF (e.g. quotation-1.pdf, quotation-2.pdf)
 * @route   GET /api/events/:id/quotation-:versionParam.pdf OR GET /api/events/:id/versions/:vNum/pdf
 * @access  Public / Client / Admin
 */
export const getQuotationVersionPDF = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await ensureEventVersions(event);
    const versionParam = req.params.versionParam || req.params.vNum;

    const { pdfBuffer, filename } = await generateEventQuotationPDF(event, versionParam);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Get Quotation Version PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Quotation PDF' });
  }
};

// =========================================================================
// WHATSAPP SHARING
// =========================================================================

/**
 * @desc    Send quotation or agreement PDF link via WhatsApp
 * @route   POST /api/events/:id/send-whatsapp-pdf
 * @access  Admin (Protected)
 */
export const sendEventWhatsAppPDF = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await ensureEventVersions(event);

    const { versionNumber, recipientPhone } = req.body || {};

    let targetVersion = null;
    if (versionNumber) {
      targetVersion = event.versions?.find(v => v.versionNumber === Number(versionNumber) || v.quotationNumber === String(versionNumber));
    }
    if (!targetVersion && event.agreementVersionNumber) {
      targetVersion = event.versions?.find(v => v.versionNumber === event.agreementVersionNumber);
    }
    if (!targetVersion && event.activeVersionNumber) {
      targetVersion = event.versions?.find(v => v.versionNumber === event.activeVersionNumber);
    }
    if (!targetVersion && event.versions?.length > 0) {
      targetVersion = event.versions[event.versions.length - 1];
    }

    const phone = recipientPhone || event.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Event does not have a client phone number.' });
    }

    const result = await notifyEventQuotationPDF(event, targetVersion, phone);

    // Audit log entry
    if (!Array.isArray(event.followUps)) event.followUps = [];
    const isAgreement = Boolean(targetVersion?.isAgreement);
    const versionLabel = targetVersion?.quotationNumber || String(targetVersion?.versionNumber || '1');
    event.followUps.push({
      note: `Sent WhatsApp ${isAgreement ? 'Agreement' : 'Quotation ' + versionLabel} to ${phone}`,
      date: new Date()
    });
    await event.save();

    return res.status(200).json({
      success: true,
      message: `WhatsApp ${isAgreement ? 'Agreement' : 'Quotation ' + versionLabel} notification dispatched successfully`,
      data: result
    });
  } catch (error) {
    console.error('Send Event WhatsApp PDF Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to dispatch WhatsApp message' });
  }
};

// =========================================================================
// LEGACY BACKWARD COMPATIBLE HANDLERS
// =========================================================================

export const getEventPDF = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const pdfBuffer = await generateEventInvoicePDF(event);
    
    const safeName = (event.customerName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Astitva_Creations_Invoice_${safeName}.pdf`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Event PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

export const sendEventPDFEmail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (!event.email) {
      return res.status(400).json({ success: false, message: 'Event does not have an email address.' });
    }

    await sendEventInvoiceEmail(event);
    
    return res.status(200).json({ success: true, message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Send Event PDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send PDF email' });
  }
};
