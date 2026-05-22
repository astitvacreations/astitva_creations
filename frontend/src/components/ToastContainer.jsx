import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToastStore } from '../store/toastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto min-w-[300px] bg-[#111] border border-[#222] p-4 flex items-center justify-between gap-4 shadow-2xl rounded-sm`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-white text-sm font-medium tracking-wide">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#555] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Progress bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
