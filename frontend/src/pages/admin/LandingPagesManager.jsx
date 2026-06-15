import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Save, Plus, Trash2, ExternalLink, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingPageStore } from '../../store/landingPageStore';
import { useToastStore } from '../../store/toastStore';
import ImageUpload from '../../components/admin/ImageUpload';

const PAGES = [
  { slug: 'wedding', label: 'Wedding', url: '/wedding-landing-page' },
  { slug: 'pre-wedding', label: 'Pre-Wedding', url: '/prewedding-landing-page' },
  { slug: 'vrwedding', label: 'VR Wedding Experience', url: '/vrwedding-landing-page' },
];

function LandingPageEditor({ slug, label, url }) {
  const { pages, fetchLandingPage, updateLandingPage } = useLandingPageStore();
  const { addToast } = useToastStore();
  const page = pages[slug];

  const [form, setForm] = useState({
    title: '', subtitle: '', bodyText: '',
    title: '', subtitle: '', bodyText: '',
    heroSlides: [], galleryImages: [], youtubeLinks: [],
    features: [], approach: [], offers: [],
    ctaLabel: 'Contact Us', ctaLink: `/inquire?source=${slug}`,
  });
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => { fetchLandingPage(slug); }, [slug]);

  useEffect(() => {
    if (page) {
      setForm({
        title: page.title || '',
        subtitle: page.subtitle || '',
        bodyText: page.bodyText || '',
        heroSlides: page.heroSlides || [],
        galleryImages: page.galleryImages || [],
        youtubeLinks: page.youtubeLinks || [],
        features: page.features?.length > 0 ? page.features : (slug === 'wedding' ? [
          { title: 'Cinematic Vision', description: 'Every wedding film is crafted with the same care and artistry as a feature film. We don\'t just record — we direct your story.' },
          { title: 'Candid & Authentic', description: 'We blend into your celebration, capturing real emotions and genuine moments as they happen — not posed, not staged.' },
          { title: 'Timeless Delivery', description: 'Beautifully edited albums and films delivered with premium quality that you\'ll treasure for generations.' }
        ] : []),
        approach: page.approach?.length > 0 ? page.approach : (slug === 'pre-wedding' ? [
          { title: 'Themed Shoots', description: 'Bollywood, vintage, rustic, royal — we build your dream theme from concept to execution.' },
          { title: 'Location Scouting', description: 'We find the perfect backdrop that matches your personality and vision.' },
          { title: 'Wardrobe Direction', description: 'Expert guidance on what to wear for stunning, cohesive visuals.' },
          { title: 'Cinematic Edit', description: 'Color-graded, film-like final photos and videos that feel like frames from a movie.' }
        ] : slug === 'vrwedding' ? [
          { title: 'Immersive Experience', description: 'Step back into your wedding day in complete 360-degree virtual reality. Relive the sights, sounds, and emotions as if you were truly there.' },
          { title: 'Cutting-edge Technology', description: 'We use state-of-the-art VR cameras and spatial audio recording to capture every detail with breathtaking realism.' },
          { title: 'Future-Proof Memories', description: 'Share your wedding with loved ones anywhere in the world. VR brings your memories to life for generations to come.' }
        ] : []),
        offers: page.offers || [],
        ctaLabel: page.ctaLabel || 'Contact Us',
        ctaLink: page.ctaLink || `/inquire?source=${slug}`,
      });
    }
  }, [page]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalForm = { ...form };
      const ytInput = document.getElementById(`youtube-input-${slug}`);
      if (ytInput && ytInput.value.trim()) {
        const urls = [ytInput.value.trim()];
        finalForm.youtubeLinks = [...(finalForm.youtubeLinks || []), ...urls];
        ytInput.value = '';
        setForm(finalForm);
      }
      await updateLandingPage(slug, finalForm);
      addToast(`${label} page saved!`, 'success');
    } catch {
      addToast(`Failed to save ${label} page`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Hero Slides management
  const handleAddHeroSlide = (input) => {
    const items = Array.isArray(input) ? input : [input];
    const newSlides = items.map((item) => ({
      imageUrl: typeof item === 'object' ? item.url : item,
      description: '',
    }));
    setForm((f) => ({ ...f, heroSlides: [...f.heroSlides, ...newSlides] }));
  };

  const removeHeroSlide = (i) => {
    setForm((f) => ({ ...f, heroSlides: f.heroSlides.filter((_, idx) => idx !== i) }));
  };

  const updateSlideDesc = (i, desc) => {
    setForm((f) => {
      const slides = [...f.heroSlides];
      slides[i] = { ...slides[i], description: desc };
      return { ...f, heroSlides: slides };
    });
  };

  // Gallery Images management
  const handleAddGallery = (input) => {
    const items = Array.isArray(input) ? input : [input];
    const urls = items.map((item) => typeof item === 'object' ? item.url : item);
    setForm((f) => ({ ...f, galleryImages: [...f.galleryImages, ...urls] }));
  };

  const removeGalleryImage = (i) => {
    setForm((f) => ({ ...f, galleryImages: f.galleryImages.filter((_, idx) => idx !== i) }));
    setSelectedImages(prev => prev.filter(idx => idx !== i).map(idx => idx > i ? idx - 1 : idx));
  };

  const handleDeleteMultipleImages = () => {
    setForm((f) => ({
      ...f,
      galleryImages: f.galleryImages.filter((_, idx) => !selectedImages.includes(idx))
    }));
    setSelectedImages([]);
  };

  const handleMoveImage = (idx, direction) => {
    setForm(f => {
      const newImages = [...f.galleryImages];
      if (idx + direction >= 0 && idx + direction < newImages.length) {
        const temp = newImages[idx];
        newImages[idx] = newImages[idx + direction];
        newImages[idx + direction] = temp;
      }
      return { ...f, galleryImages: newImages };
    });
    if (selectedImages.includes(idx)) {
      setSelectedImages(prev => prev.map(i => i === idx ? idx + direction : (i === idx + direction ? idx : i)));
    }
  };

  const handleAddYoutube = (input) => {
    const urls = Array.isArray(input) ? input : [input].map(i => i.trim()).filter(Boolean);
    if (!urls.length) return;
    setForm((f) => ({ ...f, youtubeLinks: [...(f.youtubeLinks || []), ...urls] }));
  };

  const removeYoutubeLink = (i) => {
    setForm((f) => ({ ...f, youtubeLinks: f.youtubeLinks.filter((_, idx) => idx !== i) }));
  };

  const handleAddFeature = () => setForm(f => ({ ...f, features: [...f.features, { title: '', description: '' }] }));
  const removeFeature = (i) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const updateFeature = (i, field, value) => {
    setForm(f => {
      const features = [...f.features];
      features[i] = { ...features[i], [field]: value };
      return { ...f, features };
    });
  };

  const handleAddOffer = () => setForm(f => ({ ...f, offers: [...f.offers, { title: '', description: '' }] }));
  const removeOffer = (i) => setForm(f => ({ ...f, offers: f.offers.filter((_, idx) => idx !== i) }));
  const updateOffer = (i, field, value) => {
    setForm(f => {
      const offers = [...f.offers];
      offers[i] = { ...offers[i], [field]: value };
      return { ...f, offers };
    });
  };

  const handleAddApproach = () => setForm(f => ({ ...f, approach: [...f.approach, { title: '', description: '' }] }));
  const removeApproach = (i) => setForm(f => ({ ...f, approach: f.approach.filter((_, idx) => idx !== i) }));
  const updateApproach = (i, field, value) => {
    setForm(f => {
      const approach = [...f.approach];
      approach[i] = { ...approach[i], [field]: value };
      return { ...f, approach };
    });
  };

  const fieldClass = "w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm";
  const labelClass = "block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] mb-10"
    >
      <div className="flex justify-between items-center p-6 border-b border-[#222]">
        <div>
          <h3 className="font-heading text-2xl text-white mb-1">{label} Landing Page</h3>
          <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">{url}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={url}
            target="_blank"
            className="flex items-center gap-1 text-[#A1A1A1] hover:text-[var(--color-gold)] text-xs uppercase tracking-widest transition-colors"
          >
            Preview <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Page Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={fieldClass} placeholder={`e.g. ${label} Photography & Film`} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={fieldClass} placeholder="e.g. Where Every Moment Becomes a Masterpiece" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Body Text / About Paragraph</label>
          <textarea
            value={form.bodyText}
            onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
            className={`${fieldClass} h-32 resize-y`}
            placeholder="Describe your service offering for this page..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>CTA Button Label</label>
            <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>CTA Button Link</label>
            <input type="text" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} className={fieldClass} placeholder={`/inquire?source=${slug}`} />
          </div>
        </div>

        {/* Hero Slides */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest">Hero Slideshow</h4>
              <p className="text-[#555] text-xs mt-1">Images that cycle every 5 seconds in the hero section</p>
            </div>
          </div>

          <ImageUpload label="Add Hero Slide Images" onUpload={handleAddHeroSlide} />

          {form.heroSlides.length > 0 && (
            <div className="mt-4 space-y-3">
              {form.heroSlides.map((slide, i) => (
                <div key={i} className="flex gap-4 items-center bg-[#0a0a0a] border border-[#1a1a1a] p-3">
                  <img src={slide.imageUrl} alt="" className="w-20 h-14 object-cover flex-shrink-0" />
                  <input
                    type="text"
                    value={slide.description}
                    onChange={(e) => updateSlideDesc(i, e.target.value)}
                    placeholder="Slide description (optional)"
                    className="flex-1 bg-transparent border-b border-[#333] py-1 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                  <button
                    onClick={() => removeHeroSlide(i)}
                    className="text-[#555] hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Gallery */}
        <div className="pt-6 border-t border-[#222]">
          <h4 className="text-white text-sm uppercase tracking-widest mb-4">Gallery Images</h4>
          <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
            <ImageUpload onUpload={handleAddGallery} folder="landing_gallery" multiple={true} />
            <div className="flex gap-4 items-center">
              {(form.galleryImages || []).length > 0 && (
                <button
                  onClick={() => {
                    if (selectedImages.length === form.galleryImages.length) {
                      setSelectedImages([]);
                    } else {
                      setSelectedImages(form.galleryImages.map((_, idx) => idx));
                    }
                  }}
                  className="text-[#A1A1A1] hover:text-white text-xs uppercase tracking-widest font-bold transition-colors border border-[#333] px-4 py-2 rounded bg-[#111]"
                >
                  {selectedImages.length === form.galleryImages.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {selectedImages.length > 0 && (
                <button 
                  onClick={handleDeleteMultipleImages}
                  className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-widest font-bold rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected ({selectedImages.length})
                </button>
              )}
            </div>
          </div>
          {form.galleryImages?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-6">
              {form.galleryImages.map((img, idx) => (
                <div key={idx} className={`relative aspect-square group bg-[#0a0a0a] border ${selectedImages.includes(idx) ? 'border-[var(--color-gold)] border-2' : 'border-[#333]'}`}>
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  
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
                      <button onClick={() => removeGalleryImage(idx)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors mx-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {idx < form.galleryImages.length - 1 && (
                        <button onClick={() => handleMoveImage(idx, 1)} className="bg-[#333] text-white p-1.5 rounded-full hover:bg-[#555] transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* YouTube Links */}
        <div className="pt-6 border-t border-[#222]">
          <h4 className="text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-[#A1A1A1]" /> YouTube Links
          </h4>
          <p className="text-[#A1A1A1] text-xs mb-4">Add YouTube video links to display in the Videos tab.</p>
          
          <div className="flex gap-2 mb-4 max-w-xl">
            <input 
              type="text" 
              id={`youtube-input-${slug}`}
              placeholder="https://www.youtube.com/watch?v=..."
              className={fieldClass}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddYoutube(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button 
              type="button"
              onClick={() => {
                const input = document.getElementById(`youtube-input-${slug}`);
                handleAddYoutube(input.value);
                input.value = '';
              }}
              className="px-6 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest transition-colors font-bold"
            >
              Add
            </button>
          </div>

          {form.youtubeLinks?.length > 0 && (
            <div className="space-y-2 max-w-xl">
              {form.youtubeLinks.map((link, i) => (
                <div key={i} className="flex justify-between items-center bg-[#0a0a0a] border border-[#333] px-4 py-3">
                  <span className="text-xs text-white truncate max-w-md font-mono text-[#A1A1A1]">{link}</span>
                  <button onClick={() => removeYoutubeLink(i)} className="text-red-500 hover:text-red-400 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features / Why Choose Us */}
        <div className="pt-6 border-t border-[#222]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-white text-sm uppercase tracking-widest flex items-center gap-2">
                Features / Why Choose Us
              </h4>
              <p className="text-[#A1A1A1] text-xs mt-1">Add items for the "Why Choose Astitva?" section.</p>
            </div>
            <button onClick={handleAddFeature} className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Feature
            </button>
          </div>
          <div className="space-y-4">
            {(form.features || []).map((feature, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#333] p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <input type="text" value={feature.title} onChange={e => updateFeature(i, 'title', e.target.value)} placeholder="Feature Title" className={fieldClass} />
                  <button onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-400 p-2 border border-[#333] bg-[#111] transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea value={feature.description} onChange={e => updateFeature(i, 'description', e.target.value)} placeholder="Feature Description" className={`${fieldClass} h-20 resize-y`} />
              </div>
            ))}
          </div>
        </div>

        {/* Our Approach */}
        <div className="pt-6 border-t border-[#222]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-white text-sm uppercase tracking-widest flex items-center gap-2">
                Our Approach
              </h4>
              <p className="text-[#A1A1A1] text-xs mt-1">Add items for the "Our Approach" or "The Experience" section.</p>
            </div>
            <button onClick={handleAddApproach} className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Approach
            </button>
          </div>
          <div className="space-y-4">
            {(form.approach || []).map((item, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#333] p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <input type="text" value={item.title} onChange={e => updateApproach(i, 'title', e.target.value)} placeholder="Approach Title" className={fieldClass} />
                  <button onClick={() => removeApproach(i)} className="text-red-500 hover:text-red-400 p-2 border border-[#333] bg-[#111] transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea value={item.description} onChange={e => updateApproach(i, 'description', e.target.value)} placeholder="Approach Description" className={`${fieldClass} h-20 resize-y`} />
              </div>
            ))}
          </div>
        </div>

        {/* Offers Section */}
        <div className="pt-6 border-t border-[#222]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-white text-sm uppercase tracking-widest flex items-center gap-2">
                Special Offers
              </h4>
              <p className="text-[#A1A1A1] text-xs mt-1">Add promotional offers to display on the landing page.</p>
            </div>
            <button onClick={handleAddOffer} className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Offer
            </button>
          </div>
          <div className="space-y-4">
            {(form.offers || []).map((offer, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#333] p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <input type="text" value={offer.title} onChange={e => updateOffer(i, 'title', e.target.value)} placeholder="Offer Title (e.g. 20% OFF)" className={fieldClass} />
                  <button onClick={() => removeOffer(i)} className="text-red-500 hover:text-red-400 p-2 border border-[#333] bg-[#111] transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input type="text" value={offer.description} onChange={e => updateOffer(i, 'description', e.target.value)} placeholder="Offer Description / Subtext" className={fieldClass} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPagesManager() {
  return (
    <>
      <Helmet>
        <title>Landing Pages | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-4 mb-8">
        <h2 className="font-heading text-3xl text-white">Landing Pages</h2>
        <p className="text-[#A1A1A1] text-sm">
          Manage the Wedding, Pre-Wedding, and VR Wedding Experience landing pages — hero slideshow, content, gallery, and CTA button.
        </p>
      </div>

      {PAGES.map((p) => (
        <LandingPageEditor key={p.slug} {...p} />
      ))}
    </>
  );
}
