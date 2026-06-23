import express from 'express';
import { getLandingPage, getAllLandingPages, updateLandingPage, createLandingPage, deleteLandingPage } from '../controllers/landingPageController.js';

const router = express.Router();

router.get('/', getAllLandingPages);
router.post('/', createLandingPage);
router.get('/:slug', getLandingPage);
router.patch('/:slug', updateLandingPage);
router.delete('/:slug', deleteLandingPage);

export default router;
