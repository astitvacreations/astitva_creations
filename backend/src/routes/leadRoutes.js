import express from 'express';
import { createLead, getLeads, updateLeadStatus, deleteLead } from '../controllers/leadController.js';

const router = express.Router();

router.post('/', createLead);
router.get('/', getLeads);
router.patch('/:id', updateLeadStatus);
router.delete('/:id', deleteLead);

export default router;
