import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Terminal, Database, Server, RefreshCw, Activity, Code, Mail, ShieldAlert, Trash2, Clock } from 'lucide-react';
import { useSettingStore } from '../../store/settingStore';

export default function DeveloperOptions() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  
  const { settings, updateSettings, fetchSettings } = useSettingStore();

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchHealth = async () => {
    try {
      const response = await fetch(`${apiBase}/health`);
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (!confirm('This will log you out and refresh the entire system. Your data (projects, etc.) will NOT be deleted. Proceed?')) return;
    setClearing(true);
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => {
      setClearing(false);
      window.location.reload();
    }, 1500);
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch(`${apiBase}/health/test-email`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
    } catch (err) {
      alert('Failed to send test email. Check backend logs.');
    } finally {
      setTestingEmail(false);
    }
  };

  const toggleMaintenance = async () => {
    const action = settings.isMaintenanceMode ? 'DISABLE' : 'ENABLE';
    if (!confirm(`Are you sure you want to ${action} Maintenance Mode? \n\nThis will affect what public users see.`)) return;
    
    try {
      // Use the clean update logic from the store
      await updateSettings({ ...settings, isMaintenanceMode: !settings.isMaintenanceMode });
      await fetchSettings();
      alert(`Maintenance Mode ${!settings.isMaintenanceMode ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      alert(`Error: ${err.message || 'Failed to update maintenance mode.'}`);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <>
      <Helmet>
        <title>Developer Options | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-8 max-w-6xl pb-12">
        <div>
          <h2 className="font-heading text-3xl text-white mb-1 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-[var(--color-gold)]" /> Developer Options
          </h2>
          <p className="text-[#A1A1A1] text-sm">Advanced system controls, environment variables, and health metrics.</p>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-[#222] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className={`w-5 h-5 ${healthData?.database === 'Connected' ? 'text-green-500' : 'text-red-500'}`} />
              <h3 className="font-heading text-xl text-white">Database</h3>
            </div>
            <div className={`px-3 py-2 bg-[#0a0a0a] border border-[#333] font-mono text-xs font-bold uppercase tracking-widest ${healthData?.database === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>
              {loading ? 'Checking...' : healthData?.database || 'Disconnected'}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-[#222] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-green-500" />
              <h3 className="font-heading text-xl text-white">Server Node</h3>
            </div>
            <div className="px-3 py-2 bg-[#0a0a0a] border border-[#333] text-green-500 font-mono text-xs font-bold uppercase tracking-widest">
              Online • {formatUptime(healthData?.uptime)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-[#222] p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className={`w-5 h-5 ${settings.isMaintenanceMode ? 'text-orange-500' : 'text-[#555]'}`} />
              <h3 className="font-heading text-xl text-white">Public Status</h3>
            </div>
            <div className={`px-3 py-2 bg-[#0a0a0a] border border-[#333] font-mono text-xs font-bold uppercase tracking-widest ${settings.isMaintenanceMode ? 'text-orange-500' : 'text-blue-500'}`}>
              {settings.isMaintenanceMode ? 'Maintenance ON' : 'Live & Public'}
            </div>
          </motion.div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#111] border border-[#222] p-8">
            <h3 className="font-heading text-xl text-white mb-6">System Control</h3>
            <div className="space-y-4">
              <button 
                onClick={toggleMaintenance}
                className={`w-full py-4 border font-bold text-xs uppercase tracking-widest transition-all ${
                  settings.isMaintenanceMode 
                    ? 'bg-orange-500/10 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black' 
                    : 'bg-transparent border-[#333] text-[#A1A1A1] hover:border-orange-500 hover:text-orange-500'
                }`}
              >
                {settings.isMaintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
              </button>

              {settings.isMaintenanceMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-gold)] uppercase tracking-[0.2em] font-bold">
                    <Clock className="w-3 h-3" /> Expected Return Time
                  </div>
                  <input 
                    type="datetime-local"
                    value={settings.maintenanceUntil ? new Date(new Date(settings.maintenanceUntil).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateSettings({ ...settings, maintenanceUntil: e.target.value })}
                    className="w-full bg-[#050505] border border-[#333] px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-gold)] transition-colors appearance-none cursor-pointer hover:border-[#444]"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-[9px] text-[#555] italic">This will display as a "Back by" message on the maintenance page.</p>
                </motion.div>
              )}
              
              <button 
                onClick={handleClearCache}
                disabled={clearing}
                className="w-full py-4 bg-transparent border border-[#333] text-[#A1A1A1] hover:text-white hover:border-[#666] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${clearing ? 'animate-spin text-[var(--color-gold)]' : ''}`} />
                {clearing ? 'Purging Cache...' : 'Force System Refresh'}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#111] border border-[#222] p-8">
            <h3 className="font-heading text-xl text-white mb-6">Service Tests</h3>
            <div className="space-y-4">
              <button 
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="w-full py-4 bg-transparent border border-[#333] text-[#A1A1A1] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {testingEmail ? 'Sending Test...' : 'Send Test Email (SMTP)'}
              </button>

              <button 
                className="w-full py-4 bg-transparent border border-[#333] text-[#A1A1A1] opacity-50 cursor-not-allowed flex items-center justify-center gap-3 text-xs uppercase tracking-widest font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Purge Expired Tokens
              </button>
            </div>
          </motion.div>
        </div>

        {/* Env Vars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111] border border-[#222]">
          <div className="p-4 border-b border-[#222] flex items-center gap-3">
            <Code className="w-5 h-5 text-[#777]" />
            <h3 className="font-heading text-lg text-white">Environment Variables (Redacted)</h3>
          </div>
          <div className="p-6 overflow-x-auto bg-[#0a0a0a]">
            <pre className="text-[#A1A1A1] text-xs font-mono leading-relaxed">
{loading ? 'Fetching Environment Config...' : Object.entries(healthData?.env || {}).map(([key, value]) => (
  `${key}=${value}\n`
))}
            </pre>
          </div>
        </motion.div>
      </div>
    </>
  );
}
