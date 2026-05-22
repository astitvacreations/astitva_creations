import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Search, Eye, Filter, Trash2, Download, X, Calendar, MapPin, Phone, Mail, User, Clock, CheckCircle2, Bookmark } from 'lucide-react';
import { useLeadStore } from '../../store/leadStore';
import { useToastStore } from '../../store/toastStore';

export default function LeadsManager() {
  const { leads, fetchLeads, updateLeadStatus, deleteLead, isLoading } = useLeadStore();
  const { addToast } = useToastStore();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null); // For details modal

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLeadStatus(id, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      if (selectedLead && selectedLead._id === id) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead? This action is irreversible.')) return;
    try {
      await deleteLead(id);
      addToast('Lead deleted successfully', 'success');
      if (selectedLead && selectedLead._id === id) {
        setSelectedLead(null);
      }
    } catch (error) {
      addToast('Failed to delete lead', 'error');
    }
  };

  const getSourceLabel = (slug) => {
    switch (slug) {
      case 'wedding':
        return 'Wedding Landing Page';
      case 'pre-wedding':
        return 'Pre-Wedding Page';
      case 'vrwedding':
        return 'VR Wedding Page';
      default:
        return 'General / Other';
    }
  };

  const getSourceColor = (slug) => {
    switch (slug) {
      case 'wedding':
        return 'border-purple-500/30 text-purple-400 bg-purple-500/5';
      case 'pre-wedding':
        return 'border-sky-500/30 text-sky-400 bg-sky-500/5';
      case 'vrwedding':
        return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
      default:
        return 'border-gray-500/30 text-gray-400 bg-gray-500/5';
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) {
      addToast('No leads available to export', 'error');
      return;
    }
    const headers = ['Lead ID', 'Client Name', 'Email', 'Phone', 'Event Date', 'Location', 'Source Page', 'Status', 'Submitted At', 'Client Notes'];
    const csvRows = [headers.join(',')];

    leads.forEach(l => {
      const row = [
        `"${l._id}"`,
        `"${(l.customerName || '').replace(/"/g, '""')}"`,
        `"${l.email || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.eventDate ? new Date(l.eventDate).toLocaleDateString() : ''}"`,
        `"${(l.location || '').replace(/"/g, '""')}"`,
        `"${getSourceLabel(l.source)}"`,
        `"${l.status}"`,
        `"${l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}"`,
        `"${(l.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Astitva_Creations_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Leads spreadsheet downloaded!', 'success');
  };

  // Stats calculation
  const totalCount = leads.length;
  const pendingCount = leads.filter(l => l.status === 'PENDING').length;
  const contactedCount = leads.filter(l => l.status === 'CONTACTED').length;
  const convertedCount = leads.filter(l => l.status === 'CONVERTED').length;
  const lostCount = leads.filter(l => l.status === 'LOST').length;

  // Filtering leads list
  const filteredLeads = leads.filter(l => {
    const matchesSearch = (l.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (l.email || '').toLowerCase().includes(search.toLowerCase()) || 
                          (l.phone || '').toLowerCase().includes(search.toLowerCase()) || 
                          l._id.toLowerCase().includes(search.toLowerCase());
                          
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || l.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <>
      <Helmet>
        <title>Manage Leads | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-heading text-3xl text-white mb-1">Landing Page Leads</h2>
            <p className="text-[#A1A1A1] text-sm">Review, filter, and track leads gathered directly from landing page inquiry forms.</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-[var(--color-gold)] text-black hover:bg-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm"
          >
            <Download className="w-4 h-4 stroke-[3px]" /> Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Inquiries', value: totalCount, color: 'border-[#222]' },
            { label: 'Pending', value: pendingCount, color: 'border-yellow-500/20 text-yellow-500' },
            { label: 'Contacted', value: contactedCount, color: 'border-blue-500/20 text-blue-500' },
            { label: 'Converted', value: convertedCount, color: 'border-green-500/20 text-green-500' },
            { label: 'Lost', value: lostCount, color: 'border-red-500/20 text-red-500' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 bg-[#111] border ${stat.color} rounded-sm`}>
              <span className="text-[10px] uppercase tracking-widest text-[#777] block mb-1">{stat.label}</span>
              <span className="text-2xl font-bold font-mono">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Table & Controls Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222]"
        >
          {/* Controls Bar */}
          <div className="p-4 border-b border-[#222] flex flex-col md:flex-row justify-between gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input 
                type="text" 
                placeholder="Search by name, email, phone, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
              <div className="flex items-center gap-2 text-[#777]">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-widest font-semibold">Filter:</span>
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] text-xs text-white px-3 py-1.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONTACTED">Contacted</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>

              {/* Source Select */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] text-xs text-white px-3 py-1.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
              >
                <option value="ALL">All Sources</option>
                <option value="wedding">Wedding Landing Page</option>
                <option value="pre-wedding">Pre-Wedding Page</option>
                <option value="vrwedding">VR Wedding Page</option>
                <option value="general">General / Other</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest font-bold">
                  <th className="p-4">Lead ID</th>
                  <th className="p-4">Client Details</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Source Page</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead._id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="p-4 text-[#777] font-mono text-xs">{lead._id.slice(-6).toUpperCase()}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{lead.customerName}</div>
                      <div className="text-xs text-[#777] font-normal flex flex-col gap-0.5 mt-1 font-mono">
                        <span>{lead.email}</span>
                        <span>{lead.phone}</span>
                      </div>
                      <span className="block text-[10px] text-[#555] font-normal mt-2">Submitted: {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
                    </td>
                    <td className="p-4 text-[#A1A1A1] text-xs font-mono">{lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td className="p-4 text-[#A1A1A1] text-xs">{lead.location || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-sm uppercase tracking-widest inline-block ${getSourceColor(lead.source)}`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={lead.status} 
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={`bg-transparent border-none text-[10px] uppercase tracking-widest font-bold focus:ring-0 cursor-pointer ${
                          lead.status === 'PENDING' ? 'text-yellow-500' :
                          lead.status === 'CONTACTED' ? 'text-blue-500' :
                          lead.status === 'CONVERTED' ? 'text-green-500' :
                          'text-red-500'
                        }`}
                      >
                        <option value="PENDING" className="bg-[#111] text-white">Pending</option>
                        <option value="CONTACTED" className="bg-[#111] text-white">Contacted</option>
                        <option value="CONVERTED" className="bg-[#111] text-white">Converted</option>
                        <option value="LOST" className="bg-[#111] text-white">Lost</option>
                      </select>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2 h-full items-center mt-4">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors" 
                        title="View Full Inquiry Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lead._id)} className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete Lead">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#A1A1A1]">No leads found matching current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Lead Review Details Modal */}
        <AnimatePresence>
          {selectedLead && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#222] w-full max-w-xl shadow-3xl rounded-sm max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-[#222] p-6">
                  <div>
                    <h3 className="font-heading text-xl text-white">Lead Inquiry Review</h3>
                    <span className="text-[10px] text-[#555] uppercase tracking-widest block mt-0.5">Lead ID: #{selectedLead._id.toUpperCase()}</span>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="text-[#777] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  
                  {/* Lead Details Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-[#222] bg-[#0c0c0c] space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-[var(--color-gold)] font-bold block mb-1">Client Coordinates</span>
                      <div className="flex items-center gap-2 text-xs text-white">
                        <User className="w-4 h-4 text-[#555]" /> {selectedLead.customerName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Mail className="w-4 h-4 text-[#555]" /> 
                        <a href={`mailto:${selectedLead.email}`} className="hover:text-[var(--color-gold)] transition-colors">{selectedLead.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Phone className="w-4 h-4 text-[#555]" /> 
                        <a href={`tel:${selectedLead.phone}`} className="hover:text-[var(--color-gold)] transition-colors">{selectedLead.phone}</a>
                      </div>
                    </div>

                    <div className="p-4 border border-[#222] bg-[#0c0c0c] space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-[var(--color-gold)] font-bold block mb-1">Inquiry Logistics</span>
                      <div className="flex items-center gap-2 text-xs text-white">
                        <Calendar className="w-4 h-4 text-[#555]" /> Event Date: {selectedLead.eventDate ? new Date(selectedLead.eventDate).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <MapPin className="w-4 h-4 text-[#555]" /> Location: {selectedLead.location || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Bookmark className="w-4 h-4 text-[#555]" /> Source: {getSourceLabel(selectedLead.source)}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Message */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Client Story & Requests</span>
                    {selectedLead.notes ? (
                      <p className="text-xs text-[#A1A1A1] bg-[#090909] p-4 border border-[#1a1a1a] rounded-sm leading-relaxed whitespace-pre-wrap">
                        {selectedLead.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-[#555] italic bg-[#090909] p-4 border border-[#1a1a1a] rounded-sm">No notes provided.</p>
                    )}
                  </div>

                  {/* Status Editor */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-[#000] border border-[#222] p-4 gap-4">
                    <div className="text-xs text-[#777]">
                      Submitted: {new Date(selectedLead.createdAt).toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold">Status:</span>
                      <select 
                        value={selectedLead.status} 
                        onChange={(e) => handleStatusChange(selectedLead._id, e.target.value)}
                        className={`bg-[#0c0c0c] border border-[#222] text-[10px] uppercase tracking-widest font-bold py-2 px-3 focus:ring-0 cursor-pointer ${
                          selectedLead.status === 'PENDING' ? 'text-yellow-500' :
                          selectedLead.status === 'CONTACTED' ? 'text-blue-500' :
                          selectedLead.status === 'CONVERTED' ? 'text-green-500' :
                          'text-red-500'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="border-t border-[#222] p-6 flex justify-end gap-3 bg-[#0a0a0a]">
                  <button 
                    onClick={() => handleDelete(selectedLead._id)}
                    className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs uppercase tracking-widest font-bold rounded-sm mr-auto"
                  >
                    Delete Lead
                  </button>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="px-4 py-2 border border-[#333] text-white hover:bg-[#222] text-xs uppercase tracking-widest font-bold rounded-sm"
                  >
                    Close Review
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
