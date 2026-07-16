import { Booking } from '../models/Booking.js';
import { PropRental } from '../models/PropRental.js';
import { Event } from '../models/Event.js';
import { Expense } from '../models/Expense.js';

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

    // Shoots (Bookings)
    const shoots = await Booking.find(query);
    const shootTotal = shoots.reduce((acc, curr) => acc + (curr.finalTotal || curr.estimatedPrice || 0), 0);
    const shootPending = shoots.reduce((acc, curr) => acc + ((curr.finalTotal || curr.estimatedPrice || 0) - (curr.paidAmount || 0)), 0); 
    
    // Rentals
    const rentals = await PropRental.find(query);
    const rentalTotal = rentals.reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
    const rentalPending = rentals.reduce((acc, curr) => acc + (curr.finalTotal - (curr.paidAmount || 0)), 0);

    // Events
    const events = await Event.find(query);
    const eventTotal = events.reduce((acc, curr) => acc + (curr.finalTotal || 0), 0);
    const eventPending = events.reduce((acc, curr) => acc + (curr.finalTotal - (curr.paidAmount || 0)), 0);

    // Expenses
    const expenseDateQuery = buildDateQuery(req, 'expenseDate');
    const expenses = await Expense.find(expenseDateQuery);
    
    let studioExpenseTotal = 0;
    let shootExpenseTotal = 0;
    let rentalExpenseTotal = 0;
    let eventExpenseTotal = 0;

    expenses.forEach(exp => {
      if (exp.category === 'GENERAL_STUDIO') studioExpenseTotal += exp.amount;
      else if (exp.category === 'STUDIO_SHOOT') shootExpenseTotal += exp.amount;
      else if (exp.category === 'PROP_RENTAL') rentalExpenseTotal += exp.amount;
      else if (exp.category === 'EVENT') eventExpenseTotal += exp.amount;
    });

    const totalBusiness = shootTotal + rentalTotal + eventTotal;
    const totalPending = shootPending + rentalPending + eventPending;
    const totalExpenses = studioExpenseTotal + shootExpenseTotal + rentalExpenseTotal + eventExpenseTotal;
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

    const studioExpenses = expenses.filter(e => e.category === 'GENERAL_STUDIO');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBusiness,
          totalPending,
          totalExpenses,
          netProfit
        },
        partnerShares,
        studioExpenses,
        breakdown: {
          shoots: { total: shootTotal, pending: shootPending, expenses: shootExpenseTotal, profit: shootTotal - shootExpenseTotal },
          rentals: { total: rentalTotal, pending: rentalPending, expenses: rentalExpenseTotal, profit: rentalTotal - rentalExpenseTotal },
          events: { total: eventTotal, pending: eventPending, expenses: eventExpenseTotal, profit: eventTotal - eventExpenseTotal },
          studio: { expenses: studioExpenseTotal }
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
