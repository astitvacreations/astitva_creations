import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPredefinedServices,
  createPredefinedService,
  updatePredefinedService,
  deletePredefinedService,
  getEventPDF,
  sendEventPDFEmail,
  createEventVersion,
  restoreEventVersion,
  setAgreementVersion,
  downloadEventPDF,
  getAgreementPDF,
  getQuotationVersionPDF,
  sendEventWhatsAppPDF
} from '../controllers/eventController.js';
import {
  addEventPayment,
  getEventPayments,
  deleteEventPayment,
  resendPaymentReceipt
} from '../controllers/paymentController.js';
import {
  getEventCrew,
  assignEventCrew,
  updateEventCrew,
  unassignEventCrew,
  recordCrewPayout,
  deleteCrewPayout,
  getEventCrewFinancialSummary
} from '../controllers/crewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// =========================================================================
// CREW WORK ALLOCATION, BUDGET TRACKING & PAYOUT LEDGER
// =========================================================================
router.route('/:id/crew')
  .get(protect, getEventCrew)
  .post(protect, assignEventCrew);

router.route('/:id/crew/financial-summary')
  .get(protect, getEventCrewFinancialSummary);

router.route('/:id/crew/:assignmentId')
  .put(protect, updateEventCrew)
  .delete(protect, unassignEventCrew);

router.route('/:id/crew/:assignmentId/payout')
  .post(protect, recordCrewPayout);

router.route('/:id/crew/:assignmentId/payout/:payoutId')
  .delete(protect, deleteCrewPayout);

// =========================================================================
// PAYMENT TRACKING & INSTALLMENT LEDGER ENGINE
// =========================================================================
router.route('/:id/payments')
  .get(protect, getEventPayments)
  .post(protect, addEventPayment);

router.route('/:id/payments/:paymentId')
  .delete(protect, deleteEventPayment);

router.route('/:id/payments/:paymentId/resend-receipt')
  .post(protect, resendPaymentReceipt);

// =========================================================================
// PREDEFINED SERVICES (ADMIN)
// =========================================================================
router.route('/predefined-services')
  .get(protect, getPredefinedServices)
  .post(protect, createPredefinedService);

router.route('/predefined-services/:id')
  .put(protect, updatePredefinedService)
  .delete(protect, deletePredefinedService);

// =========================================================================
// PROGRESSIVE QUOTATION VERSIONS
// =========================================================================
router.route('/:id/versions')
  .post(protect, createEventVersion);

router.route('/:id/versions/:vNum/restore')
  .put(protect, restoreEventVersion);

router.route('/:id/versions/:vNum/set-agreement')
  .put(protect, setAgreementVersion);

router.route('/:id/versions/:vNum/pdf')
  .get(getQuotationVersionPDF);

// =========================================================================
// DYNAMIC PDF GENERATION PIPELINE
// =========================================================================
// Defaults to Agreement if one is chosen; otherwise active quotation
router.route('/:id/download-pdf')
  .get(downloadEventPDF);

// Direct download for finalized Agreement PDF
router.route('/:id/agreement.pdf')
  .get(getAgreementPDF);

// Direct download for historical Quotation PDF (e.g. quotation-1.pdf, quotation-2.pdf)
router.route('/:id/quotation-:versionParam.pdf')
  .get(getQuotationVersionPDF);

// =========================================================================
// WHATSAPP QUOTATION SHARING
// =========================================================================
router.route('/:id/send-whatsapp-pdf')
  .post(protect, sendEventWhatsAppPDF);

// =========================================================================
// LEGACY COMPATIBILITY ROUTES
// =========================================================================
router.route('/:id/pdf')
  .get(protect, getEventPDF);

router.route('/:id/send-pdf')
  .post(protect, sendEventPDFEmail);

// =========================================================================
// PRIMARY EVENT CRUD
// =========================================================================
router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

export default router;
