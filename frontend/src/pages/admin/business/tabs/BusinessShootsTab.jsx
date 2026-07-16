import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, IndianRupee, Info, User, Phone, Mail, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingScreen from '../../../../components/LoadingScreen';
import ExpenseModal from './ExpenseModal';
import ViewExpensesModal from './ViewExpensesModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BusinessShootsTab({ filter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [viewExpensesModalOpen, setViewExpensesModalOpen] = useState(false);
  const [selectedShootId, setSelectedShootId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchShoots();
  }, [filter]);

  const fetchShoots = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filter).toString();
      const res = await fetch(`${API_URL}/business/shoots?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shoots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-[var(--color-gold)]">Loading data...</div>;
  if (!data) return <div className="text-[#A1A1A1]">No data available.</div>;

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchShoots();
    } catch (err) {
      console.error(err);
    }
  };

  const { shoots, expenses, summary, partnerShares } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getBookingExpense = (bookingId) => {
    return expenses.filter(e => e.referenceId === bookingId).reduce((sum, e) => sum + e.amount, 0);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Business</p>
            <h3 className="text-3xl font-bold text-green-500 mt-2">{formatCurrency(summary.totalBusiness)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(summary.totalBusiness)}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Pending Amount</p>
            <h3 className="text-3xl font-bold text-[var(--color-gold)] mt-2">{formatCurrency(summary.pendingAmount)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(summary.pendingAmount)}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Expenses</p>
            <h3 className="text-3xl font-bold text-red-500 mt-2">{formatCurrency(summary.totalExpenses)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoot Expenses: {formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Net Profit</p>
            <h3 className={`text-3xl font-bold mt-2 text-white`}>
              {formatCurrency(summary.netProfit)}
            </h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(summary.netProfit)}</p>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        {/* Chart */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Financial Breakdown</h3>
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

      {/* Partner Profits */}
      {partnerShares && partnerShares.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Partner Profits (Studio Shoots)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partnerShares.map(partner => (
              <div key={partner._id} className="p-4 border border-[#222] rounded-lg bg-[#111] flex justify-between items-center">
                <div>
                  <span className="font-bold text-white uppercase text-sm block">{partner.name}</span>
                  <span className="text-xs text-[#A1A1A1] mt-1 block">{partner.percentage}% Share</span>
                </div>
                <p className={`text-lg font-bold ${partner.share >= 0 ? 'text-green-500' : 'text-green-500'}`}>
                  {formatCurrency(partner.share)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shoots Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#222] flex justify-between items-center">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Studio Shoots Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#A1A1A1]">
            <thead className="text-xs uppercase text-[#A1A1A1] border-b border-[#222]">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Date / Name</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Total Amount</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Paid</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Pending</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Shoot Expenditure</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Shoot Profit</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {shoots.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-[#A1A1A1]">No studio shoots found for this period.</td>
                </tr>
              )}
              {shoots.map(shoot => {
                const total = shoot.finalTotal || shoot.estimatedPrice || 0;
                const paid = shoot.paidAmount || 0;
                const pending = total - paid;
                const expense = getBookingExpense(shoot._id);
                const profit = total - expense;
                
                return (
                  <tr key={shoot._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#A1A1A1] mb-1 text-xs">{new Date(shoot.eventDate || shoot.createdAt).toISOString().split('T')[0]}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#A1A1A1]">{shoot.customerName}</span>
                        <span className="px-1.5 py-0.5 text-[0.6rem] bg-[#222] text-[#A1A1A1] rounded uppercase tracking-wider border border-[#333]">
                          {shoot.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{formatCurrency(total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-500">{formatCurrency(paid)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--color-gold)]">{formatCurrency(pending)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">{formatCurrency(expense)}</span>
                        {expense > 0 && (
                          <button 
                            onClick={() => {
                              setSelectedShootId(shoot._id);
                              setViewExpensesModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 text-[0.6rem] bg-[#222] text-[#A1A1A1] rounded uppercase tracking-wider border border-[#333] hover:bg-[#333] transition-colors"
                          >
                            DETAIL
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-bold ${profit >= 0 ? 'text-white' : 'text-white'}`}>
                      {formatCurrency(profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => {
                          setSelectedShootId(shoot._id);
                          setSelectedExpense(null);
                          setExpenseModalOpen(true);
                        }}
                        className="px-2 py-1 text-xs bg-[#222] text-white rounded border border-[#333] hover:bg-[#333] transition-colors"
                      >
                        + Expense
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
        category="STUDIO_SHOOT" 
        referenceId={selectedShootId} 
        onSave={fetchShoots} 
        initialData={selectedExpense}
      />
      <ViewExpensesModal
        isOpen={viewExpensesModalOpen}
        onClose={() => setViewExpensesModalOpen(false)}
        expenses={expenses ? expenses.filter(e => e.referenceId === selectedShootId) : []}
        onEdit={(expense) => {
          setViewExpensesModalOpen(false);
          setSelectedShootId(expense.referenceId);
          setSelectedExpense(expense);
          setExpenseModalOpen(true);
        }}
        onDelete={deleteExpense}
      />
    </div>
  );
}
