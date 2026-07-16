import { useState } from 'react';
import { Search } from 'lucide-react';
import BusinessRentalsTab from '../business/tabs/BusinessRentalsTab';

export default function PropRentalsPage() {
  const [period, setPeriod] = useState('all'); // all, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222] pb-6">
        {/* Single header for the standalone page */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          <span className="pb-4 text-sm font-semibold tracking-widest uppercase transition-colors relative whitespace-nowrap text-[var(--color-gold)]">
            PROPS RENTALS
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-gold)]" />
          </span>
        </div>
      </div>
      
      <div className="bg-[#111] p-4 rounded-xl border border-[#222] flex flex-wrap items-center gap-3">
        <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-[#222]">
          <button onClick={() => setPeriod('all')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'all' ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}>ALL TIME</button>
          <button onClick={() => setPeriod('week')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'week' ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}>THIS WEEK</button>
          <button onClick={() => setPeriod('month')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'month' ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}>THIS MONTH</button>
          <button onClick={() => setPeriod('custom')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${period === 'custom' ? 'bg-white text-black' : 'text-[#A1A1A1] hover:text-white'}`}>DATE RANGE</button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-4 py-2 text-sm bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]" />
            <span className="text-[#A1A1A1]">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-4 py-2 text-sm bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]" />
          </div>
        )}

        <div className="relative ml-auto">
          <input type="text" placeholder="Search name, phone, email.." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-4 pr-10 py-2 text-sm bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors w-64" />
        </div>
      </div>

      <BusinessRentalsTab filter={{ period, startDate, endDate, search }} hideSummary={true} />
    </div>
  );
}
