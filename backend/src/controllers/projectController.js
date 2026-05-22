import { Project } from '../models/Project.js';
import { cloudinary } from '../config/cloudinary.js';

export const getProjects = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    
    // If we want to filter by category slug or name, we'd populate and filter.
    // For simplicity, let's return all active projects and populate serviceId
    const projects = await Project.find(query).populate('serviceId', 'title slug').sort({ date: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isActive: true }).populate('serviceId', 'title slug');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();
    const populated = await savedProject.populate('serviceId', 'title slug');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('serviceId', 'title slug');
    if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Collect all public_ids
    const publicIds = [];
    if (project.coverImage && project.coverImage.public_id) {
      publicIds.push(project.coverImage.public_id);
    }
    if (project.mainImage && project.mainImage.public_id) {
      publicIds.push(project.mainImage.public_id);
    }
    if (project.images && project.images.length > 0) {
      project.images.forEach(img => {
        if (img.public_id) publicIds.push(img.public_id);
      });
    }

    // Delete all from Cloudinary in parallel
    if (publicIds.length > 0) {
      await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id)));
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeImageFromProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: 'public_id is required' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Remove from MongoDB
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $pull: { images: { public_id: public_id } } },
      { new: true }
    ).populate('serviceId', 'title slug');

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
