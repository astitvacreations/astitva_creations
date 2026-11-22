import { useState, useEffect } from 'react';
import { Camera, Video, Film, Scissors, UserCheck, Plus, Trash2, Edit3, Check, X, FileText, AlertCircle, Bell, Send, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventCrewAllocation({ event, onUpdate }) {
  const [allCrewMembers, setAllCrewMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, type: null, text: '' });
  const [photosNote, setPhotosNote] = useState('');
  const [videosNote, setVideosNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fee & Scope Editing Modal State
  const [feeModal, setFeeModal] = useState({
    open: false,
    assignment: null,
    allottedBudget: '',
    shootFee: '',
    photoEditFee: '',
    videoEditFee: '',
    allowanceFee: '',
    workScopeDescription: '',
    subEventsCovered: ''
  });
  const [savingFee, setSavingFee] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Fetch all registered crew members and current event assignments
  const loadCrewData = async () => {
    if (!event?._id) return;
    try {
      setLoading(true);
      const [membersRes, assignRes] = await Promise.all([
        fetch(`${API_URL}/team/crew-members`, { credentials: 'include' }),
        fetch(`${API_URL}/events/${event._id}/crew`, { credentials: 'include' })
      ]);

      const membersData = await membersRes.json();
      const assignData = await assignRes.json();

      if (membersData.success && Array.isArray(membersData.data)) {
        setAllCrewMembers(membersData.data);
      }
      if (assignData.success && Array.isArray(assignData.data)) {
        setAssignments(assignData.data.filter(a => a.workStatus !== 'Cancelled'));
      }
    } catch (err) {
      console.error('Error fetching crew allocation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrewData();
  }, [event?._id]);

  // Categorize assignments into the 4 functional buckets
  const shootCrew = assignments.filter(a => 
    a.assignmentCategory === 'Shoot' || 
    (!a.assignmentCategory && (a.assignedRoles || []).some(r => 
      ['Lead Candid Photographer', 'Traditional Photographer', 'Candid Cinematographer', 'Traditional Videographer', 'Drone Pilot'].includes(r)
    ))
  );

  const assistantCrew = assignments.filter(a => 
    a.assignmentCategory === 'Assistant' || 
    (!a.assignmentCategory && (a.assignedRoles || []).some(r => ['Shoot Assistant / Lighting', 'Assistant'].includes(r)))
  );

  const photoEditCrew = assignments.filter(a => 
    a.assignmentCategory === 'PhotoEdit' || 
    (!a.assignmentCategory && (a.assignedRoles || []).some(r => ['Photo Editor', 'Photo Edit'].includes(r)))
  );

  const videoEditCrew = assignments.filter(a => 
    a.assignmentCategory === 'VideoEdit' || 
    (!a.assignmentCategory && (a.assignedRoles || []).some(r => ['Video Editor', 'Video Edit'].includes(r)))
  );

  const handleAssign = async (memberId, category) => {
    if (!memberId) return;
    const member = allCrewMembers.find(m => m._id === memberId);
    if (!member) return;

    let roleName = 'Lead Candid Photographer';
    let feeType = 'shootFee';

    if (category === 'Assistant') {
      roleName = 'Shoot Assistant / Lighting';
      feeType = 'allowanceFee';
    } else if (category === 'PhotoEdit') {
      roleName = 'Photo Editor';
      feeType = 'photoEditFee';
    } else if (category === 'VideoEdit') {
      roleName = 'Video Editor';
      feeType = 'videoEditFee';
    } else {
      const skill = (member.primarySkills || []).find(s => 
        ['Lead Candid Photographer', 'Traditional Photographer', 'Candid Cinematographer', 'Traditional Videographer', 'Drone Pilot'].includes(s)
      );
      if (skill) roleName = skill;
    }

    const payload = {
      teamMemberId: member._id,
      assignmentCategory: category,
      assignedRoles: [roleName],
      subEventsCovered: ['Full Event Coverage'],
      [feeType]: Number(member.standardDayRate) || 0,
      allottedBudget: Number(member.standardDayRate) || 0,
      workScopeDescription: category === 'PhotoEdit' ? photosNote : category === 'VideoEdit' ? videosNote : ''
    };

    // Optimistic UI update: instantly show the member as assigned
    const tempId = `temp-${Date.now()}`;
    const optimisticAssignment = {
      _id: tempId,
      eventId: event._id,
      teamMemberId: member,
      assignmentCategory: category,
      assignedRoles: [roleName],
      subEventsCovered: ['Full Event Coverage'],
      allottedBudget: Number(member.standardDayRate) || 0,
      [feeType]: Number(member.standardDayRate) || 0,
      clearedAmount: 0,
      pendingAmount: Number(member.standardDayRate) || 0,
      payoutStatus: 'Unpaid',
      workStatus: 'Scheduled'
    };
    setAssignments(prev => [...prev, optimisticAssignment]);

    try {
      const res = await fetch(`${API_URL}/events/${event._id}/crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(prev => prev.map(a => a._id === tempId ? data.data : a));
        if (onUpdate) onUpdate(true);
      } else {
        setAssignments(prev => prev.filter(a => a._id !== tempId));
        alert(data.message || 'Failed to assign crew member');
      }
    } catch (err) {
      console.error('Error assigning crew member:', err);
      setAssignments(prev => prev.filter(a => a._id !== tempId));
      alert('Network error assigning crew member');
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!window.confirm('Remove this person from the assignment?')) return;
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/crew/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadCrewData();
        if (onUpdate) onUpdate(true);
      } else {
        alert(data.message || 'Failed to unassign crew member');
      }
    } catch (err) {
      console.error('Error removing crew assignment:', err);
      alert('Network error unassigning crew member');
    }
  };

  const handleSaveNote = () => {
    if (noteModal.type === 'photo') {
      setPhotosNote(noteModal.text);
    } else if (noteModal.type === 'video') {
      setVideosNote(noteModal.text);
    }
    setNoteModal({ open: false, type: null, text: '' });
  };

  const openEditFeeModal = (item) => {
    setFeeModal({
      open: true,
      assignment: item,
      allottedBudget: item.allottedBudget || 0,
      shootFee: item.shootFee || 0,
      photoEditFee: item.photoEditFee || 0,
      videoEditFee: item.videoEditFee || 0,
      allowanceFee: item.allowanceFee || 0,
      workScopeDescription: item.workScopeDescription || '',
      subEventsCovered: (item.subEventsCovered || []).join(', '),
      payoutAmount: '',
      payoutType: 'UPI',
      payoutUtr: '',
      payoutNote: ''
    });
  };

  const handleDeletePayout = async (assignmentId, payoutId) => {
    if (!window.confirm('Delete / Reverse this payout record?')) return;
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/crew/${assignmentId}/payout/${payoutId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadCrewData();
        // Update current modal assignment state if still open
        if (feeModal.open && feeModal.assignment?._id === assignmentId) {
          const updatedAssignment = data.data;
          setFeeModal(prev => ({
            ...prev,
            assignment: updatedAssignment,
            allottedBudget: updatedAssignment.allottedBudget,
            shootFee: updatedAssignment.shootFee,
            photoEditFee: updatedAssignment.photoEditFee,
            videoEditFee: updatedAssignment.videoEditFee,
            allowanceFee: updatedAssignment.allowanceFee
          }));
        }
        if (onUpdate) onUpdate(true);
      } else {
        alert(data.message || 'Failed to delete payout');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting payout');
    }
  };

  const handleSaveFee = async (e) => {
    if (e) e.preventDefault();
    if (!feeModal.assignment) return;
    setSavingFee(true);
    try {
      const sFee = Number(feeModal.shootFee) || 0;
      const pFee = Number(feeModal.photoEditFee) || 0;
      const vFee = Number(feeModal.videoEditFee) || 0;
      const aFee = Number(feeModal.allowanceFee) || 0;
      let totalBudget = Number(feeModal.allottedBudget) || 0;
      if (sFee > 0 || pFee > 0 || vFee > 0 || aFee > 0) {
        totalBudget = sFee + pFee + vFee + aFee;
      }

      // 1. Update assignment fees & work scope
      const res = await fetch(`${API_URL}/events/${event._id}/crew/${feeModal.assignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          allottedBudget: totalBudget,
          shootFee: sFee,
          photoEditFee: pFee,
          videoEditFee: vFee,
          allowanceFee: aFee,
          workScopeDescription: feeModal.workScopeDescription.trim(),
          subEventsCovered: feeModal.subEventsCovered 
            ? feeModal.subEventsCovered.split(',').map(s => s.trim()).filter(Boolean) 
            : []
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to update crew fee');
        setSavingFee(false);
        return;
      }

      // 2. If a payout amount is specified, record it
      const pAmount = Number(feeModal.payoutAmount);
      if (pAmount > 0) {
        const pRes = await fetch(`${API_URL}/events/${event._id}/crew/${feeModal.assignment._id}/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: pAmount,
            paymentType: feeModal.payoutType,
            utrNumber: feeModal.payoutType === 'Cash' ? '' : feeModal.payoutUtr.trim(),
            note: feeModal.payoutNote.trim()
          })
        });
        const pData = await pRes.json();
        if (!pRes.ok || !pData.success) {
          alert(pData.message || 'Fee updated, but payout recording failed.');
        }
      }

      setFeeModal({ open: false, assignment: null });
      await loadCrewData();
      if (onUpdate) onUpdate(true);
    } catch (err) {
      console.error(err);
      alert('Network error saving fee / payout');
    } finally {
      setSavingFee(false);
    }
  };

  const handleSendReminders = async () => {
    if (!window.confirm(`Send 24-hour pre-event reminder email & WhatsApp to all ${assignments.length} assigned crew member(s)?`)) return;
    setSendingReminders(true);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/crew/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Dispatched 24-hour pre-event reminders to ${data.data?.length || assignments.length} crew member(s) via Email & WhatsApp!`);
        await loadCrewData();
      } else {
        alert(data.message || 'Failed to dispatch crew reminders');
      }
    } catch (err) {
      console.error(err);
      alert('Network error sending crew reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const totalCrewBudget = assignments.reduce((sum, a) => sum + (Number(a.allottedBudget) || 0), 0);
  const totalCrewCleared = assignments.reduce((sum, a) => sum + (Number(a.clearedAmount) || 0), 0);
  const totalCrewPending = assignments.reduce((sum, a) => sum + (Number(a.pendingAmount) || 0), 0);

  return (
    <div className="w-full bg-[#0a0a0d] border border-[#222] rounded-2xl p-4 shadow-xl mb-6 space-y-4">
      
      {/* Top Crew Allocation Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1c1c20]">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
              Production Crew Allocation & Wage Ledger
            </h4>
            <p className="text-[10px] text-[#777]">
              Assigned: <strong className="text-white font-mono">{assignments.length} Members</strong> • Allotted: <strong className="text-amber-300 font-mono">₹{totalCrewBudget.toLocaleString('en-IN')}</strong> • Cleared: <strong className="text-green-400 font-mono">₹{totalCrewCleared.toLocaleString('en-IN')}</strong> • Pending: <strong className="text-amber-400 font-mono">₹{totalCrewPending.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        {assignments.length > 0 && (
          <button
            type="button"
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="px-3 py-1.5 bg-[#181820] hover:bg-[#22222c] text-amber-300 hover:text-white border border-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            title="Dispatch 24-hour pre-event reminder email & WhatsApp to all assigned crew"
          >
            {sendingReminders ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending 24h Reminders...</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Dispatch 24h Reminder to Crew</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4 Cards Responsive Grid matching Image 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. SHOOT ASSIGNMENT */}
        <div className="bg-[#111114] border border-[#26262a] rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-md hover:border-[#333] transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[11px] font-heading font-bold text-white uppercase tracking-wider">
                SHOOT ASSIGNMENT
              </h5>
              <span className={`text-[11px] font-bold font-mono ${shootCrew.length > 0 ? 'text-emerald-400' : 'text-[#666]'}`}>
                {shootCrew.length} Assigned
              </span>
            </div>

            {/* List of assigned persons */}
            <div className="space-y-1.5 mb-3 min-h-[38px]">
              {shootCrew.length === 0 ? (
                <p className="text-xs text-[#666] italic">No one assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {shootCrew.map(item => {
                    const name = item.teamMemberId?.name || 'Crew Member';
                    const fee = Number(item.allottedBudget || 0);
                    return (
                      <div
                        key={item._id}
                        onClick={() => openEditFeeModal(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#16161b] hover:bg-[#202028] border border-[#2d2d38] hover:border-emerald-500/60 shadow-sm cursor-pointer transition-all group"
                        title="Click to view & update crew wage details or payouts"
                      >
                        <span className="text-xs">📷</span>
                        <span className="truncate max-w-[95px] text-white font-medium">{name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${fee > 0 ? 'text-amber-300 bg-black/60 border-amber-500/30' : 'text-[var(--color-gold)] bg-amber-950/40 border-amber-500/40 animate-pulse'}`}>
                          {fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '+ Set Fee'}
                        </span>
                        <span className="text-gray-400 group-hover:text-amber-300 text-xs transition-colors">✏️</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassign(item._id);
                          }}
                          className="text-gray-400 hover:text-rose-400 ml-0.5 text-xs p-0.5 rounded transition-colors"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Dropdown */}
          <select
            value=""
            onChange={(e) => handleAssign(e.target.value, 'Shoot')}
            className="w-full bg-[#18181c] hover:bg-[#202026] text-white border border-[#333] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer truncate transition-colors"
          >
            <option value="" disabled>+ Add Person for Shoot...</option>
            {allCrewMembers
              .filter(m => m.isActive && !shootCrew.some(s => (s.teamMemberId?._id || s.teamMemberId) === m._id))
              .map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role || 'Photographer'})
                </option>
              ))}
          </select>
        </div>

        {/* 2. SHOOT ASSISTANT */}
        <div className="bg-[#111114] border border-[#26262a] rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-md hover:border-[#333] transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[11px] font-heading font-bold text-white uppercase tracking-wider">
                SHOOT ASSISTANT
              </h5>
              <span className={`text-[11px] font-bold font-mono ${assistantCrew.length > 0 ? 'text-purple-400' : 'text-purple-400/80'}`}>
                {assistantCrew.length} Assigned
              </span>
            </div>

            {/* List of assigned assistants */}
            <div className="space-y-1.5 mb-3 min-h-[38px]">
              {assistantCrew.length === 0 ? (
                <p className="text-xs text-[#666] italic">No one assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assistantCrew.map(item => {
                    const name = item.teamMemberId?.name || 'Assistant';
                    const fee = Number(item.allottedBudget || 0);
                    return (
                      <div
                        key={item._id}
                        onClick={() => openEditFeeModal(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#16161b] hover:bg-[#202028] border border-[#2d2d38] hover:border-purple-500/60 shadow-sm cursor-pointer transition-all group"
                        title="Click to view & update crew wage details or payouts"
                      >
                        <span className="text-xs">🔦</span>
                        <span className="truncate max-w-[95px] text-white font-medium">{name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${fee > 0 ? 'text-purple-300 bg-black/60 border-purple-500/30' : 'text-[var(--color-gold)] bg-purple-950/40 border-purple-500/40 animate-pulse'}`}>
                          {fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '+ Set Fee'}
                        </span>
                        <span className="text-gray-400 group-hover:text-purple-300 text-xs transition-colors">✏️</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassign(item._id);
                          }}
                          className="text-gray-400 hover:text-rose-400 ml-0.5 text-xs p-0.5 rounded transition-colors"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Dropdown */}
          <select
            value=""
            onChange={(e) => handleAssign(e.target.value, 'Assistant')}
            className="w-full bg-[#18181c] hover:bg-[#202026] text-white border border-[#333] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer truncate transition-colors"
          >
            <option value="" disabled>+ Add Person for Shoot A...</option>
            {allCrewMembers
              .filter(m => m.isActive && !assistantCrew.some(s => (s.teamMemberId?._id || s.teamMemberId) === m._id))
              .map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role || 'Assistant'})
                </option>
              ))}
          </select>
        </div>

        {/* 3. PHOTOS EDIT */}
        <div className="bg-[#111114] border border-[#26262a] rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-md hover:border-[#333] transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[11px] font-heading font-bold text-white uppercase tracking-wider">
                PHOTOS EDIT
              </h5>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNoteModal({ open: true, type: 'photo', text: photosNote })}
                  className="px-2 py-0.5 bg-[#1a1a20] hover:bg-[#25252c] text-[#bbb] hover:text-white border border-[#333] rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                  title="Photo editing instructions"
                >
                  <span className="font-mono text-cyan-400">T</span> Photos Note
                </button>
                <span className={`text-[11px] font-bold font-mono ${photoEditCrew.length > 0 ? 'text-cyan-400' : 'text-cyan-400/80'}`}>
                  {photoEditCrew.length}
                </span>
              </div>
            </div>

            {/* List of assigned photo editors */}
            <div className="space-y-1.5 mb-3 min-h-[38px]">
              {photoEditCrew.length === 0 ? (
                <p className="text-xs text-[#666] italic">No one assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {photoEditCrew.map(item => {
                    const name = item.teamMemberId?.name || 'Photo Editor';
                    const fee = Number(item.allottedBudget || 0);
                    return (
                      <div
                        key={item._id}
                        onClick={() => openEditFeeModal(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#16161b] hover:bg-[#202028] border border-[#2d2d38] hover:border-cyan-500/60 shadow-sm cursor-pointer transition-all group"
                        title="Click to view & update crew wage details or payouts"
                      >
                        <span className="text-xs">🎨</span>
                        <span className="truncate max-w-[95px] text-white font-medium">{name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${fee > 0 ? 'text-cyan-300 bg-black/60 border-cyan-500/30' : 'text-[var(--color-gold)] bg-cyan-950/40 border-cyan-500/40 animate-pulse'}`}>
                          {fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '+ Set Fee'}
                        </span>
                        <span className="text-gray-400 group-hover:text-cyan-300 text-xs transition-colors">✏️</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassign(item._id);
                          }}
                          className="text-gray-400 hover:text-rose-400 ml-0.5 text-xs p-0.5 rounded transition-colors"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Dropdown */}
          <select
            value=""
            onChange={(e) => handleAssign(e.target.value, 'PhotoEdit')}
            className="w-full bg-[#18181c] hover:bg-[#202026] text-white border border-[#333] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer truncate transition-colors"
          >
            <option value="" disabled>+ Add Person for Photos E...</option>
            {allCrewMembers
              .filter(m => m.isActive && !photoEditCrew.some(s => (s.teamMemberId?._id || s.teamMemberId) === m._id))
              .map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role || 'Editor'})
                </option>
              ))}
          </select>
        </div>

        {/* 4. VIDEOS EDIT */}
        <div className="bg-[#111114] border border-[#26262a] rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-md hover:border-[#333] transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[11px] font-heading font-bold text-white uppercase tracking-wider">
                VIDEOS EDIT
              </h5>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNoteModal({ open: true, type: 'video', text: videosNote })}
                  className="px-2 py-0.5 bg-[#1a1a20] hover:bg-[#25252c] text-[#bbb] hover:text-white border border-[#333] rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                  title="Video editing instructions"
                >
                  <span className="font-mono text-purple-400">T</span> Videos Note
                </button>
                <span className={`text-[11px] font-bold font-mono ${videoEditCrew.length > 0 ? 'text-purple-400' : 'text-purple-400/80'}`}>
                  {videoEditCrew.length}
                </span>
              </div>
            </div>

            {/* List of assigned video editors */}
            <div className="space-y-1.5 mb-3 min-h-[38px]">
              {videoEditCrew.length === 0 ? (
                <p className="text-xs text-[#666] italic">No one assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {videoEditCrew.map(item => {
                    const name = item.teamMemberId?.name || 'Video Editor';
                    const fee = Number(item.allottedBudget || 0);
                    return (
                      <div
                        key={item._id}
                        onClick={() => openEditFeeModal(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#16161b] hover:bg-[#202028] border border-[#2d2d38] hover:border-purple-500/60 shadow-sm cursor-pointer transition-all group"
                        title="Click to view & update crew wage details or payouts"
                      >
                        <span className="text-xs">🎬</span>
                        <span className="truncate max-w-[95px] text-white font-medium">{name}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${fee > 0 ? 'text-purple-300 bg-black/60 border-purple-500/30' : 'text-[var(--color-gold)] bg-purple-950/40 border-purple-500/40 animate-pulse'}`}>
                          {fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : '+ Set Fee'}
                        </span>
                        <span className="text-gray-400 group-hover:text-purple-300 text-xs transition-colors">✏️</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassign(item._id);
                          }}
                          className="text-gray-400 hover:text-rose-400 ml-0.5 text-xs p-0.5 rounded transition-colors"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Dropdown */}
          <select
            value=""
            onChange={(e) => handleAssign(e.target.value, 'VideoEdit')}
            className="w-full bg-[#18181c] hover:bg-[#202026] text-white border border-[#333] rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer truncate transition-colors"
          >
            <option value="" disabled>+ Add Person for Videos E...</option>
            {allCrewMembers
              .filter(m => m.isActive && !videoEditCrew.some(s => (s.teamMemberId?._id || s.teamMemberId) === m._id))
              .map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role || 'Editor'})
                </option>
              ))}
          </select>
        </div>

      </div>

      {/* Fee & Scope Breakdown Editing Modal */}
      {feeModal.open && feeModal.assignment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-[#333] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#222] pb-3 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-mono">₹</span>
                  Edit Crew Budget & Work Scope
                </h4>
                <p className="text-xs text-[#888] mt-0.5">
                  Member: <strong className="text-emerald-400">{feeModal.assignment.teamMemberId?.name || 'Crew Member'}</strong> • Role: {feeModal.assignment.assignedRoles?.join(', ')}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setFeeModal({ open: false, assignment: null })} 
                className="text-[#888] hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                  Agreed Total Budget / Compensation (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={feeModal.allottedBudget}
                  onChange={(e) => setFeeModal(prev => ({ ...prev, allottedBudget: e.target.value }))}
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
                    value={feeModal.shootFee}
                    onChange={(e) => setFeeModal(prev => ({ ...prev, shootFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Photo Edit</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={feeModal.photoEditFee}
                    onChange={(e) => setFeeModal(prev => ({ ...prev, photoEditFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Video Edit</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={feeModal.videoEditFee}
                    onChange={(e) => setFeeModal(prev => ({ ...prev, videoEditFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#888] uppercase block font-bold mb-1">Allowance</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={feeModal.allowanceFee}
                    onChange={(e) => setFeeModal(prev => ({ ...prev, allowanceFee: e.target.value }))}
                    className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                  Sub-events Covered (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haldi, Wedding, Reception"
                  value={feeModal.subEventsCovered}
                  onChange={(e) => setFeeModal(prev => ({ ...prev, subEventsCovered: e.target.value }))}
                  className="w-full bg-[#18181c] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                  Task Scope & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Lead candid photos of groom entry & rituals; backup RAW files post shoot."
                  value={feeModal.workScopeDescription}
                  onChange={(e) => setFeeModal(prev => ({ ...prev, workScopeDescription: e.target.value }))}
                  className="w-full bg-[#18181c] border border-[#333] rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Crew Ledger Status & Payout Breakdown */}
              <div className="bg-[#0e0e12] border border-[#222228] rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#aaa] uppercase tracking-wider font-bold">
                    Payout Ledger & Settlements
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    feeModal.assignment.payoutStatus === 'Fully Cleared' ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30' :
                    feeModal.assignment.payoutStatus === 'Partially Cleared' ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30' :
                    'bg-rose-950/70 text-rose-300 border border-rose-500/30'
                  }`}>
                    {feeModal.assignment.payoutStatus || 'Unpaid'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#15151a] p-2 rounded-lg border border-[#222]">
                    <span className="text-[9px] text-[#888] block uppercase">Cleared Amount</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ₹{(feeModal.assignment.clearedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-[#15151a] p-2 rounded-lg border border-[#222]">
                    <span className="text-[9px] text-[#888] block uppercase">Pending Balance</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ₹{(feeModal.assignment.pendingAmount || 0).toLocaleString('en-IN')}
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
                        value={feeModal.payoutAmount}
                        onChange={(e) => setFeeModal(prev => ({ ...prev, payoutAmount: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#888] uppercase block mb-0.5">Payment Mode</label>
                      <select
                        value={feeModal.payoutType}
                        onChange={(e) => setFeeModal(prev => ({ ...prev, payoutType: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {feeModal.payoutType !== 'Cash' && (
                      <div>
                        <label className="text-[9px] text-[#888] uppercase block mb-0.5">UTR / Bank Ref #</label>
                        <input
                          type="text"
                          placeholder="e.g. 12-digit UTR"
                          value={feeModal.payoutUtr}
                          onChange={(e) => setFeeModal(prev => ({ ...prev, payoutUtr: e.target.value }))}
                          className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                    <div className={feeModal.payoutType === 'Cash' ? 'col-span-2' : ''}>
                      <label className="text-[9px] text-[#888] uppercase block mb-0.5">
                        {feeModal.payoutType === 'Cash' ? 'Cash Handover Note' : 'Payment Note'}
                      </label>
                      <input
                        type="text"
                        placeholder={feeModal.payoutType === 'Cash' ? 'e.g. Cash in hand handover / settlement' : 'e.g. Advance / Shoot Day'}
                        value={feeModal.payoutNote}
                        onChange={(e) => setFeeModal(prev => ({ ...prev, payoutNote: e.target.value }))}
                        className="w-full bg-[#18181c] border border-[#333] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Historical Payouts List */}
                {feeModal.assignment.payoutHistory && feeModal.assignment.payoutHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#1e1e24] space-y-1.5">
                    <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider">
                      Payout History ({feeModal.assignment.payoutHistory.length})
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {feeModal.assignment.payoutHistory.map(p => (
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
                            onClick={() => handleDeletePayout(feeModal.assignment._id, p.payoutId || p._id)}
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
                  onClick={() => setFeeModal({ open: false, assignment: null })}
                  className="px-4 py-2 bg-[#1f1f23] hover:bg-[#2a2a30] text-gray-300 rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFee}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow"
                >
                  {savingFee ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Fee...</span>
                    </>
                  ) : (
                    'Save Agreed Budget'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Editing Modal */}
      {noteModal.open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-[#333] rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {noteModal.type === 'photo' ? '🎨 Photo Editing Instructions' : '🎬 Video Editing Instructions'}
              </h4>
              <button onClick={() => setNoteModal({ open: false, type: null, text: '' })} className="text-[#888] hover:text-white">✕</button>
            </div>
            <textarea
              rows={4}
              value={noteModal.text}
              onChange={(e) => setNoteModal(prev => ({ ...prev, text: e.target.value }))}
              placeholder="e.g. Color grade in warm vintage tones; 150 retouched photos required by 15th."
              className="w-full bg-[#0a0a0d] border border-[#333] rounded-lg p-3 text-xs text-white outline-none focus:border-[var(--color-gold)] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModal({ open: false, type: null, text: '' })}
                className="px-3 py-1.5 bg-[#1e1e24] text-xs text-[#aaa] rounded-lg hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-[var(--color-gold)] text-black font-bold text-xs rounded-lg hover:bg-[#c49f33]"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
