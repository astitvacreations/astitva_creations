import { Lead } from '../models/Lead.js';
import { sendLeadEmails } from '../utils/mailer.js';

// @desc    Create new lead request & trigger emails
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  try {
    const { 
      customerName, 
      email, 
      phone, 
      eventDate, 
      location, 
      notes,
      source
    } = req.body;

    if (!customerName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email and phone number are required.' });
    }

    const lead = await Lead.create({
      customerName,
      email,
      phone,
      eventDate,
      location,
      notes,
      source: source || 'general',
      status: 'PENDING'
    });

    // Trigger notification email in background, await for serverless environments
    try {
      await sendLeadEmails(lead);
    } catch (mailError) {
      console.error('Mail notification error:', mailError);
    }

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Create Lead Controller Error:', error);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

// @desc    Get all leads
// @route   GET /api/leads
// @access  Admin
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lead status
// @route   PATCH /api/leads/:id
// @access  Admin
export const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['PENDING', 'CONTACTED', 'CONVERTED', 'LOST'].includes(status)) {
      return res.status(400).json({ message: 'Invalid lead status' });
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Admin
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
