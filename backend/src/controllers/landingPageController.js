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
      page = await LandingPage.create({ slug, title: slug });
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

// @desc    Create a landing page
// @route   POST /api/landing-pages
// @access  Admin
export const createLandingPage = async (req, res) => {
  try {
    const newPage = await LandingPage.create(req.body);
    res.status(201).json(newPage);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

// @desc    Delete a landing page by slug
// @route   DELETE /api/landing-pages/:slug
// @access  Admin
export const deleteLandingPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await LandingPage.findOneAndDelete({ slug });
    if (!page) {
      return res.status(404).json({ message: 'Landing page not found' });
    }
    res.status(200).json({ message: 'Landing page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
