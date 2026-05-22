import { Pricing } from '../models/Pricing.js';

// @desc    Get all pricing items
// @route   GET /api/pricing
// @access  Public
export const getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find().sort({ category: 1, serviceName: 1 });
    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update pricing item
// @route   POST /api/pricing
// @access  Admin
export const savePricing = async (req, res) => {
  try {
    const { _id, serviceName, category, basePrice, fullDayPrice, isActive } = req.body;
    
    let pricing;
    if (_id) {
      // If we have an ID, update the item directly
      pricing = await Pricing.findByIdAndUpdate(
        _id,
        { serviceName, category, basePrice: Number(basePrice), fullDayPrice: fullDayPrice ? Number(fullDayPrice) : undefined, isActive },
        { new: true }
      );
    } else {
      // Otherwise, check if serviceName already exists, update or create it
      pricing = await Pricing.findOneAndUpdate(
        { serviceName },
        { category, basePrice: Number(basePrice), fullDayPrice: fullDayPrice ? Number(fullDayPrice) : undefined, isActive: isActive !== undefined ? isActive : true },
        { returnDocument: 'after', upsert: true }
      );
    }
    
    res.status(201).json(pricing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete pricing item
// @route   DELETE /api/pricing/:id
// @access  Admin
export const deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing item not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
