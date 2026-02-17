import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import {
    BarChart3, Download, Users, FileText, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle2, Award, Filter, ChevronDown, PieChart
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Reports() {
    const { user } = useAuth();
    const { classes, assignments, submissions, allStudents, exportClassGrades } = useClasses();
    const toast = useToast();

    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || 'all');
    const [reportType, setReportType] = useState('overview');

    const targetClasses = selectedClass === 'all' ? classes : classes.filter(c => c.id === selectedClass);
    const targetClassIds = targetClasses.map(c => c.id);
    const targetAssignments = assignments.filter(a => targetClassIds.includes(a.classId));
    const targetSubmissions = submissions.filter(s => targetAssignments.some(a => a.id === s.assignmentId));

    // ─── Overview Stats ─────────────────────
    const overviewStats = useMemo(() => {
        const graded = targetSubmissions.filter(s => s.grade != null);
        const totalStudents = new Set();
        targetClasses.forEach(c => (c.students || []).forEach(sid => totalStudents.add(sid)));

        const avgGrade = graded.length > 0
            ? Math.round(graded.reduce((sum, s) => {
                const a = targetAssignments.find(a => a.id === s.assignmentId);
                const max = a?.totalPoints || 100;
                return sum + (s.grade / max) * 100;
            }, 0) / graded.length)
            : 0;

        const submissionRate = targetAssignments.length > 0 && totalStudents.size > 0
            ? Math.round((targetSubmissions.length / (targetAssignments.length * totalStudents.size)) * 100)
            : 0;

        const pendingGrading = targetSubmissions.filter(s => s.status === 'pending' || s.grade == null).length;

        return {
            totalStudents: totalStudents.size,
            totalAssignments: targetAssignments.length,
            totalSubmissions: targetSubmissions.length,
            avgGrade,
            submissionRate,
            pendingGrading,
            gradedCount: graded.length,
        };
    }, [targetClasses, targetAssignments, targetSubmissions]);

    // ─── Per-Assignment Analysis ─────────────
    const assignmentAnalysis = useMemo(() => {
        return targetAssignments.map(a => {
            const subs = targetSubmissions.filter(s => s.assignmentId === a.id);
            const graded = subs.filter(s => s.grade != null);
            const max = a.totalPoints || 100;
            const avgScore = graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + (s.grade / max) * 100, 0) / graded.length) : null;
            const highScore = graded.length > 0 ? Math.max(...graded.map(s => Math.round((s.grade / max) * 100))) : null;
            const lowScore = graded.length > 0 ? Math.min(...graded.map(s => Math.round((s.grade / max) * 100))) : null;

            const cls = classes.find(c => c.id === a.classId);
            const totalStudentsInClass = (cls?.students || []).length;

            // Question analysis
            const questionStats = (a.questions || []).map((q, qIdx) => {
                const answers = subs.map(s => s.answers?.[qIdx]).filter(Boolean);
                let correctCount = 0;

                if (q.type === 'multiple-choice' || q.type === 'true-false') {
                    const correctOpt = q.options?.[q.correctAnswer];
                    correctCount = answers.filter(ans => ans === correctOpt).length;
                } else if (q.type === 'fill-in-blank') {
                    correctCount = answers.filter(ans => (ans || '').trim().toLowerCase() === (q.correctText || '').trim().toLowerCase()).length;
                } else if (q.type === 'ordering') {
                    correctCount = answers.filter(ans => JSON.stringify(ans) === JSON.stringify(q.items || [])).length;
                }

                const successRate = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : null;
                return { question: q.text, type: q.type, successRate, total: answers.length, correct: correctCount };
            });

            return {
                id: a.id, title: a.title, type: a.type, className: cls?.name || 'Unknown',
                submitted: subs.length, total: totalStudentsInClass, avgScore, highScore, lowScore,
                questionStats,
            };
        }).sort((a, b) => (a.avgScore ?? 101) - (b.avgScore ?? 101));
    }, [targetAssignments, targetSubmissions, classes]);

    // ─── Per-Student Analysis ─────────────
    const studentAnalysis = useMemo(() => {
        const studentIds = new Set();
        targetClasses.forEach(c => (c.students || []).forEach(sid => studentIds.add(sid)));

        return [...studentIds].map(sid => {
            const st = allStudents.find(s => s.id === sid);
            const subs = targetSubmissions.filter(s => s.studentId === sid);
            const graded = subs.filter(s => s.grade != null);
            const avgGrade = graded.length > 0
                ? Math.round(graded.reduce((sum, s) => {
                    const a = targetAssignments.find(a => a.id === s.assignmentId);
                    return sum + (s.grade / (a?.totalPoints || 100)) * 100;
                }, 0) / graded.length)
                : null;

            return {
                id: sid,
                name: st?.displayName || 'Student',
                email: st?.email || '',
                submitted: subs.length,
                totalAssignments: targetAssignments.length,
                avgGrade,
                gradedCount: graded.length,
            };
        }).sort((a, b) => (b.avgGrade ?? -1) - (a.avgGrade ?? -1));
    }, [targetClasses, targetSubmissions, targetAssignments, allStudents]);

    // ─── Export CSV ─────────────
    const handleExportCSV = () => {
        try {
            const headers = ['Student', 'Email', 'Submitted', 'Graded', 'Average Grade'];
            const rows = studentAnalysis.map(s => [s.name, s.email, s.submitted, s.gradedCount, s.avgGrade ?? 'N/A']);
            const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${selectedClass === 'all' ? 'all' : targetClasses[0]?.name || 'class'}_${new Date().toLocaleDateString()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch {
            toast.error('Export failed');
        }
    };

    // Most failed questions
    const failedQuestions = useMemo(() => {
        const all = [];
        assignmentAnalysis.forEach(a => {
            a.questionStats.forEach((qs, idx) => {
                if (qs.successRate !== null && qs.successRate < 50) {
                    all.push({ ...qs, assignmentTitle: a.title, assignmentId: a.id });
                }
            });
        });
        return all.sort((a, b) => (a.successRate ?? 100) - (b.successRate ?? 100)).slice(0, 10);
    }, [assignmentAnalysis]);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="Reports & Analytics"
                subtitle={selectedClass === 'all' ? 'All classes' : targetClasses[0]?.name}
                actions={
                    <button onClick={handleExportCSV} className="btn-neon text-sm px-4 py-2 flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </button>
                }
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Filters */}
                <motion.div variants={item} className="flex flex-wrap gap-3">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-glass text-sm">
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {[
                        { id: 'overview', label: 'Overview', icon: PieChart },
                        { id: 'assignments', label: 'Assignments', icon: FileText },
                        { id: 'students', label: 'Students', icon: Users },
                        { id: 'questions', label: 'Hard Questions', icon: AlertTriangle },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setReportType(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${reportType === tab.id
                                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                                    : 'bg-white/[0.02] text-white/40 border border-white/[0.06] hover:text-white/60'
                                }`}>
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* ─── OVERVIEW ─── */}
                {reportType === 'overview' && (
                    <>
                        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: 'Students', value: overviewStats.totalStudents, icon: Users, color: 'neon-blue' },
                                { label: 'Avg Grade', value: `${overviewStats.avgGrade}%`, icon: TrendingUp, color: 'neon-green' },
                                { label: 'Submit Rate', value: `${overviewStats.submissionRate}%`, icon: CheckCircle2, color: 'neon-purple' },
                                { label: 'Pending', value: overviewStats.pendingGrading, icon: AlertTriangle, color: 'neon-orange' },
                            ].map((s, i) => (
                                <div key={i} className="glass-card p-4 group hover:scale-[1.02] transition-transform">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-lg bg-${s.color}/10 border border-${s.color}/20 flex items-center justify-center`}>
                                            <s.icon size={16} className={`text-${s.color}`} />
                                        </div>
                                        <p className="text-xs text-white/40">{s.label}</p>
                                    </div>
                                    <p className={`text-2xl font-display font-black text-${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* Grade Distribution Bar */}
                        <motion.div variants={item} className="glass-card p-5">
                            <h3 className="text-sm font-bold text-white/60 uppercase mb-4 flex items-center gap-2">
                                <BarChart3 size={14} className="text-neon-blue" /> Grade Distribution
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'A (90-100%)', min: 90, max: 101, color: 'bg-neon-green' },
                                    { label: 'B (80-89%)', min: 80, max: 90, color: 'bg-neon-blue' },
                                    { label: 'C (70-79%)', min: 70, max: 80, color: 'bg-neon-orange' },
                                    { label: 'D (60-69%)', min: 60, max: 70, color: 'bg-amber-500' },
                                    { label: 'F (0-59%)', min: 0, max: 60, color: 'bg-red-500' },
                                ].map(range => {
                                    const graded = targetSubmissions.filter(s => s.grade != null);
                                    const count = graded.filter(s => {
                                        const a = targetAssignments.find(a => a.id === s.assignmentId);
                                        const pct = (s.grade / (a?.totalPoints || 100)) * 100;
                                        return pct >= range.min && pct < range.max;
                                    }).length;
                                    const pct = graded.length > 0 ? (count / graded.length) * 100 : 0;
                                    return (
                                        <div key={range.label} className="flex items-center gap-3">
                                            <span className="text-xs text-white/40 w-24 shrink-0">{range.label}</span>
                                            <div className="flex-1 h-6 rounded-lg bg-white/[0.03] overflow-hidden border border-white/[0.04]">
                                                <motion.div
                                                    className={`h-full rounded-lg ${range.color}/80`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/30 w-12 text-right">{count} ({Math.round(pct)}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}

                {/* ─── ASSIGNMENTS ─── */}
                {reportType === 'assignments' && (
                    <motion.div variants={item} className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30">Assignment</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center">Class</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center">Submitted</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center">Avg</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center hidden sm:table-cell">High</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center hidden sm:table-cell">Low</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignmentAnalysis.map(a => {
                                        const avgColor = a.avgScore === null ? 'text-white/20' : a.avgScore >= 80 ? 'text-neon-green' : a.avgScore >= 60 ? 'text-neon-orange' : 'text-red-400';
                                        return (
                                            <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-sm text-white/70">{a.title}</td>
                                                <td className="px-4 py-3 text-xs text-white/40 text-center">{a.className}</td>
                                                <td className="px-4 py-3 text-sm text-center text-white/50">{a.submitted}/{a.total}</td>
                                                <td className={`px-4 py-3 text-sm text-center font-bold ${avgColor}`}>{a.avgScore !== null ? `${a.avgScore}%` : '—'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-neon-green/60 hidden sm:table-cell">{a.highScore !== null ? `${a.highScore}%` : '—'}</td>
                                                <td className="px-4 py-3 text-sm text-center text-red-400/60 hidden sm:table-cell">{a.lowScore !== null ? `${a.lowScore}%` : '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {assignmentAnalysis.length === 0 && <p className="text-sm text-white/20 text-center py-8">No assignments yet</p>}
                    </motion.div>
                )}

                {/* ─── STUDENTS ─── */}
                {reportType === 'students' && (
                    <motion.div variants={item} className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30">#</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30">Student</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center">Submitted</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center">Avg Grade</th>
                                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 text-center hidden sm:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentAnalysis.map((s, idx) => {
                                        const avgColor = s.avgGrade === null ? 'text-white/20' : s.avgGrade >= 80 ? 'text-neon-green' : s.avgGrade >= 60 ? 'text-neon-orange' : 'text-red-400';
                                        const completionRate = s.totalAssignments > 0 ? Math.round((s.submitted / s.totalAssignments) * 100) : 0;
                                        return (
                                            <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 text-xs text-white/30">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-white/70 font-medium">{s.name}</p>
                                                    <p className="text-[10px] text-white/30">{s.email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-white/50">{s.submitted}/{s.totalAssignments}</td>
                                                <td className={`px-4 py-3 text-sm text-center font-bold ${avgColor}`}>{s.avgGrade !== null ? `${s.avgGrade}%` : '—'}</td>
                                                <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${completionRate >= 80 ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' :
                                                            completionRate >= 50 ? 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20' :
                                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                                        }`}>{completionRate}% complete</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {studentAnalysis.length === 0 && <p className="text-sm text-white/20 text-center py-8">No students yet</p>}
                    </motion.div>
                )}

                {/* ─── HARD QUESTIONS ─── */}
                {reportType === 'questions' && (
                    <motion.div variants={item} className="space-y-3">
                        <p className="text-sm text-white/40">Questions with less than 50% success rate — consider reviewing these topics with students.</p>
                        {failedQuestions.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <CheckCircle2 size={40} className="text-neon-green/20 mx-auto mb-3" />
                                <p className="text-white/30 text-sm">No problematic questions found!</p>
                            </div>
                        ) : (
                            failedQuestions.map((q, idx) => (
                                <div key={idx} className="glass-card p-4 border-l-4 border-l-red-500">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-red-400 font-bold text-sm">{q.successRate}%</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white/80 font-medium mb-1">{q.question}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] text-white/30">From: {q.assignmentTitle}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/20 capitalize">{q.type}</span>
                                                <span className="text-[10px] text-red-400">{q.correct}/{q.total} correct</span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-2 rounded-full bg-white/[0.06] overflow-hidden shrink-0 mt-2">
                                            <div className="h-full rounded-full bg-red-500" style={{ width: `${q.successRate}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
