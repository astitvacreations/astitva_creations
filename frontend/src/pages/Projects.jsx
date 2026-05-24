import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useProjectStore } from '../store/projectStore';
import { useServiceStore } from '../store/serviceStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import { Search, X, Calendar, MapPin, Film, Image as ImageIcon, ChevronLeft, ChevronRight, Play, ArrowLeft } from 'lucide-react';

export default function Projects() {
  const { projects, fetchProjects, isLoading: projectsLoading } = useProjectStore();
  const { services, fetchServices, isLoading: servicesLoading } = useServiceStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Detail Modal States
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeSubEvent, setActiveSubEvent] = useState('');
  const [mediaType, setMediaType] = useState('photos'); // 'photos' | 'videos'
  const [modalScrollY, setModalScrollY] = useState(0);

  // Lightbox States
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sync data fetch on mount
  useEffect(() => {
    fetchProjects();
    fetchServices();
  }, []);

  // Lock body scroll when overlay or lightbox is active
  useEffect(() => {
    if (selectedProject || lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedProject, lightboxImage]);

  // Safe image URL extraction helper (handles strings or Cloudinary image structures)
  const getImageUrl = (imageSource) => {
    if (!imageSource) return '';
    return typeof imageSource === 'object' ? imageSource.url : imageSource;
  };

  // Helper to resolve service details for a project
  const getProjectService = (project) => {
    const serviceId = project.serviceId?._id || project.serviceId;
    return services.find(s => s._id === serviceId);
  };

  // Helper to determine sub-events for a project based on its service type
  const getSubEventsList = (project) => {
    if (!project) return [];
    const service = getProjectService(project);
    const slug = (service?.slug || '').toLowerCase();
    
    if (slug.includes('wedding') && !slug.includes('pre-wedding')) {
      return ['Engagement', 'Haldi', 'Sangeet', 'Wedding', 'Reception'];
    } else if (slug.includes('pre-wedding')) {
      return ['Promo', 'Cinematic Portrait', 'Golden Hour', 'Behind The Scenes'];
    } else if (slug.includes('half-saree')) {
      return ['Pooja', 'Draped Ceremony', 'Portraits', 'Celebrations'];
    }
    return ['Main Event', 'Portraits', 'Behind The Scenes'];
  };

  // Reset detail states upon opening a project
  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setMediaType('photos');
    setLightboxImage(null);
    setModalScrollY(0);
    const subEvts = project.tags && project.tags.length > 0
      ? project.tags
      : getSubEventsList(project);
    setActiveSubEvent(subEvts[0] || 'Main Event');
  };

  // Filter project records based on search keywords & active category filter
  const filteredProjects = projects.filter(project => {
    // Search by event owner name / couple name (stored in title)
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase());

    // Filter by service category
    if (selectedCategory === 'ALL') return matchesSearch;

    const projectService = getProjectService(project);
    const serviceSlug = projectService?.slug || '';
    return matchesSearch && (serviceSlug.toLowerCase() === selectedCategory.toLowerCase());
  });

  // Calculate media lists for the selected sub-event inside detailed view
  const subEvents = selectedProject?.tags && selectedProject.tags.length > 0
    ? selectedProject.tags
    : getSubEventsList(selectedProject);
  const activeSubEventIndex = subEvents.indexOf(activeSubEvent);

  const getMediaForSubEvent = () => {
    if (!selectedProject) return { photos: [], videos: [] };
    const allImages = (selectedProject.images || []).filter(img => img && img.category !== 'General');
    const allVideos = selectedProject.videoUrls || [];
    const partitionCount = subEvents.length || 1;
    const subIdx = activeSubEventIndex !== -1 ? activeSubEventIndex : 0;

    let photos = [];
    if (allImages.length > 0) {
      const matchedImages = allImages.filter(img => img && img.category === activeSubEvent);
      if (matchedImages.length > 0) {
        photos = matchedImages;
      } else {
        const hasCategorizedImages = allImages.some(img => img && img.category && img.category !== 'General');
        if (!hasCategorizedImages) {
          const partition = allImages.filter((_, idx) => idx % partitionCount === subIdx);
          photos = partition.length > 0 ? partition : [allImages[0]];
        }
      }
    }

    let videos = [];
    if (allVideos.length > 0) {
      const parsedVideos = allVideos.map(v => {
        if (v.includes('|')) {
          const parts = v.split('|');
          return { category: parts[0], url: parts[1] };
        }
        return { category: 'General', url: v };
      });

      const matchedVideos = parsedVideos
        .filter(v => v.category === activeSubEvent)
        .map(v => v.url);
      
      if (matchedVideos.length > 0) {
        videos = matchedVideos;
      } else {
        const hasCategorizedVideos = parsedVideos.some(v => v.category && v.category !== 'General');
        if (!hasCategorizedVideos) {
          const partition = allVideos
            .filter((_, idx) => idx % partitionCount === subIdx)
            .map(v => v.includes('|') ? v.split('|')[1] : v);
          if (partition.length === 0 && subIdx === 0 && allVideos.length > 0) {
            const firstVideo = allVideos[0];
            videos = [firstVideo.includes('|') ? firstVideo.split('|')[1] : firstVideo];
          } else {
            videos = partition;
          }
        }
      }
    }

    return { photos, videos };
  };

  const { photos: activePhotos, videos: activeVideos } = getMediaForSubEvent();

  // YouTube URL to embed link converter
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const nextLightboxImage = (e) => {
    if (e) e.stopPropagation();
    if (!activePhotos.length) return;
    const newIdx = (lightboxIndex + 1) % activePhotos.length;
    setLightboxIndex(newIdx);
    setLightboxImage(getImageUrl(activePhotos[newIdx]));
  };

  const prevLightboxImage = (e) => {
    if (e) e.stopPropagation();
    if (!activePhotos.length) return;
    const newIdx = (lightboxIndex - 1 + activePhotos.length) % activePhotos.length;
    setLightboxIndex(newIdx);
    setLightboxImage(getImageUrl(activePhotos[newIdx]));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxImage) return;
      if (e.key === 'Escape') setLightboxImage(null);
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxIndex, activePhotos]);

  return (
    <>
      <Helmet>
        <title>Portfolio | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          {/* Header */}
          <div className="mb-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6 uppercase tracking-wider"
              >
              Our Projects
            </motion.h1>
            <p className="text-[#A1A1A1] max-w-2xl mx-auto text-sm tracking-wide leading-relaxed">
              Explore our complete range of cinematic storytelling. Filter by category or search by event name.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mb-12 flex flex-col md:flex-row gap-6 justify-between items-center bg-[#111] p-3 border border-[#222] rounded-sm">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input 
                type="text" 
                placeholder="Search event owner name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222] pl-10 pr-4 py-2.5 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
              />
            </div>

            {/* Horizontal Filter Tabs */}
            <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                  selectedCategory === 'ALL'
                    ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                    : 'bg-transparent text-[#A1A1A1] border-[#222] hover:border-[var(--color-gold)] hover:text-white'
                }`}
              >
                All
              </button>
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => setSelectedCategory(service.slug)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${
                    selectedCategory === service.slug
                      ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                      : 'bg-transparent text-[#A1A1A1] border-[#222] hover:border-[var(--color-gold)] hover:text-white'
                  }`}
                >
                  {service.title}
                </button>
              ))}
            </div>
          </div>

          {/* Flat Grid Listing - Vertical Thumbnails */}
          {projectsLoading || servicesLoading ? (
            <div className="text-center py-20 uppercase tracking-widest text-[#A1A1A1] text-xs">Loading Masterpieces...</div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => {
                const projectService = getProjectService(project);
                const coverImg = getImageUrl(project.coverImage || project.images?.[0]);
                const coverImgPos = typeof project.coverImage === 'object' ? project.coverImage?.position || 'center' : 'center';

                return (
                  <motion.div
                    key={project._id}
                    onClick={() => openProjectDetails(project)}
                    className="group relative overflow-hidden bg-[#111] border border-[#222] cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
                  >
                    {/* Portrait vertical image box */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <img 
                        src={getOptimizedUrl(coverImg, 800)} 
                        alt={project.title} 
                        style={{ objectPosition: coverImgPos }}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        loading={index < 6 ? "eager" : "lazy"}
                      />
                      {/* Gradient Shadow Mask */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
                      
                      {/* Event overlay contents */}
                      <div className="absolute bottom-0 left-0 w-full p-6 transition-transform duration-300">
                        <span className="text-[var(--color-gold)] text-[10px] uppercase tracking-[0.2em] font-semibold mb-2 block">
                          {projectService?.title || 'Event Feature'}
                        </span>
                        <h3 className="font-heading text-xl md:text-2xl text-white mb-2 line-clamp-1">{project.title}</h3>
                        
                        <div className="flex gap-4 text-[10px] text-gray-400 uppercase tracking-wider mt-2 border-t border-white/10 pt-3">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[var(--color-gold)]" /> {project.location}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[var(--color-gold)]" /> {project.date ? new Date(project.date).getFullYear() : ''}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-[#A1A1A1] py-20 uppercase tracking-widest text-xs border border-[#222] bg-[#111]">
              No events found matching your filter constraints.
            </div>
          )}

        </div>
      </div>

      {/* Dynamic Sub-Event Detailed Modal View Overlay */}
      <AnimatePresence>
        {selectedProject && (() => {
          const bannerImage = selectedProject.mainImage?.url || selectedProject.coverImage?.url || getImageUrl(selectedProject.images?.[0]);
          const bannerPosition = selectedProject.mainImage?.position || selectedProject.coverImage?.position || 'center';

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0B0B0B] overflow-y-auto"
              onScroll={(e) => setModalScrollY(e.currentTarget.scrollTop)}
            >
              {/* Header Hero Area */}
              <div className="relative h-[65vh] w-full bg-[#0a0a0a] overflow-hidden">
                <img 
                  src={getOptimizedUrl(bannerImage, 1920)} 
                  alt="Banner Hero" 
                  style={{ 
                    transform: `translateY(${modalScrollY * 0.35}px)`,
                    objectPosition: bannerPosition 
                  }}
                  className="w-full h-full object-cover opacity-40 transition-transform duration-75 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-black/50"></div>
                
                {/* Back Button */}
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 left-6 md:left-12 flex items-center gap-2 text-white/70 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors bg-black/40 backdrop-blur-sm px-4 py-2 border border-white/10 rounded-sm z-10"
                >
                  <ArrowLeft className="w-4 h-4 text-[var(--color-gold)]" /> Back to Portfolio
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 right-6 md:right-12 text-white/50 hover:text-white transition-colors bg-black/40 backdrop-blur-sm p-2 border border-white/10 rounded-sm z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Captions */}
                <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-10 max-w-4xl z-10">
                  <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] font-bold block mb-2">
                    {getProjectService(selectedProject)?.title}
                  </span>
                  <h2 className="font-heading text-4xl md:text-6xl text-white font-normal uppercase leading-tight mb-4">
                    {selectedProject.title}
                  </h2>
                  <div className="flex flex-wrap gap-6 text-xs text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--color-gold)]" /> {selectedProject.location}</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" /> 
                      {selectedProject.date ? new Date(selectedProject.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Details Area */}
              <div className="max-w-6xl mx-auto px-6 md:px-12 pt-6 pb-12">
                {/* Narrative Section - Centered and Elegant (no heading) */}
                {selectedProject.description && (
                  <div className="text-center max-w-3xl mx-auto mb-8 px-4">
                    <p className="text-gray-300 text-lg md:text-xl font-light italic leading-relaxed tracking-wide whitespace-pre-wrap">
                      "{selectedProject.description}"
                    </p>
                    <div className="w-12 h-[1px] bg-[var(--color-gold)] mx-auto mt-4"></div>
                  </div>
                )}
                
                {/* Single Select Sub-Event Chapters - Horizontal (no heading) & Media Type Selectors */}
                <div className="border-b border-[#222] pb-10 mb-10 flex flex-col items-center gap-8">
                  {/* Chapter Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {subEvents.map((subEvt) => (
                      <button
                        key={subEvt}
                        onClick={() => {
                          setActiveSubEvent(subEvt);
                          setLightboxImage(null);
                        }}
                        className={`px-5 py-3 text-[10px] uppercase tracking-widest font-bold border transition-all rounded-sm flex items-center gap-2 ${
                          activeSubEvent === subEvt
                            ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_15px_rgba(177,146,71,0.2)]'
                            : 'bg-transparent text-gray-300 border-[#222] hover:border-[var(--color-gold)] hover:text-white'
                        }`}
                      >
                        <span>{subEvt}</span>
                        {activeSubEvent === subEvt && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </button>
                    ))}
                  </div>

                  {/* Photos & Videos Segmented Control */}
                  <div className="flex justify-center bg-[#0a0a0a] p-1 border border-[#222] rounded-sm">
                    <button
                      onClick={() => setMediaType('photos')}
                      className={`px-6 py-2.5 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm flex items-center gap-2 ${
                        mediaType === 'photos'
                          ? 'bg-[var(--color-gold)] text-black font-extrabold shadow-md'
                          : 'bg-transparent text-[#A1A1A1] hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Photos
                    </button>
                    <button
                      onClick={() => setMediaType('videos')}
                      className={`px-6 py-2.5 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm flex items-center gap-2 ${
                        mediaType === 'videos'
                          ? 'bg-[var(--color-gold)] text-black font-extrabold shadow-md'
                          : 'bg-transparent text-[#A1A1A1] hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      Videos
                    </button>
                  </div>
                </div>

                {/* Dynamic Media Gallery - Display single selected option of the event */}
                <div className="space-y-12">
                  {mediaType === 'videos' && (
                    <div className="space-y-6">
                      {activeVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {activeVideos.map((url, idx) => (
                            <div key={idx} className="bg-[#111] border border-[#222] p-3 rounded-sm">
                              <div className="relative aspect-video w-full bg-black">
                                <iframe 
                                  src={getEmbedUrl(url)} 
                                  className="w-full h-full border-0" 
                                  allowFullScreen 
                                  title={`${activeSubEvent} video ${idx + 1}`}
                                />
                              </div>
                              <div className="mt-4 px-2">
                                <h5 className="font-heading text-lg text-white mb-1 uppercase tracking-wider">{selectedProject.title}</h5>
                                <p className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-semibold">{activeSubEvent} Highlight</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-gray-500 uppercase tracking-widest text-[10px] border border-dashed border-[#333] bg-[#111]/40">
                          No cinematic highlights available for the {activeSubEvent} chapter of this story.
                        </div>
                      )}
                    </div>
                  )}

                  {mediaType === 'photos' && (
                    <div className="space-y-6">
                      {activePhotos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activePhotos.map((img, idx) => {
                            const finalUrl = getImageUrl(img);
                            return (
                              <div 
                                key={idx}
                                onClick={() => {
                                  setLightboxIndex(idx);
                                  setLightboxImage(finalUrl);
                                }}
                                className="relative group overflow-hidden bg-[#111] border border-[#222] cursor-pointer"
                              >
                                <img 
                                  src={getOptimizedUrl(finalUrl, 800)} 
                                  alt={`${activeSubEvent} media ${idx + 1}`} 
                                  className="w-full h-64 md:h-80 object-cover opacity-95 group-hover:scale-105 group-hover:opacity-100 transition-transform duration-700 pointer-events-none"
                                  loading={idx < 4 ? "eager" : "lazy"}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <span className="text-[var(--color-gold)] border border-[var(--color-gold)] px-6 py-2 uppercase tracking-widest text-[9px] font-bold bg-black/60 backdrop-blur-sm rounded-sm">View Canvas</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-gray-500 uppercase tracking-widest text-[10px] border border-dashed border-[#333] bg-[#111]/40">
                          No photo assets available for the {activeSubEvent} chapter of this story.
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            {/* Close Button */}
            <button 
              onClick={() => setLightboxImage(null)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10"
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* Nav Arrows */}
            {activePhotos.length > 1 && (
              <button 
                onClick={prevLightboxImage} 
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all border border-white/5"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Display Box */}
            <div className="relative flex items-center justify-center w-full h-full max-w-[90vw] max-h-[85vh]">
                <motion.img 
                key={lightboxImage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                src={getOptimizedUrl(lightboxImage, 1920)} 
                alt="Enlarged project media" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-auto cursor-grab active:cursor-grabbing shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -50) nextLightboxImage();
                  else if (swipe > 50) prevLightboxImage();
                }}
              />
            </div>

            {activePhotos.length > 1 && (
              <button 
                onClick={nextLightboxImage} 
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all border border-white/5"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Footer index banner */}
            {activePhotos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold bg-black/60 px-4 py-2 border border-white/5 rounded-sm">
                {lightboxIndex + 1} / {activePhotos.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
