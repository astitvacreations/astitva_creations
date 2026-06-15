import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, X, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useLandingPageStore } from '../store/landingPageStore';
import { useTestimonialStore } from '../store/testimonialStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { getYouTubeId } from '../utils/youtube';

const SLUG = 'pre-wedding';

const FALLBACK = {
  title: 'Pre-Wedding Photography',
  subtitle: 'Your Love Story, Before The Big Day',
  bodyText: `A pre-wedding shoot is your canvas to express your love freely — without the formality, without the crowds, just the two of you. At Astitva Creations, we transform ordinary locations into extraordinary backdrops for your love story. From golden hour fields to urban landscapes, from heritage sites to intimate home settings — every frame tells the unique chapter of your journey together.`,
  heroSlides: [
    { imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80', description: 'Conceptual Pre-Wedding Stories' },
    { imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80', description: 'Your Love, Our Canvas' },
  ],
  galleryImages: [],
  ctaLabel: 'Plan Your Pre-Wedding Shoot',
  ctaLink: '/inquire?source=pre-wedding',
};

export default function PreWeddingLandingPage() {
  const { pages, fetchLandingPage } = useLandingPageStore();
  const { testimonials, fetchTestimonials } = useTestimonialStore();
  const page = pages[SLUG];
  const data = (page && (page.title || page.heroSlides?.length > 0 || page.galleryImages?.length > 0 || page.youtubeLinks?.length > 0)) ? page : FALLBACK;

  const [activeTab, setActiveTab] = useState('photos');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const heroRef = useRef(null);
  const intervalRef = useRef(null);

  const slides = data.heroSlides?.length > 0 ? data.heroSlides : FALLBACK.heroSlides;
  const gallery = data.galleryImages || [];
  const youtubeLinks = data.youtubeLinks || [];
  const activeTestimonials = testimonials.filter(t => t.status === 'APPROVED');

  useEffect(() => { 
    fetchLandingPage(SLUG); 
    fetchTestimonials();
  }, []);

  // Parallax
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setParallaxY(-rect.top * 0.4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Slideshow
  useEffect(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  const openLightbox = (i) => {
    setLightboxIndex(i);
    setSelectedImage(gallery[i]);
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };
  const nextLb = (e) => { e.stopPropagation(); const n = (lightboxIndex + 1) % gallery.length; setLightboxIndex(n); setSelectedImage(gallery[n]); };
  const prevLb = (e) => { e.stopPropagation(); const n = (lightboxIndex - 1 + gallery.length) % gallery.length; setLightboxIndex(n); setSelectedImage(gallery[n]); };

  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <>
      <Helmet>
        <title>{data.title || 'Pre-Wedding Photography'} | Astitva Creations</title>
        <meta name="description" content={data.bodyText?.slice(0, 160)} />
      </Helmet>

      {/* ─── Parallax Hero Slideshow ─── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-[-10%] w-[120%] h-[120%]"
            style={{ transform: `translateY(${parallaxY}px)`, transition: 'transform 0.1s linear' }}
          >
            <img
              src={getOptimizedUrl(slides[currentSlide]?.imageUrl, 1920)}
              alt={slides[currentSlide]?.description || 'Pre-Wedding'}
              className="w-full h-full object-cover opacity-60"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#0B0B0B]" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs font-semibold mb-6"
          >
            Astitva Creations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight"
          >
            {data.title || FALLBACK.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/70 text-base md:text-lg italic mb-10"
          >
            {data.subtitle || FALLBACK.subtitle}
          </motion.p>

          <AnimatePresence mode="wait">
            {slides[currentSlide]?.description && (
              <motion.p
                key={currentSlide}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-white/50 text-sm italic mb-8"
              >
                {slides[currentSlide].description}
              </motion.p>
            )}
          </AnimatePresence>

          <Link
            to={data.ctaLink || '/quote'}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors"
          >
            {data.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? 'w-6 h-1.5 bg-[var(--color-gold)]' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Concept Section ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[var(--color-gold)] tracking-[0.4em] uppercase text-xs font-semibold mb-6 block">The Experience</span>
              <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">{data.title || FALLBACK.title}</h2>
              <p className="text-[#A1A1A1] text-sm leading-relaxed whitespace-pre-line">{data.bodyText || FALLBACK.bodyText}</p>
              <Link
                to={data.ctaLink || '/quote'}
                className="inline-flex items-center gap-2 mt-10 px-8 py-3 border border-[var(--color-gold)] text-[var(--color-gold)] uppercase tracking-widest text-xs font-semibold hover:bg-[var(--color-gold)] hover:text-black transition-colors"
              >
                {data.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {[
                { title: 'Themed Shoots', desc: 'Bollywood, vintage, rustic, royal — we build your dream theme from concept to execution.' },
                { title: 'Location Scouting', desc: 'We find the perfect backdrop that matches your personality and vision.' },
                { title: 'Wardrobe Direction', desc: 'Expert guidance on what to wear for stunning, cohesive visuals.' },
                { title: 'Cinematic Edit', desc: 'Color-graded, film-like final photos and videos that feel like frames from a movie.' },
              ].map((f, i) => (
                <div key={f.title} className="bg-[#111] p-6 border border-[#1a1a1a] hover:border-[var(--color-gold)]/30 transition-colors">
                  <div className="w-8 h-[2px] bg-[var(--color-gold)] mb-4" />
                  <h4 className="font-heading text-base text-white mb-2">{f.title}</h4>
                  <p className="text-[#777] text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Media Gallery (Tabs) ─── */}
      {(gallery.length > 0 || youtubeLinks.length > 0) && (
        <section className="py-20 bg-[#0B0B0B]">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-8"
            >
              Our Portfolio
            </motion.h2>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-12">
              <button 
                onClick={() => setActiveTab('photos')}
                className={`px-8 py-2 text-xs uppercase tracking-widest font-bold transition-colors border ${activeTab === 'photos' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-transparent text-[#A1A1A1] border-[#333] hover:border-[var(--color-gold)] hover:text-white'}`}
              >
                Photos
              </button>
              <button 
                onClick={() => setActiveTab('videos')}
                className={`px-8 py-2 text-xs uppercase tracking-widest font-bold transition-colors border ${activeTab === 'videos' ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' : 'bg-transparent text-[#A1A1A1] border-[#333] hover:border-[var(--color-gold)] hover:text-white'}`}
              >
                Videos
              </button>
            </div>

            {activeTab === 'photos' && gallery.length > 0 && (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {gallery.map((img, i) => (
                  <div key={i} className="relative group overflow-hidden break-inside-avoid cursor-pointer bg-[#111]" onClick={() => openLightbox(i)}>
                    <img src={getOptimizedUrl(img, 800)} alt={`Pre-Wedding ${i + 1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" loading={i < 4 ? 'eager' : 'lazy'} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-xs font-bold backdrop-blur-sm">View</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'photos' && gallery.length === 0 && (
              <p className="text-center text-[#A1A1A1]">No photos uploaded yet.</p>
            )}

            {activeTab === 'videos' && youtubeLinks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {youtubeLinks.map((link, i) => {
                  const yId = getYouTubeId(link);
                  return yId ? (
                    <div key={i} className="relative aspect-video bg-[#111] border border-[#222]">
                      <iframe
                        src={`https://www.youtube.com/embed/${yId}`}
                        title={`YouTube video ${i}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {activeTab === 'videos' && youtubeLinks.length === 0 && (
              <p className="text-center text-[#A1A1A1]">No videos uploaded yet.</p>
            )}
          </div>
        </section>
      )}

      {/* ─── Testimonials ─── */}
      {activeTestimonials.length > 0 && (
        <section className="py-24 bg-[#050505] overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
            >
              What Our Couples Say
            </motion.h2>

            <div className="relative max-w-4xl mx-auto">
              <div className="overflow-hidden relative px-4 sm:px-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIdx}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center"
                  >
                    <Quote className="w-12 h-12 text-[var(--color-gold)]/20 mb-6" />
                    <p className="text-xl md:text-2xl text-[#E0E0E0] italic font-light leading-relaxed mb-8">
                      "{activeTestimonials[testimonialIdx].content}"
                    </p>
                    <div className="flex flex-col items-center">
                      <h4 className="font-heading text-[var(--color-gold)] text-lg mb-1">{activeTestimonials[testimonialIdx].clientName}</h4>
                      <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">{activeTestimonials[testimonialIdx].eventType || 'Client'}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {activeTestimonials.length > 1 && (
                <>
                  <button onClick={() => setTestimonialIdx(p => (p - 1 + activeTestimonials.length) % activeTestimonials.length)} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10 hidden sm:block">
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button onClick={() => setTestimonialIdx(p => (p + 1) % activeTestimonials.length)} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10 hidden sm:block">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  
                  {/* Mobile Dots */}
                  <div className="flex justify-center gap-2 mt-8 sm:hidden">
                    {activeTestimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTestimonialIdx(i)}
                        className={`rounded-full transition-all ${i === testimonialIdx ? 'w-6 h-1.5 bg-[var(--color-gold)]' : 'w-1.5 h-1.5 bg-[#333]'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Banner ─── */}
      <section className="py-24 bg-[#0B0B0B] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-4"
        >
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">Let's Create Your Story</h2>
          <p className="text-[#A1A1A1] text-sm leading-relaxed mb-10">
            Every love story is unique. Let us help you tell yours in the most beautiful way possible. Reach out and let's plan something extraordinary together.
          </p>
          <Link
            to={data.ctaLink || '/quote'}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors"
          >
            {data.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-6 right-6 text-[#A1A1A1] hover:text-white">
              <X className="w-10 h-10" />
            </button>
            {gallery.length > 1 && (
              <>
                <button onClick={prevLb} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full">
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button onClick={nextLb} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full">
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}
            <div className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]">
              <img 
                src={getOptimizedUrl(selectedImage, 800)} 
                alt="placeholder" 
                className="w-full h-full object-contain pointer-events-none opacity-50 blur-xl scale-95 transition-opacity duration-500" 
              />
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }}
                src={getOptimizedUrl(selectedImage, 1920)}
                alt="Pre-wedding gallery"
                className="absolute inset-0 w-full h-full object-contain pointer-events-auto shadow-2xl cursor-grab active:cursor-grabbing"
                decoding="async"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -50) nextLb(e);
                  else if (swipe > 50) prevLb(e);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
