import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Sparkles,
  Eye,
  Unlock,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useClientGalleryStore } from '../../store/clientGalleryStore';
import { useToastStore } from '../../store/toastStore';

const apiBase = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

export default function ClientGalleryManager() {
  const {
    galleries,
    isLoading,
    isSyncing,
    fetchGalleries,
    createGallery,
    deleteGallery,
    syncGallery,
    reopenGallery,
    getLightroomQuery
  } = useClientGalleryStore();

  const { addToast } = useToastStore();

  // Create Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    eventName: '',
    folderLink: ''
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Group Accordion State: store open email groups (default all open)
  const [expandedEmails, setExpandedEmails] = useState({});

  // Sub-row Details State: store which event row is expanded for extra tools (Lightroom, CSV, etc.)
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventPhotos, setEventPhotos] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState({});

  const toggleEventExpand = async (event) => {
    const isCurrentlyOpen = expandedEventId === event._id;
    if (isCurrentlyOpen) {
      setExpandedEventId(null);
      return;
    }
    setExpandedEventId(event._id);

    if (!eventPhotos[event._id]) {
      setLoadingPhotos((prev) => ({ ...prev, [event._id]: true }));
      try {
        const res = await fetch(`${apiBase}/client-gallery/${event._id}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
          setEventPhotos((prev) => ({ ...prev, [event._id]: data.data.media || [] }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPhotos((prev) => ({ ...prev, [event._id]: false }));
      }
    }
  };

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState(null);

  // Lightroom Query Modal State
  const [lightroomData, setLightroomData] = useState(null);
  const [isLightroomModalOpen, setIsLightroomModalOpen] = useState(false);

  // Photo Viewer Drawer State
  const [viewGallery, setViewGallery] = useState(null);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState('all');

  useEffect(() => {
    fetchGalleries().catch((err) => addToast(err.message, 'error'));
  }, []);

  // Group galleries by clientEmail (normalized to lowercase)
  const groupedGalleries = useMemo(() => {
    const groups = {};
    galleries.forEach((gallery) => {
      const email = (gallery.clientEmail || 'No Email').toLowerCase().trim();
      if (!groups[email]) {
        groups[email] = {
          clientEmail: gallery.clientEmail || 'No Email',
          clientName: gallery.clientName || 'Client',
          events: [],
          totalImages: 0
        };
      }
      groups[email].events.push(gallery);
      groups[email].totalImages += gallery.totalPhotos || 0;
    });

    // Default expand all groups when data loads
    const initialExpanded = {};
    Object.keys(groups).forEach((email) => {
      initialExpanded[email] = true;
    });
    setExpandedEmails((prev) => ({ ...initialExpanded, ...prev }));

    return Object.values(groups);
  }, [galleries]);

  const toggleGroup = (email) => {
    setExpandedEmails((prev) => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientEmail.trim()) {
      addToast('Client Email is required', 'error');
      return;
    }
    if (!formData.eventName.trim()) {
      addToast('Event Name is required', 'error');
      return;
    }
    if (!formData.folderLink.trim()) {
      addToast('Google Drive Folder Link is required', 'error');
      return;
    }

    setIsSubmittingForm(true);
    try {
      await createGallery({
        clientName: formData.clientName.trim() || 'Valued Client',
        clientEmail: formData.clientEmail.trim(),
        eventName: formData.eventName.trim(),
        folderLink: formData.folderLink.trim(),
        status: 'Published'
      });
      addToast('Client gallery created & Google Drive indexed!', 'success');
      setFormData({
        clientName: '',
        clientEmail: '',
        eventName: '',
        folderLink: ''
      });
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSync = async (id, name) => {
    try {
      addToast(`Syncing photos for "${name}" from Google Drive...`, 'info');
      const res = await syncGallery(id);
      addToast(`Sync complete! ${res.totalPhotos} photos indexed.`, 'success');
      // Refresh photos for this gallery
      try {
        const photoRes = await fetch(`${apiBase}/client-gallery/${id}`, { credentials: 'include' });
        const photoData = await photoRes.json();
        if (photoRes.ok && photoData.success) {
          setEventPhotos((prev) => ({ ...prev, [id]: photoData.data.media || [] }));
        }
      } catch (e) {}
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete client gallery for "${name}"? This action is permanent.`)) return;
    try {
      await deleteGallery(id);
      addToast('Gallery deleted successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCopyLink = (galleryId, copyKey) => {
    const url = `${window.location.origin}/gallery/${galleryId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(copyKey);
    addToast('Client gallery link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyGroupLink = (email, copyKey) => {
    // Generates client portal access link
    const url = `${window.location.origin}/my-gallery?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(copyKey);
    addToast(`Portal link for ${email} copied!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenLightroom = async (gallery) => {
    try {
      const data = await getLightroomQuery(gallery._id);
      setLightroomData({ ...data, clientName: gallery.clientName, eventName: gallery.eventName });
      setIsLightroomModalOpen(true);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleViewPhotos = async (gallery) => {
    setViewGallery(gallery);
    setIsLoadingMedia(true);
    try {
      const res = await fetch(`${apiBase}/client-gallery/${gallery._id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setGalleryMedia(data.data.media || []);
      } else {
        addToast(data.message || 'Failed to fetch photos', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleReopen = async (id, name) => {
    if (!window.confirm(`Reopen selection for "${name}"? Client will be able to edit selections.`)) return;
    try {
      await reopenGallery(id);
      addToast('Gallery reopened for client selection', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleBulkExportSubmitted = () => {
    window.open(`${apiBase}/client-gallery/download-all-submitted`, '_blank');
    addToast('Preparing unified ZIP for all submitted selections...', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-white">
      <Helmet>
        <title>Client Image Galleries | Astitva Admin</title>
      </Helmet>

      {/* HEADER SECTION */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-heading tracking-widest text-white uppercase">
          Client Image Galleries
        </h1>
        <p className="text-xs md:text-sm text-[#7e8594] font-normal leading-relaxed">
          Share a Google Drive folder link and assign it to a client email. Clients visit{' '}
          <span className="text-[#a6b0c3] font-mono">/my-gallery</span> and enter their email to browse and select images.
          You receive the selections as a CSV.
        </p>
      </div>

      {/* 1. ADD NEW CLIENT GALLERY CARD */}
      <div className="bg-[#121417] border border-[#20232b] rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Add New Client Gallery
        </h2>

        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client Name */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Client Name
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Ravi & Priya"
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none transition-colors"
              />
            </div>

            {/* Client Email */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Client Email *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none transition-colors"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                placeholder="e.g. Wedding Reception"
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none transition-colors"
              />
            </div>

            {/* Google Drive Folder Link */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Google Drive Folder Link *
              </label>
              <input
                type="text"
                required
                value={formData.folderLink}
                onChange={(e) => setFormData({ ...formData, folderLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none font-mono text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmittingForm}
              className="bg-white hover:bg-gray-200 text-black font-semibold text-xs tracking-wider uppercase px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              {isSubmittingForm ? 'Creating & Indexing...' : 'Create Gallery'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. ALL CLIENT GALLERIES CARD */}
      <div className="bg-[#121417] border border-[#20232b] rounded-2xl p-6 md:p-8 space-y-6">
        {/* Section Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            All Client Galleries
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkExportSubmitted}
              className="bg-white hover:bg-gray-200 text-black font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg transition-colors"
              title="Download single ZIP of all submitted client selections"
            >
              Download All Selections (ZIP)
            </button>

            <button
              onClick={() => fetchGalleries()}
              className="bg-[#1c1f26] hover:bg-[#252a34] text-gray-300 font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg border border-[#2d323d] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Grouped Accordion List */}
        {isLoading && galleries.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <div className="w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs uppercase tracking-widest">Loading galleries...</span>
          </div>
        ) : groupedGalleries.length === 0 ? (
          <div className="py-16 text-center text-[#555] bg-[#16181f] rounded-xl border border-[#232731]">
            <p className="text-sm">No client galleries created yet. Add one above to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedGalleries.map((group) => {
              const emailKey = group.clientEmail.toLowerCase();
              const isGroupExpanded = expandedEmails[emailKey] !== false;

              return (
                <div
                  key={emailKey}
                  className="bg-[#16181f] border border-[#232731] rounded-xl overflow-hidden transition-all"
                >
                  {/* CLIENT GROUP HEADER (Preenth & Viswa) */}
                  <div
                    onClick={() => toggleGroup(emailKey)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#1a1d25] transition-colors select-none"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                        {group.clientName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{group.clientEmail}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span>{group.events.length} Events</span>
                      <span>{group.totalImages} images</span>

                      {/* Group Portal Copy Link Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyGroupLink(group.clientEmail, `group_${emailKey}`);
                        }}
                        className="bg-[#20242e] hover:bg-[#2a303d] text-gray-300 text-xs px-3.5 py-1.5 rounded-md border border-[#2d3340] flex items-center gap-1.5 font-semibold transition-colors"
                        title="Copy portal access link for this client email"
                      >
                        {copiedId === `group_${emailKey}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copy Link
                      </button>

                      <div className="text-gray-400 pl-1">
                        {isGroupExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CHILD EVENT ROWS (Belonging to this client email) */}
                  <AnimatePresence>
                    {isGroupExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 pt-1 space-y-3 bg-[#111317] border-t border-[#1e222a]"
                      >
                        {group.events.map((event) => {
                          const isEventRowExpanded = expandedEventId === event._id;
                          const isSubmitted = event.status === 'Submitted';

                          return (
                            <div
                              key={event._id}
                              className="bg-[#171920] border border-[#222631] hover:border-[#2f3545] rounded-xl transition-all overflow-hidden"
                            >
                              <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Event Title & Email */}
                                <div className="space-y-0.5">
                                  <div className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
                                    {event.clientName} &mdash; {event.eventName}
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono">
                                    {event.clientEmail}
                                  </div>
                                </div>

                                {/* Status, Photo Count & Actions */}
                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Status Badge */}
                                  {isSubmitted ? (
                                    <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-[#152820] text-[#10b981] border border-[#1e4535]">
                                      Submitted
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-[#2a2215] text-[#eab308] border border-[#443818]">
                                      Pending
                                    </span>
                                  )}

                                  {/* Photo count */}
                                  <span className="text-xs text-gray-400 font-mono px-1">
                                    {event.totalPhotos || 0} images
                                  </span>

                                  {/* SYNC DRIVE BUTTON */}
                                  <button
                                    onClick={() => handleSync(event._id, event.eventName)}
                                    disabled={isSyncing}
                                    className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#162235] hover:bg-[#1d2d47] text-[#60a5fa] border border-[#223554] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                    title="Rescan Google Drive Folder"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    Sync Drive
                                  </button>

                                  {/* COPY LINK BUTTON */}
                                  <button
                                    onClick={() => handleCopyLink(event.galleryId, event._id)}
                                    className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#22252e] hover:bg-[#2c303b] text-gray-300 border border-[#2f3442] flex items-center gap-1.5 transition-colors"
                                    title="Copy direct client gallery link"
                                  >
                                    {copiedId === event._id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                    Copy Link
                                  </button>

                                  {/* DELETE BUTTON */}
                                  <button
                                    onClick={() => handleDelete(event._id, event.eventName)}
                                    className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#2c181d] hover:bg-[#3b2027] text-[#f87171] border border-[#47242c] flex items-center gap-1.5 transition-colors"
                                    title="Delete this gallery"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </button>

                                  {/* Expand / Collapse Sub-details Toggle */}
                                  <button
                                    onClick={() => toggleEventExpand(event)}
                                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                    title="View Photos, Lightroom Query, CSV & ZIP exports"
                                  >
                                    {isEventRowExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* EXPANDED INLINE PHOTOS VIEW (EXACTLY AS IN IMAGE 1) */}
                              <AnimatePresence>
                                {isEventRowExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[#111317] border-t border-[#222631] p-5 space-y-4"
                                  >
                                    {/* Top info line */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Drive Folder:</span>
                                        {event.folderLink ? (
                                          <a
                                            href={event.folderLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#58a6ff] hover:underline truncate max-w-md inline-flex items-center gap-1"
                                          >
                                            {event.folderLink}
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                          </a>
                                        ) : (
                                          <span className="text-gray-500">ID: {event.folderId}</span>
                                        )}
                                      </div>

                                      <div className="text-gray-400 shrink-0">
                                        <span className="text-white font-semibold">{event.selectedCount || 0}</span> of{' '}
                                        <span className="text-white font-semibold">{event.totalPhotos || 0}</span> selected by client
                                      </div>
                                    </div>

                                    {/* Action buttons (Lightroom, CSV, ZIP, Reopen) */}
                                    <div className="flex items-center gap-2 flex-wrap pt-1 pb-2 border-b border-[#1c1f26]">
                                      <button
                                        onClick={() => handleOpenLightroom(event)}
                                        className="px-3 py-1.5 bg-[#142333] hover:bg-[#1a2e42] text-sky-400 rounded-md border border-[#1f364f] flex items-center gap-1.5 text-xs font-semibold"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" /> Lightroom Filter
                                      </button>

                                      <a
                                        href={`${apiBase}/client-gallery/${event._id}/export-csv`}
                                        download
                                        className="px-3 py-1.5 bg-[#152820] hover:bg-[#1d382c] text-emerald-400 rounded-md border border-[#1f3d30] flex items-center gap-1.5 text-xs font-semibold"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                                      </a>

                                      <a
                                        href={`${apiBase}/client-gallery/${event._id}/download-selections`}
                                        download
                                        className="px-3 py-1.5 bg-[#252219] hover:bg-[#332e22] text-amber-400 rounded-md border border-[#3d3729] flex items-center gap-1.5 text-xs font-semibold"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Selections ZIP
                                      </a>

                                      {isSubmitted && (
                                        <button
                                          onClick={() => handleReopen(event._id, event.eventName)}
                                          className="px-3 py-1.5 bg-[#261e1b] hover:bg-[#362a26] text-orange-400 rounded-md border border-[#42312b] flex items-center gap-1.5 text-xs font-semibold"
                                        >
                                          <Unlock className="w-3.5 h-3.5" /> Reopen Selection
                                        </button>
                                      )}
                                    </div>

                                    {/* Grid of photo thumbnails */}
                                    {loadingPhotos[event._id] ? (
                                      <div className="py-12 text-center text-gray-500">
                                        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <span className="text-xs uppercase tracking-widest">Loading photos...</span>
                                      </div>
                                    ) : !eventPhotos[event._id] || eventPhotos[event._id].length === 0 ? (
                                      <div className="py-8 text-center text-gray-500 text-xs">
                                        No photos found. Click <span className="text-[#60a5fa] font-semibold">Sync Drive</span> above to fetch photos from Google Drive.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {eventPhotos[event._id].map((photo) => (
                                          <div
                                            key={photo._id || photo.storageId}
                                            className={`bg-[#1c1f26] border rounded-xl overflow-hidden aspect-square flex flex-col justify-between relative group ${
                                              photo.isSelected ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-[#2a2e38]'
                                            }`}
                                          >
                                            <div className="flex-1 w-full overflow-hidden bg-black/40">
                                              <img
                                                src={`${apiBase}/client-gallery/media/${photo.storageId}?sz=thumb`}
                                                alt={photo.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                              />
                                            </div>

                                            {photo.isSelected && (
                                              <div className="absolute top-1.5 right-1.5 bg-amber-400 text-black rounded-full p-1 shadow">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                              </div>
                                            )}

                                            {/* Filename caption bar */}
                                            <div className="bg-[#121417]/95 px-2 py-1.5 border-t border-[#2a2e38] text-center">
                                              <span className="text-[11px] font-mono text-gray-300 truncate block">
                                                {photo.name}
                                              </span>
                                              {photo.clientComment && (
                                                <span className="text-[10px] text-amber-300 truncate block italic">
                                                  {photo.clientComment}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTROOM SEARCH STRING MODAL */}
      <AnimatePresence>
        {isLightroomModalOpen && lightroomData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121417] border border-[#2a2e38] w-full max-w-2xl p-6 space-y-4 rounded-xl text-white"
            >
              <div className="flex justify-between items-center border-b border-[#22252e] pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Adobe Lightroom Query
                </h3>
                <button
                  onClick={() => setIsLightroomModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-400">
                {lightroomData.clientName} &mdash; {lightroomData.eventName} ({lightroomData.totalSelected} selected)
              </p>

              <textarea
                readOnly
                rows={4}
                value={lightroomData.lightroomQuery}
                className="w-full bg-[#181a20] border border-[#2a2d35] p-3 text-xs font-mono text-emerald-400 rounded-lg focus:outline-none"
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-gray-500">
                  Paste into Lightroom: Library Filter &rarr; Text &rarr; Filename contains words.
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lightroomData.lightroomQuery);
                    addToast('Lightroom query copied to clipboard!', 'success');
                  }}
                  className="bg-white hover:bg-gray-200 text-black font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Query
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTO PREVIEW DRAWER */}
      <AnimatePresence>
        {viewGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#121417] border border-[#2a2e38] w-full max-w-6xl my-6 p-6 space-y-6 text-white max-h-[92vh] flex flex-col rounded-xl"
            >
              <div className="flex justify-between items-center border-b border-[#22252e] pb-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    {viewGallery.clientName} &mdash; {viewGallery.eventName}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {galleryMedia.filter((m) => m.isSelected).length} selected of {galleryMedia.length} total photos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-[#181a20] border border-[#2a2d35] rounded-md p-0.5 text-xs">
                    <button
                      onClick={() => setMediaFilter('all')}
                      className={`px-3 py-1 rounded ${mediaFilter === 'all' ? 'bg-white text-black font-semibold' : 'text-gray-400'}`}
                    >
                      All ({galleryMedia.length})
                    </button>
                    <button
                      onClick={() => setMediaFilter('selected')}
                      className={`px-3 py-1 rounded ${mediaFilter === 'selected' ? 'bg-white text-black font-semibold' : 'text-gray-400'}`}
                    >
                      Selected ({galleryMedia.filter((m) => m.isSelected).length})
                    </button>
                  </div>

                  <button
                    onClick={() => setViewGallery(null)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {isLoadingMedia ? (
                  <div className="py-24 text-center text-gray-400">
                    <div className="w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-xs uppercase tracking-widest">Loading photos...</span>
                  </div>
                ) : galleryMedia.length === 0 ? (
                  <div className="py-24 text-center text-gray-500">
                    <p className="text-sm">No photos found. Click Sync Drive to fetch from Google Drive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {galleryMedia
                      .filter((m) => (mediaFilter === 'selected' ? m.isSelected : true))
                      .map((media) => (
                        <div
                          key={media._id || media.storageId}
                          className={`relative group bg-[#181a20] border aspect-square overflow-hidden rounded-lg ${
                            media.isSelected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-[#22252e]'
                          }`}
                        >
                          <img
                            src={`${apiBase}/client-gallery/media/${media.storageId}?sz=thumb`}
                            alt={media.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {media.isSelected && (
                            <div className="absolute top-2 right-2 bg-amber-400 text-black rounded-full p-1 shadow-lg">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 text-[11px] text-white">
                            <div className="truncate font-mono">{media.name}</div>
                            {media.clientComment && (
                              <div className="text-[10px] text-amber-300 truncate mt-0.5 italic">
                                Note: {media.clientComment}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
