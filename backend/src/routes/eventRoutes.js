import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent, getPredefinedServices, createPredefinedService, updatePredefinedService, deletePredefinedService, getEventPDF, sendEventPDFEmail } from '../controllers/eventController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/predefined-services')
  .get(protect, getPredefinedServices)
  .post(protect, createPredefinedService);

router.route('/predefined-services/:id')
  .put(protect, updatePredefinedService)
  .delete(protect, deletePredefinedService);

router.route('/:id')
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

router.route('/:id/pdf')
  .get(protect, getEventPDF);

router.route('/:id/send-pdf')
  .post(protect, sendEventPDFEmail);

export default router;
