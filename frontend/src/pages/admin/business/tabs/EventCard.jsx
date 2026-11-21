import { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Download, 
  Award,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPaid, setLocalPaid] = useState(event.paidAmount || '');
  const [shootStatus, setShootStatus] = useState(event.shootStatus || '');
  const [notes, setNotes] = useState(event.notes || '');
  const [status, setStatus] = useState(event.status || 'PENDING');
  const [progress, setProgress] = useState(event.progressTracking || []);
  const [inlineExpenseName, setInlineExpenseName] = useState('');
  const [inlineExpenseAmount, setInlineExpenseAmount] = useState('');
  const [showExpenses, setShowExpenses] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');

  const total = event.finalTotal || 0;
  const pending = Math.max(0, total - (Number(localPaid) || 0));

  const expenseList = (expenses || []).filter(e => e.referenceId === event._id);
  const expenseTotal = expenseList.reduce((sum, e) => sum + e.amount, 0);

  const handleUpdatePayment = async () => {
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paidAmount: localPaid })
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shootStatus, notes, status, progressTracking: progress })
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProgress = (opt) => {
    setProgress(prev => {
      const newArr = prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt];
      return newArr;
    });
  };

  const handleInlineAddExpense = async () => {
    if (!inlineExpenseName.trim() || !inlineExpenseAmount) return;
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expenseName: inlineExpenseName,
          amount: Number(inlineExpenseAmount),
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          category: 'EVENT',
          referenceId: event._id,
          onModel: 'Event'
        })
      });
      if (res.ok) {
        setInlineExpenseName('');
        setInlineExpenseAmount('');
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleInlineDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleInlineEditExpense = async (expenseId) => {
    if (!editExpenseName.trim() || !editExpenseAmount) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expenseName: editExpenseName,
          amount: Number(editExpenseAmount)
        })
      });
      if (res.ok) {
        setEditingExpenseId(null);
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };

  const statusColorClass = 
    status === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' :
    status === 'COMPLETED' ? 'text-blue-400 bg-blue-950/60 border-blue-500/30' :
    status === 'CANCELLED' ? 'text-rose-400 bg-rose-950/60 border-rose-500/30' :
    'text-amber-400 bg-amber-950/60 border-amber-500/30';

  return (
    <div className="bg-[#0f0f11] border border-[#222] hover:border-[#333] rounded-2xl overflow-hidden flex flex-col p-5 relative w-full md:w-[380px] transition-all shadow-xl">
      
      {/* 1. Header: Customer Name + Status Badge + Edit Button */}
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
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-950/70 text-green-400 border border-green-500/30 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Agreement
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-[var(--color-gold)] border border-[var(--color-gold)]/30">
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

      {/* 2. Contact Details: Phone Number & Email */}
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

      {/* 3. Event Name & Date Grid */}
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
      <div className="bg-[#09090b] rounded-lg border border-[#222] p-2.5 flex items-center justify-between text-xs mb-3">
        <div>
          <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Total</span>
          <span className="font-bold text-white">₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Paid</span>
          <span className="font-bold text-green-400">₹{Number(localPaid || 0).toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-[9px] text-[#777] uppercase tracking-wider block font-bold">Pending</span>
          <span className="font-bold text-amber-400">₹{pending.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 5. Primary Card Action Buttons (Compact View) */}
      <div className="flex items-center gap-2 mb-1">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isExpanded 
              ? 'bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#333]'
              : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {isExpanded ? (
            <>
              Hide Details <ChevronUp className="w-4 h-4 ml-0.5" />
            </>
          ) : (
            <>
              View Details <ChevronDown className="w-4 h-4 ml-0.5" />
            </>
          )}
        </button>

        <button 
          onClick={() => onOpenQuotations && onOpenQuotations(event)}
          className="py-2.5 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
          title="Progressive Quotation Versions & Agreement"
        >
          <FileText className="w-3.5 h-3.5" />
          Quotes ({event.versions?.length || 1})
        </button>
      </div>

      {/* ================================================================ */}
      {/* 6. EXPANDED VIEW: ALL EVENT FEATURES & WORKFLOW CONTROLS          */}
      {/* ================================================================ */}
      {isExpanded && (
        <div className="pt-4 border-t border-[#222] space-y-5 mt-3">

          {/* Quotations & Agreement Banner with PDF Download */}
          <div className="bg-[#151515] rounded-xl border border-[#222] p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">📜</span>
                <span className="text-[11px] font-heading font-bold text-white uppercase tracking-wider">
                  {event.agreementVersionNumber ? (
                    <span className="text-green-400 font-bold">★ Final Agreement Active</span>
                  ) : (
                    <span className="text-[var(--color-gold)]">Quotation {event.activeQuotationNumber || '1'} (Active)</span>
                  )}
                </span>
              </div>
              <span className="text-[10px] bg-[#222] text-[#A1A1A1] px-2 py-0.5 rounded font-mono">
                {event.versions?.length || 1} {event.versions?.length === 1 ? 'version' : 'versions'}
              </span>
            </div>

            <p className="text-[10px] text-[#888] mb-3 line-clamp-1">
              {event.agreementVersionNumber 
                ? `Final contract bound to Quotation ${event.agreementVersionNumber}` 
                : (event.versions?.find(v => v.versionNumber === event.activeVersionNumber)?.note || 'Active quotation snapshot')}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onOpenQuotations && onOpenQuotations(event)}
                className="w-full py-2 bg-[var(--color-gold)]/15 hover:bg-[var(--color-gold)]/25 text-[var(--color-gold)] border border-[var(--color-gold)]/40 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Manage Quotes
              </button>
              <button 
                onClick={() => {
                  const url = event.agreementVersionNumber 
                    ? `${API_URL}/events/${event._id}/agreement.pdf`
                    : `${API_URL}/events/${event._id}/download-pdf`;
                  window.open(url, '_blank');
                }}
                className="w-full py-2 bg-[#222] hover:bg-[#2a2a2a] text-white border border-[#333] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-orange-400" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Payment Tracking */}
          <div className="bg-[#151515] rounded-xl border border-[#222] p-4">
            <h5 className="text-xs font-heading font-bold text-white uppercase tracking-widest mb-3">Payment Tracking</h5>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1 font-bold">Total</p>
                <input type="text" readOnly value={`₹${total}`} className="w-full bg-[#0a0a0a] border border-[#222] rounded px-2.5 py-1.5 text-white text-xs outline-none" />
              </div>
              <div>
                <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1 font-bold">Paid So Far</p>
                <input 
                  type="number" 
                  value={localPaid} 
                  onChange={e => setLocalPaid(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded px-2.5 py-1.5 text-white text-xs focus:border-[#22c55e] outline-none" 
                />
              </div>
              <div>
                <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1 font-bold">Pending</p>
                <input type="text" readOnly value={`₹${pending}`} className="w-full bg-[#0a0a0a] border border-[#222] rounded px-2.5 py-1.5 text-amber-400 text-xs outline-none" />
              </div>
            </div>
            <button onClick={handleUpdatePayment} className="w-full py-2 bg-[#1e293b] hover:bg-[#334155] text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
              Update Payment
            </button>
          </div>

          {/* Shoot Status (Manual) */}
          <div className="bg-[#151515] rounded-xl border border-[#222] p-4">
            <p className="text-[9px] text-[#666] uppercase tracking-wider mb-2 font-bold">Shoot Status (Manual)</p>
            <input 
              type="text" 
              placeholder="e.g. Editing Complete" 
              value={shootStatus}
              onChange={e => setShootStatus(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[var(--color-gold)] outline-none" 
            />
          </div>

          {/* Follow-up Notes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-orange-400">📝</span>
              <p className="text-[10px] text-[#22c55e] uppercase tracking-wider font-bold">
                Follow-Up Notes ({notes.length > 0 ? '1' : '0'})
              </p>
            </div>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add follow-up notes here..."
              className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-white text-xs min-h-[60px] focus:border-[var(--color-gold)] outline-none"
            />
          </div>

          {/* Progress Tracking */}
          <div className="bg-[#151515] rounded-xl border border-[#222] p-4">
            <p className="text-[10px] text-[#666] uppercase tracking-wider mb-3 font-bold">Progress Tracking</p>
            <div className="space-y-2.5">
              {progressTrackingOptions.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${progress.includes(opt) ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#444] group-hover:border-[#666] bg-transparent'}`}>
                    {progress.includes(opt) && <div className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={progress.includes(opt)} onChange={() => toggleProgress(opt)} />
                  <span className="text-[11px] text-[#A1A1A1] uppercase tracking-wider">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Dropdown & Save Details */}
          <div className="flex gap-3">
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={`flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none ${
                status === 'CONFIRMED' ? 'text-[#22c55e]' : status === 'PENDING' ? 'text-orange-400' : status === 'CANCELLED' ? 'text-red-500' : 'text-blue-500'
              }`}
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button onClick={handleSaveDetails} className="flex-1 py-2 bg-[#1e293b] hover:bg-[#334155] text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors">
              Save Details
            </button>
          </div>

          {/* Shoot Expenses */}
          <div className="pt-3 border-t border-[#222]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] text-[#A1A1A1] font-heading font-bold uppercase tracking-widest">Shoot Expenses</p>
              <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider">Total: Rs. {expenseTotal}</span>
            </div>
            
            <button onClick={() => setShowExpenses(!showExpenses)} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[10px] text-[#A1A1A1] uppercase tracking-wider font-bold hover:bg-[#1a1a1a] transition-colors mb-2">
              {showExpenses ? 'Hide Details' : `View Details (${expenseList.length})`}
            </button>

            {showExpenses && expenseList.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 mb-3 max-h-32 overflow-y-auto space-y-2">
                {expenseList.map(exp => (
                  <div key={exp._id} className="flex justify-between items-center text-xs text-[#A1A1A1]">
                    {editingExpenseId === exp._id ? (
                      <div className="flex flex-1 gap-2 mr-2">
                        <input 
                          type="text" 
                          value={editExpenseName} 
                          onChange={e => setEditExpenseName(e.target.value)} 
                          className="flex-[2] min-w-0 bg-[#151515] border border-[#333] rounded px-2 py-1 text-white outline-none focus:border-[#555]"
                        />
                        <input 
                          type="number" 
                          value={editExpenseAmount} 
                          onChange={e => setEditExpenseAmount(e.target.value)} 
                          className="flex-1 min-w-0 bg-[#151515] border border-[#333] rounded px-2 py-1 text-white outline-none focus:border-[#555]"
                        />
                        <button onClick={() => handleInlineEditExpense(exp._id)} className="text-[#22c55e] hover:text-green-400 font-bold px-1">Save</button>
                        <button onClick={() => setEditingExpenseId(null)} className="text-[#666] hover:text-[#999] font-bold px-1">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate pr-2">{exp.expenseName}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-white font-bold">Rs. {exp.amount}</span>
                          <button onClick={() => {
                            setEditingExpenseId(exp._id);
                            setEditExpenseName(exp.expenseName);
                            setEditExpenseAmount(exp.amount);
                          }} className="text-blue-500 hover:text-blue-400">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleInlineDeleteExpense(exp._id)} className="text-red-500 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Expense detail..." 
                value={inlineExpenseName}
                onChange={(e) => setInlineExpenseName(e.target.value)}
                className="flex-[2] min-w-0 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#444]" 
              />
              <input 
                type="number" 
                placeholder="Rs. 0" 
                value={inlineExpenseAmount}
                onChange={(e) => setInlineExpenseAmount(e.target.value)}
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#444]" 
              />
              <button 
                onClick={handleInlineAddExpense} 
                className="shrink-0 whitespace-nowrap bg-[#064e3b] hover:bg-[#065f46] text-[#34d399] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Delete Booking */}
          <button onClick={() => onDelete(event._id)} className="w-full py-2.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-red-300 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors mt-2">
            Delete Booking
          </button>
        </div>
      )}

    </div>
  );
}
