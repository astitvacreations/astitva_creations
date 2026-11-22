import { Booking } from '../models/Booking.js';
import { PropRental } from '../models/PropRental.js';
import { Event } from '../models/Event.js';
import { Expense } from '../models/Expense.js';
import { ensureEventVersions } from '../utils/quotationVersioning.js';

// Helper to build date match queries
const buildDateQuery = (req, dateField = 'createdAt') => {
  const { period, startDate, endDate } = req.query;
  let dateQuery = {};

  if (startDate && endDate) {
    // End date should include the full day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateQuery[dateField] = { $gte: new Date(startDate), $lte: end };
  } else if (period === 'week') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    dateQuery[dateField] = { $gte: startOfWeek };
  } else if (period === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    dateQuery[dateField] = { $gte: startOfMonth };
  }
  return dateQuery;
};

// Helper to build search queries
const buildSearchQuery = (req, searchFields = ['customerName', 'email', 'phone']) => {
  const { search } = req.query;
  if (!search) return {};
  
  const regex = new RegExp(search, 'i');
  const orConditions = searchFields.map(field => ({ [field]: regex }));
  
  return { $or: orConditions };
};

export const getBusinessOverview = async (req, res) => {
  try {
    const dateQuery = buildDateQuery(req);
    const searchCondition = buildSearchQuery(req);
    const query = { ...dateQuery, ...searchCondition };

    // Business is 100% Events-driven (no separate shoots or rentals)
    const events = await Event.find(query);
    const amountReceived = events.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
    const pendingAmount = events.reduce((acc, curr) => acc + Math.max(0, (Number(curr.finalTotal) || 0) - (Number(curr.paidAmount) || 0)), 0);
    // 1) Total Business: Received + Pending
    const totalBusiness = amountReceived + pendingAmount;

    // Expenses
    const expenseDateQuery = buildDateQuery(req, 'expenseDate');
    const expenses = await Expense.find(expenseDateQuery);
    // 4) Total Expenses
    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 5) Gross Amount: Total Business - Expenses
    const grossAmount = totalBusiness - totalExpenses;

    // 6) Net Profit: Amount Received - Expenses (Realized cash profit in hand)
    const netProfit = amountReceived - totalExpenses;

    const partnerData = await import('../models/Partner.js');
    const Partner = partnerData.Partner;
    const activePartners = await Partner.find({ isActive: true });
    
    // Partner shares based on gross business margin
    const partnerBase = grossAmount > 0 ? grossAmount : 0;
    const partnerShares = activePartners.map(p => ({
      _id: p._id,
      name: p.name,
      percentage: p.percentage,
      share: (partnerBase * p.percentage) / 100
    }));

    const studioExpenses = expenses.filter(e => e.category === 'GENERAL_STUDIO');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBusiness,
          amountReceived,
          pendingAmount,
          totalExpenses,
          grossAmount,
          netProfit,
          totalPending: pendingAmount
        },
        partnerShares,
        studioExpenses,
        breakdown: {
          events: {
            total: totalBusiness,
            received: amountReceived,
            pending: pendingAmount,
            expenses: totalExpenses,
            profit: grossAmount
          }
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBusinessShoots = async (req, res) => {
  try {
    const dateQuery = buildDateQuery(req);
    const searchCondition = buildSearchQuery(req);
    const query = { ...dateQuery, ...searchCondition };

    const shoots = await Booking.find(query).sort({ createdAt: -1 });
    
    // Compute aggregations specifically for these filtered shoots
    const totalBusiness = shoots.reduce((acc, curr) => acc + (curr.finalTotal || curr.estimatedPrice || 0), 0);
    const pendingAmount = shoots.reduce((acc, curr) => acc + ((curr.finalTotal || curr.estimatedPrice || 0) - (curr.paidAmount || 0)), 0);

    // Fetch expenses linked to these shoots
    const shootIds = shoots.map(s => s._id);
    const expenses = await Expense.find({ referenceId: { $in: shootIds }, onModel: 'Booking' });
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = totalBusiness - totalExpenses;

    const partnerData = await import('../models/Partner.js');
    const Partner = partnerData.Partner;
    const activePartners = await Partner.find({ isActive: true });
    
    const partnerShares = activePartners.map(p => ({
      _id: p._id,
      name: p.name,
      percentage: p.percentage,
      share: (netProfit * p.percentage) / 100
    }));

    res.status(200).json({
      success: true,
      data: {
        shoots,
        expenses,
        partnerShares,
        summary: {
          totalBusiness,
          pendingAmount,
          totalExpenses,
          netProfit
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBusinessRentals = async (req, res) => {
  try {
    const dateQuery = buildDateQuery(req, 'rentalDate');
    const searchCondition = buildSearchQuery(req);
    const query = { ...dateQuery, ...searchCondition };

    const rentals = await PropRental.find(query).sort({ rentalDate: -1 });
    
    const totalBusiness = rentals.reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
    const pendingAmount = rentals.reduce((acc, curr) => acc + (curr.finalTotal - (curr.paidAmount || 0)), 0);

    const rentalIds = rentals.map(r => r._id);
    const expenses = await Expense.find({ referenceId: { $in: rentalIds }, onModel: 'PropRental' });
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = totalBusiness - totalExpenses;

    const partnerData = await import('../models/Partner.js');
    const Partner = partnerData.Partner;
    const activePartners = await Partner.find({ isActive: true });
    
    const partnerShares = activePartners.map(p => ({
      _id: p._id,
      name: p.name,
      percentage: p.percentage,
      share: (netProfit * p.percentage) / 100
    }));

    res.status(200).json({
      success: true,
      data: {
        rentals,
        expenses,
        partnerShares,
        summary: {
          totalBusiness,
          pendingAmount,
          totalExpenses,
          netProfit
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBusinessEvents = async (req, res) => {
  try {
    const dateQuery = buildDateQuery(req, 'eventDate');
    const searchCondition = buildSearchQuery(req);
    const query = { ...dateQuery, ...searchCondition };

    const events = await Event.find(query).sort({ eventDate: -1 });

    // Self-healing: auto-seed Quotation 1 on any legacy unversioned events
    for (const evt of events) {
      if (!evt.versions || evt.versions.length === 0) {
        await ensureEventVersions(evt);
      }
    }
    
    const totalBusiness = events.reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
    const pendingAmount = events.reduce((acc, curr) => acc + (curr.finalTotal - (curr.paidAmount || 0)), 0);

    const eventIds = events.map(e => e._id);
    const expenses = await Expense.find({ referenceId: { $in: eventIds }, onModel: 'Event' });
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        events,
        expenses,
        summary: {
          totalBusiness,
          pendingAmount,
          totalExpenses,
          netProfit: totalBusiness - totalExpenses
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
