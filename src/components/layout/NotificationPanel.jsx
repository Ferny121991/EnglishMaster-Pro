import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Megaphone, Clock, AlertTriangle, Star, BookOpen, Inbox, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const ICONS = {
    megaphone: Megaphone,
    clock: Clock,
    alert: AlertTriangle,
    star: Star,
    book: BookOpen,
    inbox: Inbox,
};

const COLORS = {
    blue: {
        bg: 'bg-neon-blue/10',
        border: 'border-neon-blue/20',
        text: 'text-neon-blue',
        dot: 'bg-neon-blue',
        glow: 'shadow-[0_0_12px_rgba(0,209,255,0.3)]',
    },
    purple: {
        bg: 'bg-neon-purple/10',
        border: 'border-neon-purple/20',
        text: 'text-neon-purple',
        dot: 'bg-neon-purple',
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
    },
    green: {
        bg: 'bg-neon-green/10',
        border: 'border-neon-green/20',
        text: 'text-neon-green',
        dot: 'bg-neon-green',
        glow: 'shadow-[0_0_12px_rgba(0,255,136,0.3)]',
    },
    orange: {
        bg: 'bg-neon-orange/10',
        border: 'border-neon-orange/20',
        text: 'text-neon-orange',
        dot: 'bg-neon-orange',
        glow: 'shadow-[0_0_12px_rgba(255,165,0,0.3)]',
    },
    red: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        dot: 'bg-red-500',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    },
};

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const panelRef = useRef(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, isRead } = useNotifications();

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [open]);

    // Close on escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        if (open) {
            document.addEventListener('keydown', handleKey);
            return () => document.removeEventListener('keydown', handleKey);
        }
    }, [open]);

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !isRead(n.id))
        : notifications;

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${open
                        ? 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue shadow-[0_0_20px_rgba(0,209,255,0.2)]'
                        : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white hover:border-neon-blue/30'
                    }`}
            >
                <Bell size={18} className={open ? 'animate-wiggle' : ''} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-[10px] font-bold flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,209,255,0.4)]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-[380px] max-h-[520px] rounded-2xl border border-white/[0.08] bg-surface-950/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/20 flex items-center justify-center">
                                        <Bell size={14} className="text-neon-blue" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                        <p className="text-[11px] text-white/30">
                                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-neon-green/70 hover:text-neon-green hover:bg-neon-green/10 transition-all"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck size={12} />
                                            <span>Read all</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all ${filter === 'all'
                                            ? 'bg-white/[0.08] text-white shadow-sm'
                                            : 'text-white/30 hover:text-white/50'
                                        }`}
                                >
                                    All ({notifications.length})
                                </button>
                                <button
                                    onClick={() => setFilter('unread')}
                                    className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all ${filter === 'unread'
                                            ? 'bg-white/[0.08] text-white shadow-sm'
                                            : 'text-white/30 hover:text-white/50'
                                        }`}
                                >
                                    Unread ({unreadCount})
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[350px] notification-scroll">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                        <Bell size={22} className="text-white/10" />
                                    </div>
                                    <p className="text-sm text-white/20 font-medium">
                                        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                    </p>
                                    <p className="text-[11px] text-white/10 mt-1">
                                        {filter === 'unread' ? 'You\'re all caught up! 🎉' : 'Check back later'}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {filteredNotifications.map((notification, idx) => {
                                        const Icon = ICONS[notification.icon] || Bell;
                                        const color = COLORS[notification.color] || COLORS.blue;
                                        const read = isRead(notification.id);

                                        return (
                                            <motion.button
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-all duration-200 relative group ${read
                                                        ? 'opacity-50 hover:opacity-80'
                                                        : 'hover:bg-white/[0.03]'
                                                    }`}
                                            >
                                                {/* Unread dot */}
                                                {!read && (
                                                    <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${color.dot} ${color.glow}`} />
                                                )}

                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center shrink-0 mt-0.5`}>
                                                    <Icon size={15} className={color.text} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-xs font-semibold ${read ? 'text-white/40' : 'text-white/80'}`}>
                                                            {notification.title}
                                                        </p>
                                                        {notification.pinned && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-orange/20 text-neon-orange font-bold">
                                                                PINNED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-[11px] leading-relaxed mt-0.5 ${read ? 'text-white/20' : 'text-white/40'}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-white/15 mt-1">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>

                                                {/* Mark as read button */}
                                                {!read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-neon-green hover:bg-neon-green/10 transition-all shrink-0 mt-1"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={12} />
                                                    </button>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <>
                                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                                <div className="px-5 py-3 flex items-center justify-center">
                                    <p className="text-[11px] text-white/15">
                                        Showing {filteredNotifications.length} of {notifications.length} notifications
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
