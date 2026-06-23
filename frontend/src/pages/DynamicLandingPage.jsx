import { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Star, Heart, Play, MapPin, Navigation, Calendar, Clock, Gift, X, CheckCircle } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { useLeadStore } from '../store/leadStore';
import { useBookingModalStore } from '../store/bookingModalStore';
import { Pannellum } from 'pannellum-react';

const ServiceCard = ({ service, index, textAlign = 'text-center' }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    let interval;
    if (service.images && service.images.length > 1) {
      const startDelay = setTimeout(() => {
        interval = setInterval(() => {
          setIsTransitioning(true);
          setCurrentIdx((prev) => prev + 1);
        }, 3000);
      }, index * 500);
      
      return () => {
        clearTimeout(startDelay);
        clearInterval(interval);
      };
    }
  }, [service.images, index]);

  useEffect(() => {
    if (service.images && currentIdx === service.images.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIdx(0);
      }, 500); 
      return () => clearTimeout(timeout);
    }
  }, [currentIdx, service.images]);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart || !service.images || service.images.length <= 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    
    if (touchStart - touchEnd > 50) { 
      if (currentIdx >= service.images.length) return;
      setIsTransitioning(true);
      setCurrentIdx((p) => p + 1);
    }
    if (touchStart - touchEnd < -50) { 
      if (currentIdx === 0) {
        setIsTransitioning(false);
        setCurrentIdx(service.images.length);
        setTimeout(() => {
          setIsTransitioning(true);
          setCurrentIdx(service.images.length - 1);
        }, 50);
      } else {
        setIsTransitioning(true);
        setCurrentIdx((p) => p - 1);
      }
    }
  };

  const nextImg = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    if (currentIdx >= service.images.length) return;
    setIsTransitioning(true);
    setCurrentIdx((p) => p + 1); 
  };
  
  const prevImg = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    if (currentIdx === 0) {
      setIsTransitioning(false);
      setCurrentIdx(service.images.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIdx(service.images.length - 1);
      }, 50);
    } else {
      setIsTransitioning(true);
      setCurrentIdx((p) => p - 1); 
    }
  };

  if (!service.images || service.images.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="bg-[#111] rounded-2xl overflow-hidden border border-[#222] hover:border-[var(--color-gold)]/40 transition-colors flex flex-col group relative"
    >
      <div className="relative h-72 md:h-[22rem] overflow-hidden bg-black">
        <div 
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`} 
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {[...service.images, service.images[0]].map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`${service.title} - ${idx + 1}`} 
              className="w-full h-full object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
            />
          ))}
        </div>
        
        {service.images.length > 1 && (
          <>
            <button 
              onClick={prevImg} 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[var(--color-gold)] hover:text-black border border-white/20 hover:border-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={nextImg} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[var(--color-gold)] hover:text-black border border-white/20 hover:border-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-90 pointer-events-none" />
      </div>

      <div className={`p-6 lg:p-8 flex-grow flex flex-col relative z-20 -mt-16 ${textAlign}`}>
        <span className="text-[#A1A1A1] uppercase tracking-[0.2em] text-[10px] md:text-xs font-semibold mb-2">{service.label}</span>
        <h3 className="font-heading text-xl md:text-2xl text-white mb-3 uppercase leading-snug">{service.title}</h3>
        <p className="text-[#888] text-sm md:text-base leading-relaxed font-light">{service.description}</p>
      </div>
    </motion.div>
  );
};

export default function DynamicLandingPage({ fallbackSlug }) {
  const { slug } = useParams();
  const activeSlug = slug || fallbackSlug;
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addLead } = useLeadStore();
  const { isOpen: showBookingForm, openModal: setShowBookingForm, closeModal } = useBookingModalStore();
  const [showThankYou, setShowThankYou] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '' });
  const [activeVideo, setActiveVideo] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      try { videoId = new URLSearchParams(new URL(url).search).get('v'); } catch {}
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
    } else if (url.includes('vimeo.com/')) {
      videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url; 
  };

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      try { videoId = new URLSearchParams(new URL(url).search).get('v'); } catch {}
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || (lowerUrl.includes('res.cloudinary.com') && lowerUrl.includes('/video/upload'));
  };

  const photosRef = useRef(null);
  const videosRef = useRef(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/landing-pages/${activeSlug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch landing page data');
        }
        const data = await response.json();
        setPageData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeSlug) {
      fetchPage();
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!pageData) return;
    
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
          if (ref.current) {
            const isMobile = window.innerWidth < 768;
            if (isMobile && frameCount % 2 === 0) return; 
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
  }, [pageData]);

  if (loading) return <LoadingScreen isFallback={true} />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-white">Error loading page: {error}</div>;
  if (!pageData) return <div className="min-h-screen flex items-center justify-center text-white">Page not found</div>;

  const { visibility, alignments, hero, vr360View, introVideo, approach, whatWeDoBest, bestClicks, whyLoveUs, comfort, weddingFilms, packages, finalCta } = pageData;

  const handleCtaClick = (e, link) => {
    if (link === '/quote' || !link) {
      e.preventDefault();
      setShowBookingForm(true);
      setShowThankYou(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addLead({
        customerName: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        source: `${pageData.title} Landing Page`
      });
      setShowThankYou(true);
      setBookingForm({ name: '', email: '', phone: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAlignClass = (align) => {
    switch(align) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center mx-auto';
    }
  };
  
  const getFlexAlignClass = (align) => {
    switch(align) {
      case 'left': return 'items-start';
      case 'right': return 'items-end';
      case 'center':
      default: return 'items-center';
    }
  };

  const getFlexJustifyClass = (align) => {
    switch(align) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      case 'center':
      default: return 'justify-center';
    }
  };

  const getTextAlignClass = (align) => {
    switch(align) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const getItemMarginClass = (align) => {
    switch(align) {
      case 'left': return 'mr-auto';
      case 'right': return 'ml-auto';
      case 'center':
      default: return 'mx-auto';
    }
  };

  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }[pageData.buttonStyle?.borderRadius || 'none'];

  return (
    <>
      <Helmet>
        <title>{pageData.title} | Astitva Creations</title>
        <meta name="description" content={hero?.description || 'Professional wedding photography & cinematography.'} />
      </Helmet>

      {/* ─── Hero Section ─── */}
      {visibility?.hero && hero && (
        <section className={`relative h-screen flex items-center justify-center overflow-hidden bg-black`}>
          <div className="absolute inset-0 z-0">
            {hero.backgroundImageUrl && (
              <img
                src={hero.backgroundImageUrl}
                alt="Hero Background"
                className="w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0B0B0B]" />
          </div>

          <div className={`relative z-10 px-4 max-w-4xl mt-16 ${getAlignClass(alignments?.hero)}`}>
            {hero.eyebrow && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs lg:text-sm xl:text-base font-semibold mb-6"
              >
                {hero.eyebrow}
              </motion.p>
            )}
            {hero.title && (
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight text-white"
              >
                {hero.title}
              </motion.h1>
            )}
            {hero.subtitle && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/90 text-xl md:text-2xl font-serif italic mb-8 drop-shadow-md"
              >
                {hero.subtitle}
              </motion.h2>
            )}
            {hero.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className={`text-[#A1A1A1] text-sm md:text-base leading-relaxed mb-10 max-w-2xl ${alignments?.hero === 'center' ? 'mx-auto' : ''}`}
              >
                {hero.description}
              </motion.p>
            )}
            
            <div className={`flex flex-col md:flex-row gap-6 mt-8 ${alignments?.hero === 'center' ? 'items-center justify-center' : alignments?.hero === 'right' ? 'items-end justify-end' : 'items-start justify-start'}`}>
              {hero.priceStart && visibility?.heroPrice !== false && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className={`flex flex-col ${getFlexAlignClass(alignments?.hero)}`}
                >
                  <p className="text-white/80 uppercase tracking-widest text-xs font-semibold mb-2">Packages Start From Just</p>
                  <p className="font-heading text-4xl text-[var(--color-gold)] leading-none">{hero.priceStart}</p>
                </motion.div>
              )}

              {hero.ctaLabel && (
                <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                  <Link
                    to={hero.ctaLink || '/quote'}
                    onClick={(e) => handleCtaClick(e, hero.ctaLink)}
                    className={`inline-flex items-center gap-2 px-10 py-5 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)] ${roundedClass}`}
                  >
                    {hero.ctaLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── VR 360 View ─── */}
      {visibility?.vr360View && activeSlug === 'vr-wedding' && vr360View?.images && vr360View.images.length > 0 && (
        <section className="py-24 bg-[#050505] overflow-hidden">
          <div className="w-full px-4 lg:px-8">
            {vr360View.title && (
              <motion.h3 
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-10 ${getTextAlignClass(alignments?.vr360View)}`}
              >
                {vr360View.title}
              </motion.h3>
            )}
            
            <div className="relative group/gallery">
              <div className="flex flex-wrap justify-center gap-8 pb-4">
                {vr360View.images.map((img, idx) => (
                  <div key={idx} className="w-[90vw] md:w-[70vw] lg:w-[60vw] rounded-xl overflow-hidden border border-[#333] relative h-[400px] md:h-[500px] lg:h-[600px]">
                    <Pannellum
                      width="100%"
                      height="100%"
                      image={img}
                      pitch={10}
                      yaw={180}
                      hfov={110}
                      autoLoad={true}
                      showZoomCtrl={false}
                      showFullscreenCtrl={true}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className={`text-[#A1A1A1] text-xs uppercase tracking-widest mt-6 ${getTextAlignClass(alignments?.vr360View)}`}>
              Drag inside the image to look around in 360°
            </p>
          </div>
        </section>
      )}

      {/* ─── Intro Video ─── */}
      {visibility?.introVideo && introVideo && (
        <section className="py-24 bg-[#0B0B0B]">
          <div className={`max-w-6xl mx-auto px-4 ${getAlignClass(alignments?.introVideo)}`}>
            {introVideo.title && (
              <motion.h3 
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4"
              >
                {introVideo.title}
              </motion.h3>
            )}
            
            {introVideo.thumbnailUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative aspect-video rounded-lg overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] border border-[#333] mt-12 bg-[#111] group cursor-pointer"
              >
                <img 
                  src={introVideo.thumbnailUrl} 
                  alt="Intro Video Thumbnail" 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center border-2 border-white/50 group-hover:border-[var(--color-gold)] group-hover:scale-110 transition-all duration-300">
                    <Play className="w-8 h-8 text-white group-hover:text-[var(--color-gold)] transition-colors fill-current ml-1" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ─── Our Approach ─── */}
      {visibility?.approach && approach && approach.items && approach.items.length > 0 && (
        <section className="py-24 bg-[#0B0B0B]">
          <div className="max-w-6xl mx-auto px-4">
            <div className={`mb-16 ${getAlignClass(alignments?.approach)}`}>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4 uppercase tracking-widest"
              >
                {approach.title}
              </motion.h2>
              {approach.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-[#A1A1A1] text-sm md:text-base font-light"
                >
                  {approach.subtitle}
                </motion.p>
              )}
            </div>

            <div className={`flex flex-wrap gap-6 ${getFlexJustifyClass(alignments?.approach)}`}>
              {approach.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 max-w-sm w-full shadow-lg ${getTextAlignClass(alignments?.approach)}`}
                >
                  <span className="text-[var(--color-gold)] font-heading text-2xl block mb-2">{item.number}</span>
                  <h3 className="text-white font-heading text-xl uppercase mb-3">{item.title}</h3>
                  <p className="text-[#A1A1A1] text-xs leading-relaxed font-light">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── What We Do Best ─── */}
      {visibility?.whatWeDoBest && whatWeDoBest && whatWeDoBest.items && whatWeDoBest.items.length > 0 && (
        <section className="py-24 bg-[#050505]">
          <div className="max-w-[85rem] mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-16 ${getAlignClass(alignments?.whatWeDoBest)}`}
            >
              {whatWeDoBest.title}
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whatWeDoBest.items.map((service, i) => (
                <ServiceCard key={i} service={service} index={i} textAlign={getTextAlignClass(alignments?.whatWeDoBest)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Our Best Clicks ─── */}
      {visibility?.bestClicks && bestClicks && bestClicks.images && bestClicks.images.length > 0 && (
        <section className="py-24 bg-[#0B0B0B] overflow-hidden">
          <div className="w-full px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-16 ${getAlignClass(alignments?.bestClicks)}`}
            >
              {bestClicks.title}
            </motion.h2>

            <div className="relative group/gallery">
              <div ref={photosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
                {bestClicks.images.map((img, i) => (
                  <div key={i} className="relative shrink-0 w-auto h-[45vh] md:h-[50vh] lg:h-[60vh] max-h-[600px] overflow-hidden bg-[#111] rounded-xl md:rounded-none">
                    <img src={`${img}?auto=format&fit=crop&q=80&w=800`} alt={`Best Click ${i + 1}`} className="w-auto h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Why Couples Love Our Studio ─── */}
      {visibility?.whyLoveUs && whyLoveUs && whyLoveUs.items && whyLoveUs.items.length > 0 && (
        <section className="py-24 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-16 ${getAlignClass(alignments?.whyLoveUs)}`}
            >
              {whyLoveUs.title}
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyLoveUs.items.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-[#111] p-8 border-l-2 border-[var(--color-gold)] hover:bg-[#1a1a1a] transition-colors ${getTextAlignClass(alignments?.whyLoveUs)}`}
                >
                  <h3 className="font-heading text-xl text-white mb-3">{feature.title}</h3>
                  <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Comfort & Stress-Free Experience ─── */}
      {visibility?.comfort && comfort && comfort.items && comfort.items.length > 0 && (
        <section className="py-24 bg-[#0B0B0B]">
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-16 ${getAlignClass(alignments?.comfort)}`}
            >
              {comfort.title}
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {comfort.items.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 ${getTextAlignClass(alignments?.comfort)}`}
                >
                  {feature.iconUrl ? (
                    <img src={feature.iconUrl} alt={feature.title} className={`w-16 h-16 object-contain mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] ${getItemMarginClass(alignments?.comfort)}`} />
                  ) : (
                    <div className={`w-16 h-16 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center mb-6 ${getItemMarginClass(alignments?.comfort)}`}>
                      <div className="w-6 h-6 rounded-full bg-[var(--color-gold)]" />
                    </div>
                  )}
                  <h3 className="font-heading text-xl text-white mb-4">{feature.title}</h3>
                  <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Our Wedding Films ─── */}
      {visibility?.weddingFilms && weddingFilms && weddingFilms.items && weddingFilms.items.length > 0 && (
        <section className="py-24 bg-[#050505] overflow-hidden">
          <div className="w-full px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-16 ${getAlignClass(alignments?.weddingFilms)}`}
            >
              {weddingFilms.title}
            </motion.h2>

            <div className="relative group/gallery">
              <div ref={videosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
                {weddingFilms.items.map((vid, i) => (
                  <div 
                    key={i} 
                    className="relative shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-video bg-[#111] border border-[#222] rounded-xl md:rounded-none overflow-hidden cursor-pointer group"
                    onClick={() => setActiveVideo(vid.videoUrl)}
                  >
                    <img 
                      src={getYoutubeThumbnail(vid.videoUrl) || (vid.thumbnailUrl ? `${vid.thumbnailUrl}?auto=format&fit=crop&q=80&w=800` : 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80')} 
                      alt={`Video ${i}`} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-white/50 group-hover:scale-110 group-hover:bg-[var(--color-gold)] transition-all duration-300">
                        <Play className="w-6 h-6 text-white group-hover:text-black fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Packages ─── */}
      {visibility?.packages && packages && packages.items && packages.items.length > 0 && (
        <section className="py-24 bg-[#0B0B0B]">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4 ${getAlignClass(alignments?.packages)}`}
            >
              {packages.title}
            </motion.h2>
            {packages.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`text-[#A1A1A1] text-sm md:text-base font-light mb-16 max-w-2xl ${alignments?.packages === 'center' ? 'mx-auto' : ''} ${getAlignClass(alignments?.packages)}`}
              >
                {packages.subtitle}
              </motion.p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.items.map((pkg, i) => (
                  <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-[#050505] rounded-2xl p-8 border ${pkg.isRecommended ? 'border-[var(--color-gold)] relative shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-[#222] hover:border-[#444]'} transition-colors flex flex-col ${getTextAlignClass(alignments?.packages)}`}
                >
                  {pkg.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-heading text-4xl text-white mb-2">{pkg.title}</h3>
                  <div className="text-[var(--color-gold)] font-heading text-2xl mb-6">{pkg.price}</div>
                  <div className="flex-grow">
                    <ul className="space-y-4 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className={`flex items-start gap-3 text-[#A1A1A1] text-sm font-light ${alignments?.packages === 'center' ? 'justify-center text-center' : alignments?.packages === 'right' ? 'justify-end flex-row-reverse text-right' : 'justify-start text-left'}`}>
                          <svg className="w-5 h-5 text-[var(--color-gold)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to={pkg.ctaLink || '/quote'}
                    onClick={(e) => handleCtaClick(e, pkg.ctaLink)}
                    className={`w-full py-4 ${roundedClass} text-center uppercase tracking-widest text-sm font-semibold transition-all duration-300 ${pkg.isRecommended ? 'bg-[var(--color-gold)] text-black hover:bg-white shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'bg-transparent border border-[#333] text-white hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'}`}
                  >
                    Choose Package
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA ─── */}
      {visibility?.finalCta && finalCta && (
        <section className={`relative py-40 ${getAlignClass(alignments?.finalCta)} bg-cover bg-center bg-no-repeat bg-fixed`} style={{ backgroundImage: `url('${finalCta.backgroundImageUrl}')` }}>
          <div className="absolute inset-0 bg-black/80" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative z-10 max-w-4xl px-4 flex flex-col ${getFlexAlignClass(alignments?.finalCta)} ${alignments?.finalCta === 'center' ? 'mx-auto' : alignments?.finalCta === 'right' ? 'ml-auto' : ''}`}
          >
            <h2 className="font-heading text-3xl md:text-5xl text-[var(--color-gold)] mb-8 leading-tight">
              {finalCta.title}<br/>
              {finalCta.subtitle && visibility?.finalCtaSubtitle !== false && <span className="text-white text-2xl md:text-4xl mt-4 block">{finalCta.subtitle}</span>}
            </h2>
            {finalCta.description && (
              <p className={`text-[#A1A1A1] text-base md:text-lg leading-relaxed mb-10 max-w-3xl ${alignments?.finalCta === 'center' ? 'mx-auto' : ''}`}>
                {finalCta.description}
              </p>
            )}
            {finalCta.ctaLabel && (
              <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                <Link
                  to={finalCta.ctaLink || '/quote'}
                  onClick={(e) => handleCtaClick(e, finalCta.ctaLink)}
                  className={`inline-flex items-center gap-2 px-12 py-5 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)] ${roundedClass}`}
                >
                  {finalCta.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </section>
      )}
      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-[#111] border border-[#333] p-8 max-w-md w-full relative my-auto shadow-2xl"
          >
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 text-[#A1A1A1] hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {!showThankYou ? (
              <>
                <h3 className="font-heading text-2xl text-[var(--color-gold)] mb-2">Book Your Session</h3>
                <p className="text-[#A1A1A1] text-sm mb-6">Leave your details and our team will get back to you shortly to discuss your big day.</p>
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Your Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingForm.name} 
                      onChange={e => setBookingForm({...bookingForm, name: e.target.value})} 
                      className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={bookingForm.email} 
                      onChange={e => setBookingForm({...bookingForm, email: e.target.value})} 
                      className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={bookingForm.phone} 
                      onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} 
                      className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className={`w-full py-4 mt-2 ${roundedClass} bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-[var(--color-gold)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-[var(--color-gold)]" />
                </div>
                <h3 className="font-heading text-3xl text-white mb-3">Thank You!</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed mb-8">
                  Your inquiry has been successfully received. A member of our team will be in touch with you shortly.
                </p>
                <button 
                  onClick={closeModal}
                  className={`px-8 py-3 bg-[#1a1a1a] border border-[#333] text-white hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors uppercase tracking-widest text-xs font-semibold ${roundedClass}`}
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl aspect-video relative"
            >
              <button 
                onClick={() => setActiveVideo(null)} 
                className="absolute -top-10 right-0 md:-top-12 md:-right-12 text-[#A1A1A1] hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              {isDirectVideo(activeVideo) ? (
                <video src={activeVideo} controls autoPlay className="w-full h-full bg-black shadow-2xl" />
              ) : (
                <iframe 
                  src={getEmbedUrl(activeVideo)} 
                  title="Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full bg-black shadow-2xl border-none"
                ></iframe>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
