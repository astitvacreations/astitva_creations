import express from 'express';
import { 
  getPaymentReceiptPDF, 
  getDailyPaymentsSummary 
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Publicly accessible digital receipt download link sent via WhatsApp / invoice
router.get('/:paymentId/receipt.pdf', getPaymentReceiptPDF);
router.get('/receipt/:paymentId.pdf', getPaymentReceiptPDF);

// Admin daily payments & multi-UPI reconciliation summary
router.get('/daily-summary', protect, getDailyPaymentsSummary);

export default router;
