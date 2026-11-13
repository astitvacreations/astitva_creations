import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  Plus,
  RefreshCw,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit3,
  Unlock,
  Eye,
  Send,
  Calendar,
  Phone,
  Mail,
  Folder,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  FileText,
  AlertTriangle,
  FolderArchive
} from 'lucide-react';
import { useClientGalleryStore } from '../../store/clientGalleryStore';
import { useToastStore } from '../../store/toastStore';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ClientGalleryManager() {
  const {
    galleries,
    isLoading,
    isSyncing,
    fetchGalleries,
    createGallery,
    updateGallery,
    deleteGallery,
    syncGallery,
    reopenGallery,
    sendAccessLink,
    getLightroomQuery
  } = useClientGalleryStore();

  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  const [activeTab, setActiveTab] = useState('galleries');
  const [copiedId, setCopiedId] = useState(null);

  // Detail Modal / Photos Viewer
  const [viewGallery, setViewGallery] = useState(null);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState('all'); // all, selected

  // Lightroom Modal
  const [lightroomData, setLightroomData] = useState(null);
  const [isLightroomModalOpen, setIsLightroomModalOpen] = useState(false);

  // Create / Edit Form State
  const initialFormState = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventName: '',
    eventDate: '',
    folderLink: '',
    accessPin: '',
    status: 'Published',
    maxSelectionsAllowed: '',
    minSelectionsRequired: 0,
    allowClientDownloads: true,
    watermarkEnabled: false,
    watermarkText: 'Astitva Creations',
    expiresAt: '',
    subEvents: []
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchGalleries().catch((err) => addToast(err.message, 'error'));
  }, []);

  // Filtered Galleries
  const filteredGalleries = galleries.filter((g) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      g.clientName?.toLowerCase().includes(q) ||
      g.eventName?.toLowerCase().includes(q) ||
      g.clientEmail?.toLowerCase().includes(q) ||
      g.clientPhone?.includes(q) ||
      g.galleryId?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Statistics
  const stats = {
    total: galleries.length,
    selecting: galleries.filter((g) => g.status === 'Selecting' || g.status === 'Published').length,
    submitted: galleries.filter((g) => g.status === 'Submitted').length,
    totalPhotos: galleries.reduce((acc, g) => acc + (g.totalPhotos || 0), 0)
  };

  const handleOpenCreateModal = () => {
    setEditingGallery(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gallery) => {
    setEditingGallery(gallery);
    setFormData({
      clientName: gallery.clientName || '',
      clientEmail: gallery.clientEmail || '',
      clientPhone: gallery.clientPhone || '',
      eventName: gallery.eventName || '',
      eventDate: gallery.eventDate ? new Date(gallery.eventDate).toISOString().split('T')[0] : '',
      folderLink: gallery.folderLink || gallery.folderId || '',
      accessPin: gallery.accessPin || '',
      status: gallery.status || 'Published',
      maxSelectionsAllowed: gallery.settings?.maxSelectionsAllowed ?? '',
      minSelectionsRequired: gallery.settings?.minSelectionsRequired ?? 0,
      allowClientDownloads: gallery.settings?.allowClientDownloads !== false,
      watermarkEnabled: Boolean(gallery.settings?.watermarkEnabled),
      watermarkText: gallery.settings?.watermarkText || 'Astitva Creations',
      expiresAt: gallery.settings?.expiresAt ? new Date(gallery.settings.expiresAt).toISOString().split('T')[0] : '',
      subEvents: gallery.subEvents || []
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      addToast('Client Name is required', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        settings: {
          maxSelectionsAllowed: formData.maxSelectionsAllowed ? Number(formData.maxSelectionsAllowed) : null,
          minSelectionsRequired: Number(formData.minSelectionsRequired) || 0,
          allowClientDownloads: formData.allowClientDownloads,
          watermarkEnabled: formData.watermarkEnabled,
          watermarkText: formData.watermarkText,
          expiresAt: formData.expiresAt || null
        }
      };

      if (editingGallery) {
        await updateGallery(editingGallery._id, payload);
        addToast('Client gallery updated successfully', 'success');
      } else {
        await createGallery(payload);
        addToast('Client gallery created & photos indexed successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingGallery(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (gallery) => {
    if (!window.confirm(`Delete client gallery for "${gallery.clientName}"? All indexed media records will also be deleted.`)) return;
    try {
      await deleteGallery(gallery._id);
      addToast('Gallery deleted successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSync = async (id, name) => {
    try {
      addToast(`Syncing Google Drive photos for ${name}...`, 'info');
      const res = await syncGallery(id);
      addToast(`Sync complete! ${res.totalPhotos} photos now indexed.`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleReopen = async (id, name) => {
    if (!window.confirm(`Reopen selection for "${name}"? The client will be able to alter their submitted selections.`)) return;
    try {
      await reopenGallery(id);
      addToast('Gallery reopened for client selection', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCopyLink = (galleryId) => {
    const url = `${window.location.origin}/gallery/${galleryId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(galleryId);
    addToast('Client gallery link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendLink = async (id, name) => {
    try {
      await sendAccessLink(id, 'both');
      addToast(`Access link sent to ${name} via WhatsApp & Email!`, 'success');
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

  const handleOpenLightroom = async (gallery) => {
    try {
      const data = await getLightroomQuery(gallery._id);
      setLightroomData({ ...data, clientName: gallery.clientName });
      setIsLightroomModalOpen(true);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleBulkExportSubmitted = () => {
    window.open(`${apiBase}/client-gallery/download-all-submitted`, '_blank');
    addToast('Preparing bulk ZIP archive for all submitted shoots...', 'info');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published':
        return <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded">Published</span>;
      case 'Selecting':
        return <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">Selecting</span>;
      case 'Submitted':
        return <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Submitted</span>;
      case 'Archived':
        return <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 rounded">Archived</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/30 rounded">Draft</span>;
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Client Gallery Manager | Astitva Admin</title>
      </Helmet>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--color-gold)] flex items-center gap-3">
            <Camera className="w-8 h-8" /> Client Gallery Proofing & Delivery
          </h1>
          <p className="text-[#A1A1A1] text-sm mt-1">
            Manage shoot photo proofing, Google Drive synchronization, client selection quotas, and Adobe Lightroom export pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleBulkExportSubmitted}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest font-semibold transition-colors"
            title="Download unified ZIP of all submitted client selections"
          >
            <FolderArchive className="w-4 h-4 text-[var(--color-gold)]" />
            Bulk Submitted ZIP
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
          >
            <Plus className="w-4 h-4" /> New Client Gallery
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-[#222] p-5 rounded-none">
          <div className="text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">Total Galleries</div>
          <div className="text-3xl font-heading text-white">{stats.total}</div>
        </div>
        <div className="bg-[#111] border border-[#222] p-5 rounded-none">
          <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">Awaiting Selections</div>
          <div className="text-3xl font-heading text-amber-400">{stats.selecting}</div>
        </div>
        <div className="bg-[#111] border border-[#222] p-5 rounded-none">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">Selections Submitted</div>
          <div className="text-3xl font-heading text-emerald-400">{stats.submitted}</div>
        </div>
        <div className="bg-[#111] border border-[#222] p-5 rounded-none">
          <div className="text-xs uppercase tracking-wider text-[var(--color-gold)] font-semibold mb-1">Indexed Photos</div>
          <div className="text-3xl font-heading text-[var(--color-gold)]">{stats.totalPhotos}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#111] border border-[#222] p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
          <input
            type="text"
            placeholder="Search by client name, event, phone, email, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#333] pl-9 pr-4 py-2 text-sm text-white placeholder-[#666] focus:border-[var(--color-gold)] outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#777] hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#181818] border border-[#333] px-3 py-2 text-sm text-white focus:border-[var(--color-gold)] outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Selecting">Selecting</option>
            <option value="Submitted">Submitted (Ready)</option>
            <option value="Archived">Archived</option>
          </select>

          <button
            onClick={() => fetchGalleries()}
            className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-[#A1A1A1] hover:text-white transition-colors"
            title="Refresh Galleries"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--color-gold)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Galleries Table / List */}
      {isLoading && galleries.length === 0 ? (
        <div className="bg-[#111] border border-[#222] p-16 text-center text-[#A1A1A1]">
          <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs uppercase tracking-widest">Loading client galleries...</span>
        </div>
      ) : filteredGalleries.length === 0 ? (
        <div className="bg-[#111] border border-[#222] p-16 text-center text-[#A1A1A1]">
          <Camera className="w-12 h-12 text-[#444] mx-auto mb-3" />
          <h3 className="text-lg font-heading text-white mb-1">No Galleries Found</h3>
          <p className="text-sm max-w-md mx-auto text-[#777]">
            {search || statusFilter !== 'ALL'
              ? 'No galleries match your search filters.'
              : 'Create your first client gallery to start proofing photos from Google Drive.'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-6 py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              + Create First Gallery
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGalleries.map((gallery) => {
            const quotaMax = gallery.settings?.maxSelectionsAllowed;
            const selectedCount = gallery.selectedCount || 0;
            const pct = quotaMax ? Math.min(100, Math.round((selectedCount / quotaMax) * 100)) : 0;

            return (
              <div
                key={gallery._id}
                className="bg-[#111] border border-[#222] hover:border-[#333] p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Client & Event Information */}
                <div className="space-y-2 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-heading text-white">{gallery.clientName}</span>
                    {getStatusBadge(gallery.status)}
                    {gallery.accessPin && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-[#222] text-[#A1A1A1] border border-[#333] flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[var(--color-gold)]" /> PIN: {gallery.accessPin}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-[var(--color-gold)] font-medium">
                    {gallery.eventName || 'Photo Shoot'}
                    {gallery.eventDate && (
                      <span className="text-xs text-[#777] ml-2">
                        ({new Date(gallery.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#888]">
                    {gallery.clientPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#555]" /> {gallery.clientPhone}
                      </span>
                    )}
                    {gallery.clientEmail && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#555]" /> {gallery.clientEmail}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 font-mono text-[#aaa]">
                      <Folder className="w-3 h-3 text-[#555]" /> slug: {gallery.galleryId}
                    </span>
                  </div>

                  {gallery.submissionNotes && (
                    <div className="bg-[#181818] border-l-2 border-[var(--color-gold)] p-2 text-xs text-[#ccc] italic mt-2">
                      &ldquo;{gallery.submissionNotes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Center: Quotas & Selections Progress */}
                <div className="min-w-[200px] lg:w-56 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A1A1A1]">Selections</span>
                    <span className="font-bold text-white font-mono">
                      {selectedCount} {quotaMax ? `/ ${quotaMax}` : 'photos'}
                    </span>
                  </div>
                  {quotaMax ? (
                    <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          gallery.status === 'Submitted' ? 'bg-emerald-500' : 'bg-[var(--color-gold)]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#666]">Unlimited selection quota</div>
                  )}
                  <div className="flex justify-between text-[11px] text-[#666] pt-1">
                    <span>Total indexed: {gallery.totalPhotos || 0}</span>
                    {gallery.settings?.expiresAt && (
                      <span className="text-amber-500/80">
                        Exp: {new Date(gallery.settings.expiresAt).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Operational Actions */}
                <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                  {/* View Photos & Proofs */}
                  <button
                    onClick={() => handleViewPhotos(gallery)}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] transition-colors"
                    title="View Photos & Client Selections"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Sync with Google Drive */}
                  <button
                    onClick={() => handleSync(gallery._id, gallery.clientName)}
                    disabled={isSyncing}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] transition-colors disabled:opacity-50"
                    title="Rescan & Sync Google Drive Folder"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Copy Client Link */}
                  <button
                    onClick={() => handleCopyLink(gallery.galleryId)}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] transition-colors"
                    title="Copy Client Access Link"
                  >
                    {copiedId === gallery.galleryId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Send Access Link to WhatsApp / Email */}
                  <button
                    onClick={() => handleSendLink(gallery._id, gallery.clientName)}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-emerald-500 text-white hover:text-emerald-400 transition-colors"
                    title="Send Access Link via WhatsApp & Email"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  {/* Lightroom Search String Exporter */}
                  <button
                    onClick={() => handleOpenLightroom(gallery)}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-sky-500 text-white hover:text-sky-400 transition-colors"
                    title="Lightroom Search Query Generator"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {/* Selection CSV Report */}
                  <a
                    href={`${apiBase}/client-gallery/${gallery._id}/export-csv`}
                    download
                    className="p-2 bg-[#181818] border border-[#333] hover:border-emerald-500 text-white hover:text-emerald-400 transition-colors"
                    title="Download Selections CSV Report"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </a>

                  {/* High-Res Streaming ZIP Archive */}
                  <a
                    href={`${apiBase}/client-gallery/${gallery._id}/download-selections`}
                    download
                    className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] transition-colors"
                    title="Download Streaming ZIP of Selected Photos"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Reopen submitted gallery if locked */}
                  {gallery.status === 'Submitted' && (
                    <button
                      onClick={() => handleReopen(gallery._id, gallery.clientName)}
                      className="p-2 bg-[#181818] border border-amber-500/30 hover:border-amber-500 text-amber-400 transition-colors"
                      title="Reopen Gallery for Client Modification"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  )}

                  {/* Edit Gallery Settings */}
                  <button
                    onClick={() => handleOpenEditModal(gallery)}
                    className="p-2 bg-[#181818] border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] transition-colors"
                    title="Edit Gallery Settings"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Gallery */}
                  <button
                    onClick={() => handleDelete(gallery)}
                    className="p-2 bg-[#181818] border border-red-500/20 hover:border-red-500 text-red-400 transition-colors"
                    title="Delete Gallery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT GALLERY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#333] w-full max-w-3xl my-8 p-6 md:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-4">
                <h2 className="text-xl font-heading text-[var(--color-gold)] flex items-center gap-2">
                  <Camera className="w-5 h-5" /> {editingGallery ? 'Edit Client Gallery' : 'Create New Client Gallery'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-[#A1A1A1] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* 1. Client & Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g. Rahul & Sneha"
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      placeholder="e.g. Wedding & Reception"
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Client Mobile Number
                    </label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="e.g. 919876543210 or 9876543210"
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-2">
                      Gallery Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                    >
                      <option value="Draft">Draft (Admin Only)</option>
                      <option value="Published">Published (Open for Client)</option>
                      <option value="Selecting">Selecting (In Progress)</option>
                      <option value="Submitted">Submitted (Locked)</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* 2. Google Drive Source & Access Security */}
                <div className="space-y-4 pt-4 border-t border-[#222]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
                    Storage & Security
                  </h3>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">
                      Google Drive Folder Link / ID *
                    </label>
                    <input
                      type="text"
                      value={formData.folderLink}
                      onChange={(e) => setFormData({ ...formData, folderLink: e.target.value })}
                      placeholder="https://drive.google.com/drive/folders/1ABCxyz... or folder ID"
                      className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none font-mono"
                    />
                    <p className="text-[11px] text-[#666] mt-1">
                      Provide the Google Drive folder link. The system extracts the folder ID and indexes all high-res photos automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">
                        Access PIN (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.accessPin}
                        onChange={(e) => setFormData({ ...formData, accessPin: e.target.value })}
                        placeholder="e.g. 1008 (4-6 digits)"
                        className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none font-mono"
                      />
                      <p className="text-[11px] text-[#666] mt-1">
                        If provided, client will be prompted for this PIN before viewing.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">
                        Selection Expiration Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                      />
                      <p className="text-[11px] text-[#666] mt-1">
                        Automated reminders trigger 7 days after publishing and 3 days before expiry.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Proofing & Selection Quotas */}
                <div className="space-y-4 pt-4 border-t border-[#222]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
                    Proofing Quotas & Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">
                        Max Selections Allowed
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxSelectionsAllowed}
                        onChange={(e) => setFormData({ ...formData, maxSelectionsAllowed: e.target.value })}
                        placeholder="e.g. 80 (leave blank for unlimited)"
                        className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                      />
                      <p className="text-[11px] text-[#666] mt-1">Enforces client album selection ceiling.</p>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold mb-1">
                        Min Selections Required
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minSelectionsRequired}
                        onChange={(e) => setFormData({ ...formData, minSelectionsRequired: e.target.value })}
                        placeholder="0"
                        className="w-full bg-[#181818] border border-[#333] px-4 py-2.5 text-sm text-white focus:border-[var(--color-gold)] outline-none"
                      />
                      <p className="text-[11px] text-[#666] mt-1">Client cannot submit until reaching this count.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowClientDownloads}
                        onChange={(e) => setFormData({ ...formData, allowClientDownloads: e.target.checked })}
                        className="w-4 h-4 accent-[var(--color-gold)]"
                      />
                      <span className="text-xs uppercase tracking-wider text-white font-semibold">
                        Allow Client Full ZIP Download
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.watermarkEnabled}
                        onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[var(--color-gold)]"
                      />
                      <span className="text-xs uppercase tracking-wider text-white font-semibold">
                        Watermark Preview Images
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[#222]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-[#222] hover:bg-[#333] text-white text-xs uppercase tracking-widest font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
                  >
                    {editingGallery ? 'Update Gallery' : 'Create & Index Photos'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTROOM SEARCH STRING MODAL */}
      <AnimatePresence>
        {isLightroomModalOpen && lightroomData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#333] w-full max-w-2xl p-6 md:p-8 space-y-5 text-white"
            >
              <div className="flex justify-between items-center border-b border-[#222] pb-4">
                <div>
                  <h2 className="text-xl font-heading text-[var(--color-gold)] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-400" /> Adobe Lightroom / Capture One Filter
                  </h2>
                  <p className="text-xs text-[#A1A1A1] mt-0.5">
                    Query for {lightroomData.clientName} ({lightroomData.totalSelected} photos selected)
                  </p>
                </div>
                <button
                  onClick={() => setIsLightroomModalOpen(false)}
                  className="p-1 text-[#A1A1A1] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider text-[#A1A1A1] font-semibold">
                  Lightroom Filter Bar Query (Filename contains words)
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={lightroomData.lightroomQuery}
                    className="w-full bg-[#181818] border border-[#333] p-3 text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-[#777]">
                  Paste directly into Lightroom Library Filter &rarr; Text &rarr; Filename: Contains Words.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lightroomData.lightroomQuery);
                      addToast('Lightroom search string copied!', 'success');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-gold)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Query
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTOS / SELECTIONS PREVIEW MODAL */}
      <AnimatePresence>
        {viewGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#111] border border-[#333] w-full max-w-6xl my-6 p-6 space-y-6 text-white max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#222] pb-4 shrink-0">
                <div>
                  <h2 className="text-xl font-heading text-[var(--color-gold)]">
                    {viewGallery.clientName} &mdash; {viewGallery.eventName}
                  </h2>
                  <p className="text-xs text-[#A1A1A1] mt-0.5">
                    {galleryMedia.filter((m) => m.isSelected).length} selected of {galleryMedia.length} total photos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-[#181818] border border-[#333] p-0.5 text-xs">
                    <button
                      onClick={() => setMediaFilter('all')}
                      className={`px-3 py-1 ${mediaFilter === 'all' ? 'bg-[var(--color-gold)] text-black font-semibold' : 'text-[#A1A1A1]'}`}
                    >
                      All ({galleryMedia.length})
                    </button>
                    <button
                      onClick={() => setMediaFilter('selected')}
                      className={`px-3 py-1 ${mediaFilter === 'selected' ? 'bg-[var(--color-gold)] text-black font-semibold' : 'text-[#A1A1A1]'}`}
                    >
                      Selected Only ({galleryMedia.filter((m) => m.isSelected).length})
                    </button>
                  </div>

                  <button
                    onClick={() => setViewGallery(null)}
                    className="p-1 text-[#A1A1A1] hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {isLoadingMedia ? (
                  <div className="py-24 text-center text-[#A1A1A1]">
                    <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <span className="text-xs uppercase tracking-widest">Loading photos...</span>
                  </div>
                ) : galleryMedia.length === 0 ? (
                  <div className="py-24 text-center text-[#666]">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-[#444]" />
                    <p className="text-sm">No photos found. Click Sync to fetch from Google Drive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {galleryMedia
                      .filter((m) => (mediaFilter === 'selected' ? m.isSelected : true))
                      .map((media) => (
                        <div
                          key={media._id || media.storageId}
                          className={`relative group bg-[#181818] border aspect-square overflow-hidden ${
                            media.isSelected ? 'border-[var(--color-gold)] ring-2 ring-[var(--color-gold)]/30' : 'border-[#222]'
                          }`}
                        >
                          <img
                            src={`${apiBase}/client-gallery/media/${media.storageId}?sz=thumb`}
                            alt={media.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // If proxy thumbnail is generating, fallback or placeholder
                              e.target.style.opacity = 0.5;
                            }}
                          />

                          {/* Selected Checkmark Badge */}
                          {media.isSelected && (
                            <div className="absolute top-2 right-2 bg-[var(--color-gold)] text-black rounded-full p-1 shadow-lg">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Info Overlay on Hover / Active */}
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
