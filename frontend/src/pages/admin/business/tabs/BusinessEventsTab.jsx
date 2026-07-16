import { useState, useEffect } from 'react';
import { Plus, Settings, Phone, Mail, Calendar, Download, Send, Edit2, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingScreen from '../../../../components/LoadingScreen';
import ExpenseModal from './ExpenseModal';
import NewEventModal from './NewEventModal';
import ManagePredefinedServicesModal from './ManagePredefinedServicesModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BusinessEventsTab({ filter, hideSummary }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filter).toString();
      const res = await fetch(`${API_URL}/business/events?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete associated expenses.')) return;
    try {
      const res = await fetch(`${API_URL}/events/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = async (eventId, eventName) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/pdf`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to download PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Astitva_Creations_Invoice_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleSendPDF = async (eventId) => {
    if (!window.confirm('Send official invoice PDF to the client?')) return;
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/send-pdf`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Invoice sent successfully!');
      } else {
        alert(`Failed to send invoice: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending PDF email:', err);
      alert('Failed to send invoice email.');
    }
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-[var(--color-gold)]">Loading data...</div>;
  if (!data) return <div className="text-[#A1A1A1]">No data available.</div>;

  const { events, expenses, summary } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getEventExpense = (eventId) => {
    return expenses.filter(e => e.referenceId === eventId).reduce((sum, e) => sum + e.amount, 0);
  };

  const chartData = [
    { name: 'Total Business', value: summary.totalBusiness, color: '#3b82f6' },
    { name: 'Pending', value: summary.pendingAmount, color: '#eab308' },
    { name: 'Total Expenses', value: summary.totalExpenses, color: '#ef4444' },
    { name: 'Net Profit', value: Math.max(0, summary.netProfit), color: '#22c55e' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      {!hideSummary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Business</p>
                <h3 className="text-3xl font-bold text-green-500 mt-2">{formatCurrency(summary.totalBusiness)}</h3>
              </div>
              <p className="text-xs text-[#A1A1A1] mt-4">Events: {formatCurrency(summary.totalBusiness)}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Pending Amount</p>
                <h3 className="text-3xl font-bold text-[var(--color-gold)] mt-2">{formatCurrency(summary.pendingAmount)}</h3>
              </div>
              <p className="text-xs text-[#A1A1A1] mt-4">Events: {formatCurrency(summary.pendingAmount)}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Expenses</p>
                <h3 className="text-3xl font-bold text-red-500 mt-2">{formatCurrency(summary.totalExpenses)}</h3>
              </div>
              <p className="text-xs text-[#A1A1A1] mt-4">Events: {formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Net Profit</p>
                <h3 className={`text-3xl font-bold mt-2 text-white`}>
                  {formatCurrency(summary.netProfit)}
                </h3>
              </div>
              <p className="text-xs text-[#A1A1A1] mt-4">Events: {formatCurrency(summary.netProfit)}</p>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            {/* Chart */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--color-gold)] uppercase tracking-wider">Financial Breakdown</h3>
                <p className="text-[#A1A1A1] text-xs mt-2 mb-8">Visual representation of earnings and expenses for the current view.</p>
                <div className="space-y-4">
                  {chartData.filter(c => c.name !== 'Net Profit').map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-[#A1A1A1]">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </div>
                      <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm mt-4">
                    <div className="flex items-center gap-2 text-[#A1A1A1]">
                      <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
                      Net Profit
                    </div>
                    <span className="font-bold text-white">{formatCurrency(summary.netProfit)}</span>
                  </div>
                </div>
              </div>
              <div className="h-64 flex-1">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(c => c.name !== 'Net Profit')}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.filter(c => c.name !== 'Net Profit').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#222', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', color: '#A1A1A1' }} payload={
                        chartData.map(item => ({
                          id: item.name,
                          type: 'square',
                          value: item.name,
                          color: item.color
                        }))
                      } />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#A1A1A1]">
                    No financial data to display for this period
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Events Header Actions */}
      <div className="flex justify-between items-center mt-12 mb-4">
        <h3 className="text-lg font-heading text-[#A1A1A1] uppercase tracking-wider text-sm">Events ({events.length})</h3>
        <div className="flex gap-4">
          <button onClick={() => setServicesModalOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-transparent border border-[#333] text-white rounded hover:bg-[#222] transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider">Manage Services</span>
          </button>
          <button onClick={() => { setSelectedEvent(null); setEventModalOpen(true); }} className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider">+ New Event</span>
          </button>
        </div>
      </div>

      {/* Events List Container */}
      <div className="bg-[#050505] rounded-xl border border-[#222] p-6 min-h-[500px]">
        <div className="flex flex-wrap gap-6">
        {(!events || events.length === 0) && (
          <div className="col-span-full py-12 text-center text-[#A1A1A1] bg-[#111] rounded-xl border border-[#222]">
            No events found for this period.
          </div>
        )}
        {events && events.map(event => {
          const total = event.finalTotal || 0;
          const paid = event.paidAmount || 0;
          const pending = total - paid;
          const expenseList = expenses.filter(e => e.referenceId === event._id);
          const expenseTotal = expenseList.reduce((sum, e) => sum + e.amount, 0);
          
          const servicesTotal = (event.subEvents || []).flatMap(se => se.services || []).reduce((sum, s) => sum + (s.price || 0), 0);
          const computedDiscount = (servicesTotal > total) ? (servicesTotal - total) : (event.discountAmount || 0);
          
          return (
            <div key={event._id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden flex flex-col p-4 relative group w-full md:w-[320px] lg:w-[350px]">
              <div className="absolute top-4 right-4 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#050505] border border-[#222] p-2 rounded-lg shadow-xl z-10">
                <button 
                  onClick={() => { setSelectedEventId(event._id); setExpenseModalOpen(true); }}
                  className="text-white text-xs font-bold hover:text-gray-300 transition-colors"
                >
                  + Expense
                </button>
                <button 
                  onClick={() => handleDownloadPDF(event._id, event.customerName || 'Client')}
                  className="text-blue-500 text-xs font-bold hover:text-blue-400 transition-colors"
                >
                  Download PDF
                </button>
                <button 
                  onClick={() => handleSendPDF(event._id)}
                  className="text-[#22c55e] text-xs font-bold hover:text-[#16a34a] transition-colors"
                >
                  Send PDF
                </button>
                <button 
                  onClick={() => { setSelectedEvent(event); setEventModalOpen(true); }}
                  className="text-[var(--color-gold)] text-xs font-bold hover:opacity-80 transition-opacity"
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteEvent(event._id)}
                  className="text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-base font-bold text-white">{event.eventName}</h4>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider mt-1">{event.status}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#A1A1A1] uppercase tracking-wider block">Total</span>
                  <span className="font-bold text-white text-sm">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="bg-[#050505] p-3 rounded-lg border border-[#222] mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-[#22c55e] font-bold uppercase">Client:</span>
                  <span className="text-xs text-white">{event.customerName}</span>
                </div>
                {event.phone && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#A1A1A1] font-bold uppercase">Phone:</span>
                    <span className="text-xs text-[#A1A1A1]">{event.phone}</span>
                  </div>
                )}
                {event.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A1A1A1] font-bold uppercase">Email:</span>
                    <span className="text-xs text-[#A1A1A1]">{event.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[#222]">
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Total</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Paid</p>
                  <p className="text-xs font-semibold text-[#22c55e]">{formatCurrency(paid)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Pending</p>
                  <p className="text-xs font-semibold text-[var(--color-gold)]">{formatCurrency(pending)}</p>
                </div>
              </div>

              {(event.subEvents && event.subEvents.length > 0) && (
                <div className="mt-4">
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider mb-2">Services</p>
                  <div className="space-y-1">
                    {event.subEvents.flatMap(se => se.services || []).filter(Boolean).map((serv, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-[#A1A1A1] truncate max-w-[150px]">{serv?.name || 'Unknown'}</span>
                        <span className="text-xs text-[#A1A1A1]">{formatCurrency(serv?.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(computedDiscount > 0) && (
                <div className="mt-2 pt-2 border-t border-[#222]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Discount</span>
                    <span className="text-xs text-orange-400 font-semibold">- {formatCurrency(computedDiscount)}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-2 border-t border-[#222]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Expenses</p>
                  <span className="text-xs text-red-500">{formatCurrency(expenseTotal)}</span>
                </div>
                <div className="space-y-1">
                  {expenseList.map(exp => (
                    <div key={exp._id} className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1A1] truncate max-w-[150px]">{exp.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A1A1A1]">{formatCurrency(exp.amount)}</span>
                        <button className="text-[10px] text-blue-500 hover:text-blue-400">Edit</button>
                        <button onClick={() => deleteExpense(exp._id)} className="text-[10px] text-red-500 hover:text-red-400">X</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
        </div>
      </div>

      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
        category="EVENT" 
        referenceId={selectedEventId} 
        onSave={fetchEvents} 
      />
      
      <ManagePredefinedServicesModal
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        apiBase={API_URL}
      />
      
      <NewEventModal 
        isOpen={eventModalOpen}
        onClose={() => { setEventModalOpen(false); setSelectedEvent(null); }}
        onSuccess={fetchEvents}
        apiBase={API_URL}
        initialData={selectedEvent}
      />
    </div>
  );
}
