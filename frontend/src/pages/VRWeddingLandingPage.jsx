import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, X, Quote, Eye, Headphones, RotateCcw } from 'lucide-react';
import { useLandingPageStore } from '../store/landingPageStore';
import { useTestimonialStore } from '../store/testimonialStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { getYouTubeId } from '../utils/youtube';

const SLUG = 'vrwedding';

const FALLBACK = {
  title: '360° VR Wedding Experience',
  subtitle: 'Relive Your Landmark Celebration in Full Immersive Reality',
  bodyText: `Your wedding day is a gorgeous blur of pure emotion, ambient laughter, and cherished details. At Astitva Creations, we believe you deserve to preserve these landmark memories in a fully immersive virtual environment.\n\nOur state-of-the-art 360° Virtual Reality coverage captures the complete spherical space, authentic ambient acoustics, and genuine expressions from every single angle. Put on a VR headset years from now and stand right back in the center of the crowd, re-experiencing the tearful vows, the joyous laughter, and the magical atmosphere exactly as it happened.`,
  heroSlides: [
    { imageUrl: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&q=80', description: 'Immersive 360° Spherical Cinematic Experience' },
    { imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80', description: 'Step Back Into Your Magical Memories' },
  ],
  galleryImages: [],
  ctaLabel: 'Design Your VR Quote',
  ctaLink: '/inquire?source=vrwedding',
};

export default function VRWeddingLandingPage() {
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
  const activeTestimonials = testimonials.filter(t => t.isActive);

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

  // Right-click protection
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <>
      <Helmet>
        <title>{data.title || 'VR Wedding Experience'} | Astitva Creations</title>
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
              alt={slides[currentSlide]?.description || 'VR Wedding Experience'}
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
            className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs font-semibold mb-6 animate-pulse"
          >
            Virtual Reality Technology
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight text-white"
          >
            {data.title || FALLBACK.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[#EAD8A0] text-base md:text-lg italic mb-10"
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

      {/* ─── About Section ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[var(--color-gold)] tracking-[0.4em] uppercase text-xs font-semibold mb-6 block">Future of Memories</span>
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-8">
              Immersive Spatial Capturing
            </h2>
            <p className="text-[#A1A1A1] text-sm md:text-base leading-relaxed whitespace-pre-line max-w-3xl mx-auto">
              {data.bodyText || FALLBACK.bodyText}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Immersive Technology Pillars ─── */}
      <section className="py-20 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-14"
          >
            The VR Experience Advantage
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Eye, title: 'Spherical 360° Vision', desc: 'Capture the full canvas of your venue. Look left to see your friends laughing, look right to see your parents tearing up, look behind to see the beautiful setups.' },
              { icon: Headphones, title: 'Spatial Audio System', desc: 'Hear sound directionally. Ambient laughs, instrumental vows, acoustic rhythms, and heartfelt cheers resonate exactly where they happened in space.' },
              { icon: RotateCcw, title: 'Generational Time Capsule', desc: 'Transport yourself, future kids, and family members straight back onto the main platform. A truly priceless keepsake that never fades.' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#111] p-8 border border-[#1a1a1a] hover:border-[var(--color-gold)]/30 transition-colors group"
                >
                  <Icon className="w-10 h-10 text-[var(--color-gold)] mb-6 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-heading text-xl text-white mb-4">{card.title}</h3>
                  <p className="text-[#A1A1A1] text-sm leading-relaxed">{card.desc}</p>
                </motion.div>
              );
            })}
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
              <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-8">
                {gallery.map((img, i) => (
                  <div key={i} className="relative group shrink-0 w-[85vw] sm:w-[60vw] md:w-[40vw] lg:w-[30vw] aspect-[4/5] overflow-hidden cursor-pointer bg-[#111] snap-center" onClick={() => openLightbox(i)}>
                    <img src={getOptimizedUrl(img, 800)} alt={`VR Wedding ${i + 1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" loading={i < 4 ? 'eager' : 'lazy'} />
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
              <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar pb-8">
                {youtubeLinks.map((link, i) => {
                  const yId = getYouTubeId(link);
                  return yId ? (
                    <div key={i} className="relative shrink-0 w-[85vw] sm:w-[70vw] md:w-[60vw] lg:w-[45vw] aspect-video bg-[#111] border border-[#222] snap-center">
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
      {testimonials && testimonials.length > 0 && (
        <section className="py-24 bg-[#050505] overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
            >
              Testimonials
            </motion.h2>

            <div className="relative max-w-4xl mx-auto flex items-center justify-center min-h-[160px]">
              <button onClick={() => setTestimonialIdx(p => (p - 1 + testimonials.length) % testimonials.length)} className="absolute left-0 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10 hidden sm:block">
                <ChevronLeft className="w-8 h-8" />
              </button>

              <div className="px-4 sm:px-12 w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full flex flex-col items-center text-center"
                  >
                    <Quote className="w-12 h-12 text-[var(--color-gold)]/20 mb-6" />
                    <p className="text-[#A1A1A1] text-lg md:text-xl italic font-serif leading-relaxed mb-6">
                      "{testimonials[testimonialIdx]?.text}"
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1 text-[var(--color-gold)] mb-1">
                        {[...Array(parseInt(testimonials[testimonialIdx]?.rating) || 5)].map((_, idx) => (
                          <span key={idx} className="text-lg leading-none">★</span>
                        ))}
                      </div>
                      <span className="text-[var(--color-gold)] font-bold uppercase tracking-widest text-sm">
                        {testimonials[testimonialIdx]?.author}
                      </span>
                      {testimonials[testimonialIdx]?.googleReviewUrl && (
                        <a
                          href={testimonials[testimonialIdx].googleReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] text-[var(--color-gold)]/60 hover:text-[var(--color-gold)] uppercase tracking-wider transition-colors duration-300"
                        >
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.78 0 3.42.67 4.67 1.865l2.405-2.405C17.585 1.83 15.08 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.06-1.3-.17-1.945H12.24z"/>
                          </svg>
                          Verified Google Review ↗
                        </a>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {testimonials.length > 1 && (
                <>
                  <button onClick={() => setTestimonialIdx(p => (p + 1) % testimonials.length)} className="absolute right-0 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10 hidden sm:block">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  
                  {/* Mobile Dots */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden">
                    {testimonials.map((_, i) => (
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
      <section className="py-24 bg-[#050505] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-4"
        >
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">
            Step Into Your Cinematic Future
          </h2>
          <p className="text-[#A1A1A1] text-sm leading-relaxed mb-10">
            Customize and configure your custom VR coverage parameters now. Let Astitva Creations construct a premium, time-travel-like memory space for your landmark events.
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
                alt="VR Wedding gallery"
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
