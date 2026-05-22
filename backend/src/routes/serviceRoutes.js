import express from 'express';
import { getServices, getServiceBySlug, createService, updateService, deleteService } from '../controllers/serviceController.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:slug', getServiceBySlug);

// Admin routes (would normally be protected by auth middleware)
router.post('/', createService);
router.patch('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
