import { useState, useEffect } from 'react';
import { Plus, Settings, Phone, Mail, Calendar, Download, Send, Edit2, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingScreen from '../../../../components/LoadingScreen';
import ExpenseModal from './ExpenseModal';
import NewEventModal from './NewEventModal';
import ManagePredefinedServicesModal from './ManagePredefinedServicesModal';
import EventCard from './EventCard';
import { useSettingStore } from '../../../../store/settingStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BusinessEventsTab({ filter, hideSummary }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    fetchEvents();
  }, [filter]); // fetchEvents depends on filter

  useEffect(() => {
    if (!settings?.progressTrackingOptions) {
      fetchSettings();
    }
  }, []); // fetchSettings runs only on mount

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
        {events && events.map(event => (
            <EventCard 
              key={event._id}
              event={event}
              expenses={expenses}
              progressTrackingOptions={settings?.progressTrackingOptions || ['SHOOT COMPLETED', 'PHOTOS DELIVERED', 'VIDEOS DELIVERED']}
              fetchEvents={fetchEvents}
              onEdit={(evt) => { setSelectedEvent(evt); setEventModalOpen(true); }}
              onAddExpense={(id) => { setSelectedEventId(id); setExpenseModalOpen(true); }}
              onDelete={deleteEvent}
              formatCurrency={formatCurrency}
            />
          ))}
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
