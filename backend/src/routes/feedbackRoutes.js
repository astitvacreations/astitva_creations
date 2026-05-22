import express from 'express';
import { requestFeedbackEmail, validateFeedbackToken, submitFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/request', requestFeedbackEmail);
router.get('/validate/:token', validateFeedbackToken);
router.post('/submit', submitFeedback);

export default router;
