import express from 'express';
import { getProjects, getProjectBySlug, createProject, updateProject, deleteProject, removeImageFromProject } from '../controllers/projectController.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/:slug', getProjectBySlug);

// Admin routes (would normally be protected by auth middleware)
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.delete('/:id/images', removeImageFromProject);

export default router;
