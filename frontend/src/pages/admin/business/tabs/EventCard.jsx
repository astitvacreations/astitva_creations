import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventCard({ event, expenses, progressTrackingOptions, fetchEvents, onEdit, onAddExpense, onDelete, formatCurrency }) {
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
  const pending = total - (Number(localPaid) || 0);

  const expenseList = expenses.filter(e => e.referenceId === event._id);
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

  return (
    <div className="bg-[#0f0f11] border border-[#222] rounded-xl overflow-hidden flex flex-col p-6 relative w-full md:w-[400px]">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-xl font-heading font-bold text-white uppercase tracking-wider">{event.customerName}</h4>
        <div className="flex gap-2">
          <button className="text-[10px] uppercase font-bold tracking-wider text-[#22c55e] border border-[#22c55e]/30 px-3 py-1 rounded hover:bg-[#22c55e]/10 transition-colors">Overview</button>
          <button onClick={() => onEdit(event)} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-white bg-[#222] border border-[#333] px-3 py-1 rounded hover:bg-[#333] transition-colors">Edit <Edit2 className="w-3 h-3 ml-1 text-orange-400" /></button>
        </div>
      </div>
      <div className="text-[11px] text-[#A1A1A1] mb-6 space-y-0.5">
        <p>{event.phone}</p>
        <p>{event.email}</p>
      </div>

      {/* Grid Details */}
      <div className="bg-[#151515] rounded-xl border border-[#222] p-4 grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1">Events</p>
          <p className="text-xs font-semibold text-white">{event.eventName}</p>
        </div>
        <div>
          <p className="text-[9px] text-[#666] uppercase tracking-wider mb-1">Date</p>
          <p className="text-xs font-semibold text-[#22c55e]">
            {event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : 'TBD'}
          </p>
        </div>
      </div>

      {/* Payment Tracking */}
      <div className="bg-[#151515] rounded-xl border border-[#222] p-4 mb-6">
        <h5 className="text-sm font-heading font-bold text-white uppercase tracking-widest mb-4">Payment Tracking</h5>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1">Total</p>
            <input type="text" readOnly value={total} className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none" />
          </div>
          <div>
            <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1">Paid So Far</p>
            <input type="number" value={localPaid} onChange={e => setLocalPaid(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-white text-xs focus:border-[#22c55e] outline-none" />
          </div>
          <div>
            <p className="text-[9px] text-[#A1A1A1] uppercase tracking-wider mb-1">Pending</p>
            <input type="text" readOnly value={pending} className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none" />
          </div>
        </div>
        <button onClick={handleUpdatePayment} className="w-full py-2.5 bg-[#1e293b] hover:bg-[#334155] text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
          Update Payment
        </button>
      </div>

      {/* Status & Notes Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="col-span-2 bg-[#151515] rounded-xl border border-[#222] p-4 flex flex-col justify-center">
          <p className="text-[9px] text-[#666] uppercase tracking-wider mb-2 font-bold">Shoot Status (Manual)</p>
          <input 
            type="text" 
            placeholder="e.g. Editing Complete" 
            value={shootStatus}
            onChange={e => setShootStatus(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-xs focus:border-[var(--color-gold)] outline-none" 
          />
        </div>
      </div>

      {/* Follow up Notes */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-orange-400">📝</span>
          <p className="text-[10px] text-[#22c55e] uppercase tracking-wider font-bold">Follow-Up Notes ({notes.length > 0 ? '1' : '0'})</p>
        </div>
        <textarea 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes here..."
          className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-white text-xs min-h-[60px] focus:border-[var(--color-gold)] outline-none"
        ></textarea>
      </div>

      {/* Progress Tracking */}
      <div className="bg-[#151515] rounded-xl border border-[#222] p-4 mb-6">
        <p className="text-[10px] text-[#666] uppercase tracking-wider mb-3 font-bold">Progress Tracking</p>
        <div className="space-y-3">
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

      {/* Save Details row */}
      <div className="flex gap-4 mb-8">
        <select 
          value={status}
          onChange={e => setStatus(e.target.value)}
          className={`flex-1 bg-[#050505] border border-[#222] rounded px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none ${
            status === 'CONFIRMED' ? 'text-[#22c55e]' : status === 'PENDING' ? 'text-orange-400' : status === 'CANCELLED' ? 'text-red-500' : 'text-blue-500'
          }`}
        >
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button onClick={handleSaveDetails} className="flex-1 py-2 bg-[#1e293b] hover:bg-[#334155] text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
          Save Details
        </button>
      </div>

      {/* Shoot Expenses */}
      <div className="mb-6 pt-4 border-t border-[#222]">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] text-[#A1A1A1] font-heading font-bold uppercase tracking-widest">Shoot Expenses</p>
          <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider">Total: Rs. {expenseTotal}</span>
        </div>
        
        <button onClick={() => setShowExpenses(!showExpenses)} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2.5 text-[10px] text-[#A1A1A1] uppercase tracking-wider font-bold hover:bg-[#1a1a1a] transition-colors mb-3">
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
      <button onClick={() => onDelete(event._id)} className="w-full py-3 bg-[#450a0a] hover:bg-[#7f1d1d] text-red-300 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors mt-auto">
        Delete Booking
      </button>

    </div>
  );
}
