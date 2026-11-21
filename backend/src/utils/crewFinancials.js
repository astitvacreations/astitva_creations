import mongoose from 'mongoose';

/**
 * Calculates and rolls up event-level crew wages, liabilities, and studio gross margin
 * @param {string|mongoose.Types.ObjectId} eventId 
 */
export const recalculateEventCrewFinancials = async (eventId) => {
  const EventCrewAssignment = mongoose.model('EventCrewAssignment');
  const Event = mongoose.model('Event');

  const assignments = await EventCrewAssignment.find({ 
    eventId, 
    workStatus: { $ne: 'Cancelled' } 
  });
  
  const totalBudget = assignments.reduce((sum, a) => sum + (Number(a.allottedBudget) || 0), 0);
  const totalCleared = assignments.reduce((sum, a) => sum + (Number(a.clearedAmount) || 0), 0);
  const totalPending = Math.max(0, totalBudget - totalCleared);

  const event = await Event.findById(eventId);
  if (!event) return null;

  const clientNetFee = Math.max(
    0, 
    (Number(event.totalAmount || event.finalTotal) || 0) - (Number(event.discount || event.discountAmount) || 0)
  );
  const grossMargin = clientNetFee - totalBudget;
  const marginPct = clientNetFee > 0 ? Math.round((grossMargin / clientNetFee) * 100) : 0;

  event.totalCrewBudget = totalBudget;
  event.totalCrewCleared = totalCleared;
  event.totalCrewPending = totalPending;
  event.grossMarginAmount = grossMargin;
  event.grossMarginPercentage = marginPct;

  await event.save();

  return {
    totalCrewBudget: totalBudget,
    totalCrewCleared: totalCleared,
    totalCrewPending: totalPending,
    clientNetFee,
    grossMarginAmount: grossMargin,
    grossMarginPercentage: marginPct
  };
};
