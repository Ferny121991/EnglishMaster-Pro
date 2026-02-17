import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Award, TrendingUp, ChevronRight, BookOpen, CheckCircle2,
    Clock, Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function StudentGrades() {
    const { userProfile } = useAuth();
    const { classes, assignments, submissions, getStudentProgress } = useClasses();
    const navigate = useNavigate();
    const uid = userProfile?.uid;

    const [filterClass, setFilterClass] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    const myClasses = classes.filter(c => c.students?.includes(uid));
    const progress = getStudentProgress(uid);

    // All submissions with assignment data
    const gradesData = useMemo(() => {
        return submissions
            .filter(s => s.studentId === uid && s.grade != null)
            .map(s => {
                const a = assignments.find(a => a.id === s.assignmentId);
                const cls = classes.find(c => c.id === a?.classId);
                const max = a?.totalPoints || 100;
                const pct = Math.round((s.grade / max) * 100);
                return { ...s, assignment: a, class: cls, pct, max };
            })
            .filter(s => filterClass === 'all' || s.class?.id === filterClass)
            .sort((a, b) => {
                if (sortBy === 'recent') return new Date(b.gradedAt || b.submittedAt) - new Date(a.gradedAt || a.submittedAt);
                if (sortBy === 'highest') return b.pct - a.pct;
                if (sortBy === 'lowest') return a.pct - b.pct;
                return 0;
            });
    }, [submissions, assignments, classes, uid, filterClass, sortBy]);

    const avgGrade = progress.avgGrade;
    const gradeColor = avgGrade >= 90 ? 'neon-green' : avgGrade >= 70 ? 'neon-blue' : avgGrade >= 50 ? 'neon-orange' : 'red-400';

    // Grade distribution
    const distribution = useMemo(() => {
        const d = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        gradesData.forEach(s => {
            if (s.pct >= 90) d.A++;
            else if (s.pct >= 80) d.B++;
            else if (s.pct >= 70) d.C++;
            else if (s.pct >= 60) d.D++;
            else d.F++;
        });
        return d;
    }, [gradesData]);
    const maxDist = Math.max(...Object.values(distribution), 1);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar title="My Grades" subtitle={`${gradesData.length} graded assignments`} />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

                {/* Stats row */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="glass-card p-4 sm:p-5 text-center">
                        <TrendingUp size={20} className={`text-${gradeColor} mx-auto mb-2`} />
                        <p className={`text-3xl sm:text-4xl font-display font-black text-${gradeColor}`}>{avgGrade}%</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Overall Average</p>
                    </div>
                    <div className="glass-card p-4 sm:p-5 text-center">
                        <CheckCircle2 size={20} className="text-neon-green mx-auto mb-2" />
                        <p className="text-3xl sm:text-4xl font-display font-black text-white">{progress.completed}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Completed</p>
                    </div>
                    <div className="glass-card p-4 sm:p-5 text-center">
                        <Clock size={20} className="text-neon-orange mx-auto mb-2" />
                        <p className="text-3xl sm:text-4xl font-display font-black text-white">{progress.total - progress.completed}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Remaining</p>
                    </div>
                    <div className="glass-card p-4 sm:p-5 text-center">
                        <BarChart3 size={20} className="text-neon-purple mx-auto mb-2" />
                        <p className="text-3xl sm:text-4xl font-display font-black text-white">{progress.completionRate}%</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Completion Rate</p>
                    </div>
                </motion.div>

                {/* Grade Distribution Bar Chart */}
                <motion.div variants={item} className="glass-card p-4 sm:p-6">
                    <h3 className="text-base font-display font-bold text-white mb-4">Grade Distribution</h3>
                    <div className="flex items-end gap-2 sm:gap-3 h-32">
                        {Object.entries(distribution).map(([letter, count]) => {
                            const height = `${(count / maxDist) * 100}%`;
                            const colors = { A: 'neon-green', B: 'neon-blue', C: 'neon-purple', D: 'neon-orange', F: 'red-400' };
                            const color = colors[letter];
                            return (
                                <div key={letter} className="flex-1 flex flex-col items-center gap-1 h-full">
                                    <span className="text-[10px] font-bold text-white/40">{count}</span>
                                    <div className="w-full flex-1 flex items-end">
                                        <div className={`w-full rounded-t-lg bg-${color}/20 border border-${color}/30 transition-all duration-500`} style={{ height: count > 0 ? height : '4px' }} />
                                    </div>
                                    <span className={`text-xs font-bold text-${color}`}>{letter}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="input-glass flex-1 text-sm"
                    >
                        <option value="all">All Classes</option>
                        {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="input-glass text-sm sm:w-48"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Grade</option>
                        <option value="lowest">Lowest Grade</option>
                    </select>
                </motion.div>

                {/* Grades list */}
                {gradesData.length === 0 ? (
                    <motion.div variants={item} className="glass-card p-12 text-center">
                        <Award size={40} className="text-white/10 mx-auto mb-4" />
                        <p className="text-white/30 text-sm">No grades yet. Complete some assignments!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {gradesData.map(s => {
                            const color = s.pct >= 90 ? 'neon-green' : s.pct >= 70 ? 'neon-blue' : s.pct >= 50 ? 'neon-orange' : 'red-400';
                            return (
                                <motion.div key={s.id} variants={item}>
                                    <button
                                        onClick={() => navigate(`/assignments/${s.assignmentId}`)}
                                        className="w-full glass-card p-3 sm:p-4 hover:border-white/10 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center shrink-0`}>
                                                <span className={`text-${color} font-display font-black text-lg sm:text-xl`}>{s.pct}%</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm sm:text-base font-medium text-white truncate">{s.assignment?.title || 'Assignment'}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-white/30 flex items-center gap-1"><BookOpen size={10} /> {s.class?.name}</span>
                                                    <span className="text-xs text-white/20">•</span>
                                                    <span className="text-xs text-white/30">{s.grade}/{s.max} pts</span>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="hidden sm:block w-24">
                                                <div className="h-2 rounded-full bg-white/[0.04]">
                                                    <div className={`h-full rounded-full bg-${color}`} style={{ width: `${s.pct}%` }} />
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-white/20 group-hover:text-neon-blue transition-colors shrink-0" />
                                        </div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
