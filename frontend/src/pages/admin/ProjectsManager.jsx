import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { useProjectStore } from '../../store/projectStore';
import { useServiceStore } from '../../store/serviceStore';
import ImageUpload from '../../components/admin/ImageUpload';

export default function ProjectsManager() {
  const { addToast } = useToastStore();
  const { projects, addProject, updateProject, deleteProject } = useProjectStore();
  const { services } = useServiceStore();
  
  const [search, setSearch] = useState('');

  // Modal States
  const [editingProject, setEditingProject] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState('Thumbnail & Banner');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', slug: '', serviceId: '', date: '', location: '', coverImage: '', mainImage: '', videoUrls: [], tags: [], description: '' });

  // Drag-to-Position Alignment states
  const [draggingField, setDraggingField] = useState(null); // 'cover' | 'main' | null
  const dragStartRef = useRef(null);
  const editingProjectRef = useRef(null);

  // Keep ref up to date with the latest project state for use in global window event listeners
  useEffect(() => {
    editingProjectRef.current = editingProject;
  }, [editingProject]);

  // Decode standard CSS keywords or space-separated percentage strings safely
  const parsePosition = (posStr) => {
    if (!posStr) return { x: 50, y: 50 };
    
    const trimmed = posStr.trim().toLowerCase();
    if (trimmed === 'center') return { x: 50, y: 50 };
    if (trimmed === 'top') return { x: 50, y: 0 };
    if (trimmed === 'bottom') return { x: 50, y: 100 };
    if (trimmed === 'left') return { x: 0, y: 50 };
    if (trimmed === 'right') return { x: 100, y: 50 };
    
    const parts = trimmed.split(/\s+/);
    let x = 50;
    let y = 50;
    
    if (parts[0]) {
      const parsedX = parseFloat(parts[0]);
      if (!isNaN(parsedX)) x = parsedX;
    }
    if (parts[1]) {
      const parsedY = parseFloat(parts[1]);
      if (!isNaN(parsedY)) y = parsedY;
    } else {
      if (parts[0] === 'top' || parts[0] === 'bottom') {
        y = parts[0] === 'top' ? 0 : 100;
        x = 50;
      } else if (parts[0] === 'left' || parts[0] === 'right') {
        x = parts[0] === 'left' ? 0 : 100;
        y = 50;
      }
    }
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleUpdateCoverPosition = async (pos) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    try {
      const current = typeof latestProject.coverImage === 'object' ? latestProject.coverImage : { url: latestProject.coverImage, public_id: `legacy-${Date.now()}` };
      const updated = { ...current, position: pos };
      await updateProject(latestProject._id, { coverImage: updated });
      setEditingProject(prev => ({ ...prev, coverImage: updated }));
      addToast('Cover thumbnail positioning updated', 'success');
    } catch (error) {
      addToast('Failed to update positioning', 'error');
    }
  };

  const handleUpdateMainPosition = async (pos) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    try {
      const current = typeof latestProject.mainImage === 'object' ? latestProject.mainImage : { url: latestProject.mainImage, public_id: `legacy-${Date.now()}` };
      const updated = { ...current, position: pos };
      await updateProject(latestProject._id, { mainImage: updated });
      setEditingProject(prev => ({ ...prev, mainImage: updated }));
      addToast('Main hero banner positioning updated', 'success');
    } catch (error) {
      addToast('Failed to update positioning', 'error');
    }
  };

  // Bind mouse down / touch start properties and calculate dimension bounding boxes
  const handleDragStart = (e, field) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    
    const currentPosStr = field === 'cover'
      ? (typeof editingProject.coverImage === 'object' ? editingProject.coverImage?.position || 'center' : 'center')
      : (typeof editingProject.mainImage === 'object' ? editingProject.mainImage?.position || 'center' : 'center');
    
    const startPos = parsePosition(currentPosStr);
    
    dragStartRef.current = {
      clientX,
      clientY,
      startX: startPos.x,
      startY: startPos.y,
      containerWidth: rect.width || 200,
      containerHeight: rect.height || 266
    };
    
    setDraggingField(field);
  };

  // Core window-bound dragging loop to capture movement fluidly outside the preview box
  useEffect(() => {
    if (!draggingField) return;

    const handleWindowMouseMove = (e) => {
      if (!dragStartRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.clientX;
      const deltaY = clientY - dragStartRef.current.clientY;

      const percentDeltaX = (deltaX / dragStartRef.current.containerWidth) * 100;
      const percentDeltaY = (deltaY / dragStartRef.current.containerHeight) * 100;

      const newX = Math.max(0, Math.min(100, dragStartRef.current.startX - percentDeltaX));
      const newY = Math.max(0, Math.min(100, dragStartRef.current.startY - percentDeltaY));

      const positionStr = `${Math.round(newX)}% ${Math.round(newY)}%`;

      setEditingProject(prev => {
        if (!prev) return prev;
        if (draggingField === 'cover') {
          const cover = typeof prev.coverImage === 'object' ? prev.coverImage : { url: prev.coverImage };
          return { ...prev, coverImage: { ...cover, position: positionStr } };
        } else {
          const main = typeof prev.mainImage === 'object' ? prev.mainImage : { url: prev.mainImage };
          return { ...prev, mainImage: { ...main, position: positionStr } };
        }
      });
    };

    const handleWindowMouseUp = () => {
      const latestProject = editingProjectRef.current;
      if (!draggingField || !latestProject) return;

      const finalPos = draggingField === 'cover'
        ? (typeof latestProject.coverImage === 'object' ? latestProject.coverImage?.position || '50% 50%' : '50% 50%')
        : (typeof latestProject.mainImage === 'object' ? latestProject.mainImage?.position || '50% 50%' : '50% 50%');

      if (draggingField === 'cover') {
        handleUpdateCoverPosition(finalPos);
      } else {
        handleUpdateMainPosition(finalPos);
      }

      setDraggingField(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: false });
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowMouseMove, { passive: false });
    window.addEventListener('touchend', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowMouseMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [draggingField]);

  const handleResetPosition = (field) => {
    if (field === 'cover') {
      handleUpdateCoverPosition('50% 50%');
    } else {
      handleUpdateMainPosition('50% 50%');
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      videoUrls: (formData.videoUrls || []).filter(url => url && typeof url === 'string' && url.trim() !== '')
    };

    try {
      if (formData._id) {
        await updateProject(formData._id, cleanedData);
        addToast('Project updated successfully', 'success');
      } else {
        await addProject(cleanedData);
        addToast('Project created successfully', 'success');
      }
      setIsCreating(false);
    } catch (error) {
      addToast(error.message || 'Failed to save project', 'error');
    }
  };

  const handleDeleteProject = (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      deleteProject(id);
      addToast('Project deleted', 'success');
    } catch (error) {
      addToast('Failed to delete project', 'error');
    }
  };

  const getProjectService = (project) => {
    const serviceId = project?.serviceId?._id || project?.serviceId;
    return services.find(s => s._id === serviceId);
  };

  const getSubEventsList = (project) => {
    if (!project) return [];
    const service = getProjectService(project);
    const slug = (service?.slug || '').toLowerCase();
    
    if (slug.includes('wedding') && !slug.includes('pre-wedding')) {
      return ['Engagement', 'Haldi', 'Sangeet', 'Wedding', 'Reception'];
    } else if (slug.includes('pre-wedding')) {
      return ['Promo', 'Cinematic Portrait', 'Golden Hour', 'Behind The Scenes'];
    } else if (slug.includes('half-saree')) {
      return ['Pooja', 'Draped Ceremony', 'Portraits', 'Celebrations'];
    }
    return ['Main Event', 'Portraits', 'Behind The Scenes'];
  };

  // Image Manager specific logic
  const handleAddImageToGallery = (input) => {
    try {
      const inputArr = Array.isArray(input) ? input : [input];
      const newImages = inputArr.map(img => {
        const imgObj = typeof img === 'object' ? img : { url: img, public_id: `legacy-${Date.now()}-${Math.random()}` };
        return {
          url: imgObj.url,
          public_id: imgObj.public_id,
          category: activeMediaTab // Auto-tag with active sub-event tab!
        };
      });
      
      setEditingProject(prev => {
        const updatedImages = [...(prev.images || []), ...newImages];
        updateProject(prev._id, { images: updatedImages });
        return { ...prev, images: updatedImages };
      });
      
      addToast(`${newImages.length} image(s) added to ${activeMediaTab} gallery`, 'success');
    } catch (error) {
      addToast('Failed to add images', 'error');
    }
  };

  const handleUploadCoverImage = async (data) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    try {
      const pos = (typeof latestProject.coverImage === 'object' ? latestProject.coverImage?.position : 'center') || 'center';
      const newCover = { ...data, position: pos };
      await updateProject(latestProject._id, { coverImage: newCover });
      setEditingProject(prev => ({ ...prev, coverImage: newCover }));
      addToast('Cover Thumbnail updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update Cover Thumbnail', 'error');
    }
  };

  const handleUploadMainImage = async (data) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    try {
      const pos = (typeof latestProject.mainImage === 'object' ? latestProject.mainImage?.position : 'center') || 'center';
      const newMain = { ...data, position: pos };
      await updateProject(latestProject._id, { mainImage: newMain });
      setEditingProject(prev => ({ ...prev, mainImage: newMain }));
      addToast('Main Hero Banner updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update Main Hero Banner', 'error');
    }
  };

  const handleRemoveCoverImage = async () => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    if (!window.confirm('Are you sure you want to remove the cover thumbnail?')) return;
    try {
      await updateProject(latestProject._id, { coverImage: null });
      setEditingProject(prev => ({ ...prev, coverImage: null }));
      addToast('Cover Thumbnail removed', 'success');
    } catch (error) {
      addToast('Failed to remove Cover Thumbnail', 'error');
    }
  };

  const handleRemoveMainImage = async () => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    if (!window.confirm('Are you sure you want to remove the main hero banner?')) return;
    try {
      await updateProject(latestProject._id, { mainImage: null });
      setEditingProject(prev => ({ ...prev, mainImage: null }));
      addToast('Main Hero Banner removed', 'success');
    } catch (error) {
      addToast('Failed to remove Main Hero Banner', 'error');
    }
  };


  const handleDeleteImage = async (imgObj) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    if (!window.confirm("Are you sure you want to permanently delete this image?")) return;
    try {
      if (imgObj && imgObj.public_id && !imgObj.public_id.startsWith('legacy')) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiBase}/projects/${latestProject._id}/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_id: imgObj.public_id })
        });
        if (!response.ok) throw new Error('Failed to delete image from server');
      }

      const updatedImages = (latestProject.images || []).filter(
        item => !(item.url === imgObj.url && item.public_id === imgObj.public_id)
      );
      
      await updateProject(latestProject._id, { images: updatedImages });
      setEditingProject(prev => ({ ...prev, images: updatedImages }));
      addToast('Image permanently deleted', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to remove image', 'error');
    }
  };

  const handleMoveImage = async (imgObj, direction) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    
    try {
      const updatedImages = [...(latestProject.images || [])];
      // Find the image by url
      const currentIndex = updatedImages.findIndex(item => (item.url || item) === imgObj.url);
      
      if (currentIndex === -1) return;
      
      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= updatedImages.length) return;
      
      const temp = updatedImages[currentIndex];
      updatedImages[currentIndex] = updatedImages[newIndex];
      updatedImages[newIndex] = temp;
      
      await updateProject(latestProject._id, { images: updatedImages });
      setEditingProject(prev => ({ ...prev, images: updatedImages }));
    } catch (error) {
      addToast('Failed to reorder image', 'error');
    }
  };

  // Video Management Inside Media Manager Modal
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const handleAddTag = async () => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    const trimmed = newChapterName.trim();
    if (!trimmed) {
      addToast('Please enter a valid chapter name', 'error');
      return;
    }
    const currentTags = latestProject.tags || [];
    if (currentTags.includes(trimmed) || trimmed.toLowerCase() === 'general') {
      addToast('Chapter already exists', 'error');
      return;
    }
    const updatedTags = [...currentTags, trimmed];
    try {
      await updateProject(latestProject._id, { tags: updatedTags });
      setEditingProject(prev => ({ ...prev, tags: updatedTags }));
      setActiveMediaTab(trimmed);
      setNewChapterName('');
      addToast(`Chapter "${trimmed}" added successfully`, 'success');
    } catch (err) {
      addToast('Failed to add chapter', 'error');
    }
  };

  const handleRemoveTag = async (tagToRemove, e) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the chapter "${tagToRemove}"?`)) return;
    const updatedTags = (latestProject.tags || []).filter(t => t !== tagToRemove);
    try {
      await updateProject(latestProject._id, { tags: updatedTags });
      setEditingProject(prev => ({ ...prev, tags: updatedTags }));
      if (activeMediaTab === tagToRemove) {
         setActiveMediaTab('Thumbnail & Banner');
      }
      addToast(`Chapter "${tagToRemove}" removed`, 'success');
    } catch (err) {
      addToast('Failed to remove chapter', 'error');
    }
  };


  const handleAddVideoLink = async (category, url) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    if (!url.trim()) {
      addToast('Please enter a valid YouTube URL', 'error');
      return;
    }
    const videoStr = `${category}|${url.trim()}`;
    const updatedUrls = [...(latestProject.videoUrls || []), videoStr];
    
    try {
      await updateProject(latestProject._id, { videoUrls: updatedUrls });
      setEditingProject(prev => ({ ...prev, videoUrls: updatedUrls }));
      addToast(`Video link added to ${category} successfully`, 'success');
    } catch (err) {
      addToast('Failed to add video link', 'error');
    }
  };

  const handleDeleteVideoLink = async (mainIdx) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    if (!window.confirm('Are you sure you want to delete this video link?')) return;
    const updatedUrls = (latestProject.videoUrls || []).filter((_, idx) => idx !== mainIdx);
    
    try {
      await updateProject(latestProject._id, { videoUrls: updatedUrls });
      setEditingProject(prev => ({ ...prev, videoUrls: updatedUrls }));
      addToast('Video link removed', 'success');
    } catch (err) {
      addToast('Failed to remove video link', 'error');
    }
  };

  const handleUpdateVideoCategory = async (mainIdx, newCat, url) => {
    const latestProject = editingProjectRef.current;
    if (!latestProject) return;
    const updatedUrls = [...(latestProject.videoUrls || [])];
    updatedUrls[mainIdx] = `${newCat}|${url}`;
    
    updateProject(latestProject._id, { videoUrls: updatedUrls });
    setEditingProject(prev => ({ ...prev, videoUrls: updatedUrls }));
    addToast('Video category updated', 'success');
  };

  return (
    <>
      <Helmet>
        <title>Manage Projects | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-heading text-3xl text-white mb-1">Projects / Events</h2>
            <p className="text-[#A1A1A1] text-sm">Create, edit, and manage your events and galleries.</p>
          </div>
          <button 
            onClick={() => { setFormData({ title: '', slug: '', serviceId: '', date: '', location: '', coverImage: '', mainImage: '', videoUrls: [], tags: [], description: '' }); setIsCreating(true); }}
            className="px-6 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Event
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222]"
        >
          <div className="p-4 border-b border-[#222] flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input 
                type="text" 
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest">
                  <th className="p-4">Title</th>
                  <th className="p-4">Category (Service)</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(project => {
                  const serviceId = project.serviceId?._id || project.serviceId;
                  const projectService = services.find(s => s._id === serviceId);
                  
                  return (
                  <tr key={project._id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-semibold text-white">{project.title}</td>
                    <td className="p-4 text-[var(--color-gold)]">{projectService?.title || 'Unknown'}</td>
                    <td className="p-4 text-[#A1A1A1]">{project.date ? new Date(project.date).toLocaleDateString() : ''}</td>
                    <td className="p-4 text-[#777]">{project.location}</td>
                    <td className="p-4 text-right flex justify-end gap-3">
                      <button 
                        onClick={() => { 
                          setEditingProject(project); 
                          setActiveMediaTab('Thumbnail & Banner'); 
                        }} 
                        className="p-2 text-[#A1A1A1] hover:text-white hover:bg-[#333] rounded transition-colors" 
                        title="Manage Media"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { 
                          // Handle populated serviceId object
                           const serviceId = project.serviceId?._id || project.serviceId;
                           setFormData({ 
                             ...project, 
                             serviceId,
                             videoUrls: project.videoUrls || [],
                             tags: project.tags || [],
                             coverImage: project.coverImage || '',
                             mainImage: project.mainImage || ''
                           }); 
                           setIsCreating(true); 
                        }} 
                        className="p-2 text-[#A1A1A1] hover:text-white hover:bg-[#333] rounded transition-colors" 
                        title="Edit Metadata"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProject(project._id)} className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete Event">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )})}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#A1A1A1]">No events found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-sm overflow-y-auto flex justify-center py-10 px-4">
            <div className="bg-[#111] border border-[#222] w-full max-w-xl rounded-sm h-fit">
              <div className="flex justify-between items-center p-6 border-b border-[#222]">
                <h3 className="font-heading text-2xl text-white">{formData._id ? 'Edit Event' : 'New Event'}</h3>
                <button type="button" onClick={() => setIsCreating(false)} className="text-[#A1A1A1] hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Short Description</label>
                  <textarea required value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white h-20" placeholder="Brief event description..." />
                </div>
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Slug</label>
                  <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Service / Category</label>
                  <select required value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white">
                    <option value="">Select Service...</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Sub-Events / Chapters (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="Engagement, Haldi, Sangeet, Wedding, Reception" 
                    value={(formData.tags || []).join(', ')} 
                    onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} 
                    className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Date</label>
                    <input 
                      required 
                      type="date" 
                      value={formData.date ? formData.date.split('T')[0] : ''} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white [color-scheme:dark] cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">Location</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2">YouTube Video Links & Categories</label>
                  <div className="space-y-3 mb-2">
                    {(formData.videoUrls || []).map((videoStr, idx) => {
                      let category = 'General';
                      let url = videoStr || '';
                      if (videoStr && typeof videoStr === 'string' && videoStr.includes('|')) {
                        const parts = videoStr.split('|');
                        category = parts[0];
                        url = parts[1];
                      }
                      const projectTags = formData.tags && formData.tags.length > 0
                        ? formData.tags
                        : ['Engagement', 'Haldi', 'Sangeet', 'Wedding', 'Reception'];
                      return (
                        <div key={idx} className="flex gap-2 bg-[#0a0a0a] p-2 border border-[#222] rounded-sm items-center">
                          <select
                            value={category}
                            onChange={e => {
                              const newUrls = [...formData.videoUrls];
                              newUrls[idx] = `${e.target.value}|${url}`;
                              setFormData({...formData, videoUrls: newUrls});
                            }}
                            className="bg-[#111] text-white text-[10px] uppercase tracking-wider font-bold border border-[#333] px-2 py-2 focus:outline-none"
                          >
                            <option value="General">General</option>
                            {projectTags.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                          </select>
                          <input 
                            type="url" 
                            placeholder="YouTube Video URL"
                            value={url} 
                            onChange={e => {
                              const newUrls = [...formData.videoUrls];
                              newUrls[idx] = `${category}|${e.target.value}`;
                              setFormData({...formData, videoUrls: newUrls});
                            }} 
                            className="flex-1 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 text-white text-sm focus:outline-none" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, videoUrls: formData.videoUrls.filter((_, i) => i !== idx)})}
                            className="p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, videoUrls: [...(formData.videoUrls || []), 'General|']})}
                    className="text-[var(--color-gold)] text-xs uppercase tracking-widest font-bold hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> Add Video Link
                  </button>
                </div>
                <button type="submit" className="w-full py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest">Save Event</button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Image & Video Media Manager Modal */}
        {editingProject && (() => {
          const projectTags = editingProject.tags && editingProject.tags.length > 0
            ? editingProject.tags
            : getSubEventsList(editingProject);
          
          const mediaTabs = ['Thumbnail & Banner', ...projectTags];

          const activePhotos = (editingProject.images || []).map(img => {
            return typeof img === 'object' ? img : { url: img, public_id: `legacy`, category: 'General' };
          }).filter(img => {
            const cat = img?.category || 'General';
            return cat === activeMediaTab;
          });

          const parsedVideos = (editingProject.videoUrls || []).map((v, mainIdx) => {
            if (v && typeof v === 'string' && v.includes('|')) {
              const parts = v.split('|');
              return { category: parts[0], url: parts[1], originalString: v, mainIdx };
            }
            return { category: 'General', url: v || '', originalString: v || '', mainIdx };
          });

          const activeVideos = parsedVideos.filter(v => v.category === activeMediaTab);

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-[#111] border border-[#222] w-full max-w-5xl rounded-sm my-8"
              >
                <div className="flex justify-between items-center p-6 border-b border-[#222]">
                  <div>
                    <h3 className="font-heading text-2xl text-white mb-1">Manage Media: {editingProject.title}</h3>
                    <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">
                      {(editingProject.images || []).length} images & {(editingProject.videoUrls || []).length} videos in gallery
                    </p>
                  </div>
                  <button type="button" onClick={() => { setEditingProject(null); setNewVideoUrl(''); }} className="text-[#A1A1A1] hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Horizontal Sub-Event Tab Bar */}
                <div className="px-6 py-3 border-b border-[#222] bg-[#0a0a0a] flex flex-wrap gap-2 items-center justify-start">
                  {mediaTabs.map(tab => (
                    <div
                      key={tab}
                      onClick={() => setActiveMediaTab(tab)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all border rounded-sm flex items-center gap-2 cursor-pointer ${
                        activeMediaTab === tab
                          ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_10px_rgba(177,146,71,0.15)]'
                          : 'bg-transparent text-gray-400 border-[#222] hover:border-[var(--color-gold)] hover:text-white'
                      }`}
                    >
                      <span>{tab}</span>
                      {activeMediaTab === tab && <span className="w-1 h-1 bg-black rounded-full" />}
                      
                      {/* Delete Chapter option for editable tags */}
                      {tab !== 'Thumbnail & Banner' && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveTag(tab, e)}
                          className={`p-0.5 rounded-full transition-colors ${
                            activeMediaTab === tab 
                              ? 'hover:bg-black/10 text-black/70 hover:text-black' 
                              : 'hover:bg-white/10 text-gray-500 hover:text-white'
                          }`}
                          title={`Delete Chapter "${tab}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Inline Add New Chapter Form */}
                  <div className="flex items-center gap-1.5 ml-2 border border-[#333] bg-[#111] px-2 py-1 rounded-sm">
                    <input
                      type="text"
                      placeholder="NEW CHAPTER..."
                      value={newChapterName}
                      onChange={(e) => setNewChapterName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="bg-transparent border-none text-white text-[9px] uppercase tracking-widest focus:outline-none w-24 font-bold placeholder:text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="text-[var(--color-gold)] hover:text-white transition-colors"
                      title="Add Chapter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#222] max-h-[70vh] overflow-y-auto">
                  {activeMediaTab === 'Thumbnail & Banner' ? (
                    <>
                      {/* Column 1: Cover Thumbnail */}
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-[#222] pb-3">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--color-gold)]">
                            Cover Thumbnail (Portrait 3:4)
                          </h4>
                          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/20 rounded-full uppercase tracking-wider font-semibold">
                            Single Image Limit
                          </span>
                        </div>
                        <p className="text-[#A1A1A1] text-xs leading-relaxed">
                          This portrait image represents this event on the main portfolio listing page.
                        </p>

                        {editingProject.coverImage && (typeof editingProject.coverImage === 'object' ? editingProject.coverImage.url : editingProject.coverImage) ? (
                          <div className="space-y-4 bg-[#0a0a0a] p-4 border border-[#222] rounded-sm">
                            <div 
                              className="relative aspect-[3/4] max-w-[200px] mx-auto border border-[#333] overflow-hidden rounded-sm group cursor-grab active:cursor-grabbing select-none"
                              onMouseDown={(e) => handleDragStart(e, 'cover')}
                              onTouchStart={(e) => handleDragStart(e, 'cover')}
                            >
                              <img 
                                src={typeof editingProject.coverImage === 'object' ? editingProject.coverImage.url : editingProject.coverImage} 
                                style={{ 
                                  objectPosition: typeof editingProject.coverImage === 'object' ? editingProject.coverImage.position || '50% 50%' : '50% 50%',
                                  pointerEvents: 'none'
                                }}
                                className="w-full h-full object-cover select-none" 
                                alt="Cover Thumbnail Preview" 
                                draggable="false"
                              />
                              {/* Descriptive visual hover overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none select-none">
                                <Move className="w-8 h-8 text-[var(--color-gold)] mb-2 animate-pulse" />
                                <span className="text-[10px] text-white uppercase tracking-widest font-bold">Drag to Position</span>
                              </div>
                              {/* Small absolute remove button */}
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCoverImage();
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-all pointer-events-auto shadow-lg"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#777] px-1 font-bold pt-2">
                              <span>Position: {typeof editingProject.coverImage === 'object' ? editingProject.coverImage?.position || '50% 50%' : '50% 50%'}</span>
                              <button 
                                type="button" 
                                onClick={() => handleResetPosition('cover')}
                                className="text-[var(--color-gold)] hover:text-white transition-colors"
                              >
                                Reset to Center
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ImageUpload 
                            multiple={false} 
                            label="Upload Cover Thumbnail" 
                            onUpload={handleUploadCoverImage} 
                          />
                        )}
                      </div>

                      {/* Column 2: Main Hero Banner */}
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-[#222] pb-3">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--color-gold)]">
                            Main Hero Banner (Landscape 16:9)
                          </h4>
                          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/20 rounded-full uppercase tracking-wider font-semibold">
                            Single Image Limit
                          </span>
                        </div>
                        <p className="text-[#A1A1A1] text-xs leading-relaxed">
                          This landscape image spans the top of the event detail page.
                        </p>

                        {editingProject.mainImage && (typeof editingProject.mainImage === 'object' ? editingProject.mainImage.url : editingProject.mainImage) ? (
                          <div className="space-y-4 bg-[#0a0a0a] p-4 border border-[#222] rounded-sm">
                            <div 
                              className="relative aspect-video max-w-md mx-auto border border-[#333] overflow-hidden rounded-sm group cursor-grab active:cursor-grabbing select-none"
                              onMouseDown={(e) => handleDragStart(e, 'main')}
                              onTouchStart={(e) => handleDragStart(e, 'main')}
                            >
                              <img 
                                src={typeof editingProject.mainImage === 'object' ? editingProject.mainImage.url : editingProject.mainImage} 
                                style={{ 
                                  objectPosition: typeof editingProject.mainImage === 'object' ? editingProject.mainImage.position || '50% 50%' : '50% 50%',
                                  pointerEvents: 'none'
                                }}
                                className="w-full h-full object-cover select-none" 
                                alt="Main Hero Banner Preview" 
                                draggable="false"
                              />
                              {/* Descriptive visual hover overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none select-none">
                                <Move className="w-8 h-8 text-[var(--color-gold)] mb-2 animate-pulse" />
                                <span className="text-[10px] text-white uppercase tracking-widest font-bold">Drag to Position</span>
                              </div>
                              {/* Small absolute remove button */}
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMainImage();
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-all pointer-events-auto shadow-lg"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#777] px-1 font-bold pt-2">
                              <span>Position: {typeof editingProject.mainImage === 'object' ? editingProject.mainImage?.position || '50% 50%' : '50% 50%'}</span>
                              <button 
                                type="button" 
                                onClick={() => handleResetPosition('main')}
                                className="text-[var(--color-gold)] hover:text-white transition-colors"
                              >
                                Reset to Center
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ImageUpload 
                            multiple={false} 
                            label="Upload Main Banner Image" 
                            onUpload={handleUploadMainImage} 
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Column 1: Photos Manager */}
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-[#222] pb-3">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--color-gold)]">
                            Photos ({activePhotos.length})
                          </h4>
                          <span className="text-[10px] bg-[#222] text-[#A1A1A1] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                            {activeMediaTab}
                          </span>
                        </div>

                        <ImageUpload 
                          label={`Add Images to ${activeMediaTab}`} 
                          onUpload={handleAddImageToGallery} 
                        />

                        <div className="grid grid-cols-2 gap-4 max-h-[35vh] overflow-y-auto pr-2">
                          {activePhotos.map((img, idx) => {
                            const imgUrl = img?.url || img;
                            const imgCat = img?.category || 'General';
                            return (
                              <div key={idx} className="relative aspect-[4/5] group overflow-hidden bg-[#0a0a0a] border border-[#222]">
                                <img src={imgUrl} alt={`Gallery IMG ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                
                                <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 border border-[#333] rounded-sm">
                                  <select
                                    value={imgCat}
                                    onChange={(e) => {
                                      const updatedImages = [...editingProject.images];
                                      const mainIdx = editingProject.images.findIndex(item => item.url === img.url && item.public_id === img.public_id);
                                      if (mainIdx !== -1) {
                                        updatedImages[mainIdx] = { ...updatedImages[mainIdx], category: e.target.value };
                                        updateProject(editingProject._id, { images: updatedImages });
                                        setEditingProject(prev => ({ ...prev, images: updatedImages }));
                                        addToast('Image category updated', 'success');
                                      }
                                    }}
                                    className="bg-transparent text-white text-[9px] uppercase tracking-wider font-bold focus:outline-none cursor-pointer"
                                  >
                                    <option value="General" className="bg-[#111]">General</option>
                                    {projectTags.map(tag => (
                                      <option key={tag} value={tag} className="bg-[#111]">{tag}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <div className="flex items-center gap-1">
                                    <button 
                                      type="button"
                                      onClick={() => handleMoveImage(img, -1)} 
                                      className="bg-[#333] text-white p-1.5 rounded-full hover:bg-[#555] transition-colors"
                                      title="Move Left"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteImage(img)}
                                      className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors mx-1"
                                      title="Delete Image"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleMoveImage(img, 1)} 
                                      className="bg-[#333] text-white p-1.5 rounded-full hover:bg-[#555] transition-colors"
                                      title="Move Right"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {activePhotos.length === 0 && (
                            <div className="col-span-full py-12 text-center text-[#A1A1A1] text-xs uppercase tracking-widest">
                              No images in this chapter yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column 2: YouTube Videos Manager */}
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-[#222] pb-3">
                          <h4 className="text-xs uppercase tracking-[0.2em] font-extrabold text-[var(--color-gold)] flex items-center gap-2">
                            Cinematic Highlights ({activeVideos.length})
                          </h4>
                          <span className="text-[10px] bg-[#222] text-[#A1A1A1] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                            {activeMediaTab}
                          </span>
                        </div>
                        
                        {/* Add Video Form Inline */}
                        <div className="flex gap-2 bg-[#0a0a0a] p-3 border border-[#222] rounded-sm items-center">
                          <input 
                            type="url" 
                            placeholder={`Enter YouTube URL for ${activeMediaTab}...`} 
                            value={newVideoUrl}
                            onChange={e => setNewVideoUrl(e.target.value)}
                            className="flex-1 bg-[#111] border border-[#333] px-3 py-2 text-white text-xs focus:outline-none focus:border-[var(--color-gold)]"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              handleAddVideoLink(activeMediaTab, newVideoUrl);
                              setNewVideoUrl('');
                            }}
                            className="px-4 py-2 bg-[var(--color-gold)] text-black text-[10px] uppercase tracking-widest font-bold hover:bg-white transition-colors"
                          >
                            Add
                          </button>
                        </div>

                        {/* Videos List */}
                        <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2">
                          {activeVideos.map((video, idx) => {
                            return (
                              <div key={idx} className="flex gap-2 bg-[#0a0a0a] p-2 border border-[#222] rounded-sm items-center">
                                <select
                                  value={video.category}
                                  onChange={e => handleUpdateVideoCategory(video.mainIdx, e.target.value, video.url)}
                                  className="bg-[#111] text-white text-[10px] uppercase tracking-wider font-bold border border-[#333] px-2 py-2 focus:outline-none cursor-pointer"
                                >
                                  <option value="General">General</option>
                                  {projectTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                  ))}
                                </select>
                                <input 
                                  type="text" 
                                  readOnly
                                  value={video.url} 
                                  className="flex-1 bg-transparent text-[#A1A1A1] text-xs overflow-hidden text-ellipsis whitespace-nowrap px-1 border-0 focus:outline-none" 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteVideoLink(video.mainIdx)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          {activeVideos.length === 0 && (
                            <div className="py-12 text-center text-[#A1A1A1] text-xs uppercase tracking-widest">
                              No video links added for this chapter yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
