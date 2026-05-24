import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import { useEffect } from 'react';
import { useSettingStore } from '../store/settingStore';

const MaintenanceScreen = ({ settings }) => {
  let returnDate = null;
  try {
    if (settings?.maintenanceUntil) {
      returnDate = new Date(settings.maintenanceUntil).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {
    console.error("Date error", e);
  }

  const hasValidDate = returnDate && returnDate !== 'Invalid Date';

  return (
    <div style={{ 
      backgroundColor: '#050505', 
      color: '#fff', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center', 
      padding: '0 24px'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          backgroundColor: '#111', 
          border: '1px solid #222', 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '40px' 
        }}>
          <span style={{ fontSize: '2rem', color: '#B19247' }}>⚒</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
          margin: '0 0 24px 0', 
          textTransform: 'uppercase', 
          letterSpacing: '-0.05em' 
        }}>
          Perfecting the <span style={{ color: '#B19247' }}>Frame</span>
        </h1>
        
        <p style={{ 
          color: '#A1A1A1', 
          fontSize: '1.25rem', 
          lineHeight: '1.6', 
          marginBottom: '48px',
          fontWeight: '300'
        }}>
          {hasValidDate
            ? `Our digital gallery is currently undergoing a curated update. We will be back by ${returnDate}.`
            : "Our digital gallery is currently undergoing a curated update to bring you an even more cinematic experience. We'll be back shortly."
          }
        </p>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '12px', 
          backgroundColor: '#111', 
          border: '1px solid #222', 
          padding: '12px 24px', 
          borderRadius: '50px' 
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B19247' }}></div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            {hasValidDate ? `Coming back: ${returnDate}` : 'Work in Progress'}
          </span>
        </div>
      </div>
      
      <p style={{ position: 'absolute', bottom: '48px', color: '#333', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5em' }}>
        &copy; {new Date().getFullYear()} Astitva Creations Studio
      </p>
    </div>
  );
};

export default function RootLayout() {
  const { pathname } = useLocation();
  const { settings } = useSettingStore();

  const isAdminLoggedIn = localStorage.getItem('admin_auth') === 'true';

  const isMaintenance = settings && settings.isMaintenanceMode === true && !isAdminLoggedIn;
  const isAdminPath = pathname && pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (isMaintenance && !isAdminPath) {
    return <MaintenanceScreen settings={settings} />;
  }

  const showAdminBanner = settings?.isMaintenanceMode && isAdminLoggedIn;

  return (
    <div className={`flex flex-col min-h-screen bg-[var(--color-primary-black)] text-white font-body selection:bg-[var(--color-gold)] selection:text-black ${showAdminBanner ? 'pt-8' : ''}`}>
      {showAdminBanner && (
        <div className="fixed top-0 left-0 w-full bg-[#111] border-b border-[var(--color-gold)]/50 h-8 z-[9999] flex items-center justify-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-gold)]">
            Admin Preview Mode Active • Public sees Maintenance Screen
          </span>
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse"></div>
        </div>
      )}
      <Navbar />
      <main className="flex-grow overflow-clip">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
}
