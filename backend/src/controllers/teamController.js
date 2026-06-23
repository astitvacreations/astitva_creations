import Admin from '../models/Admin.js';

const SUPERADMIN_EMAIL = 'ssaiprasanth333@gmail.com';

// Helper to check if array subset
const isSubset = (subset, superset) => subset.every(val => superset.includes(val));

const hasPermissionsAccess = (admin) => {
  if (admin.email === SUPERADMIN_EMAIL) return true;
  return admin.permissions && admin.permissions.includes('/admin/permissions');
};

/**
 * @desc    Get all team members
 * @route   GET /api/team
 * @access  Private
 */
export const getTeamMembers = async (req, res) => {
  try {
    if (!hasPermissionsAccess(req.admin)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    
    // Do not return the password field
    const members = await Admin.find({}).select('-password -otp -otpExpiry');
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Add a team member
 * @route   POST /api/team
 * @access  Private
 */
export const addTeamMember = async (req, res) => {
  try {
    if (!hasPermissionsAccess(req.admin)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }

    const { email, password, permissions } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const targetPermissions = permissions || [];

    if (req.admin.email !== SUPERADMIN_EMAIL) {
      if (!isSubset(targetPermissions, req.admin.permissions || [])) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only assign permissions you possess' });
      }
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
    }

    const newAdmin = await Admin.create({
      email,
      password,
      permissions: targetPermissions
    });

    res.status(201).json({ success: true, data: { id: newAdmin._id, email: newAdmin.email, permissions: newAdmin.permissions } });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Update a team member
 * @route   PUT /api/team/:id
 * @access  Private
 */
export const updateTeamMember = async (req, res) => {
  try {
    if (!hasPermissionsAccess(req.admin)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }

    const { permissions, password } = req.body;
    const targetAdmin = await Admin.findById(req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // A normal admin cannot edit the superadmin
    if (targetAdmin.email === SUPERADMIN_EMAIL && req.admin.email !== SUPERADMIN_EMAIL) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify superadmin' });
    }

    if (permissions) {
      if (req.admin.email !== SUPERADMIN_EMAIL) {
        if (!isSubset(permissions, req.admin.permissions || [])) {
          return res.status(403).json({ success: false, message: 'Forbidden: You can only assign permissions you possess' });
        }
      }
      targetAdmin.permissions = permissions;
    }

    if (password) {
      targetAdmin.password = password;
    }

    await targetAdmin.save();
    res.status(200).json({ success: true, data: { id: targetAdmin._id, email: targetAdmin.email, permissions: targetAdmin.permissions } });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc    Delete a team member
 * @route   DELETE /api/team/:id
 * @access  Private
 */
export const deleteTeamMember = async (req, res) => {
  try {
    if (!hasPermissionsAccess(req.admin)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }

    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    if (targetAdmin.email === SUPERADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete superadmin' });
    }

    // A normal admin cannot delete someone who has permissions they don't have
    if (req.admin.email !== SUPERADMIN_EMAIL) {
      if (!isSubset(targetAdmin.permissions || [], req.admin.permissions || [])) {
          return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete an admin with higher permissions than you' });
      }
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Team member removed' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
