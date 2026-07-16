import { PropRental } from '../models/PropRental.js';
import { PropInventoryItem } from '../models/PropInventoryItem.js';
import { Expense } from '../models/Expense.js';

export const getInventory = async (req, res) => {
  try {
    const items = await PropInventoryItem.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const item = await PropInventoryItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await PropInventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPropRentals = async (req, res) => {
  try {
    const rentals = await PropRental.find().sort({ rentalDate: -1 });
    res.status(200).json({ success: true, data: rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPropRental = async (req, res) => {
  try {
    const rental = await PropRental.create(req.body);
    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePropRental = async (req, res) => {
  try {
    const rental = await PropRental.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
    res.status(200).json({ success: true, data: rental });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePropRental = async (req, res) => {
  try {
    const rental = await PropRental.findByIdAndDelete(req.params.id);
    if (!rental) return res.status(404).json({ success: false, message: 'Rental not found' });
    
    await Expense.deleteMany({ referenceId: rental._id, onModel: 'PropRental' });

    res.status(200).json({ success: true, message: 'Rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
