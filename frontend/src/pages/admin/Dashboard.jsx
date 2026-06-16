import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FileText, Eye, TrendingUp, Users, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useBookingStore } from '../../store/bookingStore';
import { useTestimonialStore } from '../../store/testimonialStore';
import { useLeadStore } from '../../store/leadStore';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { projects } = useProjectStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { testimonials } = useTestimonialStore();
  const { leads, fetchLeads } = useLeadStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchLeads();
  }, []);

  // Filter logic
  const isWithinDateRange = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (startDate && date < new Date(startDate)) return false;
    // For end date, set to end of day to include the whole day
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  };

  const filteredQuotes = (startDate || endDate) ? bookings.filter(b => isWithinDateRange(b.createdAt)) : bookings;
  const filteredLeads = (startDate || endDate) ? leads.filter(l => isWithinDateRange(l.createdAt)) : leads;

  const totalQuotes = filteredQuotes.length;
  const totalLeads = filteredLeads.length;
  
  const pendingQuotes = filteredQuotes.filter(b => b.status === 'PENDING').length;
  const pendingLeads = filteredLeads.filter(l => l.status === 'PENDING').length;
  const totalPending = pendingQuotes + pendingLeads;

  const confirmedQuotes = filteredQuotes.filter(b => b.status === 'CONFIRMED').length;
  const confirmedLeads = filteredLeads.filter(l => l.status === 'CONVERTED').length; // 'CONVERTED' for leads
  const totalConfirmed = confirmedQuotes + confirmedLeads;

  const stats = [
    { title: 'Total Leads', value: totalLeads.toString(), icon: Users, change: 'Landing page inquiries' },
    { title: 'Total Quotes', value: totalQuotes.toString(), icon: FileText, change: 'Quote wizard inquiries' },
    { title: 'Pending', value: totalPending.toString(), icon: TrendingUp, change: 'Needs review (Combined)' },
    { title: 'Confirmed', value: totalConfirmed.toString(), icon: CheckCircle, change: 'Converted (Combined)' },
  ];

  const [tableFilter, setTableFilter] = useState('ALL'); // 'ALL', 'LEADS', 'QUOTES'

  const combinedItems = [
    ...filteredQuotes.map(q => ({ ...q, itemType: 'QUOTE' })),
    ...filteredLeads.map(l => ({ ...l, itemType: 'LEAD' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const displayItems = tableFilter === 'ALL' 
    ? combinedItems 
    : tableFilter === 'LEADS' 
      ? combinedItems.filter(i => i.itemType === 'LEAD')
      : combinedItems.filter(i => i.itemType === 'QUOTE');

  const recentItems = displayItems.slice(0, 8);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Astitva Creations</title>
      </Helmet>

      <div className="space-y-8">
        
        {/* Header / Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#111] p-6 border border-[#222]">
          <div>
            <h2 className="font-heading text-2xl text-white mb-1">Performance Overview</h2>
            <p className="text-[#A1A1A1] text-sm">Track your inquiries and conversion metrics.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CalendarIcon className="w-4 h-4 text-[var(--color-gold)]" />
              <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full sm:w-auto bg-[#0a0a0a] border border-[#222] px-3 py-2 text-white text-sm focus:border-[var(--color-gold)] outline-none rounded-sm"
                />
                <span className="text-[#A1A1A1] text-sm hidden sm:block">to</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full sm:w-auto bg-[#0a0a0a] border border-[#222] px-3 py-2 text-white text-sm focus:border-[var(--color-gold)] outline-none rounded-sm"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-[#A1A1A1] hover:text-white uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111] border border-[#222] p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[#A1A1A1] text-xs uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-heading text-white">{stat.value}</h3>
                </div>
                <div className="p-3 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-lg">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[#4ade80] text-xs">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Items Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111] border border-[#222]"
        >
          <div className="p-6 border-b border-[#222] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-heading text-xl">Recent Inquiries</h3>
            <div className="flex items-center gap-4">
              <div className="flex bg-[#0a0a0a] border border-[#333] rounded-sm p-1">
                {['ALL', 'LEADS', 'QUOTES'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTableFilter(type)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${
                      tableFilter === type ? 'bg-[#333] text-[var(--color-gold)]' : 'text-[#A1A1A1] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <Link to={tableFilter === 'QUOTES' ? "/admin/quotes" : "/admin/leads"} className="text-[var(--color-gold)] text-sm hover:underline whitespace-nowrap">View All</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest">
                  <th className="p-4">Type</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map(item => (
                  <tr key={item._id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm ${
                        item.itemType === 'QUOTE' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">{item.customerName || item.name}</td>
                    <td className="p-4 text-[#A1A1A1]">{item.eventDate ? new Date(item.eventDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                    <td className="p-4 text-[#A1A1A1] max-w-[200px] truncate">
                      {item.itemType === 'QUOTE' 
                        ? (item.subServices?.join(', ') || 'N/A')
                        : (item.service || item.source || 'N/A')}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs uppercase tracking-widest font-bold rounded-full border ${
                        ['PENDING', 'NEW'].includes(item.status) ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
                        item.status === 'CONTACTED' ? 'border-blue-500/50 text-blue-500 bg-blue-500/10' :
                        ['CONFIRMED', 'CONVERTED'].includes(item.status) ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                        'border-red-500/50 text-red-500 bg-red-500/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link to={item.itemType === 'QUOTE' ? "/admin/quotes" : "/admin/leads"} className="text-white hover:text-[var(--color-gold)] text-sm border-b border-transparent hover:border-[var(--color-gold)]">Review</Link>
                    </td>
                  </tr>
                ))}
                {recentItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#A1A1A1]">No recent inquiries.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </>
  );
}
