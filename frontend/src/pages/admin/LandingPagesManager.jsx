import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Save, Plus, Trash2, ExternalLink, Video, ChevronLeft, ChevronRight, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLandingPageStore } from '../../store/landingPageStore';
import { useToastStore } from '../../store/toastStore';
import ImageUpload from '../../components/admin/ImageUpload';

const PAGES = [
  { slug: 'wedding', label: 'Wedding', url: '/wedding-landing-page' },
  { slug: 'pre-wedding', label: 'Pre-Wedding', url: '/prewedding-landing-page' },
  { slug: 'vr-wedding', label: 'VR Wedding Experience', url: '/vrwedding-landing-page' },
];

function LandingPageEditor({ slug, label, url }) {
  const { pages, fetchLandingPage, updateLandingPage } = useLandingPageStore();
  const { addToast } = useToastStore();
  const page = pages[slug];

  const [form, setForm] = useState({
    title: '', slug: '',
    visibility: { hero: true, heroPrice: true, vr360View: true, introVideo: true, approach: true, whatWeDoBest: true, bestClicks: true, whyLoveUs: true, comfort: true, weddingFilms: true, packages: true, finalCta: true, finalCtaSubtitle: true },
    alignments: { hero: 'center', vr360View: 'center', introVideo: 'center', approach: 'center', whatWeDoBest: 'center', bestClicks: 'center', whyLoveUs: 'center', comfort: 'center', weddingFilms: 'center', packages: 'center', finalCta: 'center' },
    navbar: { stickyText: 'Hurry, Limited Slots Available!', ctaLabel: 'Book Now', ctaLink: '/quote' },
    buttonStyle: { borderRadius: 'none' },
    hero: { eyebrow: '', title: '', subtitle: '', description: '', backgroundImageUrl: '', priceStart: '', ctaLabel: '', ctaLink: '' },
    vr360View: { title: '', images: [] },
    introVideo: { title: '', videoUrl: '', thumbnailUrl: '' },
    approach: { title: '', subtitle: '', items: [] },
    whatWeDoBest: { title: '', items: [] },
    bestClicks: { title: '', images: [] },
    whyLoveUs: { title: '', items: [] },
    comfort: { title: '', items: [] },
    weddingFilms: { title: '', items: [] },
    packages: { title: '', subtitle: '', items: [] },
    finalCta: { title: '', subtitle: '', description: '', backgroundImageUrl: '', ctaLabel: '', ctaLink: '' }
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLandingPage(slug); }, [slug]);

  useEffect(() => {
    if (page) {
      setForm({
        title: page.title || '',
        slug: page.slug || slug,
        visibility: page.visibility || { hero: true, heroPrice: true, vr360View: true, introVideo: true, approach: true, whatWeDoBest: true, bestClicks: true, whyLoveUs: true, comfort: true, weddingFilms: true, packages: true, finalCta: true, finalCtaSubtitle: true },
        alignments: page.alignments || { hero: 'center', vr360View: 'center', introVideo: 'center', approach: 'center', whatWeDoBest: 'center', bestClicks: 'center', whyLoveUs: 'center', comfort: 'center', weddingFilms: 'center', packages: 'center', finalCta: 'center' },
        navbar: page.navbar || { stickyText: 'Hurry, Limited Slots Available!', ctaLabel: 'Book Now', ctaLink: '/quote' },
        buttonStyle: page.buttonStyle || { borderRadius: 'none' },
        hero: page.hero || { eyebrow: '', title: '', subtitle: '', description: '', backgroundImageUrl: '', priceStart: '', ctaLabel: '', ctaLink: '' },
        vr360View: page.vr360View || { title: '', images: [] },
        introVideo: page.introVideo || { title: '', videoUrl: '', thumbnailUrl: '' },
        approach: page.approach || { title: '', subtitle: '', items: [] },
        whatWeDoBest: page.whatWeDoBest || { title: '', items: [] },
        bestClicks: page.bestClicks || { title: '', images: [] },
        whyLoveUs: page.whyLoveUs || { title: '', items: [] },
        comfort: page.comfort || { title: '', items: [] },
        weddingFilms: page.weddingFilms || { title: '', items: [] },
        packages: page.packages || { title: '', subtitle: '', items: [] },
        finalCta: page.finalCta || { title: '', subtitle: '', description: '', backgroundImageUrl: '', ctaLabel: '', ctaLink: '' }
      });
    }
  }, [page, slug]);

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

  const updateSection = (section, field, value) => {
    setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }));
  };

  const updateSectionItem = (section, idx, field, value) => {
    setForm(f => {
      const items = [...(f[section].items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, [section]: { ...f[section], items } };
    });
  };

  const addSectionItem = (section, newItem) => {
    setForm(f => ({ ...f, [section]: { ...f[section], items: [...(f[section].items || []), newItem] } }));
  };

  const removeSectionItem = (section, idx) => {
    setForm(f => ({ ...f, [section]: { ...f[section], items: (f[section].items || []).filter((_, i) => i !== idx) } }));
  };

  const fieldClass = "w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm";
  const labelClass = "block text-[#A1A1A1] text-xs uppercase tracking-widest mb-2 mt-4";

  const AlignmentSelector = ({ section }) => {
    const currentAlign = form.alignments?.[section] || 'center';
    return (
      <div className="flex bg-[#0a0a0a] border border-[#333] rounded overflow-hidden mt-1 w-fit">
        {[
          { id: 'left', icon: <AlignLeft className="w-4 h-4" /> },
          { id: 'center', icon: <AlignCenter className="w-4 h-4" /> },
          { id: 'right', icon: <AlignRight className="w-4 h-4" /> }
        ].map(align => (
          <button
            key={align.id} type="button" title={`Align ${align.id}`}
            onClick={() => setForm(f => ({ ...f, alignments: { ...f.alignments, [section]: align.id } }))}
            className={`p-2 transition-colors ${currentAlign === align.id ? 'bg-[var(--color-gold)] text-black' : 'text-[#A1A1A1] hover:text-white hover:bg-[#222]'}`}
          >
            {align.icon}
          </button>
        ))}
      </div>
    );
  };

  const VisibilityToggle = ({ section, label = '' }) => {
    const isVisible = form.visibility?.[section] ?? true;
    return (
      <button
        onClick={() => setForm(f => ({ ...f, visibility: { ...f.visibility, [section]: !isVisible } }))}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase tracking-widest font-bold transition-colors border ${isVisible ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30' : 'bg-[#111] text-[#666] border-[#333] hover:text-white'}`}
        title={`Toggle ${label || section} visibility`}
      >
        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {label ? label : (isVisible ? 'Visible' : 'Hidden')}
      </button>
    );
  };

  const SectionHeader = ({ sectionId, title }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#222] pb-4">
      <h4 className="text-white text-lg uppercase tracking-widest">{title}</h4>
      <div className="flex items-center gap-4">
        <AlignmentSelector section={sectionId} />
        <VisibilityToggle section={sectionId} />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-[#222] mb-10">
      <div className="flex justify-between items-center p-6 border-b border-[#222] sticky top-0 bg-[#111]/90 backdrop-blur-md z-50">
        <div>
          <h3 className="font-heading text-2xl text-white mb-1">{label} Settings</h3>
          <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">{url}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={url} target="_blank" className="flex items-center gap-1 text-[#A1A1A1] hover:text-[var(--color-gold)] text-xs uppercase tracking-widest transition-colors">
            Preview <ExternalLink className="w-3 h-3" />
          </Link>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-12">
        {/* Page Meta */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <h4 className="text-white text-lg uppercase tracking-widest border-b border-[#222] pb-2 mb-4">Meta Information</h4>
          <div>
            <label className={labelClass}>Page Title (SEO)</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={fieldClass} />
          </div>
        </div>

        {/* Global Styles / Navbar */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <div className="flex items-center justify-between mb-6 border-b border-[#222] pb-4">
            <h4 className="text-white text-lg uppercase tracking-widest">Global & Navigation Settings</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Floating Sticky Text</label><input type="text" value={form.navbar.stickyText} onChange={e => updateSection('navbar', 'stickyText', e.target.value)} className={fieldClass} /></div>
            <div>
              <label className={labelClass}>Button Border Radius</label>
              <select value={form.buttonStyle.borderRadius} onChange={e => updateSection('buttonStyle', 'borderRadius', e.target.value)} className={fieldClass}>
                <option value="none">Square (None)</option>
                <option value="sm">Slightly Rounded (sm)</option>
                <option value="md">Rounded (md)</option>
                <option value="lg">More Rounded (lg)</option>
                <option value="full">Pill Shaped (full)</option>
              </select>
            </div>
            <div><label className={labelClass}>Navbar CTA Label</label><input type="text" value={form.navbar.ctaLabel} onChange={e => updateSection('navbar', 'ctaLabel', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Navbar CTA Link</label><input type="text" value={form.navbar.ctaLink} onChange={e => updateSection('navbar', 'ctaLink', e.target.value)} className={fieldClass} /></div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="hero" title="1. Hero Section" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={form.hero.eyebrow} onChange={e => updateSection('hero', 'eyebrow', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Main Title</label><input type="text" value={form.hero.title} onChange={e => updateSection('hero', 'title', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Subtitle</label><input type="text" value={form.hero.subtitle} onChange={e => updateSection('hero', 'subtitle', e.target.value)} className={fieldClass} /></div>
            <div>
              <div className="flex justify-between items-center mt-4 mb-2">
                <label className="text-[#A1A1A1] text-xs uppercase tracking-widest m-0">Starting Price Label</label>
                <VisibilityToggle section="heroPrice" label="Show Price" />
              </div>
              <input type="text" value={form.hero.priceStart} onChange={e => updateSection('hero', 'priceStart', e.target.value)} className={fieldClass} />
            </div>
            <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea value={form.hero.description} onChange={e => updateSection('hero', 'description', e.target.value)} className={`${fieldClass} h-20 resize-y`} /></div>
            <div><label className={labelClass}>CTA Button Label</label><input type="text" value={form.hero.ctaLabel} onChange={e => updateSection('hero', 'ctaLabel', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>CTA Link Path</label><input type="text" value={form.hero.ctaLink} onChange={e => updateSection('hero', 'ctaLink', e.target.value)} className={fieldClass} /></div>
            <div className="md:col-span-2">
              <label className={labelClass}>Background Image URL</label>
              <ImageUpload multiple={false} label="Upload Hero Background" onUpload={(data) => updateSection('hero', 'backgroundImageUrl', data.url || data)} />
              {form.hero.backgroundImageUrl && <img src={form.hero.backgroundImageUrl} alt="Hero BG" className="mt-2 h-20 object-cover border border-[#333]" />}
            </div>
          </div>
        </div>

        {/* VR 360 View (Only for VR Wedding) */}
        {slug === 'vr-wedding' && (
          <div className="bg-[#1a1a1a] p-6 border border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <SectionHeader sectionId="vr360View" title="1.5. VR 360 View" />
            <div className="mb-6">
              <label className={labelClass}>Section Title</label>
              <input type="text" value={form.vr360View.title} onChange={e => updateSection('vr360View', 'title', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>360 Panoramic Images</label>
              <ImageUpload multiple={true} onUpload={(data) => {
                const urls = Array.isArray(data) ? data.map(d => d.url || d) : [data.url || data];
                updateSection('vr360View', 'images', [...(form.vr360View.images || []), ...urls]);
              }} />
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                {form.vr360View.images?.map((img, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img src={img} alt="" className="h-24 w-full object-cover border border-[#333]" />
                    <button onClick={() => {
                      updateSection('vr360View', 'images', form.vr360View.images.filter((_, i) => i !== idx));
                    }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Intro Video */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="introVideo" title="2. Intro Video Section" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className={labelClass}>Section Title</label><input type="text" value={form.introVideo.title} onChange={e => updateSection('introVideo', 'title', e.target.value)} className={fieldClass} /></div>
            <div>
              <label className={labelClass}>Video URL (Drag & Drop or Direct Link)</label>
              <input type="text" value={form.introVideo.videoUrl} onChange={e => updateSection('introVideo', 'videoUrl', e.target.value)} className={`${fieldClass} mb-2`} placeholder="e.g., YouTube URL or direct MP4 link" />
              <ImageUpload multiple={false} accept="video/*" label="Upload Video" onUpload={(data) => updateSection('introVideo', 'videoUrl', data.url || data)} />
            </div>
            <div>
              <label className={labelClass}>Thumbnail Image URL</label>
              <ImageUpload multiple={false} label="Upload Video Thumbnail" onUpload={(data) => updateSection('introVideo', 'thumbnailUrl', data.url || data)} />
              {form.introVideo.thumbnailUrl && <img src={form.introVideo.thumbnailUrl} alt="Thumbnail" className="mt-2 h-20 object-cover border border-[#333]" />}
            </div>
          </div>
        </div>

        {/* Approach */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="approach" title="3. Our Approach" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><label className={labelClass}>Section Title</label><input type="text" value={form.approach.title} onChange={e => updateSection('approach', 'title', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Subtitle</label><input type="text" value={form.approach.subtitle} onChange={e => updateSection('approach', 'subtitle', e.target.value)} className={fieldClass} /></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Approach Items</label>
              <button onClick={() => addSectionItem('approach', { number: `0${(form.approach.items?.length || 0) + 1}`, title: '', description: '' })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Item
              </button>
            </div>
            <div className="space-y-4">
              {form.approach.items?.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 bg-[#111] border border-[#222] p-4 relative">
                  <button onClick={() => removeSectionItem('approach', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <div className="w-20"><label className={labelClass}>Num</label><input type="text" value={item.number} onChange={e => updateSectionItem('approach', idx, 'number', e.target.value)} className={fieldClass} /></div>
                  <div className="flex-1"><label className={labelClass}>Title</label><input type="text" value={item.title} onChange={e => updateSectionItem('approach', idx, 'title', e.target.value)} className={fieldClass} /></div>
                  <div className="flex-[2]"><label className={labelClass}>Description</label><textarea value={item.description} onChange={e => updateSectionItem('approach', idx, 'description', e.target.value)} className={`${fieldClass} h-12`} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What We Do Best */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="whatWeDoBest" title="4. What We Do Best" />
          <div className="mb-6">
            <label className={labelClass}>Section Title</label>
            <input type="text" value={form.whatWeDoBest.title} onChange={e => updateSection('whatWeDoBest', 'title', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Service Cards</label>
              <button onClick={() => addSectionItem('whatWeDoBest', { title: '', description: '', label: '', images: [] })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Card
              </button>
            </div>
            <div className="space-y-6">
              {form.whatWeDoBest.items?.map((item, idx) => (
                <div key={idx} className="bg-[#111] border border-[#222] p-4 relative">
                  <button onClick={() => removeSectionItem('whatWeDoBest', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div><label className={labelClass}>Title</label><input type="text" value={item.title} onChange={e => updateSectionItem('whatWeDoBest', idx, 'title', e.target.value)} className={fieldClass} /></div>
                    <div><label className={labelClass}>Tag Label (e.g. ROMANTIC)</label><input type="text" value={item.label} onChange={e => updateSectionItem('whatWeDoBest', idx, 'label', e.target.value)} className={fieldClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea value={item.description} onChange={e => updateSectionItem('whatWeDoBest', idx, 'description', e.target.value)} className={`${fieldClass} h-16`} /></div>
                  </div>
                  <div>
                    <label className={labelClass}>Images (Slide Show)</label>
                    <ImageUpload multiple={true} onUpload={(data) => {
                      const urls = Array.isArray(data) ? data.map(d => d.url || d) : [data.url || data];
                      updateSectionItem('whatWeDoBest', idx, 'images', [...(item.images || []), ...urls]);
                    }} />
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {item.images?.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group shrink-0">
                          <img src={img} alt="" className="h-16 w-16 object-cover border border-[#333]" />
                          <button onClick={() => {
                            const newImages = item.images.filter((_, i) => i !== imgIdx);
                            updateSectionItem('whatWeDoBest', idx, 'images', newImages);
                          }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Clicks (Gallery) */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="bestClicks" title="5. Our Best Clicks" />
          <div className="mb-6">
            <label className={labelClass}>Section Title</label>
            <input type="text" value={form.bestClicks.title} onChange={e => updateSection('bestClicks', 'title', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Gallery Images</label>
            <ImageUpload multiple={true} onUpload={(data) => {
              const urls = Array.isArray(data) ? data.map(d => d.url || d) : [data.url || data];
              updateSection('bestClicks', 'images', [...(form.bestClicks.images || []), ...urls]);
            }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
              {form.bestClicks.images?.map((img, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img src={img} alt="" className="h-24 w-full object-cover border border-[#333]" />
                  <button onClick={() => {
                    updateSection('bestClicks', 'images', form.bestClicks.images.filter((_, i) => i !== idx));
                  }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Love Us */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="whyLoveUs" title="6. Why Love Us" />
          <div className="mb-6">
            <label className={labelClass}>Section Title</label>
            <input type="text" value={form.whyLoveUs.title} onChange={e => updateSection('whyLoveUs', 'title', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Features</label>
              <button onClick={() => addSectionItem('whyLoveUs', { title: '', description: '' })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Feature
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.whyLoveUs.items?.map((item, idx) => (
                <div key={idx} className="bg-[#111] border border-[#222] p-4 relative">
                  <button onClick={() => removeSectionItem('whyLoveUs', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <label className={labelClass}>Title</label><input type="text" value={item.title} onChange={e => updateSectionItem('whyLoveUs', idx, 'title', e.target.value)} className={fieldClass} />
                  <label className={labelClass}>Description</label><textarea value={item.description} onChange={e => updateSectionItem('whyLoveUs', idx, 'description', e.target.value)} className={`${fieldClass} h-16 mt-2`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comfort */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="comfort" title="7. Comfort & Stress-Free" />
          <div className="mb-6">
            <label className={labelClass}>Section Title</label>
            <input type="text" value={form.comfort.title} onChange={e => updateSection('comfort', 'title', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Comfort Items</label>
              <button onClick={() => addSectionItem('comfort', { title: '', description: '', iconUrl: '' })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Item
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {form.comfort.items?.map((item, idx) => (
                <div key={idx} className="bg-[#111] border border-[#222] p-4 relative">
                  <button onClick={() => removeSectionItem('comfort', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  
                  <div className="mb-4">
                    <label className={labelClass}>Custom Icon (Optional)</label>
                    {item.iconUrl && <img src={item.iconUrl} alt="Icon" className="h-10 w-10 object-contain mb-2" />}
                    <ImageUpload multiple={false} label="Upload Icon" onUpload={(data) => updateSectionItem('comfort', idx, 'iconUrl', data.url || data)} />
                  </div>
                  
                  <label className={labelClass}>Title</label><input type="text" value={item.title} onChange={e => updateSectionItem('comfort', idx, 'title', e.target.value)} className={fieldClass} />
                  <label className={labelClass}>Description</label><textarea value={item.description} onChange={e => updateSectionItem('comfort', idx, 'description', e.target.value)} className={`${fieldClass} h-16 mt-2`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wedding Films */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="weddingFilms" title="8. Our Films" />
          <div className="mb-6">
            <label className={labelClass}>Section Title</label>
            <input type="text" value={form.weddingFilms.title} onChange={e => updateSection('weddingFilms', 'title', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Video Thumbnails/Links</label>
              <button onClick={() => addSectionItem('weddingFilms', { thumbnailUrl: '', videoUrl: '' })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Video
              </button>
            </div>
            <div className="space-y-4">
              {form.weddingFilms.items?.map((item, idx) => (
                <div key={idx} className="bg-[#111] border border-[#222] p-4 relative flex flex-col md:flex-row gap-4">
                  <button onClick={() => removeSectionItem('weddingFilms', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <div className="flex-1">
                    <label className={labelClass}>Video URL</label>
                    <input type="text" value={item.videoUrl} onChange={e => updateSectionItem('weddingFilms', idx, 'videoUrl', e.target.value)} className={`${fieldClass} mb-2`} placeholder="Direct link or upload..." />
                    <ImageUpload multiple={false} accept="video/*" label="Upload Video" onUpload={data => updateSectionItem('weddingFilms', idx, 'videoUrl', data.url || data)} />
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Thumbnail Image URL</label>
                    <ImageUpload multiple={false} onUpload={data => updateSectionItem('weddingFilms', idx, 'thumbnailUrl', data.url || data)} />
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} className="mt-2 h-16 object-cover border border-[#333]" alt="" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="packages" title="9. Pricing Packages" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><label className={labelClass}>Section Title</label><input type="text" value={form.packages.title} onChange={e => updateSection('packages', 'title', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Subtitle</label><input type="text" value={form.packages.subtitle} onChange={e => updateSection('packages', 'subtitle', e.target.value)} className={fieldClass} /></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className={labelClass}>Pricing Plans</label>
              <button onClick={() => addSectionItem('packages', { title: '', price: '', features: [], isRecommended: false })} className="px-4 py-2 bg-[#111] border border-[#333] hover:border-[var(--color-gold)] text-white text-xs uppercase tracking-widest">
                + Add Plan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {form.packages.items?.map((item, idx) => (
                <div key={idx} className="bg-[#111] border border-[#222] p-4 relative">
                  <button onClick={() => removeSectionItem('packages', idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <div className="space-y-4 mb-4">
                    <div><label className={labelClass}>Plan Name</label><input type="text" value={item.title} onChange={e => updateSectionItem('packages', idx, 'title', e.target.value)} className={fieldClass} /></div>
                    <div><label className={labelClass}>Price</label><input type="text" value={item.price} onChange={e => updateSectionItem('packages', idx, 'price', e.target.value)} className={fieldClass} /></div>
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer mt-4">
                      <input type="checkbox" checked={item.isRecommended} onChange={e => updateSectionItem('packages', idx, 'isRecommended', e.target.checked)} className="accent-[var(--color-gold)] w-4 h-4" />
                      Highlight as Recommended
                    </label>
                  </div>
                  <div>
                    <label className={labelClass}>Features (One per line)</label>
                    <textarea 
                      value={(item.features || []).join('\n')} 
                      onChange={e => updateSectionItem('packages', idx, 'features', e.target.value.split('\n').filter(Boolean))} 
                      className={`${fieldClass} h-32 leading-relaxed`} 
                      placeholder="Traditional Photography&#10;Candid Photography&#10;..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-[#1a1a1a] p-6 border border-[#333]">
          <SectionHeader sectionId="finalCta" title="10. Final Call to Action" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Title</label><input type="text" value={form.finalCta.title} onChange={e => updateSection('finalCta', 'title', e.target.value)} className={fieldClass} /></div>
            <div>
              <div className="flex justify-between items-center mt-4 mb-2">
                <label className="text-[#A1A1A1] text-xs uppercase tracking-widest m-0">Subtitle</label>
                <VisibilityToggle section="finalCtaSubtitle" label="Show Subtitle" />
              </div>
              <input type="text" value={form.finalCta.subtitle} onChange={e => updateSection('finalCta', 'subtitle', e.target.value)} className={fieldClass} />
            </div>
            <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea value={form.finalCta.description} onChange={e => updateSection('finalCta', 'description', e.target.value)} className={`${fieldClass} h-20 resize-y`} /></div>
            <div><label className={labelClass}>Button Label</label><input type="text" value={form.finalCta.ctaLabel} onChange={e => updateSection('finalCta', 'ctaLabel', e.target.value)} className={fieldClass} /></div>
            <div><label className={labelClass}>Button Link</label><input type="text" value={form.finalCta.ctaLink} onChange={e => updateSection('finalCta', 'ctaLink', e.target.value)} className={fieldClass} /></div>
            <div className="md:col-span-2">
              <label className={labelClass}>Background Image URL</label>
              <ImageUpload multiple={false} label="Upload CTA Background" onUpload={(data) => updateSection('finalCta', 'backgroundImageUrl', data.url || data)} />
              {form.finalCta.backgroundImageUrl && <img src={form.finalCta.backgroundImageUrl} alt="CTA BG" className="mt-2 h-20 object-cover border border-[#333]" />}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function LandingPagesManager() {
  const [activeTab, setActiveTab] = useState(PAGES[0].slug);

  return (
    <>
      <Helmet><title>Landing Pages | Admin Dashboard</title></Helmet>

      <div className="space-y-4 mb-8">
        <h2 className="font-heading text-3xl text-white">Landing Pages Builder</h2>
        <p className="text-[#A1A1A1] text-sm">
          Comprehensive drag-and-drop style builder to manage visibility, alignment, and content for all landing pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#222]">
        {PAGES.map(p => (
          <button
            key={p.slug}
            onClick={() => setActiveTab(p.slug)}
            className={`px-4 py-3 text-sm uppercase tracking-widest font-bold border-b-2 transition-colors ${activeTab === p.slug ? 'border-[var(--color-gold)] text-[var(--color-gold)]' : 'border-transparent text-[#A1A1A1] hover:text-white hover:bg-[#111]'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {PAGES.filter(p => p.slug === activeTab).map((p) => (
        <LandingPageEditor key={p.slug} {...p} />
      ))}
    </>
  );
}
