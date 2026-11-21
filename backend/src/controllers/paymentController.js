import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Setting } from '../models/Setting.js';
import { getNextReceiptNumber } from '../models/ReceiptCounter.js';
import { generatePaymentReceiptPDF } from '../utils/pdfGenerator.js';
import { notifyPaymentReceived } from '../services/whatsappService.js';
import { sendPaymentReceiptEmail } from '../utils/mailer.js';

/**
 * 1. Record a new payment installment for an Event
 * @route POST /api/events/:id/payments
 */
export const addEventPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      paymentType, 
      receiverUpiId, 
      receiverAccountLabel, 
      utrNumber, 
      senderUpiId, 
      receivedBy, 
      note, 
      date 
    } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // 1. Amount Validation
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    // 2. Payment Type Validation
    const validPaymentTypes = ['UPI', 'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque'];
    if (!paymentType || !validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid payment type. Allowed modes: ${validPaymentTypes.join(', ')}` 
      });
    }

    // 3. Multi-UPI Destination & UTR Validation
    const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
    let finalReceiverUpi = receiverUpiId ? String(receiverUpiId).trim() : '';
    let finalAccountLabel = receiverAccountLabel ? String(receiverAccountLabel).trim() : '';

    if (paymentType === 'UPI') {
      if (!finalReceiverUpi) {
        return res.status(400).json({ 
          success: false, 
          message: 'Receiver UPI ID is strictly required for all UPI transactions.' 
        });
      }

      // Validate UTR format: exactly 12 alphanumeric characters
      if (!/^[a-zA-Z0-9]{12}$/.test(cleanUtr)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Standard UPI UTR number must be exactly 12 alphanumeric characters.' 
        });
      }

      // Check against authorized studio UPI accounts
      const settings = await Setting.findOne();
      if (settings?.authorizedUpiAccounts && settings.authorizedUpiAccounts.length > 0) {
        const matched = settings.authorizedUpiAccounts.find(
          a => a.isActive && a.upiId.toLowerCase() === finalReceiverUpi.toLowerCase()
        );
        if (matched) {
          finalAccountLabel = finalAccountLabel || matched.label;
        }
      }

      // Duplicate UTR check across all transactions
      const duplicateUtrInEvents = await Event.findOne({
        'payments.utrNumber': cleanUtr,
        'payments.status': { $ne: 'Voided' }
      });
      const duplicateUtrInBookings = await Booking.findOne({
        'payments.utrNumber': cleanUtr,
        'payments.status': { $ne: 'Voided' }
      });

      if (duplicateUtrInEvents || duplicateUtrInBookings) {
        return res.status(400).json({ 
          success: false, 
          message: `Duplicate UTR reference: ${cleanUtr} has already been registered on another payment.` 
        });
      }
    } else if (paymentType === 'Bank Transfer') {
      if (!cleanUtr) {
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction reference or UTR number is required for Bank Transfers.' 
        });
      }
    }

    // 4. Verification Officer
    const authorizedCollector = receivedBy || req.admin?.name || req.admin?.email || 'Authorized Staff';

    // 5. Sequential Receipt Number Generation
    const receiptNumber = await getNextReceiptNumber();

    // 6. Payment Installment Object
    const paymentInstallment = {
      paymentId: 'PAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      receiptNumber,
      amount: numericAmount,
      paymentType,
      receiverUpiId: finalReceiverUpi,
      receiverAccountLabel: finalAccountLabel,
      utrNumber: cleanUtr,
      senderUpiId: senderUpiId ? String(senderUpiId).trim() : '',
      receivedBy: authorizedCollector,
      date: date ? new Date(date) : new Date(),
      note: note ? String(note).trim() : '',
      status: 'Completed'
    };

    if (!Array.isArray(event.payments)) {
      event.payments = [];
    }
    event.payments.push(paymentInstallment);

    // 7. Atomic Recalculation Engine
    const completedPayments = event.payments.filter(p => p.status === 'Completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const grossTotal = Number(event.totalAmount || event.finalTotal || 0);
    const discount = Number(event.discount || event.discountAmount || 0);
    const netPayable = Math.max(0, grossTotal - discount);
    const pendingAmount = Math.max(0, netPayable - totalPaid);

    let paymentStatus = 'Unpaid';
    if (totalPaid >= netPayable && netPayable > 0) {
      paymentStatus = 'Fully Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    // Synchronize parent fields
    event.totalAmount = grossTotal;
    event.finalTotal = grossTotal;
    event.discount = discount;
    event.discountAmount = discount;
    event.netPayable = netPayable;
    event.paidAmount = totalPaid;
    event.pendingAmount = pendingAmount;
    event.paymentStatus = paymentStatus;

    // 8. Audit Trail Follow-up Entry
    const upiDetails = paymentType === 'UPI'
      ? ` (Sent to: ${finalReceiverUpi} • UTR: ${cleanUtr})`
      : (paymentType === 'Bank Transfer' ? ` (Bank Transfer • UTR: ${cleanUtr})` : ` (Method: ${paymentType})`);

    if (!Array.isArray(event.followUps)) {
      event.followUps = [];
    }
    event.followUps.push({
      note: `Payment Received: ₹${numericAmount.toLocaleString('en-IN')}${upiDetails} by ${authorizedCollector}. Remaining Pending: ₹${pendingAmount.toLocaleString('en-IN')}`,
      date: new Date()
    });

    await event.save();

    // 9. Automated WhatsApp Notifications (Fire & Record)
    let whatsAppResult = null;
    try {
      whatsAppResult = await notifyPaymentReceived(paymentInstallment, event);
    } catch (waErr) {
      console.error('[WhatsApp Payment Notification Error]:', waErr.message);
    }

    // 10. Automated Email Receipt Dispatch (Fire & Record)
    let emailResult = null;
    if (event.email) {
      try {
        const settings = await Setting.findOne();
        emailResult = await sendPaymentReceiptEmail(event, paymentInstallment, settings || {});
      } catch (mailErr) {
        console.error('[Email Payment Receipt Error]:', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded and ledger updated successfully.',
      data: {
        payment: paymentInstallment,
        event: {
          _id: event._id,
          customerName: event.customerName,
          eventName: event.eventName,
          totalAmount: event.totalAmount,
          discount: event.discount,
          netPayable: event.netPayable,
          paidAmount: event.paidAmount,
          pendingAmount: event.pendingAmount,
          paymentStatus: event.paymentStatus,
          payments: event.payments
        },
        whatsAppResult
      }
    });
  } catch (error) {
    console.error('Add Event Payment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Fetch all payment installments for an Event
 * @route GET /api/events/:id/payments
 */
export const getEventPayments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const grossTotal = Number(event.totalAmount || event.finalTotal || 0);
    const discount = Number(event.discount || event.discountAmount || 0);
    const netPayable = Math.max(0, grossTotal - discount);
    const paidAmount = Number(event.paidAmount || 0);
    const pendingAmount = Math.max(0, netPayable - paidAmount);

    res.status(200).json({
      success: true,
      data: {
        payments: event.payments || [],
        summary: {
          grossTotal,
          discount,
          netPayable,
          paidAmount,
          pendingAmount,
          paymentStatus: event.paymentStatus || 'Unpaid'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Delete or Void an installment payment & recalculate balances
 * @route DELETE /api/events/:id/payments/:paymentId
 */
export const deleteEventPayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const paymentIndex = (event.payments || []).findIndex(p => p.paymentId === paymentId || String(p._id) === paymentId);
    if (paymentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const removedPayment = event.payments[paymentIndex];
    event.payments.splice(paymentIndex, 1);

    // Recalculate
    const completedPayments = event.payments.filter(p => p.status === 'Completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const grossTotal = Number(event.totalAmount || event.finalTotal || 0);
    const discount = Number(event.discount || event.discountAmount || 0);
    const netPayable = Math.max(0, grossTotal - discount);
    const pendingAmount = Math.max(0, netPayable - totalPaid);

    let paymentStatus = 'Unpaid';
    if (totalPaid >= netPayable && netPayable > 0) {
      paymentStatus = 'Fully Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    event.paidAmount = totalPaid;
    event.pendingAmount = pendingAmount;
    event.paymentStatus = paymentStatus;

    if (!Array.isArray(event.followUps)) event.followUps = [];
    event.followUps.push({
      note: `Voided/Deleted payment #${removedPayment.receiptNumber} (₹${Number(removedPayment.amount || 0).toLocaleString('en-IN')}) by ${req.admin?.name || 'Staff'}. Remaining Pending: ₹${pendingAmount.toLocaleString('en-IN')}`,
      date: new Date()
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: `Payment #${removedPayment.receiptNumber} removed successfully.`,
      data: {
        paidAmount: event.paidAmount,
        pendingAmount: event.pendingAmount,
        paymentStatus: event.paymentStatus,
        payments: event.payments
      }
    });
  } catch (error) {
    console.error('Delete Event Payment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Stream dynamic digital PDF payment receipt
 * @route GET /api/payments/:paymentId/receipt.pdf
 */
export const getPaymentReceiptPDF = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Search in Event first
    let event = await Event.findOne({ 'payments.paymentId': paymentId });
    let payment = null;

    if (event) {
      payment = event.payments.find(p => p.paymentId === paymentId);
    } else {
      // Fallback search in Booking
      const booking = await Booking.findOne({ 'payments.paymentId': paymentId });
      if (booking) {
        event = booking;
        payment = booking.payments.find(p => p.paymentId === paymentId);
      }
    }

    if (!payment || !event) {
      return res.status(404).send('Payment receipt record not found.');
    }

    const settings = (await Setting.findOne()) || {};
    const pdfBuffer = await generatePaymentReceiptPDF(payment, event, settings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Receipt_${payment.receiptNumber || payment.paymentId}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Get Payment Receipt PDF Error:', error);
    res.status(500).send('Error generating payment receipt: ' + error.message);
  }
};

/**
 * 5. Re-dispatch WhatsApp payment receipt to client
 * @route POST /api/events/:id/payments/:paymentId/resend-receipt
 */
export const resendPaymentReceipt = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const payment = (event.payments || []).find(p => p.paymentId === paymentId || String(p._id) === paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const result = await notifyPaymentReceived(payment, event);

    // Also send receipt to client's email
    let emailResult = { success: false, reason: 'No client email provided' };
    if (event.email) {
      try {
        const settings = await Setting.findOne();
        emailResult = await sendPaymentReceiptEmail(event, payment, settings || {});
      } catch (mailErr) {
        console.error('[Resend Payment Receipt Email Error]:', mailErr.message);
      }
    }

    const message = event.email
      ? `Payment receipt successfully dispatched to WhatsApp (${event.phone}) and Email (${event.email}).`
      : `Payment receipt successfully dispatched via WhatsApp (${event.phone}).`;

    res.status(200).json({
      success: true,
      message,
      data: { waResult: result, emailResult }
    });
  } catch (error) {
    console.error('Resend Payment Receipt Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Daily Payments & Multi-UPI Reconciliation Summary
 * @route GET /api/payments/daily-summary
 */
export const getDailyPaymentsSummary = async (req, res) => {
  try {
    const targetDateStr = req.query.date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // Fetch all events that have payments
    const events = await Event.find({
      'payments.date': { $gte: startOfDay, $lte: endOfDay },
      'payments.status': 'Completed'
    }).select('eventName customerName phone payments');

    const matchedPayments = [];
    events.forEach(evt => {
      (evt.payments || []).forEach(p => {
        if (p.status === 'Completed' && p.date >= startOfDay && p.date <= endOfDay) {
          matchedPayments.push({
            ...p.toObject(),
            eventId: evt._id,
            eventName: evt.eventName,
            customerName: evt.customerName,
            phone: evt.phone
          });
        }
      });
    });

    // Multi-UPI destination breakdown
    const byUpiDestination = {};
    const byPaymentType = {};
    let totalCollected = 0;

    matchedPayments.forEach(p => {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;

      // Group by payment mode
      const type = p.paymentType || 'Other';
      byPaymentType[type] = (byPaymentType[type] || 0) + amt;

      // Group by destination UPI
      if (p.paymentType === 'UPI') {
        const dest = p.receiverUpiId || 'Unspecified UPI';
        if (!byUpiDestination[dest]) {
          byUpiDestination[dest] = {
            totalAmount: 0,
            count: 0,
            label: p.receiverAccountLabel || ''
          };
        }
        byUpiDestination[dest].totalAmount += amt;
        byUpiDestination[dest].count += 1;
      }
    });

    res.status(200).json({
      success: true,
      date: targetDateStr,
      data: {
        totalCollected,
        transactionCount: matchedPayments.length,
        byPaymentType,
        byUpiDestination,
        transactions: matchedPayments
      }
    });
  } catch (error) {
    console.error('Daily Payments Summary Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Fetch Studio Authorized Payment Accounts (UPI & Bank)
 * @route GET /api/settings/payment-accounts
 */
export const getPaymentAccounts = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    res.status(200).json({
      success: true,
      data: {
        authorizedUpiAccounts: settings.authorizedUpiAccounts || [],
        authorizedBankAccounts: settings.authorizedBankAccounts || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. Add or Update Studio Authorized Payment Account
 * @route POST /api/settings/payment-accounts
 */
export const addPaymentAccount = async (req, res) => {
  try {
    const { type, upiId, label, bankName, isDefault, accountNumber, ifscCode, accountHolder } = req.body;

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    if (type === 'BANK') {
      if (!accountNumber || !ifscCode) {
        return res.status(400).json({ success: false, message: 'Account number and IFSC code are required.' });
      }
      settings.authorizedBankAccounts.push({
        accountNumber,
        ifscCode,
        bankName: bankName || '',
        accountHolder: accountHolder || '',
        label: label || 'Studio Bank Account'
      });
    } else {
      // UPI account
      if (!upiId || !label) {
        return res.status(400).json({ success: false, message: 'UPI ID and Label are required.' });
      }

      if (isDefault) {
        settings.authorizedUpiAccounts.forEach(a => { a.isDefault = false; });
      }

      settings.authorizedUpiAccounts.push({
        upiId: String(upiId).trim(),
        label: String(label).trim(),
        bankName: bankName || '',
        isDefault: Boolean(isDefault),
        isActive: true
      });
    }

    await settings.save();

    res.status(201).json({
      success: true,
      message: 'Payment account added successfully.',
      data: {
        authorizedUpiAccounts: settings.authorizedUpiAccounts,
        authorizedBankAccounts: settings.authorizedBankAccounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. Delete Studio Authorized Payment Account
 * @route DELETE /api/settings/payment-accounts/:accountId
 */
export const deletePaymentAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    settings.authorizedUpiAccounts = (settings.authorizedUpiAccounts || []).filter(
      a => String(a._id) !== accountId
    );
    settings.authorizedBankAccounts = (settings.authorizedBankAccounts || []).filter(
      a => String(a._id) !== accountId
    );

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Payment account removed.',
      data: {
        authorizedUpiAccounts: settings.authorizedUpiAccounts,
        authorizedBankAccounts: settings.authorizedBankAccounts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
