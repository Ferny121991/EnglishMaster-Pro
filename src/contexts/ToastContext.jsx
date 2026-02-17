import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLORS = {
    success: { bg: 'bg-neon-green/10', border: 'border-neon-green/30', text: 'text-neon-green', shadow: 'shadow-[0_0_30px_rgba(0,255,136,0.1)]' },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' },
    warning: { bg: 'bg-neon-orange/10', border: 'border-neon-orange/30', text: 'text-neon-orange', shadow: 'shadow-[0_0_30px_rgba(255,165,0,0.1)]' },
    info: { bg: 'bg-neon-blue/10', border: 'border-neon-blue/30', text: 'text-neon-blue', shadow: 'shadow-[0_0_30px_rgba(0,209,255,0.1)]' },
};

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
    const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
    const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
    const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" style={{ maxWidth: '380px' }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => {
                        const Icon = ICONS[toast.type];
                        const c = COLORS[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-2xl ${c.bg} ${c.border} ${c.shadow}`}
                            >
                                <Icon size={18} className={`${c.text} mt-0.5 shrink-0`} />
                                <p className="text-sm text-white/90 font-medium flex-1 leading-relaxed">{toast.message}</p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-white/30 hover:text-white/60 transition-colors shrink-0 mt-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
