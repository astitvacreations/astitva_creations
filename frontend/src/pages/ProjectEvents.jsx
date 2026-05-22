import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { useServiceStore } from '../store/serviceStore';
import { useProjectStore } from '../store/projectStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { ArrowLeft, X } from 'lucide-react';

export default function ProjectEvents() {
  const { serviceSlug } = useParams();
  const { services } = useServiceStore();
  const { projects } = useProjectStore();

  const [activeVideos, setActiveVideos] = useState(null);

  // Safe image URL extraction helper (handles strings or coverImage object structures)
  const getImageUrl = (imageSource) => {
    if (!imageSource) return '';
    return typeof imageSource === 'object' ? imageSource.url : imageSource;
  };

  const service = services.find(s => s.slug === serviceSlug);
  const serviceEvents = projects.filter(p => (p.serviceId?._id || p.serviceId) === service?._id);

  const getEmbedUrl = (url) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (!service) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B] text-center text-white">
        <h1 className="text-2xl font-heading text-[var(--color-gold)] mb-4">Service Not Found</h1>
        <Link to="/projects" className="text-[#A1A1A1] hover:text-white underline">Back to Projects</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{service.title} Events | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <Link to="/projects" className="inline-flex items-center gap-2 text-[#A1A1A1] hover:text-white transition-colors mb-8 text-sm uppercase tracking-widest font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>

          <div className="mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6"
            >
              {service.title} Events
            </motion.h1>
            <p className="text-[#A1A1A1] max-w-2xl">{service.description}</p>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceEvents.map((event, index) => {
              const coverImg = getImageUrl(event.coverImage || event.images?.[0]);
              const coverImgPos = typeof event.coverImage === 'object' ? event.coverImage?.position || 'center' : 'center';

              return (
              <div
                key={event._id}
                className="group relative overflow-hidden bg-[#111] border border-[#222] cursor-pointer animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.1, 0.3)}s`, animationFillMode: 'both' }}
              >
                <Link to={`/projects/${service.slug}/${event.slug}`}>
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <img 
                      src={getOptimizedUrl(coverImg, 1600)} 
                      alt={event.title} 
                      style={{ objectPosition: coverImgPos }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index < 4 ? "high" : "auto"}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300"></div>
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.2em] mb-2">{new Date(event.date).toLocaleDateString()}</span>
                      <h3 className="font-heading text-2xl text-white mb-2">{event.title}</h3>
                      <p className="text-[#A1A1A1] text-xs leading-relaxed line-clamp-2 mb-4">{event.description || 'No description provided.'}</p>
                      
                      <div className="flex justify-between items-center border-t border-[#333] pt-4">
                        <Link to={`/projects/${service.slug}/${event.slug}`} className="text-white text-[10px] uppercase tracking-widest font-bold border-b border-[var(--color-gold)] pb-0.5 hover:text-[var(--color-gold)] transition-colors">
                          View Gallery
                        </Link>
                        
                        {(event.videoUrls && event.videoUrls.length > 0) && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveVideos(event.videoUrls);
                            }}
                            className="flex items-center gap-1.5 text-[white] text-[10px] uppercase tracking-widest font-bold border-b border-[var(--color-gold)] pb-0.5 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 rounded-full border border-[var(--color-gold)] flex items-center justify-center pt-0 pl-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </span>
                            {event.videoUrls.length > 1 ? 'View Videos' : 'View Video'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
            })}
          </div>

          {serviceEvents.length === 0 && (
            <div className="text-center text-[#A1A1A1] py-20 uppercase tracking-widest">No events found for this service.</div>
          )}

        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideos && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          >
            <button 
              onClick={() => setActiveVideos(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-10 h-10" />
            </button>

            <div className="w-full max-w-6xl max-h-full overflow-y-auto space-y-12 py-10 px-4">
              <h2 className="font-heading text-3xl md:text-5xl text-[var(--color-gold)] text-center mb-16 uppercase tracking-[0.2em]">Cinematic Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {activeVideos.map((url, idx) => (
                  <div key={idx} className="relative aspect-video w-full bg-black shadow-2xl border border-white/10">
                    <iframe 
                      src={getEmbedUrl(url)} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title={`Video ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
