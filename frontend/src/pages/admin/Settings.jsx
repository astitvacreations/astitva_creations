import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Save, Trash2, Plus, X, Move, Loader2 } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { useSettingStore } from '../../store/settingStore';
import ImageUpload from '../../components/admin/ImageUpload';

export default function Settings() {
  const { addToast } = useToastStore();
  const { settings, updateSettings, fetchSettings } = useSettingStore();
  const [formData, setFormData] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const [draggingSlide, setDraggingSlide] = useState(null); // { index, type: 'desktop' | 'mobile' }
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

  const handleDragStart = (e, index, type = 'desktop') => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const slide = (formData.heroSlides || [])[index];
    const posStr = type === 'mobile'
      ? (slide?.mobilePosition || '50% 50%')
      : (slide?.position || '50% 50%');
    const startPos = parsePosition(posStr);
    dragStartRef.current = {
      clientX,
      clientY,
      startX: startPos.x,
      startY: startPos.y,
      containerWidth: rect.width || 128,
      containerHeight: rect.height || 80,
      index,
      type
    };
    setDraggingSlide({ index, type });
  };

  useEffect(() => {
    if (draggingSlide === null) return;

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
        const slides = [...(prev.heroSlides || [])];
        if (slides[dragStartRef.current.index]) {
          const type = dragStartRef.current.type;
          if (type === 'mobile') {
            slides[dragStartRef.current.index] = {
              ...slides[dragStartRef.current.index],
              mobilePosition: positionStr
            };
          } else {
            slides[dragStartRef.current.index] = {
              ...slides[dragStartRef.current.index],
              position: positionStr
            };
          }
        }
        return { ...prev, heroSlides: slides };
      });
    };

    const handleWindowMouseUp = () => {
      setDraggingSlide(null);
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
  }, [draggingSlide]);

  const handleResetSlidePosition = (index, type = 'desktop') => {
    setFormData((prev) => {
      const slides = [...(prev.heroSlides || [])];
      if (slides[index]) {
        if (type === 'mobile') {
          slides[index] = { ...slides[index], mobilePosition: '50% 50%' };
        } else {
          slides[index] = { ...slides[index], position: '50% 50%' };
        }
      }
      return { ...prev, heroSlides: slides };
    });
    addToast(`${type === 'mobile' ? 'Mobile' : 'Desktop'} slide position reset to center`, 'success');
  };

  const [activeCat, setActiveCat] = useState('WEDDING');
  const [newCatInput, setNewCatInput] = useState('');
  const [newSubInput, setNewSubInput] = useState('');
  const [newServiceInput, setNewServiceInput] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  // Update local formData only if the database settings are loaded initially or successfully saved,
  // preventing active edits from being lost.
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      // set activeCat dynamically if activeCat is not in serviceCategories keys anymore
      const cats = settings.serviceCategories || {};
      const catKeys = Object.keys(cats);
      if (catKeys.length > 0 && !catKeys.includes(activeCat)) {
        setActiveCat(catKeys[0]);
      }
    }
  }, [settings]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(settings);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      addToast('Settings updated successfully!', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };


  // ── Hero Slides helpers ──
  const heroSlides = formData.heroSlides || [];
  const [isUploadingMobile, setIsUploadingMobile] = useState({});

  const handleAddHeroSlide = (input) => {
    const items = Array.isArray(input) ? input : [input];
    const newSlides = items.map((item) => ({
      imageUrl: typeof item === 'object' ? item.url : item,
      mobileImageUrl: '',
      caption: '',
      description: '',
    }));
    setFormData((prev) => ({ ...prev, heroSlides: [...(prev.heroSlides || []), ...newSlides] }));
  };

  const removeHeroSlide = (index) => {
    setFormData((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index),
    }));
  };

  const updateSlideCaption = (index, cap) => {
    setFormData((prev) => {
      const slides = [...prev.heroSlides];
      slides[index] = { ...slides[index], caption: cap };
      return { ...prev, heroSlides: slides };
    });
  };

  const updateSlideDescription = (index, desc) => {
    setFormData((prev) => {
      const slides = [...prev.heroSlides];
      slides[index] = { ...slides[index], description: desc };
      return { ...prev, heroSlides: slides };
    });
  };

  const handleMobileImageUpload = async (index, file) => {
    if (!file) return;
    setIsUploadingMobile((prev) => ({ ...prev, [index]: true }));
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();
      if (response.ok) {
        setFormData((prev) => {
          const slides = [...prev.heroSlides];
          slides[index] = { ...slides[index], mobileImageUrl: data.url, mobilePosition: '50% 50%' };
          return { ...prev, heroSlides: slides };
        });
        addToast('Mobile slide image uploaded successfully', 'success');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      addToast(error.message || 'Failed to upload mobile image', 'error');
    } finally {
      setIsUploadingMobile((prev) => ({ ...prev, [index]: false }));
    }
  };

  // ── Customizable Service & Sub-Events helpers ──
  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    const catUpper = newCatInput.trim().toUpperCase();
    const currentCats = { ...(formData.serviceCategories || {}) };
    if (currentCats[catUpper]) {
      addToast('Category already exists!', 'error');
      return;
    }
    currentCats[catUpper] = [];
    setFormData(prev => ({ ...prev, serviceCategories: currentCats }));
    setActiveCat(catUpper);
    setNewCatInput('');
    addToast(`Added category "${catUpper}"`, 'success');
  };

  const handleRemoveCategory = (cat) => {
    if (!window.confirm(`Are you sure you want to permanently delete the category "${cat}" and all its sub-events?`)) return;
    const currentCats = { ...(formData.serviceCategories || {}) };
    delete currentCats[cat];
    setFormData(prev => ({ ...prev, serviceCategories: currentCats }));
    
    const remaining = Object.keys(currentCats);
    if (remaining.length > 0) {
      setActiveCat(remaining[0]);
    } else {
      setActiveCat('');
    }
    addToast(`Removed category "${cat}"`, 'success');
  };

  const handleAddSubEvent = () => {
    if (!activeCat) {
      addToast('Please select or add a category first!', 'error');
      return;
    }
    if (!newSubInput.trim()) return;
    const subUpper = newSubInput.trim().toUpperCase();
    const currentCats = { ...(formData.serviceCategories || {}) };
    const currentSubs = currentCats[activeCat] || [];
    if (currentSubs.includes(subUpper)) {
      addToast('Sub-event already exists under this category!', 'error');
      return;
    }
    currentCats[activeCat] = [...currentSubs, subUpper];
    setFormData(prev => ({ ...prev, serviceCategories: currentCats }));
    setNewSubInput('');
    addToast(`Added sub-event "${subUpper}" to "${activeCat}"`, 'success');
  };

  const handleRemoveSubEvent = (subToRemove) => {
    if (!activeCat) return;
    const currentCats = { ...(formData.serviceCategories || {}) };
    const currentSubs = currentCats[activeCat] || [];
    currentCats[activeCat] = currentSubs.filter(sub => sub !== subToRemove);
    setFormData(prev => ({ ...prev, serviceCategories: currentCats }));
    addToast(`Removed sub-event "${subToRemove}" from "${activeCat}"`, 'success');
  };

  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    const serviceName = newServiceInput.trim();
    const currentServices = [...(formData.standardServices || [])];
    if (currentServices.includes(serviceName)) {
      addToast('Standard service already exists!', 'error');
      return;
    }
    setFormData(prev => ({ ...prev, standardServices: [...currentServices, serviceName] }));
    setNewServiceInput('');
    addToast(`Added standard service "${serviceName}"`, 'success');
  };

  const handleRemoveService = (serviceToRemove) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${serviceToRemove}" from standard services?`)) return;
    const currentServices = [...(formData.standardServices || [])];
    setFormData(prev => ({
      ...prev,
      standardServices: currentServices.filter(s => s !== serviceToRemove)
    }));
    addToast(`Removed standard service "${serviceToRemove}"`, 'success');
  };

  const inputClass = "w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors";
  const labelClass = "block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2";

  return (
    <>
      <Helmet>
        <title>Settings | Admin Dashboard</title>
      </Helmet>

      <div className="max-w-4xl space-y-8">
        <div>
          <h2 className="font-heading text-3xl text-white mb-1">Platform Settings</h2>
          <p className="text-[#A1A1A1] text-sm">Configure core platform integrations, branding, hero slideshow, and security.</p>
        </div>

        {/* ── General Info ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-[#222]">
          <div className="p-6 border-b border-[#222]"><h3 className="font-heading text-xl text-white">General Info</h3></div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Studio Name</label>
                <input type="text" value={formData.studioName || ''} onChange={e => setFormData({ ...formData, studioName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact Email</label>
                <input type="email" value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>WhatsApp Number (For Quotes)</label>
              <input type="text" value={formData.whatsappNumber || ''} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} className={inputClass} />
            </div>
            <div className="pt-6 border-t border-[#222]">
              <label className={labelClass}>Owner / Founder Image (About Us Page)</label>
              <p className="text-[#A1A1A1] text-xs mb-4">This image will be displayed in the 'About Founder' section on the Home page and the 'Our Story' section on the About Us page.</p>
              {formData.ownerImage && (
                <div className="relative w-40 aspect-[4/5] mb-4 group">
                  <img src={formData.ownerImage} alt="Owner" className="w-full h-full object-cover rounded-sm border border-[#333]" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ownerImage: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <ImageUpload
                label={formData.ownerImage ? "Change Image" : "Upload Image"}
                multiple={false}
                onUpload={(data) => setFormData(prev => ({ ...prev, ownerImage: data.url || data }))}
              />
            </div>
            <div className="pt-6 border-t border-[#222]">
              <label className={labelClass}>Call To Action (CTA) Section Image (Home Page)</label>
              <p className="text-[#A1A1A1] text-xs mb-4">This image will be displayed with a parallax effect in the "Ready to start a new project?" section before the footer on the Home page.</p>
              {formData.ctaImage && (
                <div className="relative w-40 aspect-video mb-4 group">
                  <img src={formData.ctaImage} alt="CTA Background" className="w-full h-full object-cover rounded-sm border border-[#333]" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ctaImage: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <ImageUpload
                label={formData.ctaImage ? "Change Image" : "Upload Image"}
                multiple={false}
                onUpload={(data) => setFormData(prev => ({ ...prev, ctaImage: data.url || data }))}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Hero Slideshow ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#111] border border-[#222]">
          <div className="p-6 border-b border-[#222]">
            <h3 className="font-heading text-xl text-white mb-1">Home Page Hero Slideshow</h3>
            <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">
              Images auto-advance every 5 seconds · Add a description for each slide
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Overall Main Centered Caption & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#222]">
              <div>
                <label className={labelClass}>Initial Intro Main Caption</label>
                <input 
                  type="text" 
                  value={formData.heroMainCaption || ''} 
                  onChange={e => setFormData({ ...formData, heroMainCaption: e.target.value })} 
                  placeholder="e.g. Capturing Timeless Elegance" 
                  className={inputClass} 
                />
                <p className="text-[#555] text-[10px] uppercase tracking-widest mt-1">Displayed centered on site load</p>
              </div>
              <div>
                <label className={labelClass}>Initial Intro Main Description</label>
                <textarea 
                  value={formData.heroMainDescription || ''} 
                  onChange={e => setFormData({ ...formData, heroMainDescription: e.target.value })} 
                  placeholder="e.g. Your Story, Told Cinematically." 
                  rows={1} 
                  className={`${inputClass} resize-none`} 
                />
                <p className="text-[#555] text-[10px] uppercase tracking-widest mt-1">Supports line breaks</p>
              </div>
            </div>

            <ImageUpload label="Add Hero Slide Images" onUpload={handleAddHeroSlide} />

            {heroSlides.length > 0 ? (
              <div className="space-y-3 mt-4">
                {heroSlides.map((slide, i) => (
                  <div key={i} className="flex gap-4 items-center bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded-sm">
                    {/* Side-by-Side Slide Preview Containers */}
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Draggable Desktop Slide Image Container */}
                      <div className="flex flex-col items-center gap-1">
                        <div 
                          className="relative w-36 h-20 bg-[#111] border border-[#222] overflow-hidden group cursor-grab active:cursor-grabbing select-none rounded-sm"
                          onMouseDown={(e) => handleDragStart(e, i)}
                          onTouchStart={(e) => handleDragStart(e, i)}
                          title="Drag desktop image to position crop alignment"
                        >
                          <img
                            src={slide.imageUrl}
                            alt={`Desktop Slide ${i + 1}`}
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
                        <span className="text-[8px] text-[#555] uppercase tracking-wider font-bold">Desktop</span>
                      </div>

                      {/* Responsive Mobile Image Container */}
                      <div className="flex flex-col items-center gap-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          id={`mobile-upload-${i}`}
                          onChange={(e) => handleMobileImageUpload(i, e.target.files[0])}
                        />

                        {slide.mobileImageUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <div 
                              className="relative w-14 h-20 bg-[#111] border border-[#222] overflow-hidden group cursor-grab active:cursor-grabbing select-none rounded-sm"
                              onMouseDown={(e) => handleDragStart(e, i, 'mobile')}
                              onTouchStart={(e) => handleDragStart(e, i, 'mobile')}
                              title="Drag mobile image to position crop alignment"
                            >
                              <img
                                src={slide.mobileImageUrl}
                                alt={`Mobile Slide ${i + 1}`}
                                style={{
                                  objectPosition: slide.mobilePosition || '50% 50%',
                                  pointerEvents: 'none'
                                }}
                                className="w-full h-full object-cover select-none"
                                draggable="false"
                              />
                              {/* Hover Drag Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none select-none">
                                <Move className="w-3.5 h-3.5 text-[var(--color-gold)] mb-0.5 animate-pulse" />
                                <span className="text-[6px] text-white uppercase tracking-widest font-bold text-center">Drag</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons below the thumbnail */}
                            <div className="flex gap-1.5 items-center select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => document.getElementById(`mobile-upload-${i}`)?.click()}
                                className="text-[8px] text-[var(--color-gold)] hover:text-white uppercase tracking-widest font-bold transition-colors"
                              >
                                Edit
                              </button>
                              <span className="text-[8px] text-[#333]">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const slides = [...prev.heroSlides];
                                    slides[i] = { ...slides[i], mobileImageUrl: '', mobilePosition: '50% 50%' };
                                    return { ...prev, heroSlides: slides };
                                  });
                                  addToast('Mobile slide image removed', 'success');
                                }}
                                className="text-[8px] text-red-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => !isUploadingMobile[i] && document.getElementById(`mobile-upload-${i}`)?.click()}
                            className="relative w-14 h-20 bg-[#070707] border border-dashed border-[#333] hover:border-[var(--color-gold)]/60 transition-colors flex flex-col items-center justify-center cursor-pointer select-none rounded-sm"
                            title="Upload vertical mobile version of this image"
                          >
                            {isUploadingMobile[i] ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-gold)]" />
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 text-[#555] hover:text-white" />
                                <span className="text-[7px] text-[#555] uppercase tracking-widest font-bold mt-1">+ Mob</span>
                              </>
                            )}
                          </div>
                        )}
                        <span className="text-[8px] text-[#555] uppercase tracking-wider font-bold">Mobile</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={slide.caption || ''}
                        onChange={(e) => updateSlideCaption(i, e.target.value)}
                        placeholder="Slide caption (gold category prefix)"
                        className="w-full bg-transparent border-b border-[#333] py-1 text-xs text-[var(--color-gold)] placeholder-[var(--color-gold)]/40 focus:outline-none focus:border-[var(--color-gold)] transition-colors uppercase tracking-wider font-semibold"
                      />
                      <input
                        type="text"
                        value={slide.description || ''}
                        onChange={(e) => updateSlideDescription(i, e.target.value)}
                        placeholder="Slide description (main heading text)"
                        className="w-full bg-transparent border-b border-[#333] py-1 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                      />
                      
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-[#555] font-bold gap-4 flex-wrap">
                        <div className="flex flex-col gap-0.5">
                          <span>Desk: {slide.position || '50% 50%'}</span>
                          {slide.mobileImageUrl && <span>Mob: {slide.mobilePosition || '50% 50%'}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => handleResetSlidePosition(i, 'desktop')}
                            className="text-[var(--color-gold)] hover:text-white transition-colors"
                          >
                            Reset Desk
                          </button>
                          {slide.mobileImageUrl && (
                            <button 
                              type="button"
                              onClick={() => handleResetSlidePosition(i, 'mobile')}
                              className="text-[var(--color-gold)] hover:text-white transition-colors border-l border-[#333] pl-2"
                            >
                              Reset Mob
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeHeroSlide(i)}
                      className="flex-shrink-0 text-[#555] hover:text-red-500 transition-colors p-1"
                      title="Remove slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[#555] text-xs">{heroSlides.length} slide{heroSlides.length !== 1 ? 's' : ''} · Remember to Save Settings after editing.</p>
              </div>
            ) : (
              <p className="text-[#555] text-xs mt-2">
                No slides uploaded yet — fallback stock images will be shown on the home page until you add slides.
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Integrations & SEO ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-[#222]">
          <div className="p-6 border-b border-[#222]"><h3 className="font-heading text-xl text-white">Integrations & SEO</h3></div>
          <div className="p-6 space-y-6">
            <div>
              <label className={labelClass}>Meta Pixel ID</label>
              <input type="text" value={formData.metaPixelId || ''} onChange={e => setFormData({ ...formData, metaPixelId: e.target.value })} placeholder="e.g. 123456789012345" className={inputClass} />
              <p className="text-[#777] text-xs mt-2">Required for tracking ad conversions and Facebook/Instagram traffic.</p>
            </div>
            <div>
              <label className={labelClass}>Google Analytics (G-XXXXX)</label>
              <input type="text" value={formData.googleAnalyticsId || ''} onChange={e => setFormData({ ...formData, googleAnalyticsId: e.target.value })} placeholder="e.g. G-ABC123XYZ" className={inputClass} />
            </div>
          </div>
        </motion.div>

        {/* ── Customizable Service Categories & Sub-Events ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-[#111] border border-[#222]">
          <div className="p-6 border-b border-[#222]">
            <h3 className="font-heading text-xl text-white mb-1">Customizable Service Categories & Sub-Events</h3>
            <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">
              Manage the event types, sub-celebrations, and standard services offered in quotes
            </p>
          </div>
          <div className="p-6 space-y-8">
            
            {/* Row 1: Categories & Sub-events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#1c1c1c] pb-8">
              
              {/* Primary Categories Left Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[#A1A1A1] font-bold">1. Primary Categories</label>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {Object.keys(formData.serviceCategories || {}).map((cat) => (
                    <div 
                      key={cat} 
                      onClick={() => setActiveCat(cat)}
                      className={`flex justify-between items-center p-3 border cursor-pointer transition-all rounded-sm ${
                        activeCat === cat 
                          ? 'bg-[#1a150c] border-[var(--color-gold)] text-[var(--color-gold)] font-bold' 
                          : 'bg-[#0a0a0a] border-[#222] text-[#A1A1A1] hover:border-[#444] hover:text-white'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-widest">{cat}</span>
                      <button 
                        type="button; e.stopPropagation()"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(cat);
                        }}
                        className="text-[#555] hover:text-red-500 transition-colors p-1"
                        title={`Delete Category ${cat}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {Object.keys(formData.serviceCategories || {}).length === 0 && (
                    <div className="text-xs text-[#555] italic">No service categories defined.</div>
                  )}
                </div>

                {/* Add Category Form */}
                <div className="flex gap-2 pt-2">
                  <input 
                    type="text" 
                    placeholder="e.g. MATERNITY"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-[var(--color-gold)] hover:bg-white text-black font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1 rounded-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Sub-events Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest text-[#A1A1A1] font-bold">
                    2. Sub-Events under {activeCat ? `"${activeCat}"` : 'None'}
                  </label>
                </div>
                <div className="bg-[#0a0a0a] border border-[#222] p-4 min-h-[220px] rounded-sm space-y-4">
                  {activeCat ? (
                    <>
                      <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {(formData.serviceCategories?.[activeCat] || []).map((sub) => (
                          <div 
                            key={sub}
                            className="bg-[#111] border border-[#333] text-white px-2.5 py-1.5 rounded-sm text-[10px] uppercase tracking-wider font-bold flex items-center gap-2"
                          >
                            <span>{sub}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveSubEvent(sub)}
                              className="text-[#555] hover:text-red-500 transition-colors"
                              title={`Remove ${sub}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(formData.serviceCategories?.[activeCat] || []).length === 0 && (
                          <div className="text-xs text-[#555] italic p-4 w-full text-center">
                            No sub-events in this category yet. Add one below!
                          </div>
                        )}
                      </div>

                      {/* Add Sub-Event Form */}
                      <div className="flex gap-2 border-t border-[#1c1c1c] pt-3">
                        <input 
                          type="text" 
                          placeholder="e.g. PRE BABY SHOOT"
                          value={newSubInput}
                          onChange={(e) => setNewSubInput(e.target.value)}
                          className="flex-1 bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] uppercase"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubEvent())}
                        />
                        <button 
                          type="button"
                          onClick={handleAddSubEvent}
                          className="px-4 py-2 bg-[var(--color-gold)] hover:bg-white text-black font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1 rounded-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-[#555] italic p-8 text-center">
                      Select or add a primary category from the left column to configure its sub-events.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Row 2: Standard Services */}
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest text-[#A1A1A1] font-bold">3. Standard Services Offered in Quotes</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(formData.standardServices || []).map((service) => (
                  <div 
                    key={service}
                    className="flex justify-between items-center p-3 bg-[#0a0a0a] border border-[#222] rounded-sm"
                  >
                    <span className="text-xs text-white">{service}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveService(service)}
                      className="text-[#555] hover:text-red-500 transition-colors p-1"
                      title={`Remove Standard Service ${service}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Standard Service Form */}
              <div className="flex gap-2 max-w-md pt-2">
                <input 
                  type="text" 
                  placeholder="e.g. Cinematic Highlights"
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                />
                <button 
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-2 bg-[var(--color-gold)] hover:bg-white text-black font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-1 rounded-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
            </div>

          </div>
        </motion.div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Floating Save Prompt */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#111] border border-[var(--color-gold)] p-4 shadow-2xl flex items-center gap-4 max-w-sm rounded"
          >
            <div className="flex-1">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Unsaved Changes</h4>
              <p className="text-[#A1A1A1] text-[10px] uppercase tracking-widest mt-1">Remember to save your settings to apply them live.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-[10px] hover:bg-white transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
