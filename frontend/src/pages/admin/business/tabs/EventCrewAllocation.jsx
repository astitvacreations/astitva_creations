import { useState, useEffect } from 'react';
import { Camera, Video, Film, Scissors, UserCheck, Plus, Trash2, Edit3, Check, X, FileText, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventCrewAllocation({ event, onUpdate }) {
  const [allCrewMembers, setAllCrewMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, type: null, text: '' });
  const [photosNote, setPhotosNote] = useState('');
  const [videosNote, setVideosNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
    (a.assignedRoles || []).some(r => 
      ['Lead Candid Photographer', 'Traditional Photographer', 'Candid Cinematographer', 'Traditional Videographer', 'Drone Pilot'].includes(r)
    )
  );

  const assistantCrew = assignments.filter(a => 
    (a.assignedRoles || []).some(r => ['Shoot Assistant / Lighting', 'Assistant'].includes(r))
  );

  const photoEditCrew = assignments.filter(a => 
    (a.assignedRoles || []).some(r => ['Photo Editor', 'Photo Edit'].includes(r))
  );

  const videoEditCrew = assignments.filter(a => 
    (a.assignedRoles || []).some(r => ['Video Editor', 'Video Edit'].includes(r))
  );

  // Filter available (unassigned to this category) crew members
  const isAssigned = (memberId) => assignments.some(a => (a.teamMemberId?._id || a.teamMemberId) === memberId);

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
      // Pick best matching shoot role
      const skill = (member.primarySkills || []).find(s => 
        ['Lead Candid Photographer', 'Traditional Photographer', 'Candid Cinematographer', 'Traditional Videographer', 'Drone Pilot'].includes(s)
      );
      if (skill) roleName = skill;
    }

    const payload = {
      teamMemberId: member._id,
      assignedRoles: [roleName],
      subEventsCovered: ['Full Event Coverage'],
      [feeType]: Number(member.standardDayRate) || 0,
      allottedBudget: Number(member.standardDayRate) || 0,
      workScopeDescription: category === 'PhotoEdit' ? photosNote : category === 'VideoEdit' ? videosNote : ''
    };

    try {
      const res = await fetch(`${API_URL}/events/${event._id}/crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadCrewData();
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Failed to assign crew member');
      }
    } catch (err) {
      console.error('Error assigning crew member:', err);
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
        if (onUpdate) onUpdate();
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

  return (
    <div className="w-full bg-[#0a0a0d] border border-[#222] rounded-2xl p-4 shadow-xl mb-6">
      
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
                    return (
                      <span
                        key={item._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      >
                        <span className="text-xs">📷</span>
                        <span className="truncate max-w-[120px]">{name}</span>
                        <button
                          onClick={() => handleUnassign(item._id)}
                          className="text-emerald-400 hover:text-white ml-0.5"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </span>
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
              .filter(m => m.isActive)
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
                    return (
                      <span
                        key={item._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm"
                      >
                        <span className="text-xs">🔦</span>
                        <span className="truncate max-w-[120px]">{name}</span>
                        <button
                          onClick={() => handleUnassign(item._id)}
                          className="text-purple-400 hover:text-white ml-0.5"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </span>
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
              .filter(m => m.isActive)
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
                    return (
                      <span
                        key={item._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      >
                        <span className="text-xs">🎨</span>
                        <span className="truncate max-w-[120px]">{name}</span>
                        <button
                          onClick={() => handleUnassign(item._id)}
                          className="text-cyan-400 hover:text-white ml-0.5"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </span>
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
              .filter(m => m.isActive)
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
                    return (
                      <span
                        key={item._id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm"
                      >
                        <span className="text-xs">🎬</span>
                        <span className="truncate max-w-[120px]">{name}</span>
                        <button
                          onClick={() => handleUnassign(item._id)}
                          className="text-purple-400 hover:text-white ml-0.5"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </span>
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
              .filter(m => m.isActive)
              .map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role || 'Editor'})
                </option>
              ))}
          </select>
        </div>

      </div>

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
