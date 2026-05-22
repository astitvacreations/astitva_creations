import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';

const router = express.Router();

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/', updateSettings);

export default router;
