import { useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export default function ReferenceLandingPage() {
  const photosRef = useRef(null);
  const videosRef = useRef(null);

  // Auto-scroll logic for galleries
  useEffect(() => {
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

  return (
    <>
      <Helmet>
        <title>Timeless Wedding Photography | Astitva Creations</title>
        <meta name="description" content="Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories." />
      </Helmet>

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80"
            alt="Wedding Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0B0B0B]" />
        </div>

        <div className="relative z-10 px-4 max-w-4xl mx-auto text-center mt-16">
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
            className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight text-white"
          >
            Timeless Wedding Photography
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/90 text-xl md:text-2xl font-serif italic mb-8 drop-shadow-md"
          >
            "Your Love Story, Captured Forever."
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[#A1A1A1] text-sm md:text-base leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="mb-10 bg-[#111]/80 backdrop-blur-sm border border-[var(--color-gold)]/30 p-6 inline-block rounded-md shadow-2xl"
          >
            <p className="text-white/80 uppercase tracking-widest text-xs font-semibold mb-2">Wedding Packages Start From Just</p>
            <p className="font-heading text-4xl text-[var(--color-gold)]">₹24,999/-</p>
          </motion.div>

          <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="block">
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Intro Video ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h3 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4"
          >
            Every Moment. Every Emotion. Beautifully Preserved.
          </motion.h3>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative aspect-video rounded-lg overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] border border-[#333] mt-12 bg-[#111] group cursor-pointer"
          >
            <img 
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80" 
              alt="Intro Video Thumbnail" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center border-2 border-white/50 group-hover:border-[var(--color-gold)] group-hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 text-white group-hover:text-[var(--color-gold)] transition-colors fill-current ml-1" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── What We Do Best ─── */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            What We Do Best
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: 'Pre-Wedding Shoots', 
                desc: 'Romantic outdoor and creative concept shoots that celebrate your journey together.',
                img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
                label: 'ROMANTIC'
              },
              { 
                title: 'Wedding Day Photography', 
                desc: 'Capturing every ritual, emotion, smile, and candid moment from start to finish.',
                img: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
                label: 'CANDID'
              },
              { 
                title: 'Cinematic Wedding Films', 
                desc: 'Beautifully edited wedding movies that tell your love story like a film.',
                img: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
                label: 'CINEMATIC'
              },
              { 
                title: 'Reception & Engagement', 
                desc: 'Elegant photography and videography for all your wedding celebrations.',
                img: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80',
                label: 'ELEGANT'
              }
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] rounded-2xl overflow-hidden border border-[#222] hover:border-[var(--color-gold)]/40 transition-colors flex flex-col group cursor-pointer"
              >
                <div className="relative h-64 overflow-hidden">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent opacity-80" />
                </div>
                <div className="p-6 pt-2 flex-grow flex flex-col">
                  <span className="text-[#A1A1A1] uppercase tracking-[0.2em] text-[10px] font-semibold mb-2">{service.label}</span>
                  <h3 className="font-heading text-xl text-white mb-3 uppercase">{service.title}</h3>
                  <p className="text-[#888] text-sm leading-relaxed font-light">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Best Clicks ─── */}
      <section className="py-24 bg-[#0B0B0B] overflow-hidden">
        <div className="w-full px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Our Best Clicks
          </motion.h2>

          <div className="relative group/gallery">
            <div ref={photosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
              {[
                'https://images.unsplash.com/photo-1519741497674-611481863552',
                'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
                'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
                'https://images.unsplash.com/photo-1532712938310-34cb3982ef74',
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
              ].map((img, i) => (
                <div key={i} className="relative shrink-0 w-auto h-[45vh] md:h-[50vh] lg:h-[60vh] max-h-[600px] overflow-hidden bg-[#111] rounded-xl md:rounded-none">
                  <img src={`${img}?auto=format&fit=crop&q=80&w=800`} alt={`Best Click ${i + 1}`} className="w-auto h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Couples Love Our Studio ─── */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Why Couples Love Our Studio
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Creative Storytelling', desc: 'Every wedding is unique, and we craft visuals that reflect your personal love story.' },
              { title: 'Experienced Team', desc: 'Dedicated photographers, cinematographers, and editors ensuring flawless coverage.' },
              { title: 'Premium Editing', desc: 'High-end color grading, cinematic highlights, reels, and wedding films.' },
              { title: 'Luxury Albums', desc: 'Premium-quality albums, designer photo books, and elegant wall frames.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] p-8 border-l-2 border-[var(--color-gold)] hover:bg-[#1a1a1a] transition-colors"
              >
                <h3 className="font-heading text-xl text-white mb-3">{feature.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comfort & Stress-Free Experience ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Comfort & Stress-Free Experience
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Complete Event Coordination', desc: 'Our team works seamlessly with your schedule and wedding planners.' },
              { title: 'Timely Delivery', desc: 'Fast turnaround for edited photos, videos, reels, and albums.' },
              { title: 'Friendly & Supportive', desc: 'We make couples feel comfortable and natural in front of the camera.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center mx-auto mb-6">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-gold)]" />
                </div>
                <h3 className="font-heading text-xl text-white mb-4">{feature.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Wedding Films ─── */}
      <section className="py-24 bg-[#050505] overflow-hidden">
        <div className="w-full px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Our Wedding Films
          </motion.h2>

          <div className="relative group/gallery">
            <div ref={videosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
              {[
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
                'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
                'https://images.unsplash.com/photo-1606216794074-735e91aa2c92'
              ].map((img, i) => (
                <div 
                  key={i} 
                  className="relative shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-video bg-[#111] border border-[#222] rounded-xl md:rounded-none overflow-hidden"
                >
                  <img src={`${img}?auto=format&fit=crop&q=80&w=800`} alt={`Video ${i}`} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-white/50">
                      <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-32 bg-[#111] overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto px-4"
        >
          <h2 className="font-heading text-3xl md:text-5xl text-[var(--color-gold)] mb-8 leading-tight">
            Affordable Premium Wedding Photography<br/>
            <span className="text-white text-2xl md:text-4xl mt-4 block">Starts From Just ₹24,999/-</span>
          </h2>
          <p className="text-[#A1A1A1] text-base md:text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
            Get professional photography, cinematic videography, creative editing, premium albums, and a dedicated team to capture your special day without exceeding your budget.
          </p>
          <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-12 py-5 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              Book Your Wedding Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
