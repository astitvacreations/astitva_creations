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
  Briefcase,
  Loader2
} from 'lucide-react';
import TeamPermissions from './TeamPermissions';
import ImageUpload from '../../components/admin/ImageUpload';

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
    avatar: '',
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

  // Wage & Payout Update Modal State (from Lifetime Wage Statement)
  const [wageEditModal, setWageEditModal] = useState({
    open: false,
    assignment: null,
    allottedBudget: '',
    shootFee: '',
    photoEditFee: '',
    videoEditFee: '',
    allowanceFee: '',
    payoutAmount: '',
    payoutType: 'UPI',
    payoutUtr: '',
    payoutNote: '',
    saving: false
  });

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
        avatar: member.avatar || '',
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
        avatar: '',
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

  const openEditWageModal = (assignment) => {
    setWageEditModal({
      open: true,
      assignment,
      allottedBudget: assignment.allottedBudget || 0,
      shootFee: assignment.shootFee || 0,
      photoEditFee: assignment.photoEditFee || 0,
      videoEditFee: assignment.videoEditFee || 0,
      allowanceFee: assignment.allowanceFee || 0,
      payoutAmount: '',
      payoutType: 'UPI',
      payoutUtr: '',
      payoutNote: '',
      saving: false
    });
  };

  const handleSaveWageEdit = async (e) => {
    if (e) e.preventDefault();
    const { assignment, allottedBudget, shootFee, photoEditFee, videoEditFee, allowanceFee, payoutAmount, payoutType, payoutUtr, payoutNote } = wageEditModal;
    if (!assignment) return;
    const evId = assignment.eventId?._id || assignment.eventId;
    if (!evId) {
      alert('Event ID not found');
      return;
    }
    setWageEditModal(prev => ({ ...prev, saving: true }));
    try {
      const sFee = Number(shootFee) || 0;
      const pFee = Number(photoEditFee) || 0;
      const vFee = Number(videoEditFee) || 0;
      const aFee = Number(allowanceFee) || 0;
      let totalBudget = Number(allottedBudget) || 0;
      if (sFee > 0 || pFee > 0 || vFee > 0 || aFee > 0) {
        totalBudget = sFee + pFee + vFee + aFee;
      }

      // 1. Update assignment fees
      const res = await fetch(`${API_URL}/events/${evId}/crew/${assignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          allottedBudget: totalBudget,
          shootFee: sFee,
          photoEditFee: pFee,
          videoEditFee: vFee,
          allowanceFee: aFee
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to update wage details');
        setWageEditModal(prev => ({ ...prev, saving: false }));
        return;
      }

      // 2. If payout amount entered, record payout
      const pAmount = Number(payoutAmount);
      if (pAmount > 0) {
        const pRes = await fetch(`${API_URL}/events/${evId}/crew/${assignment._id}/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: pAmount,
            paymentType: payoutType,
            utrNumber: payoutType === 'Cash' ? '' : payoutUtr.trim(),
            note: payoutNote.trim()
          })
        });
        const pData = await pRes.json();
        if (!pRes.ok || !pData.success) {
          alert(pData.message || 'Wage updated, but payout recording failed.');
        }
      }

      setWageEditModal({ open: false, assignment: null, saving: false });
      if (selectedLedgerMember) {
        await handleOpenLedger(selectedLedgerMember);
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating wage details');
      setWageEditModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteWagePayout = async (assignment, payoutId) => {
    if (!window.confirm('Delete / Reverse this payout record?')) return;
    const evId = assignment.eventId?._id || assignment.eventId;
    try {
      const res = await fetch(`${API_URL}/events/${evId}/crew/${assignment._id}/payout/${payoutId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (selectedLedgerMember) {
          await handleOpenLedger(selectedLedgerMember);
        }
        setWageEditModal(prev => {
          if (!prev.open || prev.assignment?._id !== assignment._id) return prev;
          const updated = data.data;
          return {
            ...prev,
            assignment: updated,
            allottedBudget: updated.allottedBudget,
            shootFee: updated.shootFee,
            photoEditFee: updated.photoEditFee,
            videoEditFee: updated.videoEditFee,
            allowanceFee: updated.allowanceFee
          };
        });
      } else {
        alert(data.message || 'Failed to delete payout');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting payout');
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
                    {/* Vertical Portrait Image Frame (as in Image 2) */}
                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#16161a] border border-[#26262a] relative mb-3 group/img">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 group-hover/img:scale-105 transition-all duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#18181c] to-[#0f0f12] text-[var(--color-gold)] p-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center font-heading font-bold text-2xl mb-2">
                            {member.name?.charAt(0) || 'C'}
                          </div>
                          <span className="text-[10px] uppercase tracking-widest text-[#666]">No Headshot</span>
                        </div>
                      )}
                      
                      {/* Active / Inactive Badge Overlay on Top Right */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border font-mono backdrop-blur-md shadow-md ${
                          member.isActive 
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' 
                            : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Member Details Below Photo (Exact Image 2 Style) */}
                    <div className="px-1 mb-3">
                      <h4 className="text-lg font-heading font-bold text-white uppercase tracking-wider truncate mb-0.5" title={member.name}>
                        {member.name}
                      </h4>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2 truncate">
                        {member.role || 'Crew Member'}
                      </p>
                      
                      {member.phone && (
                        <p className="flex items-center gap-2 text-xs font-mono text-[#ccc] mb-2">
                          <Phone className="w-3.5 h-3.5 text-pink-500 fill-pink-500/20 shrink-0" />
                          <span>{member.phone}</span>
                        </p>
                      )}
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
              {/* Member Photo Upload / Avatar */}
              <div className="bg-[#16161b] p-3.5 rounded-xl border border-[#2a2a32] flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  {memberForm.avatar ? (
                    <img 
                      src={memberForm.avatar} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-gold)] shadow" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#202028] border border-[#383844] flex items-center justify-center text-xl text-[var(--color-gold)] font-heading font-bold">
                      {memberForm.name?.charAt(0) || <Camera className="w-6 h-6 text-[#777]" />}
                    </div>
                  )}
                  {memberForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setMemberForm(prev => ({ ...prev, avatar: '' }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center shadow"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold">
                    Profile Photo / Headshot (Displays in Team & About Us)
                  </label>
                  <input
                    type="text"
                    placeholder="Paste image URL or upload below..."
                    value={memberForm.avatar}
                    onChange={e => setMemberForm(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--color-gold)] font-mono"
                  />
                  <div className="pt-1">
                    <ImageUpload 
                      multiple={false} 
                      label="Upload Member Headshot"
                      onUpload={(res) => {
                        const url = res?.url || (Array.isArray(res) && res[0]?.url);
                        if (url) setMemberForm(prev => ({ ...prev, avatar: url }));
                      }} 
                    />
                  </div>
                </div>
              </div>

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
                              <th className="py-2.5 px-3 font-bold text-right">Action</th>
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
                                  <td className="py-2.5 px-3 font-mono font-bold">
                                    {Number(item.allottedBudget || 0) > 0 ? (
                                      <span className="text-white">₹{Number(item.allottedBudget).toLocaleString('en-IN')}</span>
                                    ) : (
                                      <span 
                                        onClick={() => openEditWageModal(item)}
                                        className="text-[var(--color-gold)] bg-amber-950/40 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] cursor-pointer hover:bg-amber-900/50 transition-colors animate-pulse"
                                        title="Click to set compensation"
                                      >
                                        + Set Fee
                                      </span>
                                    )}
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
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => openEditWageModal(item)}
                                      className="px-2.5 py-1 bg-[#22222a] hover:bg-emerald-950/70 text-[#ccc] hover:text-emerald-400 border border-[#383842] hover:border-emerald-500/50 rounded text-[11px] font-bold uppercase transition-all inline-flex items-center gap-1 shadow-sm"
                                      title="Update wage & record payout"
                                    >
                                      <span>✏️</span>
                                      <span>Update</span>
                                    </button>
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

      {/* Wage & Payout Update Modal (Opened from Lifetime Wage Statement) */}
      {wageEditModal.open && wageEditModal.assignment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-[#333] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#222] pb-3 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-mono">₹</span>
                  Update Crew Compensation & Payout
                </h4>
                <p className="text-xs text-[#888] mt-0.5">
                  Event: <strong className="text-white">{wageEditModal.assignment.eventId?.eventName || 'Event'}</strong> • Role: <strong className="text-emerald-400">{(wageEditModal.assignment.assignedRoles || []).join(', ')}</strong>
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setWageEditModal({ open: false, assignment: null, saving: false })} 
                className="text-[#888] hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWageEdit} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                  Agreed Total Budget / Compensation (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={wageEditModal.allottedBudget}
                  onChange={(e) => setWageEditModal(prev => ({ ...prev, allottedBudget: e.target.value }))}
                  className="w-full bg-[#18181c] border border-[#333] rounded-lg px-3 py-2 text-sm font-bold font-mono text-emerald-400 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Fee Breakdown Components */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Shoot Fee</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={wageEditModal.shootFee}
                    onChange={(e) => setWageEditModal(prev => ({ ...prev, shootFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Photo Edit</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={wageEditModal.photoEditFee}
                    onChange={(e) => setWageEditModal(prev => ({ ...prev, photoEditFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Video Edit</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={wageEditModal.videoEditFee}
                    onChange={(e) => setWageEditModal(prev => ({ ...prev, videoEditFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Allowance</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={wageEditModal.allowanceFee}
                    onChange={(e) => setWageEditModal(prev => ({ ...prev, allowanceFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Cleared vs Pending Balance */}
              <div className="bg-[#0e0e12] border border-[#222228] rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#aaa] uppercase tracking-wider font-bold">
                    Cleared vs Pending Balance
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    wageEditModal.assignment.payoutStatus === 'Fully Cleared' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30' :
                    wageEditModal.assignment.payoutStatus === 'Partially Cleared' ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30' :
                    'bg-rose-950/70 text-rose-300 border border-rose-500/30'
                  }`}>
                    {wageEditModal.assignment.payoutStatus || 'Unpaid'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#15151a] p-2 rounded-lg border border-[#222]">
                    <span className="text-[9px] text-[#888] block uppercase">Cleared Amount</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ₹{(wageEditModal.assignment.clearedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-[#15151a] p-2 rounded-lg border border-[#222]">
                    <span className="text-[9px] text-[#888] block uppercase">Pending Balance</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ₹{(wageEditModal.assignment.pendingAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Record Payout Section */}
                <div className="pt-2 border-t border-[#1e1e24] space-y-2">
                  <p className="text-[10px] text-[var(--color-gold)] font-bold uppercase tracking-wider">
                    + Disburse / Record New Payout
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-[#888] uppercase block mb-0.5">Payout Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={wageEditModal.payoutAmount}
                        onChange={(e) => setWageEditModal(prev => ({ ...prev, payoutAmount: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#888] uppercase block mb-0.5">Payment Mode</label>
                      <select
                        value={wageEditModal.payoutType}
                        onChange={(e) => setWageEditModal(prev => ({ ...prev, payoutType: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {wageEditModal.payoutType !== 'Cash' && (
                      <div>
                        <label className="text-[9px] text-[#888] uppercase block mb-0.5">UTR / Bank Ref #</label>
                        <input
                          type="text"
                          placeholder="e.g. 12-digit UTR"
                          value={wageEditModal.payoutUtr}
                          onChange={(e) => setWageEditModal(prev => ({ ...prev, payoutUtr: e.target.value }))}
                          className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                    <div className={wageEditModal.payoutType === 'Cash' ? 'col-span-2' : ''}>
                      <label className="text-[9px] text-[#888] uppercase block mb-0.5">
                        {wageEditModal.payoutType === 'Cash' ? 'Cash Handover Note' : 'Payment Note'}
                      </label>
                      <input
                        type="text"
                        placeholder={wageEditModal.payoutType === 'Cash' ? 'e.g. Cash in hand handover / settlement' : 'e.g. Advance / Settlement'}
                        value={wageEditModal.payoutNote}
                        onChange={(e) => setWageEditModal(prev => ({ ...prev, payoutNote: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Historical Payouts List */}
                {wageEditModal.assignment.payoutHistory && wageEditModal.assignment.payoutHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#1e1e24] space-y-1.5">
                    <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider">
                      Payout History ({wageEditModal.assignment.payoutHistory.length})
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {wageEditModal.assignment.payoutHistory.map(p => (
                        <div key={p.payoutId || p._id} className="flex items-center justify-between bg-[#141418] px-2.5 py-1.5 rounded text-[11px] border border-[#222]">
                          <div>
                            <span className="font-mono font-bold text-emerald-400 mr-2">
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-[#888] font-mono uppercase bg-black/40 px-1 py-0.5 rounded mr-1">
                              {p.paymentType}
                            </span>
                            {p.utrNumber && <span className="text-[10px] text-[#666] font-mono mr-1">UTR: {p.utrNumber}</span>}
                            {p.note && <span className="text-[10px] text-[#aaa]">({p.note})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteWagePayout(wageEditModal.assignment, p.payoutId || p._id)}
                            className="text-rose-400 hover:text-rose-300 text-xs px-1 hover:bg-rose-950/40 rounded transition-colors"
                            title="Reverse payout"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#222] shrink-0">
                <button
                  type="button"
                  onClick={() => setWageEditModal({ open: false, assignment: null, saving: false })}
                  className="px-4 py-2 bg-[#1f1f23] hover:bg-[#2a2a30] text-gray-300 rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={wageEditModal.saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow"
                >
                  {wageEditModal.saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save & Update Ledger'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
