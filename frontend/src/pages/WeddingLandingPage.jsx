import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, X, Quote, Play } from 'lucide-react';
import { useLandingPageStore } from '../store/landingPageStore';
import { useTestimonialStore } from '../store/testimonialStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { getYouTubeId } from '../utils/youtube';

const SLUG = 'wedding';

const FALLBACK = {
  title: 'Wedding Photography & Film',
  subtitle: 'Where Every Moment Becomes a Masterpiece',
  bodyText: `Your wedding day is the beginning of your greatest love story. At Astitva Creations, 
  we believe every couple deserves to have their love preserved in the most authentic, 
  emotional, and cinematic way possible. From the nervous excitement of getting ready, to the 
  tearful vows, to the uninhibited joy of the celebrations — we capture it all, exactly as it happens.`,
  heroSlides: [
    { imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80', description: 'Timeless Wedding Moments' },
    { imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80', description: 'Every Detail, Perfectly Captured' },
  ],
  galleryImages: [],
  ctaLabel: 'Book Your Wedding Story',
  ctaLink: '/inquire?source=wedding',
};

export default function WeddingLandingPage() {
  const { pages, fetchLandingPage } = useLandingPageStore();
  const { testimonials, fetchTestimonials } = useTestimonialStore();
  const page = pages[SLUG];
  const data = (page && (page.title || page.heroSlides?.length > 0 || page.galleryImages?.length > 0 || page.youtubeLinks?.length > 0)) ? page : FALLBACK;

  const [activeTab, setActiveTab] = useState('photos');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const photosRef = useRef(null);
  const videosRef = useRef(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoLightboxId, setVideoLightboxId] = useState(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef(null);
  const intervalRef = useRef(null);

  const slides = data.heroSlides?.length > 0 ? data.heroSlides : FALLBACK.heroSlides;

  // Touch and swipe logic
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) setCurrentSlide((p) => (p + 1) % slides.length);
    if (isRightSwipe) setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
      if (e.key === 'ArrowRight') setCurrentSlide((p) => (p + 1) % slides.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // Auto-scroll logic for galleries and parallax scroll
  useEffect(() => {
    // Parallax scroll listener
    const handleScroll = () => setParallaxY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Continuous smooth auto-scroll
    let animationId;
    let isHoveredOrActive = false;

    const setPause = () => { isHoveredOrActive = true; };
    const setResume = () => { isHoveredOrActive = false; };

    const refs = [photosRef, videosRef];
    
    refs.forEach(ref => {
      if (ref.current) {
        ref.current.addEventListener('mouseenter', setPause);
        ref.current.addEventListener('mouseleave', setResume);
        ref.current.addEventListener('touchstart', setPause, {passive: true});
        ref.current.addEventListener('touchend', setResume, {passive: true});
      }
    });

    let frameCount = 0;
    const scroll = () => {
      frameCount++;
      if (!isHoveredOrActive) {
        refs.forEach(ref => {
          if (ref.current && !ref.current.getAttribute('data-paused')) {
            const isMobile = window.innerWidth < 768;
            if (isMobile && frameCount % 2 === 0) return; // Skip every other frame on mobile
            ref.current.scrollLeft += 1;
            if (ref.current.scrollLeft >= ref.current.scrollWidth - ref.current.clientWidth - 1) {
              ref.current.scrollLeft = 0;
            }
          }
        });
      }
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.removeEventListener('mouseenter', setPause);
          ref.current.removeEventListener('mouseleave', setResume);
          ref.current.removeEventListener('touchstart', setPause);
          ref.current.removeEventListener('touchend', setResume);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleScrollCTA = () => {
      setShowStickyCTA(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScrollCTA);
    return () => window.removeEventListener('scroll', handleScrollCTA);
  }, []);

  const gallery = data?.galleryImages || [];
  const youtubeLinks = data?.youtubeLinks || [];
  const activeTestimonials = testimonials?.filter(t => t.approved === true) || [];

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
        <title>{data.title || 'Wedding Photography'} | Astitva Creations</title>
        <meta name="description" content={data.bodyText?.slice(0, 160)} />
      </Helmet>

      {/* ─── Parallax Hero Slideshow ─── */}
      <section 
        ref={heroRef} 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
              alt={slides[currentSlide]?.description || 'Wedding'}
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
            className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs lg:text-sm xl:text-base font-semibold mb-6"
          >
            Astitva Creations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] mb-6 leading-tight"
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

          {/* Slide description */}
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

          <div className="mb-4 mt-6">
            <Link
              to={(data?.ctaLink && data.ctaLink !== '/quote') ? data.ctaLink : FALLBACK.ctaLink}
              className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white hover:text-black transition-colors duration-300"
            >
              {data?.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={() => setCurrentSlide(p => (p - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 bg-black/50 hover:bg-[var(--color-gold)] text-white hover:text-black rounded-full flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8" />
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 bg-black/50 hover:bg-[var(--color-gold)] text-white hover:text-black rounded-full flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8" />
            </button>
          </>
        )}

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? 'w-6 h-1.5 bg-[var(--color-gold)]' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] mb-2 text-white font-light">Scroll</span>
          <div className="w-[1px] h-10 bg-white/20 relative overflow-hidden">
            <motion.div 
              className="w-full h-1/2 bg-[var(--color-gold)] absolute top-0"
              animate={{ top: ['-50%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Video Section ─── */}
      {data?.videoUrl && (
        <section className="py-20 bg-black">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-video rounded-lg overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] border border-[#333]"
            >
              <video 
                src={data.videoUrl}
                autoPlay 
                muted 
                loop 
                playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── About Section ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[var(--color-gold)] tracking-[0.4em] uppercase text-xs font-semibold mb-6 block">Our Approach</span>
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-8">
              More Than Just Photography
            </h2>
            <p className="text-[#A1A1A1] text-sm md:text-base leading-relaxed whitespace-pre-line">
              {data.bodyText || FALLBACK.bodyText}
            </p>
          </motion.div>
        </div>
      </section>


      {/* ─── Media Gallery (Photos) ─── */}
      {gallery.length > 0 && (
        <section className="py-20 bg-[#0B0B0B] overflow-hidden">
          <div className="w-full px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-12"
            >
              Our Portfolio
            </motion.h2>

            <div className="relative group/gallery">
              <div ref={photosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
                {gallery.map((img, i) => (
                  <div key={i} className="relative group shrink-0 w-auto h-[45vh] md:h-[50vh] lg:h-[60vh] max-h-[600px] overflow-hidden cursor-pointer bg-[#111] rounded-xl md:rounded-none" onClick={() => openLightbox(i)}>
                    <img src={getOptimizedUrl(img, 800)} alt={`Wedding ${i + 1}`} className="w-auto h-full object-cover group-hover:scale-105 transition-transform duration-700" loading={i < 4 ? 'eager' : 'lazy'} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-xs font-bold backdrop-blur-sm">View</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Why Choose Us ─── */}
      <section className="py-20 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-14"
          >
            Why Choose Astitva?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(data?.features && data.features.length > 0 ? data.features : [
              { title: 'Cinematic Vision', description: 'Every wedding film is crafted with the same care and artistry as a feature film. We don\'t just record — we direct your story.' },
              { title: 'Candid & Authentic', description: 'We blend into your celebration, capturing real emotions and genuine moments as they happen — not posed, not staged.' },
              { title: 'Timeless Delivery', description: 'Beautifully edited albums and films delivered with premium quality that you\'ll treasure for generations.' },
            ]).map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] p-8 border border-[#1a1a1a] hover:border-[var(--color-gold)]/30 transition-colors"
              >
                <div className="w-10 h-[2px] bg-[var(--color-gold)] mb-6" />
                <h3 className="font-heading text-xl text-white mb-4">{card.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{card.description || card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Special Offers ─── */}
      {data?.offers && data.offers.length > 0 && (
        <section className="py-16 bg-[#111] border-y border-[var(--color-gold)]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/icons/background.jpg')] bg-cover bg-center opacity-10 bg-fixed" />
          <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center relative z-10">
            <h2 className="font-heading text-2xl md:text-3xl text-[var(--color-gold)] mb-8">Special Offers</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {data.offers.map((offer, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-[#050505]/80 backdrop-blur-sm border border-[var(--color-gold)]/50 p-6 max-w-sm w-full shadow-[0_0_15px_rgba(212,175,55,0.15)] rounded-sm"
                >
                  <h3 className="font-heading text-xl text-white mb-2">{offer.title}</h3>
                  <p className="text-[#A1A1A1] text-sm">{offer.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Videos Section ─── */}
      {youtubeLinks.length > 0 && (
        <section className="py-20 bg-[#0B0B0B] overflow-hidden">
          <div className="w-full px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-12"
            >
              Memorable Client Stories
            </motion.h2>

            <div className="relative group/gallery">
              <div ref={videosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
                {youtubeLinks.map((link, i) => {
                  const yId = getYouTubeId(link);
                  return yId ? (
                    <div 
                      key={i} 
                      className="relative shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-video bg-[#111] border border-[#222] rounded-xl md:rounded-none overflow-hidden cursor-pointer group/vid"
                      onClick={() => setVideoLightboxId(yId)}
                    >
                      <img src={`https://img.youtube.com/vi/${yId}/maxresdefault.jpg`} alt={`Video ${i}`} className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border-2 border-white/50 group-hover/vid:border-[var(--color-gold)] transition-colors">
                          <Play className="w-8 h-8 text-white group-hover/vid:text-[var(--color-gold)] transition-colors fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
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
      <section 
        className="relative py-32 text-center border-t border-[#222] overflow-hidden bg-fixed bg-center bg-cover"
        style={{ backgroundImage: 'url(/icons/background.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/70 z-0" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto px-4"
        >
          <h2 className="font-heading text-3xl md:text-5xl text-[var(--color-gold)] mb-6 drop-shadow-lg">
            Ready to Begin Your Story?
          </h2>
          <p className="text-[#eee] text-lg leading-relaxed mb-10 drop-shadow-md">
            Let's have a conversation about your wedding day. We'd love to learn about your vision, your story, and how we can make your memories last forever.
          </p>
          <div className="mt-8 mb-4">
            <Link
              to={(data?.ctaLink && data.ctaLink !== '/quote') ? data.ctaLink : FALLBACK.ctaLink}
              className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white hover:text-black transition-colors duration-300"
            >
              {data?.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Sticky Bottom CTA ─── */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          >
            <div className="text-[var(--color-gold)] font-bold uppercase tracking-widest text-[10px] sm:text-xs bg-black/80 px-3 py-1.5 rounded-full border border-[var(--color-gold)]/30 backdrop-blur-md shadow-lg">
              Hurry, Limited Slots Available!
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Link
                to={(data?.ctaLink && data.ctaLink !== '/quote') ? data.ctaLink : FALLBACK.ctaLink}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors rounded-full shadow-[0_0_20px_rgba(177,146,71,0.4)]"
              >
                Book Now
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                alt="Wedding gallery"
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

      {/* ─── Video Lightbox ─── */}
      <AnimatePresence>
        {videoLightboxId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <button
              onClick={() => setVideoLightboxId(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoLightboxId}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
