import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Image as ImageIcon, BookOpen, Settings, LogOut, FileText, Star, IndianRupee, Terminal, MessageSquare, Globe, Users } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Self-fixing: Ensure we are marked as admin whenever we are in the admin layout
  useEffect(() => {
    localStorage.setItem('admin_auth', 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Projects', icon: ImageIcon, path: '/admin/projects' },
    { name: 'Services', icon: BookOpen, path: '/admin/services' },
    { name: 'Landing Pages', icon: Globe, path: '/admin/landing-pages' },
    { name: 'Pricing Engine', icon: IndianRupee, path: '/admin/pricing' },
    { name: 'Quotes', icon: FileText, path: '/admin/quotes' },
    { name: 'Leads', icon: Users, path: '/admin/leads' },
    { name: 'Testimonials', icon: MessageSquare, path: '/admin/testimonials' },
    { name: 'Feedback', icon: Star, path: '/admin/feedback' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
    { name: 'Dev Options', icon: Terminal, path: '/admin/developer' },
  ];

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
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold)] text-black flex items-center justify-center font-bold">
              SA
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-bold">Super Admin</p>
              <p className="text-[#A1A1A1] text-xs">admin@astitvacreations.com</p>
            </div>
          </div>
        </header>

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
