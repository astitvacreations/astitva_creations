import { useState, useEffect } from 'react';
import useAuthStore from '../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Search, Download, DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import BusinessOverviewTab from './tabs/BusinessOverviewTab';
import BusinessShootsTab from './tabs/BusinessShootsTab';
import BusinessRentalsTab from './tabs/BusinessRentalsTab';
import BusinessEventsTab from './tabs/BusinessEventsTab';

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('all'); // all, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.email === 'ssaiprasanth333@gmail.com';
  const myPermissions = admin?.permissions || [];

  const hasPerm = (path) => isSuperAdmin || myPermissions.includes(path);

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'shoots', label: 'STUDIO SHOOTS' }
  ];

  if (hasPerm('/admin/prop-rentals')) {
    tabs.push({ id: 'rentals', label: 'PROPS RENTALS' });
  }
  
  if (hasPerm('/admin/events')) {
    tabs.push({ id: 'events', label: 'EVENTS' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-heading text-white">Business Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
            <input 
              type="text" 
              placeholder="Search customer, phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors w-64"
            />
          </div>
          
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          >
            <option value="all">ALL TIME</option>
            <option value="week">THIS WEEK</option>
            <option value="month">THIS MONTH</option>
            <option value="custom">DATE RANGE</option>
          </select>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
              <span className="text-[#A1A1A1]">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-[#222] overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold tracking-widest uppercase transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-[var(--color-gold)]' : 'text-[#A1A1A1] hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="business-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-gold)]"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <BusinessOverviewTab filter={{ period, startDate, endDate, search }} />}
            {activeTab === 'shoots' && <BusinessShootsTab filter={{ period, startDate, endDate, search }} />}
            {activeTab === 'rentals' && <BusinessRentalsTab filter={{ period, startDate, endDate, search }} />}
            {activeTab === 'events' && <BusinessEventsTab filter={{ period, startDate, endDate, search }} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
