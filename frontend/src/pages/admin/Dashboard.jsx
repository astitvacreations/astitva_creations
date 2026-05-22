import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FileText, Image as ImageIcon, Eye, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useBookingStore } from '../../store/bookingStore';
import { useTestimonialStore } from '../../store/testimonialStore';
import { useEffect } from 'react';

export default function Dashboard() {
  const { projects } = useProjectStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { testimonials } = useTestimonialStore();

  useEffect(() => {
    fetchBookings();
  }, []);

  const stats = [
    { title: 'Total Quotes', value: bookings.length.toString(), icon: FileText, change: 'Lifetime inquiries' },
    { title: 'Projects', value: projects.length.toString(), icon: ImageIcon, change: 'Published events' },
    { title: 'Testimonials', value: testimonials.length.toString(), icon: Eye, change: 'Client reviews' },
    { title: 'Pending', value: bookings.filter(b => b.status === 'PENDING').length.toString(), icon: TrendingUp, change: 'Needs review' },
  ];

  const recentQuotes = bookings.slice(0, 5);
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Astitva Creations</title>
      </Helmet>

      <div className="space-y-8">
        
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

        {/* Recent Quotes Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111] border border-[#222]"
        >
          <div className="p-6 border-b border-[#222] flex justify-between items-center">
            <h3 className="font-heading text-xl">Recent Quote Requests</h3>
            <Link to="/admin/quotes" className="text-[var(--color-gold)] text-sm hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest">
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Services</th>
                  <th className="p-4">Estimate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map(quote => (
                  <tr key={quote._id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-semibold">{quote.customerName}</td>
                    <td className="p-4 text-[#A1A1A1]">{new Date(quote.eventDate).toLocaleDateString()}</td>
                    <td className="p-4 text-[#A1A1A1] max-w-[200px] truncate">{quote.subServices?.join(', ') || 'N/A'}</td>
                    <td className="p-4 text-[var(--color-gold)] font-bold">₹{quote.estimatedPrice?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs uppercase tracking-widest font-bold rounded-full border ${
                        quote.status === 'PENDING' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
                        quote.status === 'CONTACTED' ? 'border-blue-500/50 text-blue-500 bg-blue-500/10' :
                        quote.status === 'CONFIRMED' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
                        'border-red-500/50 text-red-500 bg-red-500/10'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link to="/admin/quotes" className="text-white hover:text-[var(--color-gold)] text-sm border-b border-transparent hover:border-[var(--color-gold)]">Review</Link>
                    </td>
                  </tr>
                ))}
                {recentQuotes.length === 0 && (
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
