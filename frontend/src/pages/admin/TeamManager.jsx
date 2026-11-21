import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Camera, 
  Film, 
  Search, 
  Phone, 
  Mail, 
  IndianRupee, 
  Shield, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  FileText, 
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';
import TeamPermissions from './TeamPermissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SKILL_OPTIONS = [
  'Lead Candid Photographer',
  'Traditional Photographer',
  'Candid Cinematographer',
  'Traditional Videographer',
  'Drone Pilot',
  'Photo Editor',
  'Video Editor',
  'Shoot Assistant / Lighting'
];

export default function TeamManager() {
  const [activeTab, setActiveTab] = useState('crew'); // 'crew' or 'permissions'
  const [crewMembers, setCrewMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Modal states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Lead Candid Photographer',
    primarySkills: ['Lead Candid Photographer'],
    upiId: '',
    standardDayRate: '',
    isActive: true,
    notes: ''
  });
  const [savingMember, setSavingMember] = useState(false);

  // Ledger Modal State
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [selectedLedgerMember, setSelectedLedgerMember] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const fetchCrewMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/team/crew-members`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrewMembers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching crew directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewMembers();
  }, []);

  const handleOpenMemberModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        role: member.role || 'Lead Candid Photographer',
        primarySkills: member.primarySkills || [],
        upiId: member.upiId || '',
        standardDayRate: member.standardDayRate || '',
        isActive: member.isActive !== undefined ? member.isActive : true,
        notes: member.notes || ''
      });
    } else {
      setEditingMember(null);
      setMemberForm({
        name: '',
        phone: '',
        email: '',
        role: 'Lead Candid Photographer',
        primarySkills: ['Lead Candid Photographer'],
        upiId: '',
        standardDayRate: '',
        isActive: true,
        notes: ''
      });
    }
    setIsMemberModalOpen(true);
  };

  const handleToggleSkill = (skill) => {
    setMemberForm(prev => {
      const exists = prev.primarySkills.includes(skill);
      return {
        ...prev,
        primarySkills: exists 
          ? prev.primarySkills.filter(s => s !== skill) 
          : [...prev.primarySkills, skill]
      };
    });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return alert('Name is required');

    setSavingMember(true);
    try {
      const url = editingMember 
        ? `${API_URL}/team/crew-members/${editingMember._id}` 
        : `${API_URL}/team/crew-members`;
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(memberForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsMemberModalOpen(false);
        fetchCrewMembers();
      } else {
        alert(data.message || 'Failed to save team member');
      }
    } catch (err) {
      console.error('Save member error:', err);
      alert('Network error saving team member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the crew roster?`)) return;
    try {
      const res = await fetch(`${API_URL}/team/crew-members/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCrewMembers();
      } else {
        alert(data.message || 'Failed to delete member');
      }
    } catch (err) {
      console.error('Delete member error:', err);
      alert('Network error deleting member');
    }
  };

  const handleOpenLedger = async (member) => {
    setSelectedLedgerMember(member);
    setLedgerModalOpen(true);
    setLoadingLedger(true);
    try {
      const res = await fetch(`${API_URL}/team/${member._id}/ledger`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setLedgerData(data);
      } else {
        setLedgerData(null);
      }
    } catch (err) {
      console.error('Fetch ledger error:', err);
      setLedgerData(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Filter members by search and role
  const filteredMembers = crewMembers.filter(m => {
    const matchesSearch = 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.includes(searchTerm) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedRoleFilter === 'ALL') return true;
    return (m.primarySkills || []).some(s => s.toLowerCase().includes(selectedRoleFilter.toLowerCase())) ||
           m.role?.toLowerCase().includes(selectedRoleFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-body">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-heading font-bold uppercase tracking-wider text-white">
                Team & Crew Management
              </h1>
              <p className="text-xs text-[#888] mt-0.5">
                Manage crew directory, role allocations, standard wage rates, payout ledgers, and staff permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Primary Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#121214] border border-[#26262a] rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('crew')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'crew'
                  ? 'bg-[var(--color-gold)] text-black shadow-md'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Crew Directory ({crewMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'permissions'
                  ? 'bg-[var(--color-gold)] text-black shadow-md'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Staff Permissions
            </button>
          </div>

          {activeTab === 'crew' && (
            <button
              onClick={() => handleOpenMemberModal()}
              className="px-4 py-2.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              + Add Crew Member
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CREW DIRECTORY */}
      {activeTab === 'crew' && (
        <div className="space-y-6">

          {/* Search & Skill Filters */}
          <div className="bg-[#0f0f12] border border-[#222] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#666] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, phone, role, or UPI ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#17171a] border border-[#2e2e34] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#666] outline-none focus:border-[var(--color-gold)]"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Photographer', 'Cinematographer', 'Drone', 'Editor', 'Assistant'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedRoleFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedRoleFilter === filter
                      ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/50'
                      : 'bg-[#151518] text-[#888] hover:text-white border border-[#26262a]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Crew Members Grid */}
          {loading ? (
            <div className="py-20 text-center text-[#888] font-mono text-xs">
              Loading team directory...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-[#0f0f12] border border-[#222] rounded-2xl p-12 text-center text-[#888]">
              <Users className="w-12 h-12 mx-auto mb-3 text-[#444]" />
              <p className="text-sm font-semibold text-white">No crew members found</p>
              <p className="text-xs text-[#666] mt-1">Add your photographers, cinematographers, drone pilots, and editors to start allocating events.</p>
              <button
                onClick={() => handleOpenMemberModal()}
                className="mt-4 px-4 py-2 bg-[var(--color-gold)] text-black font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-[#c49f33]"
              >
                + Add First Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMembers.map(member => (
                <div
                  key={member._id}
                  className="bg-[#0f0f12] border border-[#26262a] hover:border-[#383840] rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Member Header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h4 className="text-base font-heading font-bold text-white uppercase tracking-wider">
                          {member.name}
                        </h4>
                        <p className="text-xs text-[var(--color-gold)] font-medium">
                          {member.role || 'Crew Member'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono ${
                        member.isActive 
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Contact & Wage Details */}
                    <div className="space-y-1.5 text-xs text-[#aaa] bg-[#141417] p-3 rounded-xl border border-[#222] mb-3">
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#666]" />
                        <span className="font-mono text-white/90">{member.phone || 'No phone'}</span>
                      </p>
                      {member.email && (
                        <p className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-[#666]" />
                          <span className="truncate text-white/90">{member.email}</span>
                        </p>
                      )}
                      {member.upiId && (
                        <p className="flex items-center gap-2 text-amber-300 font-mono">
                          <CreditCard className="w-3.5 h-3.5 text-[#666]" />
                          <span>{member.upiId}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2 pt-1 border-t border-[#222]">
                        <IndianRupee className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[#888]">Standard Day Rate:</span>
                        <strong className="text-green-400 font-mono">₹{(member.standardDayRate || 0).toLocaleString('en-IN')}</strong>
                      </p>
                    </div>

                    {/* Primary Skills Chips */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(member.primarySkills || []).map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-[#1b1b20] border border-[#2c2c34] text-[10px] font-semibold text-[#bbb] rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-[#222] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenLedger(member)}
                      className="flex-1 py-2 px-3 bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Historical Ledger
                    </button>

                    <button
                      onClick={() => handleOpenMemberModal(member)}
                      className="p-2 bg-[#1b1b20] hover:bg-[#25252c] text-[#ccc] hover:text-white border border-[#333] rounded-xl transition-colors"
                      title="Edit Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteMember(member._id, member.name)}
                      className="p-2 bg-[#2d1212] hover:bg-[#451616] text-rose-400 border border-rose-500/30 rounded-xl transition-colors"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: STAFF PERMISSIONS & PARTNERS */}
      {activeTab === 'permissions' && (
        <div className="bg-[#0f0f12] border border-[#222] rounded-2xl p-6 shadow-xl">
          <TeamPermissions />
        </div>
      )}

      {/* ADD / EDIT CREW MEMBER MODAL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-[#26262a] rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-[#222] mb-4">
              <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider">
                {editingMember ? 'Edit Crew Member' : 'Add New Crew Member'}
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-[#888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Naveen Prasad"
                    value={memberForm.name}
                    onChange={e => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    Phone (for WhatsApp Briefs) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 919876543210"
                    value={memberForm.phone}
                    onChange={e => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. naveen@example.com"
                    value={memberForm.email}
                    onChange={e => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    Primary Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Candid Photographer"
                    value={memberForm.role}
                    onChange={e => setMemberForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    UPI ID (Destination for Payouts)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. naveen@okhdfcbank"
                    value={memberForm.upiId}
                    onChange={e => setMemberForm(prev => ({ ...prev, upiId: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none focus:border-[var(--color-gold)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                    Standard Day Rate (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={memberForm.standardDayRate}
                    onChange={e => setMemberForm(prev => ({ ...prev, standardDayRate: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-xl px-3 py-2 text-xs text-green-400 font-mono font-bold outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              {/* Skills Checkboxes */}
              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-2">
                  Skills & Coverage Capabilities
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto bg-[#18181c] p-3 rounded-xl border border-[#2a2a30]">
                  {SKILL_OPTIONS.map(skill => {
                    const checked = memberForm.primarySkills.includes(skill);
                    return (
                      <label
                        key={skill}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                          checked ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] font-bold' : 'text-[#888] hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleSkill(skill)}
                          className="accent-[var(--color-gold)]"
                        />
                        <span className="text-[11px] truncate">{skill}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#aaa]">Active Member Status:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memberForm.isActive}
                    onChange={e => setMemberForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-xs font-bold text-white uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="px-6 py-2 bg-[var(--color-gold)] hover:bg-[#c49f33] text-xs font-bold text-black uppercase rounded-xl shadow-md disabled:opacity-50"
                >
                  {savingMember ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* HISTORICAL LEDGER STATEMENT MODAL */}
      {ledgerModalOpen && selectedLedgerMember && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#101013] border border-[#26262a] rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Ledger Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#222] shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-950/80 text-blue-400 border border-blue-500/30 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider">
                    {selectedLedgerMember.name} • Lifetime Wage Statement
                  </h3>
                  <p className="text-xs text-[#888] font-mono">
                    UPI: {selectedLedgerMember.upiId || 'N/A'} • Rate: ₹{(selectedLedgerMember.standardDayRate || 0).toLocaleString('en-IN')}/shoot
                  </p>
                </div>
              </div>

              <button onClick={() => setLedgerModalOpen(false)} className="text-[#888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ledger Content */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6">
              {loadingLedger ? (
                <div className="py-16 text-center text-[#888] font-mono text-xs">
                  Calculating lifetime allocations & payouts...
                </div>
              ) : !ledgerData ? (
                <div className="py-16 text-center text-[#888]">
                  No ledger transactions available for this member.
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-3.5">
                      <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Assigned Events</p>
                      <p className="text-xl font-bold text-white font-mono">
                        {ledgerData.summary?.totalAssignedEvents || 0}
                      </p>
                    </div>

                    <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-3.5">
                      <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Lifetime Budget</p>
                      <p className="text-xl font-bold text-[var(--color-gold)] font-mono">
                        ₹{(ledgerData.summary?.lifetimeAllottedBudget || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-3.5">
                      <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Cleared Payouts</p>
                      <p className="text-xl font-bold text-emerald-400 font-mono">
                        ₹{(ledgerData.summary?.lifetimeClearedPayouts || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-3.5">
                      <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Pending Balance</p>
                      <p className="text-xl font-bold text-amber-400 font-mono">
                        ₹{(ledgerData.summary?.totalPendingLiabilities || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Assignments Table */}
                  <div>
                    <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider mb-3">
                      Historical Event Allocations & Payouts
                    </h4>

                    {(ledgerData.assignments || []).length === 0 ? (
                      <p className="text-xs text-[#666] italic py-6 text-center bg-[#151518] rounded-xl">
                        No event assignments recorded yet.
                      </p>
                    ) : (
                      <div className="bg-[#151518] border border-[#26262a] rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#1c1c22] border-b border-[#2e2e36] text-[10px] uppercase tracking-wider text-[#888]">
                            <tr>
                              <th className="py-2.5 px-3 font-bold">Event & Date</th>
                              <th className="py-2.5 px-3 font-bold">Assigned Roles</th>
                              <th className="py-2.5 px-3 font-bold">Allotted</th>
                              <th className="py-2.5 px-3 font-bold">Cleared</th>
                              <th className="py-2.5 px-3 font-bold">Pending</th>
                              <th className="py-2.5 px-3 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222]">
                            {ledgerData.assignments.map(item => {
                              const ev = item.eventId;
                              const dateStr = ev?.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN') : 'TBD';
                              return (
                                <tr key={item._id} className="hover:bg-[#1a1a20] transition-colors">
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-white truncate max-w-[150px]">{ev?.eventName || 'Event'}</p>
                                    <p className="text-[10px] text-[#777] font-mono">{dateStr} • {ev?.clientName || 'Client'}</p>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-[11px] text-[#ccc]">
                                      {(item.assignedRoles || []).join(', ')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-white">
                                    ₹{(item.allottedBudget || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                                    ₹{(item.clearedAmount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                                    ₹{(item.pendingAmount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                      item.payoutStatus === 'Fully Cleared' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30' :
                                      item.payoutStatus === 'Partially Cleared' ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30' :
                                      'bg-rose-950/70 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      {item.payoutStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#222] flex justify-end shrink-0">
              <button
                onClick={() => setLedgerModalOpen(false)}
                className="px-5 py-2 bg-[#222] hover:bg-[#333] text-xs font-bold text-white uppercase rounded-xl"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
