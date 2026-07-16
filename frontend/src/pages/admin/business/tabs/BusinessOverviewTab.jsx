import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, TrendingDown, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingScreen from '../../../../components/LoadingScreen';
import ExpenseModal from './ExpenseModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#eab308']; // Green (Shoot), Red (Exp), Blue (Prop), Yellow (Event)

export default function BusinessOverviewTab({ filter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [filter]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filter).toString();
      const res = await fetch(`${API_URL}/business/overview?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch business overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center py-24 text-[var(--color-gold)]">Loading data...</div>;
  if (!data) return <div className="text-[#A1A1A1]">No data available.</div>;

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        fetchOverview();
      } else {
        alert(data.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  const { overview, breakdown, partnerShares, studioExpenses } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const chartData = [
    { name: 'Shoot Profits', value: Math.max(0, breakdown.shoots.profit), color: '#22c55e' },
    { name: 'Expenditure', value: overview.totalExpenses, color: '#ef4444' },
    { name: 'Prop Profits', value: Math.max(0, breakdown.rentals.profit), color: '#3b82f6' },
    { name: 'Event Profits', value: Math.max(0, breakdown.events.profit), color: '#eab308' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Business</p>
            <h3 className="text-3xl font-bold text-green-500 mt-2">{formatCurrency(overview.totalBusiness)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(breakdown.shoots.total)} | Rentals: {formatCurrency(breakdown.rentals.total)} | Events: {formatCurrency(breakdown.events.total)}</p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Pending Amount</p>
            <h3 className="text-3xl font-bold text-[var(--color-gold)] mt-2">{formatCurrency(overview.totalPending)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(breakdown.shoots.pending)} | Rentals: {formatCurrency(breakdown.rentals.pending)} | Events: {formatCurrency(breakdown.events.pending)}</p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Total Expenses</p>
            <h3 className="text-3xl font-bold text-red-500 mt-2">{formatCurrency(overview.totalExpenses)}</h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Studio: {formatCurrency(breakdown.studio.expenses)} | Shoot: {formatCurrency(breakdown.shoots.expenses)} | Events: {formatCurrency(breakdown.events.expenses)}</p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-[#A1A1A1] uppercase tracking-wider font-semibold">Net Profit</p>
            <h3 className={`text-3xl font-bold mt-2 ${overview.netProfit >= 0 ? 'text-white' : 'text-white'}`}>
              {formatCurrency(overview.netProfit)}
            </h3>
          </div>
          <p className="text-xs text-[#A1A1A1] mt-4">Shoots: {formatCurrency(breakdown.shoots.profit)} | Rentals: {formatCurrency(breakdown.rentals.profit)} | Events: {formatCurrency(breakdown.events.profit)}</p>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        {/* Chart */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Financial Breakdown</h3>
            <p className="text-[#A1A1A1] text-xs mt-2 mb-8">Visual representation of earnings and expenses for the current view.</p>
            <div className="space-y-4">
              {chartData.map((item, index) => (
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
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#222', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', color: '#A1A1A1' }} />
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
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Partner Profits (Overview)</h3>
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

      {/* Studio Expenditures */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Studio Expenditures</h3>
          <button 
            onClick={() => setExpenseModalOpen(true)}
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-md hover:bg-gray-200 transition-colors"
          >
            Add Expense
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#A1A1A1]">
            <thead className="text-xs uppercase text-[#A1A1A1] border-b border-[#222]">
              <tr>
                <th className="px-4 py-3 font-semibold tracking-wider">Date</th>
                <th className="px-4 py-3 font-semibold tracking-wider">Type</th>
                <th className="px-4 py-3 font-semibold tracking-wider">Expense Name</th>
                <th className="px-4 py-3 font-semibold tracking-wider text-right">Price</th>
                <th className="px-4 py-3 font-semibold tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {(!studioExpenses || studioExpenses.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-[#A1A1A1]">No studio expenses found for this period.</td>
                </tr>
              )}
              {studioExpenses && studioExpenses.map(expense => (
                <tr key={expense._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{expense.category}</td>
                  <td className="px-4 py-3 text-white">{expense.expenseName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-red-500">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button 
                      onClick={() => deleteExpense(expense._id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal 
        isOpen={expenseModalOpen} 
        onClose={() => setExpenseModalOpen(false)} 
        category="GENERAL_STUDIO" 
        referenceId={null} 
        onSave={fetchOverview} 
      />
    </div>
  );
}
