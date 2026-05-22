import express from 'express';
import { createQuoteRequest, getBookings, updateBookingStatus, deleteBooking, getBookingPDF, applyDiscount, updateQuoteRequest, getBookingPDFPreview } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/quote', createQuoteRequest);
router.post('/pdf-preview', getBookingPDFPreview);
router.get('/', getBookings);
router.get('/:id/pdf', getBookingPDF);
router.put('/:id', updateQuoteRequest);
router.patch('/:id', updateBookingStatus);
router.patch('/:id/discount', applyDiscount);
router.delete('/:id', deleteBooking);

export default router;

