import mongoose from 'mongoose';

export const paymentInstallmentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      default: () => 'PAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase()
    },
    receiptNumber: { type: String, required: true },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be greater than zero']
    },
    paymentType: {
      type: String,
      enum: ['UPI', 'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque'],
      required: true
    },
    // Destination tracking for UPI
    receiverUpiId: {
      type: String,
      trim: true
    },
    receiverAccountLabel: { type: String, default: '' },
    // Transaction References
    utrNumber: {
      type: String,
      trim: true
    },
    senderUpiId: { type: String, trim: true, default: '' },
    // Operational metadata
    receivedBy: { type: String, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Completed', 'Pending Verification', 'Voided'],
      default: 'Completed'
    }
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuoteRequest' },
    eventName: { type: String, required: true },
    customerName: { type: String, default: 'Client' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    eventDate: { type: Date, default: Date.now },
    location: { type: String, default: '' },
    subEvents: [{
      name: { type: String, default: 'Event' },
      services: [{
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'PredefinedService' },
        name: { type: String, default: '' },
        price: { type: Number, default: 0 }
      }]
    }],
    deliverables: [{ type: String }],
    complimentaries: [{ type: String }],
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Fully Paid', 'Overdue'],
      default: 'Unpaid'
    },
    payments: [paymentInstallmentSchema],

    // =========================================================================
    // CREW WORK ALLOCATION & LABOR COST ROLLUP
    // =========================================================================
    totalCrewBudget: { type: Number, default: 0 }, // Sum of all crew allotted budgets
    totalCrewCleared: { type: Number, default: 0 }, // Sum of all cleared amounts
    totalCrewPending: { type: Number, default: 0 }, // Total labor liabilities pending
    grossMarginAmount: { type: Number, default: 0 }, // (Client Total - Discount) - totalCrewBudget
    grossMarginPercentage: { type: Number, default: 0 }, // (grossMarginAmount / clientTotal) * 100

    status: { 
      type: String, 
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], 
      default: 'PENDING' 
    },
    notes: { type: String },
    shootStatus: { type: String },
    progressTracking: [{ type: String }],
    slot: { type: String },

    // =========================================================================
    // PROGRESSIVE QUOTATION VERSIONS EXTENSIONS
    // =========================================================================
    // Pointers to the current active and agreement versions
    activeVersionNumber: { type: Number, default: 1 },
    activeQuotationNumber: { type: String, default: '1' }, // e.g. '1', '2', '3'
    agreementVersionNumber: { type: Number, default: null }, // Null until explicitly chosen as Agreement

    // Array of immutable quotation snapshots
    versions: [{
      versionNumber: { type: Number, required: true }, // Sequential: 1, 2, 3...
      quotationNumber: { type: String, required: true }, // Display label: '1', '2', '3'
      versionName: { type: String, default: '' }, // e.g., 'Quotation 1 (Initial Quote)', 'Quotation 2'
      note: { type: String, default: '' }, // Admin reason for this revision (e.g., 'Added drone & traditional video')
      isAgreement: { type: Boolean, default: false }, // True ONLY if this specific version is finalized as the Agreement
      createdAt: { type: Date, default: Date.now },
      date: { type: String, default: '' }, // Shoot/event date for this version
      
      // Complete snapshot of items and services for this version
      subEventList: [{
        name: { type: String }, // e.g., 'Haldi', 'Wedding', 'Reception'
        services: [{
          name: { type: String },
          price: { type: Number, default: 0 },
          quantity: { type: Number, default: 1 }
        }]
      }],
      deliverables: [{ name: { type: String }, price: { type: Number, default: 0 } }],
      complimentries: [{ name: { type: String }, price: { type: Number, default: 0 } }],
      addOns: [{ name: { type: String }, price: { type: Number, default: 0 } }],
      album: {
        enabled: { type: Boolean, default: false },
        numberOfAlbums: { type: Number, default: 1 },
        sheets: { type: Number, default: 0 },
        pricePerSheet: { type: Number, default: 500 }
      },

      // Financial snapshot
      totalAmount: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      discountPercentage: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 }
    }],

    // Audit trail for tracking quotation changes
    followUps: [{
      note: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
export default Event;
