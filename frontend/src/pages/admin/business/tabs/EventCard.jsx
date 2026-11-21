import { useState } from 'react';
import { 
  Edit2, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Award,
  Eye,
  ExternalLink
} from 'lucide-react';
import EventDetailsModal from './EventDetailsModal';

export default function EventCard({ 
  event, 
  expenses, 
  progressTrackingOptions, 
  fetchEvents, 
  onEdit, 
  onAddExpense, 
  onDelete, 
  formatCurrency, 
  onOpenQuotations 
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const total = event.finalTotal || 0;
  const paid = Number(event.paidAmount || 0);
  const pending = Math.max(0, total - paid);
  const status = event.status || 'PENDING';

  const statusColorClass = 
    status === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' :
    status === 'COMPLETED' ? 'text-blue-400 bg-blue-950/60 border-blue-500/30' :
    status === 'CANCELLED' ? 'text-rose-400 bg-rose-950/60 border-rose-500/30' :
    'text-amber-400 bg-amber-950/60 border-amber-500/30';

  return (
    <>
      <div className="bg-[#0f0f11] border border-[#222] hover:border-[#333] rounded-2xl overflow-hidden flex flex-col p-5 relative w-full md:w-[380px] transition-all shadow-xl">
        
        {/* 1. Header: Customer Name + Status Badge + Edit */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-heading font-bold text-white uppercase tracking-wider truncate" title={event.customerName}>
              {event.customerName}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColorClass}`}>
                {status}
              </span>
              {event.agreementVersionNumber ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-950/70 text-green-400 border border-green-500/30 flex items-center gap-1 font-mono">
                  <Award className="w-3 h-3" />
                  ★ Agreement
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-[var(--color-gold)] border border-[var(--color-gold)]/30 font-mono">
                  Quotation {event.activeQuotationNumber || '1'}
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={() => onEdit(event)} 
            className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-white bg-[#1a1a1a] hover:bg-[#252528] border border-[#333] px-3 py-1.5 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            Edit <Edit2 className="w-3 h-3 ml-0.5 text-orange-400" />
          </button>
        </div>

        {/* 2. Contact Details: Phone & Email */}
        <div className="text-xs text-[#A1A1A1] space-y-1 mb-3 pt-1">
          <p className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#666] shrink-0" />
            <span className="font-mono text-white/90">{event.phone || 'No phone'}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-[#666] shrink-0" />
            <span className="truncate text-white/90">{event.email || 'No email'}</span>
          </p>
        </div>

        {/* 3. Event & Shoot Date */}
        <div className="bg-[#151515] rounded-xl border border-[#222] p-3 grid grid-cols-2 gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[9px] text-[#666] uppercase tracking-wider mb-0.5 font-bold">Event</p>
            <p className="text-xs font-semibold text-white truncate" title={event.eventName}>
              {event.eventName || 'Event'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-[#666] uppercase tracking-wider mb-0.5 font-bold">Shoot Date</p>
            <p className="text-xs font-semibold text-[#22c55e] flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : 'TBD'}</span>
            </p>
          </div>
        </div>

        {/* 4. Financials Summary Bar */}
        <div className="bg-[#09090b] rounded-lg border border-[#222] p-2.5 flex items-center justify-between text-xs mb-4">
          <div>
            <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Total</span>
            <span className="font-bold text-white">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Paid</span>
            <span className="font-bold text-green-400">₹{paid.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Pending</span>
            <span className="font-bold text-amber-400">₹{pending.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 5. Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Primary View Details Button - Opens Full-Screen Popup */}
          <button 
            onClick={() => setDetailsOpen(true)}
            className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            View Details
          </button>

          {/* Manage Quotations Button */}
          <button 
            onClick={() => onOpenQuotations && onOpenQuotations(event)}
            className="py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
            title="Progressive Quotation Versions & Agreement"
          >
            <FileText className="w-3.5 h-3.5" />
            Quotes ({event.versions?.length || 1})
          </button>
        </div>

      </div>

      {/* Full Screen Popup Dialog for View Details */}
      <EventDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        event={event}
        expenses={expenses}
        progressTrackingOptions={progressTrackingOptions}
        fetchEvents={fetchEvents}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenQuotations={onOpenQuotations}
      />
    </>
  );
}
