import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, Users, ArrowRight, Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
    const navigate = useNavigate();
    const { demoLogin } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [loginRole, setLoginRole] = useState(null);
    const [isRegister, setIsRegister] = useState(false);

    const handleDemoLogin = (role) => {
        demoLogin(role);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-surface-950 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            <div className="relative z-10">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                            <GraduationCap size={22} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-lg bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                            EnglishMaster Pro
                        </span>
                    </div>
                </header>

                {/* Hero */}
                <main className="max-w-6xl mx-auto px-8 pt-16 pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-8">
                            <Sparkles size={14} className="text-neon-blue" />
                            <span className="text-xs font-medium text-neon-blue">Premium Class Management System</span>
                        </div>

                        <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            <span className="text-white">Master English</span>
                            <br />
                            <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                                Like Never Before
                            </span>
                        </h1>

                        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
                            The ultimate platform for teachers and students. Create classes, manage assignments,
                            track progress, and achieve English fluency with a premium experience.
                        </p>

                        {/* Role Selection */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => { setLoginRole('teacher'); setShowLogin(true); }}
                                className="group relative w-72"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl opacity-60 blur group-hover:opacity-100 transition-all duration-300" />
                                <div className="relative glass-card p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-blue/5 border border-neon-blue/20 flex items-center justify-center">
                                        <BookOpen className="text-neon-blue" size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-white">I'm a Teacher</p>
                                        <p className="text-xs text-white/40">Create & manage classes</p>
                                    </div>
                                    <ArrowRight size={18} className="text-white/30 ml-auto group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>

                            <button
                                onClick={() => { setLoginRole('student'); setShowLogin(true); }}
                                className="group relative w-72"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-pink rounded-2xl opacity-60 blur group-hover:opacity-100 transition-all duration-300" />
                                <div className="relative glass-card p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 border border-neon-purple/20 flex items-center justify-center">
                                        <Users className="text-neon-purple" size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-white">I'm a Student</p>
                                        <p className="text-xs text-white/40">Join & learn</p>
                                    </div>
                                    <ArrowRight size={18} className="text-white/30 ml-auto group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
                    >
                        {[
                            { value: '50+', label: 'Features' },
                            { value: '∞', label: 'Students' },
                            { value: 'Real-time', label: 'Grading' },
                            { value: 'Premium', label: 'Experience' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-4 text-center">
                                <p className="text-2xl font-display font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </main>

                {/* Footer */}
                <footer className="max-w-6xl mx-auto px-8 py-12 border-t border-white/[0.06] text-center">
                    <p className="text-xs text-white/20 font-medium tracking-widest uppercase mb-2">
                        Hecho por <span className="text-neon-blue font-bold">FernelyDev</span>
                    </p>
                    <p className="text-[10px] text-white/10 uppercase tracking-tighter">
                        EnglishMaster Pro &copy; {new Date().getFullYear()} — Premium LMS Experience
                    </p>
                </footer>
            </div>

            {/* Login Modal */}
            <AnimatePresence>
                {showLogin && (
                    <LoginModal
                        role={loginRole}
                        isRegister={isRegister}
                        setIsRegister={setIsRegister}
                        onClose={() => { setShowLogin(false); setIsRegister(false); }}
                        onDemoLogin={handleDemoLogin}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function LoginModal({ role, isRegister, setIsRegister, onClose, onDemoLogin }) {
    const { login, register, loginWithStudentCode, isProduction } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Used as Code for students
    const [name, setName] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Force login mode for students (no self-registration)
    if (role === 'student' && isRegister) {
        setIsRegister(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (role === 'student') {
                // Student Login with Code
                await loginWithStudentCode(email, password);
            } else if (isRegister) {
                // Teacher Registration
                await register(email, password, name, role);
            } else {
                // Teacher Login
                await login(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-3xl opacity-30 blur-xl" />
                <div className="relative glass-card p-8 rounded-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center mb-4">
                            {role === 'teacher' ? <BookOpen className="text-white" size={28} /> : <Users className="text-white" size={28} />}
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white">
                            {isRegister ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-sm text-white/40 mt-1 capitalize">
                            {role === 'student' ? 'Enter your credentials' : `Sign ${isRegister ? 'up' : 'in'} as ${role}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && role === 'teacher' && (
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-glass pl-11"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-glass pl-11"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                placeholder={role === 'student' ? "Access Code (e.g. AB12CD)" : "Password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-glass pl-11 pr-11"
                                required
                                maxLength={role === 'student' ? 6 : undefined}
                                style={role === 'student' ? { textTransform: 'uppercase', letterSpacing: '2px' } : {}}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className="btn-neon w-full">
                            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : (role === 'student' ? 'Enter Class' : 'Sign In'))}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/30">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {!isProduction && (
                        <button
                            onClick={() => onDemoLogin(role)}
                            className="mt-4 btn-ghost w-full text-center flex items-center justify-center gap-2"
                        >
                            <Sparkles size={16} />
                            Try Demo Mode
                        </button>
                    )}

                    {role === 'teacher' && (
                        <p className="mt-4 text-center text-sm text-white/40">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button onClick={() => setIsRegister(!isRegister)} className="text-neon-blue hover:underline">
                                {isRegister ? 'Sign In' : 'Register'}
                            </button>
                        </p>
                    )}

                    {role === 'student' && (
                        <p className="mt-4 text-center text-xs text-white/30">
                            Don't have a code? Ask your teacher to register you.
                        </p>
                    )}
                </div>
                <p className="text-center text-xs text-white/20 mt-4">
                    Protected by reCAPTCHA and subject to the Google Privacy Policy and Terms of Service. v1.1.0
                </p>
            </motion.div>
        </motion.div>
    );
}
