import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Video, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { useServiceStore } from '../../store/serviceStore';
import ImageUpload from '../../components/admin/ImageUpload';
import { getYouTubeId } from '../../utils/youtube';

export default function ServicesManager() {
  const { addToast } = useToastStore();
  const { services, addService, updateService, deleteService } = useServiceStore();

  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [mediaTab, setMediaTab] = useState('images'); // 'images' | 'videos'
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', coverImage: '', coverImagePosition: '50% 50%',
    heroImage: '', heroImages: [], heroDescription: '',
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    setSelectedImages([]);
  }, [editingService, mediaTab]);

  // Drag-to-Position Alignment states
  const [draggingType, setDraggingType] = useState(null); // 'cover' | 'hero' | null
  const [draggingIndex, setDraggingIndex] = useState(null); // index if draggingType is 'hero'
  const dragStartRef = useRef(null);

  const parsePosition = (posStr) => {
    if (!posStr) return { x: 50, y: 50 };
    const parts = posStr.split(' ');
    let x = parseFloat(parts[0]);
    let y = parseFloat(parts[1]);
    if (isNaN(x)) x = 50;
    if (isNaN(y)) y = 50;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleDragStart = (e, type, index = null) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    
    let currentPosStr = '50% 50%';
    if (type === 'cover') {
      currentPosStr = formData.coverImagePosition || '50% 50%';
    } else if (type === 'hero' && index !== null) {
      currentPosStr = formData.heroImages?.[index]?.position || '50% 50%';
    }
    
    const startPos = parsePosition(currentPosStr);
    
    dragStartRef.current = {
      clientX,
      clientY,
      startX: startPos.x,
      startY: startPos.y,
      containerWidth: rect.width || 128,
      containerHeight: rect.height || 80,
      index
    };
    
    setDraggingType(type);
    setDraggingIndex(index);
  };

  useEffect(() => {
    if (!draggingType) return;

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

      setFormData((prev) => {
        if (draggingType === 'cover') {
          return { ...prev, coverImagePosition: positionStr };
        } else if (draggingType === 'hero') {
          const heroImages = [...(prev.heroImages || [])];
          const idx = dragStartRef.current.index;
          if (heroImages[idx]) {
            heroImages[idx] = { ...heroImages[idx], position: positionStr };
          }
          return { ...prev, heroImages };
        }
        return prev;
      });
    };

    const handleWindowMouseUp = () => {
      setDraggingType(null);
      setDraggingIndex(null);
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
  }, [draggingType]);

  const handleResetPosition = (type, index = null) => {
    setFormData((prev) => {
      if (type === 'cover') {
        return { ...prev, coverImagePosition: '50% 50%' };
      } else if (type === 'hero' && index !== null) {
        const heroImages = [...(prev.heroImages || [])];
        if (heroImages[index]) {
          heroImages[index] = { ...heroImages[index], position: '50% 50%' };
        }
        return { ...prev, heroImages };
      }
      return prev;
    });
    addToast('Position reset to center', 'success');
  };

  const handleAddHeroImages = (input) => {
    const items = Array.isArray(input) ? input : [input];
    const newHeroImages = items.map((item) => ({
      url: typeof item === 'object' ? item.url : item,
      position: '50% 50%',
    }));
    setFormData((prev) => ({
      ...prev,
      heroImages: [...(prev.heroImages || []), ...newHeroImages]
    }));
  };

  const handleRemoveHeroImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      heroImages: (prev.heroImages || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    
    // Manual validation to avoid HTML5 silent failures in scrolling modals
    if (!formData.title?.trim()) return addToast('Title is required', 'error');
    if (!formData.slug?.trim()) return addToast('Slug is required', 'error');
    if (!formData.description?.trim()) return addToast('Description is required', 'error');
    if (!formData.coverImage) return addToast('Cover image is required', 'error');

    try {
      if (formData._id) {
        await updateService(formData._id, formData);
        addToast('Service updated successfully', 'success');
      } else {
        await addService(formData);
        addToast('Service created successfully', 'success');
      }
      setIsCreating(false);
    } catch (error) {
      addToast(error.message || 'Failed to save service', 'error');
    }
  };

  const handleDeleteService = (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      deleteService(id);
      addToast('Service deleted', 'success');
    } catch {
      addToast('Failed to delete service', 'error');
    }
  };

  // ── Image management ──
  const handleAddImage = (input) => {
    try {
      const newImagesData = Array.isArray(input) ? input : [input];
      const newImageUrls = newImagesData.map(item => typeof item === 'object' ? item.url : item);
      setEditingService(prev => {
        const updatedImages = [...(prev.images || []), ...newImageUrls];
        updateService(prev._id, { images: updatedImages });
        return { ...prev, images: updatedImages };
      });
      addToast(`${newImagesData.length} image(s) added`, 'success');
    } catch {
      addToast('Failed to add images', 'error');
    }
  };

  const deleteCloudinaryMedia = async (urls) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${apiBase}/upload/delete-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
    } catch (err) {
      console.error('Failed to delete from cloudinary', err);
    }
  };

  const handleDeleteImage = async (index) => {
    try {
      const imgToDelete = editingService.images[index];
      const updatedImages = [...editingService.images];
      updatedImages.splice(index, 1);
      await updateService(editingService._id, { images: updatedImages });
      setEditingService({ ...editingService, images: updatedImages });
      setSelectedImages(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
      addToast('Image removed', 'success');

      const imgUrl = typeof imgToDelete === 'object' ? imgToDelete.url : imgToDelete;
      await deleteCloudinaryMedia([imgUrl]);
    } catch {
      addToast('Failed to remove image', 'error');
    }
  };

  const handleDeleteMultipleImages = async () => {
    if (selectedImages.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) return;
    
    try {
      const urlsToDelete = selectedImages.map(idx => {
        const img = editingService.images[idx];
        return typeof img === 'object' ? img.url : img;
      });
      
      const updatedImages = editingService.images.filter((_, idx) => !selectedImages.includes(idx));
      
      await updateService(editingService._id, { images: updatedImages });
      setEditingService({ ...editingService, images: updatedImages });
      setSelectedImages([]);
      addToast(`${selectedImages.length} images removed`, 'success');
      
      await deleteCloudinaryMedia(urlsToDelete);
    } catch {
      addToast('Failed to remove images', 'error');
    }
  };

  const handleMoveImage = (index, direction) => {
    try {
      const updatedImages = [...editingService.images];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updatedImages.length) return;
      
      const temp = updatedImages[index];
      updatedImages[index] = updatedImages[newIndex];
      updatedImages[newIndex] = temp;
      
      updateService(editingService._id, { images: updatedImages });
      setEditingService({ ...editingService, images: updatedImages });
    } catch {
      addToast('Failed to reorder image', 'error');
    }
  };

  // ── Video management ──
  const handleVideoLinkSubmit = (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    const yId = getYouTubeId(newVideoUrl);
    if (!yId) {
      addToast('Invalid YouTube Link. Please provide a valid watch, sharing, or shorts URL.', 'error');
      return;
    }
    try {
      setEditingService(prev => {
        const updatedVideos = [...(prev.videos || []), newVideoUrl.trim()];
        updateService(prev._id, { videos: updatedVideos });
        return { ...prev, videos: updatedVideos };
      });
      addToast('YouTube video added successfully', 'success');
      setNewVideoUrl('');
    } catch {
      addToast('Failed to add video link', 'error');
    }
  };

  const handleDeleteVideo = (index) => {
    try {
      const updatedVideos = [...(editingService.videos || [])];
      updatedVideos.splice(index, 1);
      updateService(editingService._id, { videos: updatedVideos });
      setEditingService({ ...editingService, videos: updatedVideos });
      addToast('Video removed', 'success');
    } catch {
      addToast('Failed to remove video', 'error');
    }
  };

  const inputClass = "w-full bg-[#0a0a0a] border border-[#333] px-4 py-2 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm";
  const labelClass = "block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2";

  return (
    <>
      <Helmet>
        <title>Manage Services | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-heading text-3xl text-white mb-1">Services Categories</h2>
            <p className="text-[#A1A1A1] text-sm">Manage your core services, hero banners, images, and videos.</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: '',
                slug: '',
                description: '',
                coverImage: '',
                coverImagePosition: '50% 50%',
                heroImage: '',
                heroImages: [],
                heroDescription: ''
              });
              setIsCreating(true);
            }}
            className="px-6 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-[#222]">
          <div className="p-4 border-b border-[#222] flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input
                type="text"
                placeholder="Search services..."
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
                  <th className="p-4">Slug</th>
                  <th className="p-4">Images</th>
                  <th className="p-4">Videos</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => s.title.toLowerCase().includes(search.toLowerCase())).map(service => (
                  <tr key={service._id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-semibold text-white">{service.title}</td>
                    <td className="p-4 text-[#777]">{service.slug}</td>
                    <td className="p-4 text-[#A1A1A1]">{(service.images || []).length}</td>
                    <td className="p-4 text-[#A1A1A1]">{(service.videos || []).length}</td>
                    <td className="p-4 text-right flex justify-end gap-3">
                      <button onClick={() => { setEditingService(service); setMediaTab('images'); }} className="p-2 text-[#A1A1A1] hover:text-white hover:bg-[#333] rounded transition-colors" title="Manage Media">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setFormData({
                            ...service,
                            coverImagePosition: service.coverImagePosition || '50% 50%',
                            heroImages: service.heroImages || []
                          });
                          setIsCreating(true);
                        }}
                        className="p-2 text-[#A1A1A1] hover:text-white hover:bg-[#333] rounded transition-colors"
                        title="Edit Service"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteService(service._id)} className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete Service">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-[#A1A1A1]">No services found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {/* ── Create / Edit Service Modal ── */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-sm overflow-y-auto flex justify-center py-10 px-4"
          >
            <div className="bg-[#111] border border-[#222] w-full max-w-2xl rounded-sm h-fit">
              <div className="flex justify-between items-center p-6 border-b border-[#222]">
                <h3 className="font-heading text-2xl text-white">{formData._id ? 'Edit Service' : 'New Service'}</h3>
                <button type="button" onClick={() => setIsCreating(false)} className="text-[#A1A1A1] hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveService} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Title <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Slug <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description <span className="text-red-500">*</span></label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} h-24`} />
                </div>

                <div>
                  <label className={labelClass}>Hero Page Tagline (shown on service page parallax banner)</label>
                  <input type="text" value={formData.heroDescription || ''} onChange={e => setFormData({ ...formData, heroDescription: e.target.value })} className={inputClass} placeholder="e.g. Capturing every precious moment of your story" />
                </div>

                {/* Cover Image */}
                <div>
                  <label className={labelClass}>Cover Image (shown on home / services listing)</label>
                  {formData.coverImage ? (
                    <div className="bg-[#0a0a0a] p-4 border border-[#222] rounded-sm space-y-3">
                      <div 
                        className="relative aspect-[4/5] max-w-[280px] mx-auto border border-[#333] overflow-hidden rounded-sm group cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={(e) => handleDragStart(e, 'cover')}
                        onTouchStart={(e) => handleDragStart(e, 'cover')}
                        title="Drag image to position crop alignment"
                      >
                        <img 
                          src={formData.coverImage} 
                          style={{ 
                            objectPosition: formData.coverImagePosition || '50% 50%',
                            pointerEvents: 'none'
                          }}
                          className="w-full h-full object-cover select-none" 
                          alt="Cover Preview" 
                          draggable="false"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none select-none">
                          <Move className="w-8 h-8 text-[var(--color-gold)] mb-2 animate-pulse" />
                          <span className="text-[10px] text-white uppercase tracking-widest font-bold">Drag to Align</span>
                        </div>
                        {/* Remove button */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, coverImage: '', coverImagePosition: '50% 50%' });
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-all pointer-events-auto shadow-lg"
                          title="Remove Cover Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#777] px-1 font-bold pt-1">
                        <span>Position: {formData.coverImagePosition || '50% 50%'}</span>
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
                      label="Select Cover Image" 
                      onUpload={(data) => setFormData({ ...formData, coverImage: typeof data === 'object' ? data.url : data, coverImagePosition: '50% 50%' })} 
                    />
                  )}
                </div>

                {/* Service Hero Banner Images (Multi-Image Parallax) */}
                <div className="space-y-4">
                  <label className={labelClass}>Hero Parallax Banner Images (Select multiple images for slideshow)</label>
                  <ImageUpload 
                    multiple={true} 
                    label="Add Hero Banner Images" 
                    onUpload={handleAddHeroImages} 
                  />

                  {formData.heroImages && formData.heroImages.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {formData.heroImages.map((slide, i) => (
                        <div key={i} className="flex gap-4 items-center bg-[#0a0a0a] border border-[#222] p-3 rounded-sm">
                          {/* Draggable Slide Image Container */}
                          <div 
                            className="relative w-36 h-20 bg-[#111] border border-[#222] overflow-hidden group cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                            onMouseDown={(e) => handleDragStart(e, 'hero', i)}
                            onTouchStart={(e) => handleDragStart(e, 'hero', i)}
                            title="Drag image to position crop alignment"
                          >
                            <img
                              src={slide.url}
                              alt={`Hero Slide ${i + 1}`}
                              style={{
                                objectPosition: slide.position || '50% 50%',
                                pointerEvents: 'none'
                              }}
                              className="w-full h-full object-cover select-none"
                              draggable="false"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none select-none">
                              <Move className="w-5 h-5 text-[var(--color-gold)] mb-1 animate-pulse" />
                              <span className="text-[8px] text-white uppercase tracking-widest font-bold">Drag to Align</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="text-white text-xs uppercase tracking-widest font-bold font-heading">Hero Slide {i + 1}</div>
                            
                            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#555] font-bold">
                              <span>Position: {slide.position || '50% 50%'}</span>
                              <button 
                                type="button"
                                onClick={() => handleResetPosition('hero', i)}
                                className="text-[var(--color-gold)] hover:text-white transition-colors"
                              >
                                Reset to Center
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveHeroImage(i)}
                            className="flex-shrink-0 text-[#555] hover:text-red-500 transition-colors p-1"
                            title="Remove Hero Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#555] text-xs mt-2">
                      No hero slideshow images uploaded yet — fallback cover image will be used as a static banner.
                    </p>
                  )}
                </div>

                <button type="submit" className="w-full py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest hover:bg-white transition-colors">
                  Save Service
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Media Manager Modal (Images + Videos) ── */}
        {editingService && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-sm flex justify-center items-start p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#111] border border-[#222] w-full max-w-5xl rounded-sm my-8"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#222]">
                <div>
                  <h3 className="font-heading text-2xl text-white mb-1">Media: {editingService.title}</h3>
                  <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">
                    {(editingService.images || []).length} images · {(editingService.videos || []).length} videos
                  </p>
                </div>
                <button onClick={() => setEditingService(null)} className="text-[#A1A1A1] hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-[#222]">
                <button
                  onClick={() => setMediaTab('images')}
                  className={`flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all ${mediaTab === 'images' ? 'text-[var(--color-gold)] border-[var(--color-gold)]' : 'text-[#555] border-transparent hover:text-[#A1A1A1]'}`}
                >
                  <ImageIcon className="w-4 h-4" /> Images ({(editingService.images || []).length})
                </button>
                <button
                  onClick={() => setMediaTab('videos')}
                  className={`flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all ${mediaTab === 'videos' ? 'text-[var(--color-gold)] border-[var(--color-gold)]' : 'text-[#555] border-transparent hover:text-[#A1A1A1]'}`}
                >
                  <Video className="w-4 h-4" /> Videos ({(editingService.videos || []).length})
                </button>
              </div>

              {/* Images Tab */}
              {mediaTab === 'images' && (
                <div className="p-6">
                  <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
                    <ImageUpload label="Add Images to Gallery" onUpload={handleAddImage} />
                    {selectedImages.length > 0 && (
                      <button 
                        onClick={handleDeleteMultipleImages}
                        className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Selected ({selectedImages.length})
                      </button>
                    )}
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(editingService.images || []).map((imgSrc, idx) => (
                        <div key={idx} className={`relative aspect-[4/5] group overflow-hidden bg-[#0a0a0a] border ${selectedImages.includes(idx) ? 'border-[var(--color-gold)] border-2' : 'border-[#222]'}`}>
                          <img src={typeof imgSrc === 'object' ? imgSrc.url : imgSrc} alt={`IMG ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          
                          <div className="absolute top-2 left-2 z-10">
                            <input 
                              type="checkbox" 
                              checked={selectedImages.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedImages(prev => [...prev, idx]);
                                else setSelectedImages(prev => prev.filter(i => i !== idx));
                              }}
                              className="w-5 h-5 accent-[var(--color-gold)] cursor-pointer"
                            />
                          </div>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="flex items-center gap-1 pointer-events-auto">
                              {idx > 0 && (
                                <button onClick={() => handleMoveImage(idx, -1)} className="bg-[#333] text-white p-1.5 rounded-full hover:bg-[#555] transition-colors">
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteImage(idx)} className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors mx-1">
                                <Trash2 className="w-5 h-5" />
                              </button>
                              {idx < editingService.images.length - 1 && (
                                <button onClick={() => handleMoveImage(idx, 1)} className="bg-[#333] text-white p-1.5 rounded-full hover:bg-[#555] transition-colors">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(editingService.images || []).length === 0 && (
                        <div className="col-span-full py-12 text-center text-[#A1A1A1]">No images yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Videos Tab */}
              {mediaTab === 'videos' && (
                <div className="p-6">
                  <form onSubmit={handleVideoLinkSubmit} className="mb-6 flex gap-3 items-end">
                    <div className="flex-grow">
                      <label className={labelClass}>Add YouTube Video Link</label>
                      <input
                        type="url"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        className={inputClass}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors h-[38px] shrink-0"
                    >
                      Add Video
                    </button>
                  </form>
                  <div className="max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(editingService.videos || []).map((videoUrl, idx) => {
                        const yId = getYouTubeId(videoUrl);
                        return (
                          <div key={idx} className="relative group bg-[#0a0a0a] border border-[#222] overflow-hidden aspect-video">
                            {yId ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${yId}`}
                                title={`Video ${idx + 1}`}
                                className="w-full h-full border-0 pointer-events-none"
                                allowFullScreen
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[#555] uppercase tracking-widest bg-red-950/20">
                                Invalid YouTube Link ({videoUrl})
                              </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDeleteVideo(idx)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(editingService.videos || []).length === 0 && (
                        <div className="col-span-full py-12 text-center text-[#A1A1A1]">No videos yet. Add YouTube video links above.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

