import express from 'express';
import { getLandingPage, getAllLandingPages, updateLandingPage } from '../controllers/landingPageController.js';

const router = express.Router();

router.get('/', getAllLandingPages);
router.get('/:slug', getLandingPage);
router.patch('/:slug', updateLandingPage);
router.post('/:slug', updateLandingPage); // alias for upsert

export default router;
