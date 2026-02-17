import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Users, ClipboardList, TrendingUp, Plus,
    Clock, Award, BarChart3, AlertTriangle,
    CheckCircle2, FileCheck, Megaphone
} from 'lucide-react';

export default function TeacherDashboard() {
    const { userProfile } = useAuth();
    const {
        classes, assignments, submissions, allStudents, announcements,
        getClassSubmissionStats
    } = useClasses();
    const navigate = useNavigate();

    const teacherClasses = classes.filter(c => !c.archived);
    const totalStudents = new Set(teacherClasses.flatMap(c => c.students || [])).size;
    const totalAssignments = assignments.length;

    // Pending grading
    const pendingSubs = submissions.filter(s => s.status === 'pending' || (s.grade == null && s.status !== 'graded'));

    // Recent submissions
    const recentSubs = submissions
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 6);

    // Overall average
    const gradedSubs = submissions.filter(s => s.grade != null);
    const avgGrade = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((acc, s) => {
            const a = assignments.find(a => a.id === s.assignmentId);
            const max = a?.totalPoints || 100;
            return acc + ((s.grade / max) * 100);
        }, 0) / gradedSubs.length)
        : 0;

    // Recent announcements
    const recentAnn = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title={`Hello, ${userProfile?.displayName?.split(' ')[0] || 'Teacher'}`}
                subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                actions={
                    <button onClick={() => navigate('/classes')} className="btn-neon text-sm px-4 py-2 flex items-center gap-2">
                        <Plus size={16} /> New Class
                    </button>
                }
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

                {/* Stats Row */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { icon: BookOpen, label: 'Classes', value: teacherClasses.length, color: 'neon-blue', glow: 'rgba(0,209,255,0.08)' },
                        { icon: Users, label: 'Students', value: totalStudents, color: 'neon-green', glow: 'rgba(0,255,136,0.08)' },
                        { icon: ClipboardList, label: 'Assignments', value: totalAssignments, color: 'neon-purple', glow: 'rgba(139,92,246,0.08)' },
                        { icon: BarChart3, label: 'Avg Grade', value: `${avgGrade}%`, color: 'neon-orange', glow: 'rgba(255,165,0,0.08)' },
                    ].map((stat, idx) => (
                        <div key={idx} className="glass-card p-3 sm:p-5 group hover:scale-[1.02] transition-all cursor-pointer"
                            style={{ boxShadow: `0 0 30px ${stat.glow}` }}
                            onClick={() => navigate(idx === 0 ? '/classes' : idx === 1 ? '/students' : idx === 2 ? '/assignments' : '/grades')}>
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

                {/* Pending Grading Alert */}
                {pendingSubs.length > 0 && (
                    <motion.div variants={item}
                        className="glass-card p-4 border-l-4 border-l-neon-orange bg-neon-orange/5 cursor-pointer hover:bg-neon-orange/10 transition-colors"
                        onClick={() => navigate('/grades')}>
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-neon-orange" />
                            <div className="flex-1">
                                <h3 className="text-neon-orange font-semibold text-sm">{pendingSubs.length} submissions awaiting grading</h3>
                                <p className="text-xs text-white/30 mt-0.5">Click to open gradebook</p>
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-neon-orange/10 border border-neon-orange/20 text-neon-orange font-bold text-sm">{pendingSubs.length}</span>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Submissions */}
                    <motion.div variants={item} className="glass-card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                                <FileCheck size={18} className="text-neon-blue" /> Recent Submissions
                            </h3>
                            <button onClick={() => navigate('/grades')} className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors">View All</button>
                        </div>
                        {recentSubs.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-8">No submissions yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentSubs.map(s => {
                                    const a = assignments.find(a => a.id === s.assignmentId);
                                    const student = allStudents.find(st => st.id === s.studentId);
                                    const isGraded = s.grade != null;
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isGraded ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20'}`}>
                                                {isGraded ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{student?.displayName || s.studentName || 'Student'}</p>
                                                <p className="text-xs text-white/30 truncate">{a?.title}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {isGraded ? (
                                                    <span className="text-sm font-bold text-neon-green">{s.grade}/{a?.totalPoints || 100}</span>
                                                ) : (
                                                    <span className="text-xs text-neon-orange">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* Class Overview */}
                    <motion.div variants={item} className="glass-card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                                <BookOpen size={18} className="text-neon-purple" /> Your Classes
                            </h3>
                            <button onClick={() => navigate('/classes')} className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors">Manage</button>
                        </div>
                        {teacherClasses.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-8">Create your first class!</p>
                        ) : (
                            <div className="space-y-3">
                                {teacherClasses.slice(0, 5).map(cls => {
                                    const stats = getClassSubmissionStats(cls.id);
                                    const classAssignments = assignments.filter(a => a.classId === cls.id);
                                    return (
                                        <button key={cls.id} onClick={() => navigate(`/classes/${cls.id}`)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-neon-blue/20 transition-all text-left group">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center shrink-0 border border-white/5">
                                                <BookOpen size={18} className="text-neon-blue" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{cls.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                                                    <span className="flex items-center gap-1"><Users size={10} /> {cls.students?.length || 0}</span>
                                                    <span className="flex items-center gap-1"><ClipboardList size={10} /> {classAssignments.length}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-mono text-neon-blue/50">{cls.code}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div variants={item}>
                    <h3 className="text-sm text-white/30 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: Plus, label: 'New Class', action: () => navigate('/classes'), color: 'neon-blue' },
                            { icon: ClipboardList, label: 'New Assignment', action: () => navigate('/assignments'), color: 'neon-green' },
                            { icon: Award, label: 'Grade Work', action: () => navigate('/grades'), color: 'neon-purple' },
                            { icon: Users, label: 'Manage Students', action: () => navigate('/students'), color: 'neon-orange' },
                        ].map((action, idx) => (
                            <button key={idx} onClick={action.action}
                                className={`glass-card p-4 text-center hover:scale-[1.03] transition-all group`}>
                                <div className={`w-10 h-10 mx-auto rounded-xl bg-${action.color}/10 border border-${action.color}/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                    <action.icon size={20} className={`text-${action.color}`} />
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-white/60 group-hover:text-white transition-colors">{action.label}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
