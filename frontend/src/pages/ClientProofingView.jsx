import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  Check,
  Heart,
  MessageSquare,
  Lock,
  Unlock,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';

const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://astitva-creations.onrender.com/api');

export default function ClientProofingView() {
  const { galleryId } = useParams();
  const { addToast } = useToastStore();

  const [gallery, setGallery] = useState(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication State
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [clientToken, setClientToken] = useState(() => localStorage.getItem(`gallery_token_${galleryId}`) || '');

  // Selection & Filtering State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeSubEvent, setActiveSubEvent] = useState('ALL');
  const [filterView, setFilterView] = useState('ALL'); // 'ALL' or 'SELECTED'

  // Lightbox & Note Modal State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [noteMedia, setNoteMedia] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Submit Selections Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Access Fetch
  useEffect(() => {
    fetchGalleryAccess();
  }, [galleryId, clientToken]);

  const fetchGalleryAccess = async (pinCode) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = {};
      if (clientToken) {
        headers['Authorization'] = `Bearer ${clientToken}`;
      }
      if (pinCode) {
        headers['x-access-pin'] = pinCode;
      }

      const pinQuery = pinCode ? `?pin=${encodeURIComponent(pinCode)}` : '';
      const res = await fetch(`${apiBase}/client-gallery/access/${galleryId}${pinQuery}`, {
        headers,
        credentials: 'include'
      });
      const data = await res.json();

      if (res.status === 401 && (data.requiresPin || data.pinRequired)) {
        setIsPinRequired(true);
        if (pinCode) {
          setPinError(data.message || 'Incorrect PIN code');
        }
        setIsLoading(false);
        return;
      }

      if (res.ok && data.success) {
        const rawGallery = data.data?.gallery || data.data || data.gallery;
        const galleryObj = {
          ...rawGallery,
          _id: rawGallery?._id || rawGallery?.id || galleryId,
          id: rawGallery?.id || rawGallery?._id || galleryId
        };
        const photos = data.data?.media || galleryObj.media || [];

        if (data.token) {
          localStorage.setItem(`gallery_token_${galleryId}`, data.token);
          setClientToken(data.token);
        }
        setGallery(galleryObj);
        setMedia(photos);

        // Prepopulate selected IDs
        const selected = new Set(photos.filter((p) => p.isSelected).map((p) => p.storageId));
        setSelectedIds(selected);
        setIsPinRequired(false);
        setPinError('');
      } else {
        throw new Error(data.message || 'Unable to access gallery');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. PIN Verification
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) return;
    setPinError('');

    try {
      await fetchGalleryAccess(pin);
    } catch (err) {
      setPinError('Connection error. Please try again.');
    }
  };

  // 3. Toggle Photo Selection
  const handleToggleSelect = async (storageId, e) => {
    if (e) e.stopPropagation();
    if (!gallery || gallery.settings?.isSelectionLocked || gallery.status === 'Submitted') {
      addToast('Selection is locked for this gallery.', 'info');
      return;
    }

    const isCurrentlySelected = selectedIds.has(storageId);
    const max = gallery.settings?.maxSelectionsAllowed;

    if (!isCurrentlySelected && max && selectedIds.size >= max) {
      addToast(`Selection limit reached! You can select up to ${max} photos.`, 'error');
      return;
    }

    // Optimistic UI update
    const nextSelected = new Set(selectedIds);
    if (isCurrentlySelected) {
      nextSelected.delete(storageId);
    } else {
      nextSelected.add(storageId);
    }
    setSelectedIds(nextSelected);

    try {
      const res = await fetch(`${apiBase}/client-gallery/${gallery._id || gallery.id}/select`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`
        },
        body: JSON.stringify({
          storageIds: [storageId],
          isSelected: !isCurrentlySelected
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setSelectedIds(selectedIds);
        addToast(data.message || 'Failed to update selection', 'error');
      }
    } catch (err) {
      setSelectedIds(selectedIds);
      addToast('Network error while updating selection', 'error');
    }
  };

  // 4. Save Retouching Note
  const handleSaveNote = async () => {
    if (!noteMedia || !gallery) return;
    try {
      const res = await fetch(`${apiBase}/client-gallery/${gallery._id || gallery.id}/media/${noteMedia.storageId}/note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`
        },
        body: JSON.stringify({ clientComment: noteText }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMedia((prev) =>
          prev.map((m) => (m.storageId === noteMedia.storageId ? { ...m, clientComment: noteText } : m))
        );
        addToast('Retouching note saved!', 'success');
        setNoteMedia(null);
      } else {
        addToast(data.message || 'Failed to save note', 'error');
      }
    } catch (err) {
      addToast('Failed to save note', 'error');
    }
  };

  // 5. Submit Final Selections
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!gallery) return;

    const min = gallery.settings?.minSelectionsRequired || 0;
    if (selectedIds.size < min) {
      addToast(`Please select at least ${min} photos before submitting.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/client-gallery/${gallery._id || gallery.id}/submit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientToken}`
        },
        body: JSON.stringify({ submissionNotes }),
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setGallery((prev) => ({
          ...prev,
          status: 'Submitted',
          settings: { ...prev.settings, isSelectionLocked: true }
        }));
        setIsSubmitModalOpen(false);
        addToast('Selections submitted successfully! The editing team has been notified.', 'success');
      } else {
        addToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      addToast('Network error while submitting selections', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Media
  const displayedMedia = media.filter((item) => {
    const matchesSubEvent = activeSubEvent === 'ALL' || item.subEventId === activeSubEvent;
    const matchesFilter = filterView === 'ALL' || selectedIds.has(item.storageId);
    return matchesSubEvent && matchesFilter;
  });

  // Lightbox Navigation
  const handlePrevPhoto = () => {
    if (lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  };
  const handleNextPhoto = () => {
    if (lightboxIndex < displayedMedia.length - 1) setLightboxIndex(lightboxIndex + 1);
  };

  // PIN Lock Screen
  if (isPinRequired) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <Helmet>
          <title>Client Gallery Access | Astitva Creations</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] p-8 max-w-md w-full text-center space-y-6"
        >
          <div className="w-14 h-14 bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-heading text-[var(--color-gold)] tracking-widest uppercase">
              Protected Gallery
            </h1>
            <p className="text-sm text-[#A1A1A1] mt-1">
              Please enter the 4-digit access passcode provided to you by Astitva Creations.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-[#181818] border border-[#333] text-white focus:border-[var(--color-gold)] outline-none"
              autoFocus
            />

            {pinError && <p className="text-xs text-red-400 font-semibold">{pinError}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              Access Gallery &rarr;
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-center">
        <div className="bg-[#111] border border-[#222] p-10 max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-heading text-white">Gallery Unavailable</h2>
          <p className="text-sm text-[#888]">{error}</p>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (isLoading || !gallery) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[var(--color-gold)]">
        <div className="w-10 h-10 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs uppercase tracking-widest text-[#A1A1A1]">Loading Shoot Gallery...</span>
      </div>
    );
  }

  const isLocked = gallery.settings?.isSelectionLocked || gallery.status === 'Submitted';
  const maxQuota = gallery.settings?.maxSelectionsAllowed;
  const minRequired = gallery.settings?.minSelectionsRequired || 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-[var(--color-gold)] selection:text-black">
      <Helmet>
        <title>{gallery.clientName} &mdash; Photo Proofing | Astitva Creations</title>
      </Helmet>

      {/* STICKY CLIENT CONTROL BAR */}
      <div className="sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#222] px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-gold)] font-bold">
              {gallery.clientName}
            </div>
            <div className="text-sm font-heading text-white truncate max-w-[200px] md:max-w-none">
              {gallery.eventName}
            </div>
          </div>
        </div>

        {/* Counter & Action */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-[#181818] border border-[#333] px-3.5 py-1.5 rounded-none text-xs font-mono">
            <span className="text-[#A1A1A1]">Selected:</span>
            <span className="text-[var(--color-gold)] font-bold">
              {selectedIds.size} {maxQuota ? `/ ${maxQuota}` : 'photos'}
            </span>
          </div>

          {gallery.settings?.allowClientDownloads && (
            <a
              href={`${apiBase}/client-gallery/${gallery._id || gallery.id}/client-download?token=${clientToken}`}
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-xs text-white uppercase tracking-wider transition-colors"
              title="Download Selected High-Res ZIP"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Download ZIP
            </a>
          )}

          {isLocked ? (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Selections Submitted
            </div>
          ) : (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Submit Selections
            </button>
          )}
        </div>
      </div>

      {/* MAIN GALLERY CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Gallery Shoot Header */}
        <div className="text-center py-6 border-b border-[#1a1a1a] space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Astitva Creations Proofing Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-heading text-white">{gallery.clientName}</h1>
          <p className="text-sm text-[#A1A1A1] max-w-xl mx-auto">
            {gallery.eventName} &bull;{' '}
            {gallery.eventDate
              ? new Date(gallery.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Memories Collection'}
          </p>
          <p className="text-xs text-[#666] pt-1">
            Click the checkmark on any photo to select it for your album. You can also click the speech bubble to add custom retouching instructions.
          </p>
        </div>

        {/* Sub-event Navigation & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
          {/* Sub-event tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveSubEvent('ALL')}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors ${
                activeSubEvent === 'ALL'
                  ? 'bg-[var(--color-gold)] text-black'
                  : 'bg-[#111] text-[#A1A1A1] hover:text-white border border-[#222]'
              }`}
            >
              All Photos ({media.length})
            </button>

            {gallery.subEvents?.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubEvent(sub.id)}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors ${
                  activeSubEvent === sub.id
                    ? 'bg-[var(--color-gold)] text-black'
                    : 'bg-[#111] text-[#A1A1A1] hover:text-white border border-[#222]'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Filter: All vs Selected */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterView('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterView === 'ALL' ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]' : 'text-[#777] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterView('SELECTED')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${
                filterView === 'SELECTED' ? 'text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]' : 'text-[#777] hover:text-white'
              }`}
            >
              Selected ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {displayedMedia.length === 0 ? (
          <div className="text-center py-24 text-[#666]">
            <Camera className="w-12 h-12 mx-auto mb-3 text-[#333]" />
            <p className="text-sm">No photos found in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {displayedMedia.map((photo, idx) => {
              const isSelected = selectedIds.has(photo.storageId);

              return (
                <div
                  key={photo._id || photo.storageId}
                  onClick={() => setLightboxIndex(idx)}
                  className={`group relative bg-[#111] border aspect-[3/4] overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'border-[var(--color-gold)] ring-2 ring-[var(--color-gold)]/40' : 'border-[#222] hover:border-[#444]'
                  }`}
                >
                  <img
                    src={`${apiBase}/client-gallery/media/${photo.storageId}?sz=thumb`}
                    alt={photo.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Watermark Overlay (if enabled) */}
                  {gallery.settings?.watermarkEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-25">
                      <span className="text-xs md:text-sm font-heading tracking-widest text-white rotate-[-30deg] uppercase">
                        {gallery.settings?.watermarkText || 'Astitva Creations'}
                      </span>
                    </div>
                  )}

                  {/* Selection Button (Top-Right) */}
                  <button
                    onClick={(e) => handleToggleSelect(photo.storageId, e)}
                    disabled={isLocked}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-transform active:scale-90 ${
                      isSelected
                        ? 'bg-[var(--color-gold)] text-black shadow-lg scale-100'
                        : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/90 opacity-80 group-hover:opacity-100'
                    }`}
                    title={isSelected ? 'Deselect photo' : 'Select photo'}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'text-black' : 'text-white/60'}`} />
                  </button>

                  {/* Retouching Note Button (Top-Left) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteMedia(photo);
                      setNoteText(photo.clientComment || '');
                    }}
                    className={`absolute top-2 left-2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-opacity ${
                      photo.clientComment ? 'text-amber-400 opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Add retouching notes"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom Info Bar */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-2 text-[10px] text-[#ccc] opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate font-mono">{photo.name}</div>
                    {photo.clientComment && (
                      <div className="truncate text-amber-300 italic mt-0.5">&ldquo;{photo.clientComment}&rdquo;</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxIndex !== null && displayedMedia[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            {/* Lightbox Bar */}
            <div className="flex justify-between items-center p-4 border-b border-[#222] shrink-0 text-white">
              <div className="font-mono text-xs text-[#A1A1A1]">
                {displayedMedia[lightboxIndex].name} &bull; {lightboxIndex + 1} of {displayedMedia.length}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleToggleSelect(displayedMedia[lightboxIndex].storageId, e)}
                  disabled={isLocked}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    selectedIds.has(displayedMedia[lightboxIndex].storageId)
                      ? 'bg-[var(--color-gold)] text-black'
                      : 'bg-[#222] text-white hover:bg-[#333]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {selectedIds.has(displayedMedia[lightboxIndex].storageId) ? 'Selected' : 'Select'}
                </button>

                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-1 text-[#A1A1A1] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              <img
                src={`${apiBase}/client-gallery/media/${displayedMedia[lightboxIndex].storageId}?sz=preview`}
                alt={displayedMedia[lightboxIndex].name}
                className="max-h-full max-w-full object-contain select-none"
              />

              {/* Prev / Next controls */}
              {lightboxIndex > 0 && (
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {lightboxIndex < displayedMedia.length - 1 && (
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTE EDIT MODAL */}
      <AnimatePresence>
        {noteMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#333] w-full max-w-md p-6 space-y-4 text-white"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-3">
                <h3 className="text-sm font-heading text-[var(--color-gold)] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Retouching Instructions
                </h3>
                <button onClick={() => setNoteMedia(null)} className="text-[#A1A1A1] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-[#888] font-mono">{noteMedia.name}</div>

              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Please remove the background microphone, enhance warm skin tones..."
                className="w-full bg-[#181818] border border-[#333] p-3 text-sm text-white focus:border-[var(--color-gold)] outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNoteMedia(null)}
                  className="px-4 py-2 bg-[#222] text-xs uppercase font-semibold text-white hover:bg-[#333]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-[var(--color-gold)] text-xs uppercase font-bold text-black hover:bg-white"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSION MODAL */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#333] w-full max-w-lg p-6 md:p-8 space-y-5 text-white"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-4">
                <h2 className="text-xl font-heading text-[var(--color-gold)] flex items-center gap-2">
                  <Send className="w-5 h-5" /> Submit Selections
                </h2>
                <button onClick={() => setIsSubmitModalOpen(false)} className="text-[#A1A1A1] hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-[#181818] border border-[#222] p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A1A1A1]">Total Selected:</span>
                  <span className="font-bold text-[var(--color-gold)] font-mono">
                    {selectedIds.size} {maxQuota ? `of ${maxQuota} allowed` : 'photos'}
                  </span>
                </div>
                {minRequired > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A1A1A1]">Minimum Required:</span>
                    <span className="font-mono text-white">{minRequired} photos</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                  Remarks / Special Instructions (Optional)
                </label>
                <textarea
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="e.g. Preferred album cover photo, any specific songs or color palettes..."
                  className="w-full bg-[#181818] border border-[#333] p-3 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                />
              </div>

              <p className="text-xs text-[#777]">
                Note: Submitting locks your selections and instantly alerts the studio editing team to begin your album design & printing process.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-2.5 bg-[#222] hover:bg-[#333] text-white text-xs uppercase tracking-widest font-semibold"
                >
                  Keep Selecting
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || selectedIds.size < minRequired}
                  className="px-6 py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

