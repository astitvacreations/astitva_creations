import { Event } from '../models/Event.js';
import { PredefinedService } from '../models/PredefinedService.js';
import { Expense } from '../models/Expense.js';
import { generateEventInvoicePDF } from '../utils/pdfGenerator.js';
import { sendEventInvoiceEmail } from '../utils/mailer.js';

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

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: -1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
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
