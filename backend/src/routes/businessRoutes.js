import express from 'express';
import { getBusinessOverview, getBusinessShoots, getBusinessRentals, getBusinessEvents } from '../controllers/businessController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/overview').get(protect, getBusinessOverview);
router.route('/shoots').get(protect, getBusinessShoots);
router.route('/rentals').get(protect, getBusinessRentals);
router.route('/events').get(protect, getBusinessEvents);

export default router;
