import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    ClipboardList,
    BarChart3,
    Settings,
    LogOut,
    GraduationCap,
    X,
    Database,
    PieChart,
    CalendarDays,
    Trophy,
    Gamepad2,
} from 'lucide-react';
import { useEffect } from 'react';

const teacherLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/classes', icon: BookOpen, label: 'My Classes' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/grades', icon: BarChart3, label: 'Gradebook' },
    { to: '/question-bank', icon: Database, label: 'Question Bank' },
    { to: '/reports', icon: PieChart, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-classes', icon: BookOpen, label: 'My Classes' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/grades', icon: BarChart3, label: 'My Grades' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/practice', icon: Gamepad2, label: 'Practice' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ mobileOpen, onClose }) {
    const { userProfile, isTeacher, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const links = isTeacher ? teacherLinks : studentLinks;

    // Auto-close sidebar on route change (mobile)
    useEffect(() => {
        if (mobileOpen && onClose) onClose();
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getRoleBadge = () => {
        if (isAdmin && isTeacher) {
            return { label: 'Maestro · Admin', bgClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dotClass: 'bg-amber-400' };
        }
        if (isTeacher) {
            return { label: 'Maestro', bgClass: 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20', dotClass: 'bg-neon-purple' };
        }
        return { label: 'Estudiante', bgClass: 'bg-neon-green/10 text-neon-green border border-neon-green/20', dotClass: 'bg-neon-green' };
    };

    const roleBadge = getRoleBadge();

    return (
        <aside
            className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col w-64
                bg-surface-950/95 backdrop-blur-2xl border-r border-white/[0.06]
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
            {/* Logo */}
            <div className="p-5 flex items-center justify-between border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-base bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                            EnglishMaster
                        </h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Pro</p>
                    </div>
                </div>
                {/* Close button (mobile only) */}
                <button
                    onClick={onClose}
                    className="lg:hidden w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Role badge */}
            <div className="px-5 pt-4 pb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${roleBadge.bgClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dotClass}`} />
                    {roleBadge.label}
                </span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_20px_rgba(0,209,255,0.05)]'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                            }`
                        }
                    >
                        <link.icon size={20} className="flex-shrink-0" />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {userProfile?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{userProfile?.displayName}</p>
                        <p className="text-xs text-white/40 truncate">{userProfile?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-white/20 font-medium tracking-widest uppercase">
                        Hecho por <a href="https://fernelydev.com/" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">FernelyDev</a>
                    </p>
                </div>
            </div>
        </aside>
    );
}
