import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { X, ChevronLeft, ChevronRight, ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import { useServiceStore } from '../store/serviceStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { getYouTubeId } from '../utils/youtube';

export default function ServiceGallery() {
  const { serviceSlug } = useParams();
  const { services } = useServiceStore();

  const service = services.find((s) => s.slug === serviceSlug);

  const [activeTab, setActiveTab] = useState('images'); // 'images' | 'videos'
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const heroRef = useRef(null);

  // Parallax on hero
  // Parallax removed to fix jumping issue on scroll
  useEffect(() => {
    // Left empty to prevent jumping
  }, []);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'ArrowLeft') prevImage(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, activeTab]);

  // Disable right click
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setSelectedImage(service.images[index]);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % service.images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(service.images[newIndex]);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + service.images.length) % service.images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(service.images[newIndex]);
  };

  const heroSlidesCount = service?.heroImages?.length > 0 
    ? service.heroImages.length 
    : 1;

  // Auto-advance hero slides every 5 seconds
  useEffect(() => {
    if (!service || heroSlidesCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % heroSlidesCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [service, heroSlidesCount]);

  if (!service) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B] text-center">
        <h1 className="text-white text-2xl font-heading mb-4">Service Not Found</h1>
        <Link to="/services" className="text-[var(--color-gold)] hover:underline uppercase tracking-widest text-sm">
          Return to Services
        </Link>
      </div>
    );
  }

  const heroSlides = service.heroImages && service.heroImages.length > 0
    ? service.heroImages
    : [{ url: service.heroImage || service.coverImage, position: service.coverImagePosition || '50% 50%' }];
  const videos = service.videos || [];

  const nextHero = (e) => {
    e.stopPropagation();
    setCurrentHeroIdx((prev) => (prev + 1) % heroSlides.length);
  };

  const prevHero = (e) => {
    e.stopPropagation();
    setCurrentHeroIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <>
      <Helmet>
        <title>{service.title} | Astitva Creations</title>
        <meta name="description" content={service.description} />
      </Helmet>

      {/* ─── Parallax Hero ─── */}
      <section
        ref={heroRef}
        className="relative h-[70vh] min-h-[400px] flex items-end overflow-hidden"
      >
        {/* Parallax background (Slideshow) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={currentHeroIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              src={getOptimizedUrl(heroSlides[currentHeroIdx].url, 1920)}
              alt={`${service.title} Hero slide ${currentHeroIdx + 1}`}
              style={{
                objectPosition: heroSlides[currentHeroIdx].position || '50% 50%',
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              loading="eager"
            />
          </AnimatePresence>
        </div>

        {/* Overlays to ensure text readability without ruining image quality */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" style={{ zIndex: 1 }} />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent pointer-events-none" style={{ zIndex: 1 }} />
        
        {/* Hero Slideshow Navigation */}
        {heroSlides.length > 1 && (
          <>
            <button
              onClick={prevHero}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-[var(--color-gold)] transition-colors"
              aria-label="Previous Hero Image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={nextHero}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-[var(--color-gold)] transition-colors"
              aria-label="Next Hero Image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            
            {/* Dot indicators */}
            <div className="absolute bottom-8 right-6 lg:right-16 flex gap-2 z-20">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentHeroIdx(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentHeroIdx
                      ? 'w-6 h-1.5 bg-[var(--color-gold)]'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to hero slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Text content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-[#A1A1A1] hover:text-[var(--color-gold)] uppercase tracking-widest text-xs mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Services
            </Link>
            <h1 className="font-heading text-4xl md:text-6xl mb-4 text-white drop-shadow-2xl">
              {service.title}
            </h1>
            {service.heroDescription && (
              <p className="text-white/70 max-w-2xl text-sm md:text-base leading-relaxed italic">
                {service.heroDescription}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── Description ─── */}
      <div className="bg-[#0B0B0B] py-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <p className="text-[#A1A1A1] max-w-3xl text-sm leading-relaxed">{service.description}</p>
        </div>
      </div>

      {/* ─── Tab Buttons ─── */}
      <div className="sticky top-[80px] lg:top-[96px] z-40 bg-[#0B0B0B] border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex gap-0 justify-center md:justify-start">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-8 py-4 uppercase tracking-widest text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'images'
                ? 'text-[var(--color-gold)] border-[var(--color-gold)]'
                : 'text-[#555] border-transparent hover:text-[#A1A1A1]'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Images
            <span className="text-[#555] font-normal">({(service.images || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-8 py-4 uppercase tracking-widest text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'videos'
                ? 'text-[var(--color-gold)] border-[var(--color-gold)]'
                : 'text-[#555] border-transparent hover:text-[#A1A1A1]'
            }`}
          >
            <Video className="w-4 h-4" /> Videos
            <span className="text-[#555] font-normal">({videos.length})</span>
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="min-h-[60vh] pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-10">

          {/* Images Tab */}
          {activeTab === 'images' && (
            <>
              {service.images && service.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {service.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative group overflow-hidden break-inside-avoid cursor-pointer bg-[#111] animate-slide-up aspect-[4/5] sm:aspect-[3/4]"
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s`, animationFillMode: 'both' }}
                      onClick={() => openLightbox(index)}
                    >
                      <img
                        src={getOptimizedUrl(img, 800)}
                        alt={`${service.title} highlight ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-xs font-bold bg-black/50 backdrop-blur-sm">
                          View
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-30 font-heading text-sm text-white pointer-events-none select-none drop-shadow-md">
                        Astitva
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#A1A1A1] py-20 uppercase tracking-widest text-sm">
                  No images available for this service yet.
                </div>
              )}
            </>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {videos.map((videoUrl, index) => {
                     const yId = getYouTubeId(videoUrl);
                     return (
                       <motion.div
                         key={index}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: index * 0.08 }}
                         className="bg-[#111] border border-[#1a1a1a] overflow-hidden group shadow-lg"
                       >
                         <div className="aspect-video bg-black">
                           {yId ? (
                             <iframe
                               src={`https://www.youtube.com/embed/${yId}`}
                               title={`Video ${index + 1}`}
                               className="w-full h-full border-0"
                               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                               allowFullScreen
                             />
                           ) : (
                             <video
                               src={videoUrl}
                               controls
                               preload="metadata"
                               className="w-full h-full object-cover"
                               controlsList="nodownload"
                             >
                               Your browser does not support the video tag.
                             </video>
                           )}
                         </div>
                         <div className="p-4 flex justify-between items-center bg-[#111] border-t border-[#1a1a1a]">
                           <span className="text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5">
                             <Video className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Video {index + 1}
                           </span>
                           {yId && (
                             <span className="text-[#555] text-[10px] uppercase tracking-widest font-bold">
                               YouTube Embed
                             </span>
                           )}
                         </div>
                       </motion.div>
                     );
                   })}
                </div>
              ) : (
                <div className="text-center text-[#A1A1A1] py-20 uppercase tracking-widest text-sm">
                  No videos available for this service yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute top-6 right-6 text-[#A1A1A1] hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>

            {service.images.length > 1 && (
              <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full transition-all">
                <ChevronLeft className="w-10 h-10" />
              </button>
            )}

            <div className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]">
              <img
                src={getOptimizedUrl(selectedImage, 800)}
                alt="placeholder"
                className="w-full h-full object-contain pointer-events-none opacity-50 blur-xl scale-95 transition-opacity duration-500"
              />
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                src={getOptimizedUrl(selectedImage, 1920)}
                alt="Lightbox view"
                className="absolute inset-0 w-full h-full object-contain pointer-events-auto shadow-2xl cursor-grab active:cursor-grabbing"
                decoding="async"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -50) nextImage(e);
                  else if (swipe > 50) prevImage(e);
                }}
              />
            </div>

            {service.images.length > 1 && (
              <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full transition-all">
                <ChevronRight className="w-10 h-10" />
              </button>
            )}

            {service.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#A1A1A1] uppercase tracking-widest text-sm">
                {currentIndex + 1} / {service.images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
