import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useServiceStore } from '../store/serviceStore';
import { getOptimizedUrl } from '../utils/cloudinary';

export default function EventGallery() {
  const { serviceSlug, eventSlug } = useParams();
  const { projects } = useProjectStore();
  const { services } = useServiceStore();
  
  const project = projects.find(p => p.slug === eventSlug);
  const service = project ? services.find(s => s._id === (project.serviceId?._id || project.serviceId)) : null;
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Disable right click to prevent easy downloading
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
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
  }, [selectedImage, currentIndex]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setSelectedImage(project.images[index]);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % project.images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(project.images[newIndex]);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + project.images.length) % project.images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(project.images[newIndex]);
  };

  if (!project) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B] text-center">
        <h1 className="text-white text-2xl font-heading mb-4">Event Not Found</h1>
        <Link to="/projects" className="text-[var(--color-gold)] hover:underline uppercase tracking-widest text-sm">Return to Projects</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{project.title} | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <Link to={`/projects/${serviceSlug}`} className="inline-flex items-center gap-2 text-[#A1A1A1] hover:text-[var(--color-gold)] uppercase tracking-widest text-xs mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to {service?.title || 'Projects'}
          </Link>

          <div className="mb-16 border-b border-[#222] pb-12">
            <span className="text-[var(--color-gold)] uppercase tracking-[0.3em] text-sm font-semibold">{service?.title}</span>
            <h1 className="font-heading text-5xl md:text-7xl mt-4 mb-6">{project.title}</h1>
            <div className="flex flex-wrap gap-6 text-[#A1A1A1] uppercase tracking-widest text-xs">
              <span className="border-r border-[#333] pr-6">{project.date ? new Date(project.date).toLocaleDateString() : ''}</span>
              <span>{project.location}</span>
            </div>
          </div>

          {/* Left-to-Right Natural Gallery Grid */}
          {project.images && project.images.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
              {project.images.map((img, index) => (
                <div 
                  key={index}
                  className="relative group overflow-hidden bg-[#111] border border-[#222] cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s`, animationFillMode: 'both' }}
                  onClick={() => openLightbox(index)}
                >
                  <img 
                    src={getOptimizedUrl(img, 800)} 
                    alt={`Gallery image ${index + 1}`} 
                    className="w-full h-auto object-cover opacity-100 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index < 4 ? "high" : "auto"}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-xs font-bold bg-black/50 backdrop-blur-sm">View Full Screen</span>
                  </div>
                  {/* Subtle Watermark */}
                  <div className="absolute bottom-4 right-4 opacity-30 font-heading text-xl text-white pointer-events-none select-none drop-shadow-md">
                    Astitva
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#A1A1A1] py-12 uppercase tracking-widest text-sm">
              No images available for this event.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
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
            
            {project.images.length > 1 && (
              <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full transition-all">
                <ChevronLeft className="w-10 h-10" />
              </button>
            )}

            <div className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]">
              {/* Cached low-res placeholder (Relative to provide instant layout dimensions) */}
              <img 
                src={getOptimizedUrl(selectedImage, 800)} 
                alt="placeholder" 
                className="w-full h-full object-contain pointer-events-none opacity-50 blur-xl scale-95 transition-opacity duration-500" 
              />
              {/* High-res image (Absolute to overlay) */}
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

            {project.images.length > 1 && (
              <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-[#A1A1A1] hover:text-white hover:bg-[#111] rounded-full transition-all">
                <ChevronRight className="w-10 h-10" />
              </button>
            )}

            {project.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#A1A1A1] uppercase tracking-widest text-sm">
                {currentIndex + 1} / {project.images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
