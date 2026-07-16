import express from 'express';
import { getPropRentals, createPropRental, updatePropRental, deletePropRental, getInventory, createInventoryItem, deleteInventoryItem } from '../controllers/propRentalController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPropRentals)
  .post(protect, createPropRental);

router.route('/inventory')
  .get(protect, getInventory)
  .post(protect, createInventoryItem);

router.route('/inventory/:id')
  .delete(protect, deleteInventoryItem);

router.route('/:id')
  .put(protect, updatePropRental)
  .delete(protect, deletePropRental);

export default router;
