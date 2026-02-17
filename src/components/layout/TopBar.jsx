import { Search } from 'lucide-react';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

export default function TopBar({ title, subtitle, actions }) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 bg-surface-950/60 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="text-xl font-display font-bold text-white">{title}</h1>
                    {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:border-neon-blue/30 transition-all"
                    >
                        <Search size={18} />
                    </button>

                    {/* Notifications */}
                    <NotificationPanel />

                    {actions}
                </div>
            </div>

            {/* Search bar */}
            {searchOpen && (
                <div className="px-6 pb-4 animate-slide-down">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            autoFocus
                            placeholder="Search classes, students, assignments..."
                            className="input-glass pl-11"
                            onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
