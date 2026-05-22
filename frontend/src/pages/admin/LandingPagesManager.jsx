import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Save, Plus, Trash2, ExternalLink } from 'lucide-react';
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
    heroSlides: [], galleryImages: [],
    ctaLabel: 'Book Your Story', ctaLink: `/inquire?source=${slug}`,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLandingPage(slug); }, [slug]);

  useEffect(() => {
    if (page) {
      setForm({
        title: page.title || '',
        subtitle: page.subtitle || '',
        bodyText: page.bodyText || '',
        heroSlides: page.heroSlides || [],
        galleryImages: page.galleryImages || [],
        ctaLabel: page.ctaLabel || 'Book Your Story',
        ctaLink: page.ctaLink || `/inquire?source=${slug}`,
      });
    }
  }, [page]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLandingPage(slug, form);
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

        {/* Gallery Images */}
        <div>
          <div className="mb-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest">Gallery Images</h4>
            <p className="text-[#555] text-xs mt-1">Images shown in the masonry gallery section of the page</p>
          </div>

          <ImageUpload label="Add Gallery Images" onUpload={handleAddGallery} />

          {form.galleryImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
              {form.galleryImages.map((img, i) => (
                <div key={i} className="relative aspect-square group bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeGalleryImage(i)} className="text-white hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
