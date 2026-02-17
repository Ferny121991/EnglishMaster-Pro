import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Shell() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-surface-950 relative">
            {/* Ambient orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="lg:ml-64 relative z-10 min-h-screen transition-all duration-300">
                {/* Mobile top bar with hamburger */}
                <div className="lg:hidden sticky top-0 z-20 px-4 py-3 bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:border-neon-blue/30 transition-all"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="15" y2="12" />
                            <line x1="3" y1="18" x2="18" y2="18" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <span className="font-display font-bold text-sm bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">EnglishMaster</span>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
}
