import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLandingPageStore } from '../store/landingPageStore';
import { getOptimizedUrl } from '../utils/cloudinary';

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
  const page = pages[SLUG];
  const data = (page && (page.title || page.heroSlides?.length > 0)) ? page : FALLBACK;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const heroRef = useRef(null);
  const intervalRef = useRef(null);

  const slides = data.heroSlides?.length > 0 ? data.heroSlides : FALLBACK.heroSlides;
  const gallery = data.galleryImages || [];

  useEffect(() => { fetchLandingPage(SLUG); }, []);

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
              src={slides[currentSlide]?.imageUrl}
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

          <Link
            to={data.ctaLink || '/quote'}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors"
          >
            {data.ctaLabel || FALLBACK.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Slide dots */}
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
            {[
              { title: 'Cinematic Vision', desc: 'Every wedding film is crafted with the same care and artistry as a feature film. We don\'t just record — we direct your story.' },
              { title: 'Candid & Authentic', desc: 'We blend into your celebration, capturing real emotions and genuine moments as they happen — not posed, not staged.' },
              { title: 'Timeless Delivery', desc: 'Beautifully edited albums and films delivered with premium quality that you\'ll treasure for generations.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] p-8 border border-[#1a1a1a] hover:border-[var(--color-gold)]/30 transition-colors"
              >
                <div className="w-10 h-[2px] bg-[var(--color-gold)] mb-6" />
                <h3 className="font-heading text-xl text-white mb-4">{card.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery ─── */}
      {gallery.length > 0 && (
        <section className="py-20 bg-[#0B0B0B]">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-12"
            >
              Wedding Gallery
            </motion.h2>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {gallery.map((img, i) => (
                <div
                  key={i}
                  className="relative group overflow-hidden break-inside-avoid cursor-pointer bg-[#111]"
                  onClick={() => openLightbox(i)}
                >
                  <img
                    src={getOptimizedUrl(img, 800)}
                    alt={`Wedding ${i + 1}`}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                    loading={i < 4 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-xs font-bold backdrop-blur-sm">View</span>
                  </div>
                </div>
              ))}
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
            Ready to Begin Your Story?
          </h2>
          <p className="text-[#A1A1A1] text-sm leading-relaxed mb-10">
            Let's have a conversation about your wedding day. We'd love to learn about your vision, your story, and how we can make your memories last forever.
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
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                src={getOptimizedUrl(selectedImage, 1600)}
                alt="Wedding gallery"
                className="w-full h-full object-contain shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
