import express from 'express';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/teamController.js';
import {
  getTeamMemberLedger,
  listCrewMembers,
  listPublicCrewMembers,
  createCrewMember,
  getCrewMemberById,
  updateCrewMember,
  deleteCrewMember
} from '../controllers/crewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint for About Us page
router.get('/public', listPublicCrewMembers);

// =========================================================================
// CREW DIRECTORY & HISTORICAL EARNINGS LEDGER
// =========================================================================
router.route('/directory/members')
  .get(protect, listCrewMembers)
  .post(protect, createCrewMember);

router.route('/directory/members/:id')
  .get(protect, getCrewMemberById)
  .put(protect, updateCrewMember)
  .delete(protect, deleteCrewMember);

router.route('/crew-members')
  .get(protect, listCrewMembers)
  .post(protect, createCrewMember);

router.route('/crew-members/:id')
  .get(protect, getCrewMemberById)
  .put(protect, updateCrewMember)
  .delete(protect, deleteCrewMember);

router.route('/ledger/:memberId')
  .get(protect, getTeamMemberLedger);

router.route('/:memberId/ledger')
  .get(protect, getTeamMemberLedger);

// =========================================================================
// ADMIN TEAM PERMISSIONS (EXISTING)
// =========================================================================
router.route('/')
  .get(protect, getTeamMembers)
  .post(protect, addTeamMember);

router.route('/:id')
  .put(protect, updateTeamMember)
  .delete(protect, deleteTeamMember);

export default router;
