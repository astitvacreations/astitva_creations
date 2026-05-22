import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { useSettingStore } from '../store/settingStore';
import { useEffect } from 'react';

export default function Contact() {
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const whatsappClean = settings.whatsappNumber.replace(/\D/g, '');

  return (
    <>
      <Helmet>
        <title>Contact Us | {settings.studioName}</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6"
            >
              Get In Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1A1] text-lg leading-relaxed font-light"
            >
              We accept a limited number of commissions each year to ensure the highest quality of luxury service. Reach out to check our availability.
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-16">
            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-3/5 bg-[#111] border border-[#222] p-8 md:p-12 shadow-2xl"
            >
              <h2 className="font-heading text-2xl text-white mb-8">Send an Inquiry</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">First Name</label>
                    <input type="text" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Last Name</label>
                    <input type="text" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Email Address</label>
                    <input type="email" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Phone Number</label>
                    <input type="tel" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Event Date & Location</label>
                  <input type="text" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Tell us about your event</label>
                  <textarea rows="4" className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"></textarea>
                </div>
                <button type="submit" className="px-10 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors">
                  Submit Inquiry
                </button>
              </form>
            </motion.div>

            {/* Direct Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-2/5 flex flex-col gap-8"
            >
              <div className="bg-[#111] border border-[#222] p-8">
                <h3 className="font-heading text-2xl text-white mb-6">Studio Location</h3>
                <div className="flex gap-4 items-start text-[#A1A1A1]">
                  <MapPin className="w-6 h-6 text-[var(--color-gold)] shrink-0" />
                  <p>Office address:<br/>Near kinnera complex srikakulam 532001</p>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] p-8">
                <h3 className="font-heading text-2xl text-white mb-6">Direct Contact</h3>
                <div className="flex flex-col gap-6">
                  <a href={`tel:${settings.whatsappNumber}`} className="flex items-center gap-4 text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors">
                    <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span>{settings.whatsappNumber}</span>
                  </a>
                  <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-4 text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors">
                    <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span>{settings.contactEmail}</span>
                  </a>
                  <a href={`https://wa.me/${whatsappClean}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 text-[#A1A1A1] hover:text-[#25D366] transition-colors">
                    <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center hover:border-[#25D366]">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
