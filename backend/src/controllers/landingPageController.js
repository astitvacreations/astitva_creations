import { LandingPage } from '../models/LandingPage.js';

// @desc    Get a landing page by slug
// @route   GET /api/landing-pages/:slug
// @access  Public
export const getLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = await LandingPage.findOne({ slug });
    if (!page) {
      // Auto-create with defaults on first access
      page = await LandingPage.create({ slug });
    }
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all landing pages
// @route   GET /api/landing-pages
// @access  Admin
export const getAllLandingPages = async (req, res) => {
  try {
    const pages = await LandingPage.find();
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a landing page by slug
// @route   PATCH /api/landing-pages/:slug
// @access  Admin
export const updateLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { _id, __v, createdAt, updatedAt, ...updates } = req.body;
    const page = await LandingPage.findOneAndUpdate(
      { slug },
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
