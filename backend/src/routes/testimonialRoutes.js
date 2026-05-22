import express from 'express';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonialController.js';

const router = express.Router();

router.get('/', getTestimonials);
router.post('/', createTestimonial);
router.patch('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;
