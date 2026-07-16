import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, X, Save } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const availableOptions = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Business', path: '/admin/business' },
  { label: 'Events', path: '/admin/events' },
  { label: 'Prop Rentals', path: '/admin/prop-rentals' },
  { label: 'Projects', path: '/admin/projects' },
  { label: 'Services', path: '/admin/services' },
  { label: 'Landing Pages', path: '/admin/landing-pages' },
  { label: 'Pricing Engine', path: '/admin/pricing' },
  { label: 'Quotes', path: '/admin/quotes' },
  { label: 'Leads', path: '/admin/leads' },
  { label: 'Testimonials', path: '/admin/testimonials' },
  { label: 'Feedback', path: '/admin/feedback' },
  { label: 'Settings', path: '/admin/settings' },
  { label: 'Permissions', path: '/admin/permissions' }
];

export default function TeamPermissions() {
  const { admin } = useAuthStore();
  const [team, setTeam] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', permissions: [] });
  const [error, setError] = useState('');

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerEditingId, setPartnerEditingId] = useState(null);
  const [partnerFormData, setPartnerFormData] = useState({ name: '', percentage: 0 });
  const [partnerError, setPartnerError] = useState('');

  const isSuperAdmin = admin?.email === 'ssaiprasanth333@gmail.com';
  const myPermissions = admin?.permissions || [];

  const fetchTeamAndPartners = async () => {
    try {
      const [teamRes, partnerRes] = await Promise.all([
        fetch(`${apiBase}/team`, { credentials: 'include' }),
        fetch(`${apiBase}/partners`, { credentials: 'include' })
      ]);
      const teamData = await teamRes.json();
      const partnerData = await partnerRes.json();
      if (teamRes.ok && teamData.success) {
        setTeam(teamData.data);
      }
      if (partnerRes.ok && partnerData.success) {
        setPartners(partnerData.data);
      }
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndPartners();
  }, []);

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingId(member._id);
      setFormData({ email: member.email, password: '', permissions: member.permissions || [] });
    } else {
      setEditingId(null);
      setFormData({ email: '', password: '', permissions: [] });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleTogglePermission = (path) => {
    setFormData(prev => {
      if (prev.permissions.includes(path)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== path) };
      } else {
        return { ...prev, permissions: [...prev.permissions, path] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingId ? `${apiBase}/team/${editingId}` : `${apiBase}/team`;
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = { permissions: formData.permissions };
      if (!editingId) {
        payload.email = formData.email;
        payload.password = formData.password;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        handleCloseModal();
        fetchTeamAndPartners();
      } else {
        setError(data.message || 'Error saving team member');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network or Server error. Did you restart the backend?');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`${apiBase}/team/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchTeamAndPartners();
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting member');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--color-gold)]" />
            Team Permissions
          </h2>
          <p className="text-[#A1A1A1] mt-1">Manage team members and their access levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPartnerEditingId(null);
              setPartnerFormData({ name: '', percentage: 0 });
              setIsPartnerModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#222] text-white font-bold uppercase tracking-wider rounded-lg hover:bg-[#333] transition-colors border border-[#333]"
          >
            <Plus className="w-5 h-5 text-[var(--color-gold)]" />
            Add Partner
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-gold)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-[#222] p-6 rounded-xl hover:border-[var(--color-gold)]/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center font-bold uppercase text-xl">
                    {member.email.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white truncate max-w-[150px]" title={member.email}>{member.email}</h3>
                    <p className="text-xs text-[#A1A1A1]">{member.email === 'ssaiprasanth333@gmail.com' ? 'Super Admin' : 'Admin'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {member.email !== 'ssaiprasanth333@gmail.com' && (
                    <>
                      <button 
                        onClick={() => handleOpenModal(member)}
                        className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors rounded-lg hover:bg-[#222]"
                        title="Edit Permissions"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member._id)}
                        className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors rounded-lg hover:bg-[#222]"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-[#A1A1A1] uppercase tracking-wider mb-2 font-semibold">Access Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {member.email === 'ssaiprasanth333@gmail.com' ? (
                    <span className="px-2 py-1 bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-xs rounded-full border border-[var(--color-gold)]/20">
                      All Access
                    </span>
                  ) : (
                    member.permissions?.map(perm => {
                      const opt = availableOptions.find(o => o.path === perm);
                      return opt ? (
                        <span key={perm} className="px-2 py-1 bg-[#222] text-[#E0E0E0] text-xs rounded-full border border-[#333]">
                          {opt.label}
                        </span>
                      ) : null;
                    })
                  )}
                  {member.email !== 'ssaiprasanth333@gmail.com' && (!member.permissions || member.permissions.length === 0) && (
                    <span className="text-xs text-red-400">No access granted</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && partners.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-heading text-white mb-6 uppercase tracking-wider">Business Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <motion.div
                key={partner._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111] border border-[#222] p-6 rounded-xl hover:border-[var(--color-gold)]/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white uppercase truncate">{partner.name}</h3>
                    <p className="text-sm text-[#A1A1A1] mt-1">{partner.percentage}% Share</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setPartnerEditingId(partner._id);
                        setPartnerFormData({ name: partner.name, percentage: partner.percentage });
                        setIsPartnerModalOpen(true);
                      }}
                      className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors rounded-lg hover:bg-[#222]"
                      title="Edit Partner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to remove this partner?')) return;
                        try {
                          const res = await fetch(`${apiBase}/partners/${partner._id}`, { method: 'DELETE', credentials: 'include' });
                          if (res.ok) fetchTeamAndPartners();
                          else alert('Failed to delete partner');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors rounded-lg hover:bg-[#222]"
                      title="Remove Partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-heading text-[var(--color-gold)]">
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button onClick={handleCloseModal} className="text-[#A1A1A1] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    placeholder="member@astitvacreations.com"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">
                  {editingId ? 'Change Password (Optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2 mt-6">
                  Permissions
                </label>
                {formData.email === admin?.email ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {formData.email === 'ssaiprasanth333@gmail.com' ? (
                      <div className="p-3 rounded-lg border border-[#222] bg-[#050505] text-[#A1A1A1] text-sm">
                        You are the Super Admin. You have all access by default.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.permissions.length > 0 ? (
                          formData.permissions.map(perm => {
                            const opt = availableOptions.find(o => o.path === perm);
                            return opt ? (
                              <span key={perm} className="px-3 py-2 bg-[#222] text-[#E0E0E0] text-sm rounded-lg border border-[#333]">
                                {opt.label}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-sm text-red-400">No permissions assigned.</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableOptions.map((option) => {
                      // Non-superadmin can only assign permissions they have
                      const canAssign = isSuperAdmin || myPermissions.includes(option.path);
                      
                      if (!canAssign) return null; // Hide options they can't assign to others
                      
                      return (
                        <label key={option.path} className="flex items-center gap-3 p-3 rounded-lg border border-[#222] bg-[#050505] cursor-pointer hover:border-[var(--color-gold)]/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(option.path)}
                            onChange={() => handleTogglePermission(option.path)}
                            className="w-4 h-4 text-[var(--color-gold)] bg-[#222] border-[#333] rounded focus:ring-[var(--color-gold)] focus:ring-offset-[#111]"
                          />
                          <span className="text-sm font-semibold">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <button
                type="submit"
                className="w-full py-4 mt-6 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingId ? 'Save Changes' : 'Create Member'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-heading text-[var(--color-gold)]">
                {partnerEditingId ? 'Edit Business Partner' : 'Add Business Partner'}
              </h3>
              <button onClick={() => { setIsPartnerModalOpen(false); setPartnerError(''); setPartnerEditingId(null); }} className="text-[#A1A1A1] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setPartnerError('');

              const currentTotal = partners.reduce((sum, p) => p._id === partnerEditingId ? sum : sum + p.percentage, 0);
              if (currentTotal + partnerFormData.percentage > 100) {
                setPartnerError(`Total share cannot exceed 100%. Currently used: ${currentTotal}%`);
                return;
              }

              try {
                const url = partnerEditingId ? `${apiBase}/partners/${partnerEditingId}` : `${apiBase}/partners`;
                const method = partnerEditingId ? 'PUT' : 'POST';
                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(partnerFormData)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  setIsPartnerModalOpen(false);
                  setPartnerFormData({ name: '', percentage: 0 });
                  setPartnerEditingId(null);
                  fetchTeamAndPartners();
                } else {
                  setPartnerError(data.message || 'Error saving partner');
                }
              } catch (err) {
                setPartnerError(err.message || 'Network error');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Partner Name</label>
                <input
                  type="text"
                  required
                  value={partnerFormData.name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  placeholder="e.g. Tiru"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Share Percentage (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={partnerFormData.percentage}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, percentage: Number(e.target.value) })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  placeholder="e.g. 50"
                />
              </div>

              {partnerError && <p className="text-red-500 text-sm mt-2">{partnerError}</p>}

              <button
                type="submit"
                className="w-full py-4 mt-6 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {partnerEditingId ? 'Save Changes' : 'Add Partner'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
