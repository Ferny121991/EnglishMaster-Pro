import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/layout/TopBar';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Palette, Bell, Globe, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
    const { userProfile, updateUserData } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [darkMode, setDarkMode] = useState(userProfile?.preferences?.darkMode !== false);
    const [notifications, setNotifications] = useState(userProfile?.preferences?.notifications !== false);
    const [language, setLanguage] = useState(userProfile?.preferences?.language || 'en');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            await updateUserData({
                displayName,
                preferences: { darkMode, notifications, language }
            });
            setFeedback({ type: 'success', message: 'Changes saved successfully! ✨' });
            setTimeout(() => setFeedback(null), 3000);
        } catch (e) {
            setFeedback({ type: 'error', message: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <TopBar title="Settings" subtitle="Manage your account and preferences" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-3xl">

                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-xl border ${feedback.type === 'success' ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : 'bg-red-500/10 border-red-500/20 text-red-500'} text-sm font-medium`}
                    >
                        {feedback.message}
                    </motion.div>
                )}

                {/* Profile */}
                <div className="glass-card p-6">
                    <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2"><User size={18} className="text-neon-blue" /> Profile</h3>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-2xl font-bold">
                            {userProfile?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white">{userProfile?.displayName}</h4>
                            <p className="text-sm text-white/40">{userProfile?.email}</p>
                            <span className="badge-blue mt-2 capitalize">{userProfile?.role}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/50 mb-1.5">Display Name</label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="input-glass"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/50 mb-1.5">Email</label>
                            <input value={userProfile?.email} className="input-glass" disabled title="Email cannot be changed" />
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="glass-card p-6">
                    <h3 className="font-display font-semibold text-white mb-5 flex items-center gap-2"><Palette size={18} className="text-neon-purple" /> Preferences</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <Moon size={18} className={`transition-colors ${darkMode ? 'text-neon-blue' : 'text-white/20'}`} />
                                <div><p className="text-sm font-medium text-white">Dark Mode</p><p className="text-xs text-white/40">Use dark theme</p></div>
                            </div>
                            <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-7 rounded-full transition-all ${darkMode ? 'bg-neon-blue' : 'bg-white/10'} relative`}>
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-lg ${darkMode ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className={`transition-colors ${notifications ? 'text-neon-green' : 'text-white/20'}`} />
                                <div><p className="text-sm font-medium text-white">Notifications</p><p className="text-xs text-white/40">Email notifications</p></div>
                            </div>
                            <button onClick={() => setNotifications(!notifications)} className={`w-12 h-7 rounded-full transition-all ${notifications ? 'bg-neon-green' : 'bg-white/10'} relative`}>
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-lg ${notifications ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-neon-orange" />
                                <div><p className="text-sm font-medium text-white">Language</p><p className="text-xs text-white/40">Interface language</p></div>
                            </div>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-glass w-32 text-sm">
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`btn-neon px-8 h-12 flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
