import express from 'express';
import { getPricing, savePricing, deletePricing } from '../controllers/pricingController.js';

const router = express.Router();

router.get('/', getPricing);
router.post('/', savePricing);
router.delete('/:id', deletePricing);

export default router;
