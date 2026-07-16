import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export default function ViewExpensesModal({ isOpen, onClose, expenses, onEdit, onDelete }) {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider text-sm">Expenses Details</h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-[#A1A1A1]">
              No expenses recorded.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {expenses.map((expense) => (
                <div key={expense._id} className="bg-[#050505] border border-[#222] rounded-lg p-4 flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-white">{expense.expenseName}</h4>
                    <p className="text-xs text-[#A1A1A1] mt-1">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                    {expense.description && (
                      <p className="text-xs text-[#A1A1A1] mt-2 italic">{expense.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="font-bold text-red-500">{formatCurrency(expense.amount)}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(expense)} 
                        className="p-1.5 bg-[#1a1a1a] text-blue-400 rounded hover:bg-[#222] hover:text-blue-300 transition-colors"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDelete(expense._id)} 
                        className="p-1.5 bg-[#1a1a1a] text-red-500 rounded hover:bg-[#222] hover:text-red-400 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
