import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Image as ImageIcon, BookOpen, Settings, LogOut, FileText, Star, IndianRupee, Terminal, MessageSquare, Globe, Users, Shield, PieChart } from 'lucide-react';
import useAuthStore from '../store/authStore';
import LoadingScreen from '../components/LoadingScreen';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { admin, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []); // Always verify session on mount

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (isLoading) {
    return <LoadingScreen isFallback={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const baseMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Business', icon: PieChart, path: '/admin/business' },
    { name: 'Events', icon: BookOpen, path: '/admin/events' },
    { name: 'Props Rentals', icon: ImageIcon, path: '/admin/prop-rentals' },
    { name: 'Projects', icon: ImageIcon, path: '/admin/projects' },
    { name: 'Services', icon: BookOpen, path: '/admin/services' },
    { name: 'Landing Pages', icon: Globe, path: '/admin/landing-pages' },
    { name: 'Pricing Engine', icon: IndianRupee, path: '/admin/pricing' },
    { name: 'Quotes', icon: FileText, path: '/admin/quotes' },
    { name: 'Leads', icon: Users, path: '/admin/leads' },
    { name: 'Testimonials', icon: MessageSquare, path: '/admin/testimonials' },
    { name: 'Feedback', icon: Star, path: '/admin/feedback' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  let menu = [];

  if (admin?.email === 'ssaiprasanth333@gmail.com') {
    menu = [...baseMenu];
    menu.push({ name: 'Permissions', icon: Shield, path: '/admin/permissions' });
    menu.push({ name: 'Dev Options', icon: Terminal, path: '/admin/developer' });
  } else {
    // Filter base menu based on permissions
    const adminPerms = admin?.permissions || [];
    menu = baseMenu.filter(item => adminPerms.includes(item.path));
    
    // Add Permissions menu if they have access
    if (adminPerms.includes('/admin/permissions')) {
      menu.push({ name: 'Permissions', icon: Shield, path: '/admin/permissions' });
    }
  }

  // Route protection
  const isAllowed = admin?.email === 'ssaiprasanth333@gmail.com' || 
    (admin?.permissions && admin.permissions.includes(location.pathname));
  
  if (location.pathname !== '/admin' && location.pathname !== '/admin/' && !isAllowed) {
     // If they land on a page they don't have access to, redirect to their first allowed page, or login
     if (menu.length > 0) {
       return <Navigate to={menu[0].path} replace />;
     } else {
       return <Navigate to="/admin/login" replace />;
     }
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-[#222] hidden md:flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-[#222]">
          <span className="font-heading text-xl tracking-widest text-[var(--color-gold)] uppercase">Astitva Admin</span>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          {menu.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all duration-300 ${location.pathname.includes(item.path) ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'text-[#A1A1A1] hover:bg-[#222] hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wider font-semibold">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#222]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 w-full rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-[#222] bg-[#111] flex items-center justify-between px-8">
          <h2 className="font-heading text-2xl text-white">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 rounded-full bg-[var(--color-gold)] text-black flex items-center justify-center font-bold uppercase cursor-pointer"
            >
              {admin?.email?.substring(0, 2) || 'AD'}
            </button>
            <div className="hidden md:block text-sm">
              <p className="font-bold">{admin?.email === 'ssaiprasanth333@gmail.com' ? 'Super Admin' : 'Admin'}</p>
              <p className="text-[#A1A1A1] text-xs">{admin?.email}</p>
            </div>
          </div>
        </header>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-[#222] bg-[#111] overflow-hidden"
            >
              <nav className="flex flex-col py-2 px-4 space-y-1">
                {menu.map((item) => (
                  <Link 
                    key={item.name} 
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${location.pathname.includes(item.path) ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'text-[#A1A1A1] hover:bg-[#222] hover:text-white'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-wider font-semibold">{item.name}</span>
                  </Link>
                ))}
                <div className="pt-2 mt-2 pb-2 border-t border-[#222]">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-wider font-semibold">Logout</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
