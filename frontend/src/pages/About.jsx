import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Camera, Heart, Star, Award } from 'lucide-react';
import { useSettingStore } from '../store/settingStore';
import { useEffect } from 'react';

export default function About() {
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <>
      <Helmet>
        <title>Our Story | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-5xl md:text-7xl text-[var(--color-gold)] mb-6 drop-shadow-[0_2px_15px_rgba(177,146,71,0.2)]"
            >
              Our Story
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1A1] text-lg leading-relaxed font-light"
            >
              Astitva Creations was founded on a simple premise: your most cherished moments deserve to be immortalized with elegance, luxury, and raw authenticity.
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 items-center mb-24">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-sm lg:max-w-[400px] aspect-[4/5]">
                <img 
                  src={settings?.ownerImage || "https://images.unsplash.com/photo-1554048612-b6a3721eb6d3?auto=format&fit=crop&q=80"} 
                  alt="Behind the lens" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl"
                />
                <div className="absolute inset-0 border border-[var(--color-gold)]/30 translate-x-4 translate-y-4 -z-10"></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2"
            >
              <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">The Philosophy</h2>
              <p className="text-[#A1A1A1] mb-6 leading-relaxed">
                We are a collective of passionate visual storytellers, cinematic videographers, and editorial editors. We approach every event not as a rigid schedule of photos, but as a flowing narrative of human connection.
              </p>
              <p className="text-[#A1A1A1] mb-8 leading-relaxed">
                From the quiet anticipation of getting ready to the explosive joy of the reception dance floor, we blend seamlessly into your day. Our unobtrusive, documentary style ensures that the emotions we capture are 100% real.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mt-12">
                <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }} className="bg-[#111] p-6 border border-[#1a1a1a] shadow-lg">
                  <Camera className="w-8 h-8 text-[var(--color-gold)] mb-4 animate-pulse" />
                  <h3 className="font-heading text-xl text-white mb-2">Cinematic Style</h3>
                  <p className="text-sm text-[#A1A1A1] leading-relaxed">Every shot is framed with an editorial eye and lit like a high-end film.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }} className="bg-[#111] p-6 border border-[#1a1a1a] shadow-lg">
                  <Heart className="w-8 h-8 text-[var(--color-gold)] mb-4 animate-pulse" />
                  <h3 className="font-heading text-xl text-white mb-2">Real Emotion</h3>
                  <p className="text-sm text-[#A1A1A1] leading-relaxed">We hunt for the candid, unscripted moments that truly define your day.</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats / Accolades */}
          <div className="bg-[#111] border border-[#222] p-12 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div whileHover={{ scale: 1.05 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-6">
                <div className="text-5xl font-heading text-[var(--color-gold)] mb-2">500+</div>
                <div className="text-sm text-[#A1A1A1] uppercase tracking-widest">Weddings Captured</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-6 border-y md:border-y-0 md:border-x border-[#333]">
                <div className="text-5xl font-heading text-[var(--color-gold)] mb-2">10+</div>
                <div className="text-sm text-[#A1A1A1] uppercase tracking-widest">Years of Expertise</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="p-6">
                <div className="text-5xl font-heading text-[var(--color-gold)] mb-2">5★</div>
                <div className="text-sm text-[#A1A1A1] uppercase tracking-widest">Client Satisfaction</div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
