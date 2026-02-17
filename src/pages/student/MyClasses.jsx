import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Users, ClipboardList, ChevronRight, LogOut, Star,
    Search
} from 'lucide-react';
import { useState } from 'react';

export default function MyClasses() {
    const { userProfile } = useAuth();
    const { classes, assignments, submissions, leaveClass, getAssignmentCompletionRate } = useClasses();
    const toast = useToast();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [confirmLeave, setConfirmLeave] = useState(null);

    const uid = userProfile?.uid;
    const myClasses = classes.filter(c => c.students?.includes(uid) && !c.archived);

    const filteredClasses = myClasses.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.teacherName?.toLowerCase().includes(search.toLowerCase())
    );

    const handleLeave = async (classId) => {
        try {
            await leaveClass(classId, uid);
            toast.success('Successfully left the class.');
            setConfirmLeave(null);
        } catch (e) {
            toast.error('Failed to leave class: ' + e.message);
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="My Classes"
                subtitle={`${myClasses.length} enrolled classes`}
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Search */}
                <motion.div variants={item} className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        placeholder="Search classes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-glass pl-11"
                    />
                </motion.div>

                {/* Empty state */}
                {filteredClasses.length === 0 ? (
                    <motion.div variants={item} className="glass-card p-12 text-center">
                        <BookOpen size={40} className="text-white/10 mx-auto mb-4" />
                        <p className="text-white/30 text-sm">
                            {search ? 'No classes match your search.' : 'You haven\'t joined any classes yet.'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredClasses.map(cls => {
                            const classAssignments = assignments.filter(a => a.classId === cls.id);
                            const classSubmissions = submissions.filter(s => s.studentId === uid && classAssignments.some(a => a.id === s.assignmentId));
                            const completedCount = classSubmissions.length;
                            const totalCount = classAssignments.length;
                            const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                            const gradedSubs = classSubmissions.filter(s => s.grade != null);
                            const avgGrade = gradedSubs.length > 0
                                ? Math.round(gradedSubs.reduce((acc, s) => {
                                    const a = classAssignments.find(a => a.id === s.assignmentId);
                                    return acc + ((s.grade / (a?.totalPoints || 100)) * 100);
                                }, 0) / gradedSubs.length)
                                : null;

                            return (
                                <motion.div key={cls.id} variants={item} className="glass-card group overflow-hidden hover:border-white/10 transition-all">
                                    {/* Progress bar at top */}
                                    <div className="h-1 bg-white/[0.02]">
                                        <div className="h-full bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-500" style={{ width: `${completionPct}%` }} />
                                    </div>

                                    <div className="p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0">
                                                <h3 className="text-base sm:text-lg font-display font-bold text-white truncate">{cls.name}</h3>
                                                <p className="text-xs text-white/40 mt-0.5">{cls.teacherName}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {avgGrade != null && (
                                                    <span className={`text-sm font-bold ${avgGrade >= 90 ? 'text-neon-green' : avgGrade >= 70 ? 'text-neon-blue' : 'text-neon-orange'}`}>
                                                        {avgGrade}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {cls.description && (
                                            <p className="text-xs text-white/30 leading-relaxed mb-4 line-clamp-2">{cls.description}</p>
                                        )}

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-xs text-white/30">Students</p>
                                                <p className="text-sm font-bold text-white">{cls.students?.length || 0}</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-xs text-white/30">Done</p>
                                                <p className="text-sm font-bold text-neon-green">{completedCount}/{totalCount}</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-xs text-white/30">Level</p>
                                                <p className="text-sm font-bold text-neon-purple">{cls.level || '—'}</p>
                                            </div>
                                        </div>

                                        {/* Code badge */}
                                        <div className="flex items-center gap-2 mb-4 bg-white/[0.02] px-3 py-2 rounded-lg border border-white/[0.04]">
                                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Code</span>
                                            <span className="text-sm font-mono font-bold text-neon-blue tracking-widest">{cls.code}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/assignments`)}
                                                className="flex-1 btn-ghost flex items-center justify-center gap-2 text-sm py-2 rounded-lg"
                                            >
                                                <ClipboardList size={14} /> Assignments
                                            </button>
                                            <button
                                                onClick={() => setConfirmLeave(cls.id)}
                                                className="w-9 h-9 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Leave class"
                                            >
                                                <LogOut size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Leave confirmation */}
                                    <AnimatePresence>
                                        {confirmLeave === cls.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-t border-red-500/10 bg-red-500/5 overflow-hidden"
                                            >
                                                <div className="p-4 text-center space-y-3">
                                                    <p className="text-sm text-red-400">Leave <strong>{cls.name}</strong>?</p>
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => setConfirmLeave(null)} className="px-4 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors">Cancel</button>
                                                        <button onClick={() => handleLeave(cls.id)} className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">Leave</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
