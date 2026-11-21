import mongoose from 'mongoose';

export const crewPayoutTransactionSchema = new mongoose.Schema(
  {
    payoutId: { 
      type: String, 
      required: true, 
      default: () => 'POUT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase() 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: [1, 'Payout amount must be greater than zero'] 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    paymentType: { 
      type: String, 
      enum: ['UPI', 'Cash', 'Bank Transfer'], 
      default: 'UPI' 
    },
    utrNumber: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    paidBy: { 
      type: String, 
      required: true 
    },
    note: { 
      type: String, 
      trim: true, 
      default: '' 
    }
  }, 
  { timestamps: true }
);

const eventCrewAssignmentSchema = new mongoose.Schema(
  {
    eventId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Event', 
      required: true, 
      index: true 
    },
    teamMemberId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TeamMember', 
      required: true, 
      index: true 
    },
    
    // 1. Role & Scope of Work Clarity
    assignedRoles: [{ 
      type: String, 
      enum: [
        'Lead Candid Photographer', 
        'Traditional Photographer', 
        'Candid Cinematographer', 
        'Traditional Videographer', 
        'Drone Pilot', 
        'Photo Editor', 
        'Video Editor', 
        'Shoot Assistant / Lighting'
      ],
      required: true 
    }],
    subEventsCovered: [{ type: String }],
    workScopeDescription: { 
      type: String, 
      default: '' 
    },
    
    // 2. Budget Allocation
    shootFee: { type: Number, default: 0, min: 0 },
    photoEditFee: { type: Number, default: 0, min: 0 },
    videoEditFee: { type: Number, default: 0, min: 0 },
    allowanceFee: { type: Number, default: 0, min: 0 },
    allottedBudget: { type: Number, default: 0, min: 0 },
    
    // 3. Cleared vs Pending Balance Tracking
    clearedAmount: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0, min: 0 },
    payoutStatus: { 
      type: String, 
      enum: ['Unpaid', 'Partially Cleared', 'Fully Cleared'], 
      default: 'Unpaid',
      index: true
    },
    
    // 4. Milestone & Task Execution Status
    workStatus: { 
      type: String, 
      enum: ['Scheduled', 'In Progress', 'Shoot Completed', 'Editing Completed', 'Cancelled'], 
      default: 'Scheduled' 
    },
    
    // 5. Automated Pre-Event Reminders (24h Pre-Event)
    preEventReminderSent: { 
      type: Boolean, 
      default: false 
    },
    preEventReminderSentAt: { 
      type: Date, 
      default: null 
    },
    
    payoutHistory: [crewPayoutTransactionSchema],
    assignmentNotes: { type: String, default: '' }
  }, 
  { timestamps: true }
);

// Pre-save calculation hook
eventCrewAssignmentSchema.pre('save', function() {
  const sFee = Number(this.shootFee) || 0;
  const pFee = Number(this.photoEditFee) || 0;
  const vFee = Number(this.videoEditFee) || 0;
  const aFee = Number(this.allowanceFee) || 0;

  // If component fees are provided, allottedBudget is their sum; otherwise retain explicit allottedBudget
  if (sFee > 0 || pFee > 0 || vFee > 0 || aFee > 0) {
    this.allottedBudget = sFee + pFee + vFee + aFee;
  }

  const totalCleared = (this.payoutHistory || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  this.clearedAmount = totalCleared;
  this.pendingAmount = Math.max(0, (Number(this.allottedBudget) || 0) - totalCleared);

  if (totalCleared >= this.allottedBudget && this.allottedBudget > 0) {
    this.payoutStatus = 'Fully Cleared';
  } else if (totalCleared > 0) {
    this.payoutStatus = 'Partially Cleared';
  } else {
    this.payoutStatus = 'Unpaid';
  }
});

// Ensure a team member cannot be assigned twice to the same event
eventCrewAssignmentSchema.index({ eventId: 1, teamMemberId: 1 }, { unique: true });

export const EventCrewAssignment = mongoose.model('EventCrewAssignment', eventCrewAssignmentSchema);
