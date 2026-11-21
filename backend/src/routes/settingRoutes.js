import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { 
  getPaymentAccounts, 
  addPaymentAccount, 
  deletePaymentAccount 
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/payment-accounts', protect, getPaymentAccounts);
router.post('/payment-accounts', protect, addPaymentAccount);
router.delete('/payment-accounts/:accountId', protect, deletePaymentAccount);

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/', updateSettings);

export default router;
