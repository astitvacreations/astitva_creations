import { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingScreen from '../../../../components/LoadingScreen';
import ExpenseModal from './ExpenseModal';
import ManageInventoryModal from './ManageInventoryModal';
import NewPropRentalModal from './NewPropRentalModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BusinessRentalsTab({ filter, hideSummary }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);

  useEffect(() => {
    fetchRentals();
  }, [filter]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filter).toString();
      const res = await fetch(`${API_URL}/business/rentals?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRental = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prop rental? This will also delete associated expenses.')) return;
    try {
      const res = await fetch(`${API_URL}/prop-rentals/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        fetchRentals();
      } else {
        alert(data.message || 'Failed to delete rental');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-[var(--color-gold)]">Loading data...</div>;
  if (!data) return <div className="text-[#A1A1A1]">No data available.</div>;

  const { rentals, expenses, summary, partnerShares } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getRentalExpense = (rentalId) => {
    return expenses.filter(e => e.referenceId === rentalId).reduce((sum, e) => sum + e.amount, 0);
  };

  const chartData = [
    { name: 'Total Business', value: summary.totalBusiness, color: '#3b82f6' },
    { name: 'Pending', value: summary.pendingAmount, color: '#eab308' },
    { name: 'Total Expenses', value: summary.totalExpenses, color: '#ef4444' },
    { name: 'Net Profit', value: Math.max(0, summary.netProfit), color: '#22c55e' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {!hideSummary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Business</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.totalBusiness)}</h3>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Pending Amount</p>
              <h3 className="text-2xl font-bold text-[var(--color-gold)] mt-1">{formatCurrency(summary.pendingAmount)}</h3>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(summary.totalExpenses)}</h3>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Net Profit</p>
              <h3 className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(summary.netProfit)}
              </h3>
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

      {/* Partner Profits */}
      {partnerShares && partnerShares.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[var(--color-gold)] mb-6 uppercase tracking-wider text-sm">Partner Profits (Props)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partnerShares.map(partner => (
              <div key={partner._id} className="p-4 border border-[#222] rounded-lg bg-[#111] flex justify-between items-center">
                <div>
                  <span className="font-bold text-white uppercase text-sm block">{partner.name}</span>
                  <span className="text-xs text-[#A1A1A1] mt-1 block">{partner.percentage}% Share</span>
                </div>
                <p className={`text-lg font-bold ${partner.share >= 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>
                  {formatCurrency(partner.share)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prop Rentals Details Header Actions */}
      <div className="flex justify-between items-center mt-12 mb-4">
        <h3 className="text-lg font-bold text-[#A1A1A1] uppercase tracking-wider text-sm">Prop Rentals Details</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => setInventoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] text-white rounded-md hover:bg-[#222] transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-wider">Manage Inventory</span>
          </button>
          <button 
            onClick={() => { setSelectedRental(null); setRentalModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-wider">New Prop Rental</span>
          </button>
        </div>
      </div>

      {/* Rentals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rentals.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#A1A1A1] bg-[#111] rounded-xl border border-[#222]">
            No prop rentals found for this period.
          </div>
        )}
        {rentals.map(rental => {
          const total = rental.finalTotal || 0;
          const paid = rental.paidAmount || 0;
          const pending = total - paid;
          const expense = getRentalExpense(rental._id);
          const profit = total - expense;
          
          return (
            <div key={rental._id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden flex flex-col p-4 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setSelectedRentalId(rental._id);
                    setExpenseModalOpen(true);
                  }}
                  className="px-2 py-1 bg-[#222] text-[#A1A1A1] hover:text-white rounded text-xs font-bold uppercase"
                  title="Add Expense"
                >
                  + Exp
                </button>
                <button 
                  onClick={() => { setSelectedRental(rental); setRentalModalOpen(true); }}
                  className="p-1 bg-[#222] text-[#A1A1A1] hover:text-blue-500 rounded"
                  title="Edit Rental"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteRental(rental._id)}
                  className="p-1 bg-[#222] text-[#A1A1A1] hover:text-red-500 rounded"
                  title="Delete Rental"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-base font-bold text-white">{rental.customerName}</h4>
                  <div className="text-xs text-[#A1A1A1] mt-1 space-y-0.5">
                    {rental.email && <div>{rental.email}</div>}
                    <div>{rental.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#A1A1A1] uppercase tracking-wider block">Total</span>
                  <span className="font-bold text-white text-sm">{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[#222]">
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Paid</p>
                  <p className="text-xs font-semibold text-[#22c55e]">{formatCurrency(paid)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Pending</p>
                  <p className="text-xs font-semibold text-[var(--color-gold)]">{formatCurrency(pending)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider">Profit</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(profit)}</p>
                </div>
              </div>

              {rental.itemsRented && rental.itemsRented.length > 0 && (
                <div className="mt-4 pt-2">
                  <p className="text-[10px] text-[#A1A1A1] uppercase tracking-wider mb-2">Items Rented</p>
                  <div className="space-y-2">
                    {rental.itemsRented.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-[#050505] p-2 rounded-lg">
                        <span className="text-xs text-white">{item.name || item}</span>
                        <span className="text-xs text-[#A1A1A1]">{formatCurrency(item.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
        category="PROP_RENTAL" 
        referenceId={selectedRentalId} 
        onSave={fetchRentals} 
      />

      <ManageInventoryModal
        isOpen={inventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
        apiBase={API_URL}
      />

      <NewPropRentalModal
        isOpen={rentalModalOpen}
        onClose={() => { setRentalModalOpen(false); setSelectedRental(null); }}
        apiBase={API_URL}
        onSuccess={fetchRentals}
        initialData={selectedRental}
      />
    </div>
  );
}
