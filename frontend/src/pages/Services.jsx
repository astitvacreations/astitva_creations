import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useServiceStore } from '../store/serviceStore';
import { ArrowRight } from 'lucide-react';
import { getOptimizedUrl } from '../utils/cloudinary';

export default function Services() {
  const { services } = useServiceStore();

  return (
    <>
      <Helmet>
        <title>Services | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <div className="mb-16 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6"
            >
              Our Services
            </motion.h1>
            <p className="text-[#A1A1A1] max-w-2xl mx-auto">
              From luxury weddings to cinematic commercial films, we provide premium visual storytelling services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={service._id}
                className="group bg-[#111] border border-[#222] overflow-hidden flex flex-col h-full animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.1, 0.3)}s`, animationFillMode: 'both' }}
              >
                <div className="relative aspect-square overflow-hidden bg-[#050505]">
                  <img 
                    src={getOptimizedUrl(service.coverImage, 800)} 
                    alt={service.title} 
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index < 4 ? "high" : "auto"}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-heading text-2xl text-[var(--color-gold)] mb-3">{service.title}</h3>
                  <p className="text-[#A1A1A1] text-sm leading-relaxed mb-8">
                    {service.description}
                  </p>
                  
                  <div className="mt-auto flex flex-col gap-4">
                    <Link 
                      to={`/services/${service.slug}`} 
                      className="px-6 py-3 border border-[var(--color-gold)] text-[var(--color-gold)] uppercase tracking-widest text-xs font-bold hover:bg-[var(--color-gold)] hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      View Category Gallery <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link 
                      to={`/projects/${service.slug}`} 
                      className="px-6 py-3 bg-[#222] text-[var(--color-gold)] uppercase tracking-widest text-xs font-bold hover:bg-white hover:text-black transition-all text-center"
                    >
                      View Recent Projects
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center text-[#A1A1A1] py-20 uppercase tracking-widest">
              No services found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
