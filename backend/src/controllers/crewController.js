import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { EventCrewAssignment } from '../models/EventCrewAssignment.js';
import { TeamMember } from '../models/TeamMember.js';
import { Expense } from '../models/Expense.js';
import { recalculateEventCrewFinancials } from '../utils/crewFinancials.js';
import { notifyCrewAssignmentBrief, notifyCrewPreEventReminder } from '../services/whatsappService.js';
import { sendCrewAssignmentEmail, sendCrewPreEventReminderEmail } from '../utils/mailer.js';

/**
 * =============================================================================
 * 1. EVENT CREW ASSIGNMENTS & SCOPE MANAGEMENT
 * =============================================================================
 */

/**
 * @desc    Fetch all crew assignments for an event
 * @route   GET /api/events/:id/crew
 * @access  Private
 */
export const getEventCrew = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const assignments = await EventCrewAssignment.find({ eventId: id })
      .populate('teamMemberId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
      eventRollup: {
        totalCrewBudget: event.totalCrewBudget || 0,
        totalCrewCleared: event.totalCrewCleared || 0,
        totalCrewPending: event.totalCrewPending || 0,
        grossMarginAmount: event.grossMarginAmount || 0,
        grossMarginPercentage: event.grossMarginPercentage || 0
      }
    });
  } catch (error) {
    console.error('Error fetching event crew:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Assign a crew member with roles and budget allocation
 * @route   POST /api/events/:id/crew
 * @access  Private
 */
export const assignEventCrew = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      teamMemberId,
      assignmentCategory,
      assignedRoles,
      subEventsCovered,
      workScopeDescription,
      shootFee,
      photoEditFee,
      videoEditFee,
      allowanceFee,
      allottedBudget,
      assignmentNotes,
      allowDoubleBooking
    } = req.body;

    if (!teamMemberId) {
      return res.status(400).json({ success: false, message: 'Please provide teamMemberId' });
    }

    if (!assignedRoles || !Array.isArray(assignedRoles) || assignedRoles.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one assigned role is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const teamMember = await TeamMember.findById(teamMemberId);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Determine assignment category: Shoot, Assistant, PhotoEdit, VideoEdit
    let category = assignmentCategory;
    if (!category) {
      if (assignedRoles.some(r => ['Photo Editor', 'Photo Edit'].includes(r))) {
        category = 'PhotoEdit';
      } else if (assignedRoles.some(r => ['Video Editor', 'Video Edit'].includes(r))) {
        category = 'VideoEdit';
      } else if (assignedRoles.some(r => ['Shoot Assistant / Lighting', 'Assistant'].includes(r))) {
        category = 'Assistant';
      } else {
        category = 'Shoot';
      }
    }

    // Check if team member is already assigned to this specific category for this event
    // (A single person CAN be assigned to Shoot AND PhotoEdit AND VideoEdit since they happen on different days)
    const existing = await EventCrewAssignment.findOne({
      eventId: id,
      teamMemberId,
      assignmentCategory: category,
      workStatus: { $ne: 'Cancelled' }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `This team member is already assigned to ${category} for this event`
      });
    }

    // Double-booking check: only for on-location fieldwork (Shoot/Assistant) on the shoot date
    const targetDate = event.eventDate || event.date;
    if ((category === 'Shoot' || category === 'Assistant') && targetDate && !allowDoubleBooking) {
      const sameDayEvents = await Event.find({
        _id: { $ne: id },
        $or: [{ eventDate: targetDate }, { date: targetDate }],
        status: { $nin: ['CANCELLED'] }
      }).select('_id eventName clientName');

      if (sameDayEvents.length > 0) {
        const conflictingAssignment = await EventCrewAssignment.findOne({
          eventId: { $in: sameDayEvents.map(e => e._id) },
          teamMemberId,
          assignmentCategory: { $in: ['Shoot', 'Assistant'] },
          workStatus: { $nin: ['Cancelled'] }
        }).populate('eventId', 'eventName clientName eventDate date');

        if (conflictingAssignment) {
          return res.status(400).json({
            success: false,
            message: `Double-booking conflict: ${teamMember.name} is already assigned to "${conflictingAssignment.eventId?.eventName || 'another event'}" on ${targetDate}. Set allowDoubleBooking: true to bypass if intentional.`,
            conflictingAssignment
          });
        }
      }
    }

    const assignment = new EventCrewAssignment({
      eventId: id,
      teamMemberId,
      assignmentCategory: category,
      assignedRoles,
      subEventsCovered: subEventsCovered || [],
      workScopeDescription: workScopeDescription || '',
      shootFee: Number(shootFee) || 0,
      photoEditFee: Number(photoEditFee) || 0,
      videoEditFee: Number(videoEditFee) || 0,
      allowanceFee: Number(allowanceFee) || 0,
      allottedBudget: Number(allottedBudget) || 0,
      assignmentNotes: assignmentNotes || ''
    });

    await assignment.save();

    // Recalculate event-level rollup
    const rollups = await recalculateEventCrewFinancials(id);

    // Populate teamMemberId for immediate client response
    await assignment.populate('teamMemberId');

    // Send private WhatsApp & Email in background without delaying HTTP response
    setImmediate(() => {
      notifyCrewAssignmentBrief(assignment, event, teamMember).catch(err => {
        console.error('[WhatsApp Brief Error]:', err.message);
      });

      if (teamMember.email) {
        sendCrewAssignmentEmail(event, assignment, teamMember).catch(err => {
          console.error('[Crew Email Assignment Error]:', err.message);
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Crew member assigned successfully',
      data: assignment,
      eventRollup: rollups
    });
  } catch (error) {
    console.error('Error assigning crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Update crew work scope, sub-events, or fee breakdown
 * @route   PUT /api/events/:id/crew/:assignmentId
 * @access  Private
 */
export const updateEventCrew = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const {
      assignedRoles,
      subEventsCovered,
      workScopeDescription,
      shootFee,
      photoEditFee,
      videoEditFee,
      allowanceFee,
      allottedBudget,
      workStatus,
      assignmentNotes
    } = req.body;

    // Support lookup by either assignment ID or teamMemberId
    let assignment = await EventCrewAssignment.findOne({
      eventId: id,
      $or: [
        mongoose.isValidObjectId(assignmentId) ? { _id: assignmentId } : null,
        mongoose.isValidObjectId(assignmentId) ? { teamMemberId: assignmentId } : null
      ].filter(Boolean)
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Crew assignment not found' });
    }

    if (assignedRoles && Array.isArray(assignedRoles) && assignedRoles.length > 0) {
      assignment.assignedRoles = assignedRoles;
    }
    if (subEventsCovered !== undefined) assignment.subEventsCovered = subEventsCovered;
    if (workScopeDescription !== undefined) assignment.workScopeDescription = workScopeDescription;
    if (shootFee !== undefined) assignment.shootFee = Number(shootFee);
    if (photoEditFee !== undefined) assignment.photoEditFee = Number(photoEditFee);
    if (videoEditFee !== undefined) assignment.videoEditFee = Number(videoEditFee);
    if (allowanceFee !== undefined) assignment.allowanceFee = Number(allowanceFee);
    if (allottedBudget !== undefined) assignment.allottedBudget = Number(allottedBudget);
    if (workStatus !== undefined) assignment.workStatus = workStatus;
    if (assignmentNotes !== undefined) assignment.assignmentNotes = assignmentNotes;

    await assignment.save();

    const rollups = await recalculateEventCrewFinancials(id);

    res.status(200).json({
      success: true,
      message: 'Crew assignment updated successfully',
      data: assignment,
      eventRollup: rollups
    });
  } catch (error) {
    console.error('Error updating crew assignment:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Unassign crew member
 *          Disallowed if payments have already been cleared; if cleared, marks status as 'Cancelled'
 * @route   DELETE /api/events/:id/crew/:assignmentId
 * @access  Private
 */
export const unassignEventCrew = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;

    let assignment = await EventCrewAssignment.findOne({
      eventId: id,
      $or: [
        mongoose.isValidObjectId(assignmentId) ? { _id: assignmentId } : null,
        mongoose.isValidObjectId(assignmentId) ? { teamMemberId: assignmentId } : null
      ].filter(Boolean)
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Crew assignment not found' });
    }

    // If payments have been cleared, prevent hard deletion to preserve financial audit trail
    if (assignment.clearedAmount > 0) {
      assignment.workStatus = 'Cancelled';
      await assignment.save();
      const rollups = await recalculateEventCrewFinancials(id);

      return res.status(200).json({
        success: true,
        message: 'Payments have already been cleared for this assignment. Assignment marked as Cancelled to preserve payment audit trail.',
        data: assignment,
        eventRollup: rollups
      });
    }

    await EventCrewAssignment.findByIdAndDelete(assignment._id);
    const rollups = await recalculateEventCrewFinancials(id);

    res.status(200).json({
      success: true,
      message: 'Crew assignment removed successfully',
      eventRollup: rollups
    });
  } catch (error) {
    console.error('Error unassigning crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * =============================================================================
 * 2. CREW PAYOUTS & WAGE SETTLEMENT LEDGER
 * =============================================================================
 */

/**
 * @desc    Disburse an installment payout to a crew member (UPI/Cash/Bank Transfer)
 *          Updates cleared/pending amounts, logs studio expense, and adds audit trail note
 * @route   POST /api/events/:id/crew/:assignmentId/payout
 * @access  Private
 */
export const recordCrewPayout = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;
    const { amount, paymentType, utrNumber, paidBy, note, allowOverpay } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payout amount must be greater than zero' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let assignment = await EventCrewAssignment.findOne({
      eventId: id,
      $or: [
        mongoose.isValidObjectId(assignmentId) ? { _id: assignmentId } : null,
        mongoose.isValidObjectId(assignmentId) ? { teamMemberId: assignmentId } : null
      ].filter(Boolean)
    }).populate('teamMemberId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Crew assignment not found' });
    }

    // Verify payout doesn't exceed pending balance unless explicit allowOverpay is granted
    if (numAmount > assignment.pendingAmount && !allowOverpay) {
      return res.status(400).json({
        success: false,
        message: `Payout amount (₹${numAmount.toLocaleString('en-IN')}) exceeds remaining pending balance (₹${assignment.pendingAmount.toLocaleString('en-IN')}). Set allowOverpay: true if this is an authorized bonus or advance.`
      });
    }

    const authorizingUser = paidBy || req.admin?.name || req.admin?.email || 'Studio Management';
    const payMode = paymentType || 'UPI';
    const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
    const cleanNote = note ? String(note).trim() : '';

    const newPayout = {
      amount: numAmount,
      date: new Date(),
      paymentType: payMode,
      utrNumber: cleanUtr,
      paidBy: authorizingUser,
      note: cleanNote
    };

    assignment.payoutHistory.push(newPayout);
    await assignment.save();

    const createdPayout = assignment.payoutHistory[assignment.payoutHistory.length - 1];

    // Recalculate event labor cost rollups
    const rollups = await recalculateEventCrewFinancials(id);

    // Sync studio operational business expense
    const memberName = assignment.teamMemberId?.name || 'Crew Member';
    const rolesStr = (assignment.assignedRoles || []).join(', ') || 'Crew Member';

    try {
      await Expense.create({
        category: 'EVENT',
        referenceId: event._id,
        onModel: 'Event',
        expenseName: `Crew Wage - ${memberName} (${rolesStr})`,
        description: `Payout ID: ${createdPayout.payoutId} | Type: ${payMode} | UTR: ${cleanUtr || 'N/A'}${cleanNote ? ` | Note: ${cleanNote}` : ''}`,
        amount: numAmount,
        expenseDate: createdPayout.date || new Date(),
        createdBy: req.admin?._id || null
      });
    } catch (expError) {
      console.error('Failed to log crew wage expense:', expError);
    }

    // Append audit trail note in event follow-ups
    const auditNote = `Crew Payout: ₹${numAmount.toLocaleString('en-IN')} cleared to ${memberName} for [${rolesStr}] via ${payMode} (UTR: ${cleanUtr || 'N/A'}). Remaining: ₹${assignment.pendingAmount.toLocaleString('en-IN')}`;
    event.followUps = event.followUps || [];
    event.followUps.push({
      note: auditNote,
      createdAt: new Date(),
      createdBy: authorizingUser
    });
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Crew payout recorded and ledger reconciled successfully',
      data: assignment,
      payout: createdPayout,
      eventRollup: rollups
    });
  } catch (error) {
    console.error('Error recording crew payout:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Void a payout and reverse the ledger balance
 *          Removes the payout, increases pending balance, removes linked studio expense, and updates rollups
 * @route   DELETE /api/events/:id/crew/:assignmentId/payout/:payoutId
 * @access  Private
 */
export const deleteCrewPayout = async (req, res) => {
  try {
    const { id, assignmentId, payoutId } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let assignment = await EventCrewAssignment.findOne({
      eventId: id,
      $or: [
        mongoose.isValidObjectId(assignmentId) ? { _id: assignmentId } : null,
        mongoose.isValidObjectId(assignmentId) ? { teamMemberId: assignmentId } : null
      ].filter(Boolean)
    }).populate('teamMemberId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Crew assignment not found' });
    }

    const payoutItem = assignment.payoutHistory.find(
      p => p.payoutId === payoutId || (p._id && p._id.toString() === payoutId)
    );

    if (!payoutItem) {
      return res.status(404).json({ success: false, message: 'Payout transaction not found' });
    }

    const reversedAmount = payoutItem.amount;
    const targetPayoutId = payoutItem.payoutId;

    // Filter out target payout
    assignment.payoutHistory = assignment.payoutHistory.filter(
      p => p.payoutId !== targetPayoutId && (!p._id || p._id.toString() !== targetPayoutId)
    );

    await assignment.save();

    // Auto-remove linked studio business expense
    try {
      await Expense.findOneAndDelete({
        referenceId: event._id,
        description: { $regex: targetPayoutId }
      });
    } catch (expError) {
      console.error('Failed to remove crew wage expense:', expError);
    }

    // Recalculate event rollups
    const rollups = await recalculateEventCrewFinancials(id);

    // Append reversal audit note
    const memberName = assignment.teamMemberId?.name || 'Crew Member';
    const auditNote = `Crew Payout Reversal: ₹${reversedAmount.toLocaleString('en-IN')} reversed for ${memberName} (Payout ID: ${targetPayoutId}). New Pending: ₹${assignment.pendingAmount.toLocaleString('en-IN')}`;
    event.followUps = event.followUps || [];
    event.followUps.push({
      note: auditNote,
      createdAt: new Date(),
      createdBy: req.admin?.name || req.admin?.email || 'Studio Management'
    });
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Payout transaction voided and ledger reversed successfully',
      data: assignment,
      eventRollup: rollups
    });
  } catch (error) {
    console.error('Error voiding crew payout:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Fetch event crew labor cost rollup summary
 * @route   GET /api/events/:id/crew/financial-summary
 * @access  Private
 */
export const getEventCrewFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await recalculateEventCrewFinancials(id);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * =============================================================================
 * 3. TEAM MEMBER EARNINGS DIRECTORY & HISTORICAL LEDGER
 * =============================================================================
 */

/**
 * @desc    Aggregate statement of a crew member across all historical events
 * @route   GET /api/team/:memberId/ledger
 * @access  Private
 */
export const getTeamMemberLedger = async (req, res) => {
  try {
    const { memberId } = req.params;
    const member = await TeamMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    const assignments = await EventCrewAssignment.find({ teamMemberId: memberId })
      .populate('eventId', 'clientName eventName eventDate date location status totalAmount finalTotal')
      .sort({ createdAt: -1 });

    const activeAssignments = assignments.filter(a => a.workStatus !== 'Cancelled');

    const lifetimeAllottedBudget = activeAssignments.reduce(
      (sum, a) => sum + (Number(a.allottedBudget) || 0),
      0
    );
    const lifetimeClearedPayouts = assignments.reduce(
      (sum, a) => sum + (Number(a.clearedAmount) || 0),
      0
    );
    const totalPendingLiabilities = Math.max(0, lifetimeAllottedBudget - lifetimeClearedPayouts);

    res.status(200).json({
      success: true,
      member: {
        _id: member._id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        role: member.role,
        primarySkills: member.primarySkills,
        upiId: member.upiId,
        bankDetails: member.bankDetails,
        standardDayRate: member.standardDayRate,
        isActive: member.isActive
      },
      summary: {
        totalAssignedEvents: assignments.length,
        activeEventsCount: activeAssignments.length,
        lifetimeAllottedBudget,
        lifetimeClearedPayouts,
        totalPendingLiabilities
      },
      assignments
    });
  } catch (error) {
    console.error('Error fetching team member ledger:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * =============================================================================
 * 4. CREW DIRECTORY MANAGEMENT
 * =============================================================================
 */

/**
 * @desc    List all crew members
 * @route   GET /api/team/crew-members or GET /api/team/directory/members
 * @access  Private
 */
export const listCrewMembers = async (req, res) => {
  try {
    const { role, activeOnly } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (activeOnly === 'true') filter.isActive = true;

    const members = await TeamMember.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) {
    console.error('Error listing crew members:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Get single crew member by ID
 * @route   GET /api/team/crew-members/:id
 * @access  Private
 */
export const getCrewMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id || req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error('Error fetching crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Create new crew member
 * @route   POST /api/team/crew-members or POST /api/team/directory/members
 * @access  Private
 */
export const createCrewMember = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      role,
      primarySkills,
      upiId,
      bankDetails,
      standardDayRate,
      isActive,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide crew member name' });
    }

    const member = await TeamMember.create({
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      role: role || 'Photographer / Cinematographer',
      primarySkills: primarySkills || [],
      upiId: upiId ? upiId.trim() : '',
      bankDetails: bankDetails || {},
      standardDayRate: Number(standardDayRate) || 0,
      isActive: isActive !== undefined ? isActive : true,
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Crew member created successfully', data: member });
  } catch (error) {
    console.error('Error creating crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Update crew member
 * @route   PUT /api/team/crew-members/:id
 * @access  Private
 */
export const updateCrewMember = async (req, res) => {
  try {
    const targetId = req.params.id || req.params.memberId;
    const member = await TeamMember.findByIdAndUpdate(targetId, req.body, {
      new: true,
      runValidators: true
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    res.status(200).json({ success: true, message: 'Crew member updated successfully', data: member });
  } catch (error) {
    console.error('Error updating crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Delete crew member
 * @route   DELETE /api/team/crew-members/:id
 * @access  Private
 */
export const deleteCrewMember = async (req, res) => {
  try {
    const targetId = req.params.id || req.params.memberId;

    // Check if member has active assignments
    const activeAssignments = await EventCrewAssignment.countDocuments({
      teamMemberId: targetId,
      workStatus: { $ne: 'Cancelled' }
    });

    if (activeAssignments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete member with ${activeAssignments} active event assignments. Deactivate the member instead.`
      });
    }

    const member = await TeamMember.findByIdAndDelete(targetId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Crew member not found' });
    }

    res.status(200).json({ success: true, message: 'Crew member deleted successfully' });
  } catch (error) {
    console.error('Error deleting crew member:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Manually dispatch 24h pre-event reminders to all assigned crew members of an event
 * @route   POST /api/events/:id/crew/send-reminders
 * @access  Private
 */
export const sendManualCrewReminders = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const assignments = await EventCrewAssignment.find({
      eventId: id,
      workStatus: { $ne: 'Cancelled' }
    }).populate('teamMemberId');

    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ success: false, message: 'No active crew members assigned to this event' });
    }

    const results = [];
    for (const assignment of assignments) {
      const teamMember = assignment.teamMemberId;
      if (!teamMember) continue;

      let emailResult = null;
      let waResult = null;

      if (teamMember.email) {
        try {
          emailResult = await sendCrewPreEventReminderEmail(event, assignment, teamMember);
        } catch (e) {
          emailResult = { success: false, error: e.message };
        }
      }

      if (teamMember.phone) {
        try {
          waResult = await notifyCrewPreEventReminder(assignment, event, teamMember);
        } catch (e) {
          waResult = { success: false, error: e.message };
        }
      }

      assignment.preEventReminderSent = true;
      assignment.preEventReminderSentAt = new Date();
      await assignment.save();

      results.push({
        teamMemberId: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.phone,
        emailResult,
        waResult
      });
    }

    res.status(200).json({
      success: true,
      message: `Dispatched pre-event reminders to ${results.length} crew member(s).`,
      data: results
    });
  } catch (error) {
    console.error('Error dispatching manual crew reminders:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

