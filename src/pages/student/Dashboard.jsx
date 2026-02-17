import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Clock, TrendingUp, Flame, Plus, ChevronRight,
    AlertTriangle, Award, FileCheck, BarChart3
} from 'lucide-react';
import { useState } from 'react';

export default function StudentDashboard() {
    const { userProfile } = useAuth();
    const {
        classes, assignments, submissions, announcements,
        joinClass, getOverdueAssignments, getPendingAssignments,
        getStudentProgress, getStudentStreak
    } = useClasses();
    const toast = useToast();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [showJoin, setShowJoin] = useState(false);

    const uid = userProfile?.uid;
    const myClasses = classes.filter(c => c.students?.includes(uid));
    const progress = getStudentProgress(uid);
    const overdueAssignments = getOverdueAssignments(uid);
    const pendingAssignments = getPendingAssignments(uid);
    const streak = getStudentStreak(uid);

    // Recent grades
    const recentGraded = submissions
        .filter(s => s.studentId === uid && s.grade != null)
        .sort((a, b) => new Date(b.gradedAt || b.submittedAt) - new Date(a.gradedAt || a.submittedAt))
        .slice(0, 5);

    // Recent announcements
    const recentAnnouncements = announcements
        .filter(a => myClasses.some(c => c.id === a.classId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            await joinClass(joinCode.trim(), uid);
            toast.success('Successfully joined class!');
            setJoinCode('');
            setShowJoin(false);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setJoining(false);
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title={`Welcome back, ${userProfile?.displayName?.split(' ')[0] || 'Student'}`}
                subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                actions={
                    <button onClick={() => setShowJoin(!showJoin)} className="btn-neon text-sm px-4 py-2 flex items-center gap-2">
                        <Plus size={16} /> Join Class
                    </button>
                }
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

                {/* Join Class Modal Inline */}
                {showJoin && (
                    <motion.div variants={item} className="glass-card p-4 sm:p-6 border border-neon-blue/20">
                        <h3 className="text-white font-semibold mb-3">Join a Class</h3>
                        <div className="flex gap-3">
                            <input
                                placeholder="Enter class code..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                className="input-glass flex-1 uppercase tracking-widest font-mono"
                                maxLength={6}
                            />
                            <button onClick={handleJoin} disabled={joining} className="btn-neon px-6 shrink-0">
                                {joining ? 'Joining...' : 'Join'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Stats Cards */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { icon: BookOpen, label: 'Classes', value: myClasses.length, color: 'neon-blue', glow: 'rgba(0,209,255,0.1)' },
                        { icon: FileCheck, label: 'Completed', value: `${progress.completed}/${progress.total}`, color: 'neon-green', glow: 'rgba(0,255,136,0.1)' },
                        { icon: BarChart3, label: 'Average', value: `${progress.avgGrade}%`, color: 'neon-purple', glow: 'rgba(139,92,246,0.1)' },
                        { icon: Flame, label: 'Streak', value: `${streak}d`, color: 'neon-orange', glow: 'rgba(255,165,0,0.1)' },
                    ].map((stat, idx) => (
                        <div key={idx} className="glass-card p-3 sm:p-5 group hover:scale-[1.02] transition-all" style={{ boxShadow: `0 0 30px ${stat.glow}` }}>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-${stat.color}/10 border border-${stat.color}/20 flex items-center justify-center`}>
                                    <stat.icon size={16} className={`text-${stat.color}`} />
                                </div>
                                <p className="text-xs sm:text-sm text-white/40">{stat.label}</p>
                            </div>
                            <p className={`text-xl sm:text-3xl font-display font-black text-${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Overdue Alert */}
                {overdueAssignments.length > 0 && (
                    <motion.div variants={item} className="glass-card p-4 border-l-4 border-l-red-500 bg-red-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={18} className="text-red-400" />
                            <h3 className="text-red-400 font-semibold text-sm">Overdue Assignments ({overdueAssignments.length})</h3>
                        </div>
                        <div className="space-y-2">
                            {overdueAssignments.slice(0, 3).map(a => (
                                <button key={a.id} onClick={() => navigate(`/assignments/${a.id}`)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left">
                                    <span className="text-sm text-white/60">{a.title}</span>
                                    <span className="text-xs text-red-400">{new Date(a.dueDate).toLocaleDateString()}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Assignments */}
                    <motion.div variants={item} className="glass-card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                                <Clock size={18} className="text-neon-blue" /> Upcoming
                            </h3>
                            <span className="badge-glass text-xs">{pendingAssignments.length}</span>
                        </div>
                        {pendingAssignments.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-8">No upcoming assignments!</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingAssignments.slice(0, 5).map(a => {
                                    const cls = classes.find(c => c.id === a.classId);
                                    const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <button key={a.id} onClick={() => navigate(`/assignments/${a.id}`)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-neon-blue/20 transition-all text-left group">
                                            <div className="w-10 h-10 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center shrink-0">
                                                <FileCheck size={18} className="text-neon-blue" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{a.title}</p>
                                                <p className="text-xs text-white/30">{cls?.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-xs font-bold ${daysLeft <= 1 ? 'text-red-400' : daysLeft <= 3 ? 'text-neon-orange' : 'text-neon-green'}`}>{daysLeft}d left</p>
                                            </div>
                                            <ChevronRight size={14} className="text-white/20 group-hover:text-neon-blue transition-colors shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Recent Grades */}
                    <motion.div variants={item} className="glass-card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                                <Award size={18} className="text-neon-green" /> Recent Grades
                            </h3>
                            <button onClick={() => navigate('/grades')} className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors">View All</button>
                        </div>
                        {recentGraded.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-8">No grades yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentGraded.map(s => {
                                    const a = assignments.find(a => a.id === s.assignmentId);
                                    const max = a?.totalPoints || 100;
                                    const pct = Math.round((s.grade / max) * 100);
                                    const color = pct >= 90 ? 'neon-green' : pct >= 70 ? 'neon-blue' : pct >= 50 ? 'neon-orange' : 'red-400';
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <div className={`w-10 h-10 rounded-lg bg-${color}/10 border border-${color}/20 flex items-center justify-center`}>
                                                <span className={`text-${color} font-bold text-sm`}>{pct}%</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{a?.title || 'Assignment'}</p>
                                                <p className="text-xs text-white/30">{s.grade}/{max} pts</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Recent Announcements */}
                {recentAnnouncements.length > 0 && (
                    <motion.div variants={item} className="glass-card p-4 sm:p-6">
                        <h3 className="text-lg font-display font-bold text-white mb-4">📢 Recent Announcements</h3>
                        <div className="space-y-3">
                            {recentAnnouncements.map(a => {
                                const cls = classes.find(c => c.id === a.classId);
                                return (
                                    <div key={a.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-neon-purple">{cls?.name}</span>
                                            <span className="text-[10px] text-white/20">•</span>
                                            <span className="text-[10px] text-white/30">{new Date(a.createdAt).toLocaleDateString()}</span>
                                            {a.pinned && <span className="text-[10px] text-neon-orange">📌</span>}
                                        </div>
                                        <p className="text-sm text-white/60 leading-relaxed">{a.content}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
