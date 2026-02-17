import { useState, useMemo } from 'react';
import { useClasses } from '../../contexts/ClassContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Award, TrendingUp, CheckCircle2, X, Clock, Search,
    Filter, ChevronRight, Eye, AlertTriangle, RotateCcw
} from 'lucide-react';

export default function Grades() {
    const { classes, assignments, submissions, allStudents, updateSubmission, deleteSubmission, bulkGradeSubmissions } = useClasses();
    const toast = useToast();
    const [selectedSub, setSelectedSub] = useState(null);
    const [filterClass, setFilterClass] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    const gradeColor = (g) => g >= 90 ? 'text-neon-green' : g >= 70 ? 'text-neon-blue' : g >= 50 ? 'text-neon-orange' : 'text-red-400';
    const gradeBg = (g) => g >= 90 ? 'from-neon-green/20 to-neon-green/5' : g >= 70 ? 'from-neon-blue/20 to-neon-blue/5' : g >= 50 ? 'from-neon-orange/20 to-neon-orange/5' : 'from-red-500/20 to-red-500/5';

    const handleGrade = async (id, grade, questionScores) => {
        try {
            await updateSubmission(id, { grade: parseInt(grade), questionScores, status: 'graded' });
            toast.success('Grade saved!');
            setSelectedSub(null);
        } catch (e) {
            toast.error('Failed to save grade');
        }
    };

    const handleRetake = async (subId) => {
        try {
            await deleteSubmission(subId);
            toast.success('Submission deleted — student can retake the assignment');
            setSelectedSub(null);
        } catch (e) {
            toast.error('Failed to allow retake');
        }
    };

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            const assignment = assignments.find(a => a.id === sub.assignmentId);
            const student = allStudents.find(s => s.id === sub.studentId);
            if (filterClass !== 'all' && assignment?.classId !== filterClass) return false;
            if (filterStatus === 'pending' && sub.grade != null) return false;
            if (filterStatus === 'graded' && sub.grade == null) return false;
            if (search) {
                const q = search.toLowerCase();
                const nameMatch = (student?.displayName || sub.studentName || '').toLowerCase().includes(q);
                const titleMatch = (assignment?.title || '').toLowerCase().includes(q);
                if (!nameMatch && !titleMatch) return false;
            }
            return true;
        }).sort((a, b) => {
            if (a.grade == null && b.grade != null) return -1;
            if (a.grade != null && b.grade == null) return 1;
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        });
    }, [submissions, assignments, allStudents, filterClass, filterStatus, search]);

    const gradedSubmissions = submissions.filter(s => s.grade != null);
    const pendingCount = submissions.filter(s => s.grade == null).length;
    const avgGrade = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((acc, s) => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            const max = assignment?.totalPoints || 100;
            return acc + ((Number(s.grade) / max) * 100);
        }, 0) / gradedSubmissions.length)
        : 0;

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar title="Gradebook" subtitle="View and manage student grades" />
            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: 'Average', value: `${avgGrade}%`, icon: Award, color: 'neon-green', glow: 'rgba(0,255,136,0.08)' },
                        { label: 'Submissions', value: submissions.length, icon: BarChart3, color: 'neon-blue', glow: 'rgba(0,209,255,0.08)' },
                        { label: 'Graded', value: gradedSubmissions.length, icon: TrendingUp, color: 'neon-purple', glow: 'rgba(139,92,246,0.08)' },
                        { label: 'Pending', value: pendingCount, icon: Clock, color: pendingCount > 0 ? 'neon-orange' : 'white/40', glow: pendingCount > 0 ? 'rgba(255,165,0,0.08)' : 'transparent' },
                    ].map((s, i) => (
                        <motion.div key={i} variants={item} className="glass-card p-3 sm:p-5" style={{ boxShadow: `0 0 30px ${s.glow}` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <s.icon size={16} className={`text-${s.color}`} />
                                <span className="text-xs text-white/40">{s.label}</span>
                            </div>
                            <p className={`text-xl sm:text-3xl font-display font-bold text-${s.color}`}>{s.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Pending Alert */}
                {pendingCount > 0 && (
                    <motion.div variants={item}
                        className="glass-card p-3 border-l-4 border-l-neon-orange bg-neon-orange/5 cursor-pointer"
                        onClick={() => setFilterStatus('pending')}>
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-neon-orange" />
                            <span className="text-sm text-neon-orange font-medium">{pendingCount} submissions need grading</span>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <motion.div variants={item} className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search student or assignment..."
                            className="input-glass pl-10 text-sm"
                        />
                    </div>
                    <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                        className="input-glass text-sm px-3 py-2.5 w-auto min-w-[140px]">
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
                        {['all', 'pending', 'graded'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-3 py-2 text-xs capitalize transition-all ${filterStatus === s ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Grades Table / Cards */}
                <motion.div variants={item} className="glass-card overflow-hidden">
                    {/* Desktop Table Header */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider">
                        <div className="col-span-3">Student</div>
                        <div className="col-span-3">Assignment</div>
                        <div className="col-span-2">Class</div>
                        <div className="col-span-2">Grade</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    {filteredSubmissions.length === 0 ? (
                        <div className="p-8 text-center">
                            <BarChart3 size={28} className="mx-auto text-white/10 mb-3" />
                            <p className="text-white/40 text-sm">
                                {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
                            </p>
                        </div>
                    ) : (
                        filteredSubmissions.map((sub) => {
                            const student = allStudents.find(s => s.id === sub.studentId);
                            const assignment = assignments.find(a => a.id === sub.assignmentId);
                            const cls = classes.find(c => c.id === assignment?.classId);
                            const pct = sub.grade != null ? Math.round((sub.grade / (assignment?.totalPoints || 100)) * 100) : null;

                            return (
                                <div key={sub.id}
                                    onClick={() => setSelectedSub({ sub, assignment, student })}
                                    className="sm:grid sm:grid-cols-12 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.02] hover:bg-white/[0.02] transition-all items-center cursor-pointer group flex flex-col sm:flex-row gap-2 sm:gap-4"
                                >
                                    {/* Student */}
                                    <div className="sm:col-span-3 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${sub.grade != null ? 'bg-gradient-to-br from-neon-blue to-neon-purple' : 'bg-gradient-to-br from-neon-orange to-amber-500'}`}>
                                            {student?.displayName?.[0] || sub.studentName?.[0] || '?'}
                                        </div>
                                        <span className="text-sm text-white truncate">{student?.displayName || sub.studentName || 'Unknown'}</span>
                                    </div>
                                    {/* Assignment */}
                                    <div className="sm:col-span-3 text-sm text-white/60 truncate">{assignment?.title || 'Unknown'}</div>
                                    {/* Class */}
                                    <div className="sm:col-span-2 font-mono text-xs text-neon-blue/60 hidden sm:block">{cls?.name || '—'}</div>
                                    {/* Grade */}
                                    <div className="sm:col-span-2">
                                        {sub.grade != null ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradeBg(pct)} flex items-center justify-center`}>
                                                    <span className={`text-xs font-bold ${gradeColor(pct)}`}>{sub.grade}</span>
                                                </div>
                                                <span className="text-xs text-white/30">/ {assignment?.totalPoints || 100}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-neon-orange flex items-center gap-1"><Clock size={12} /> Pending</span>
                                        )}
                                    </div>
                                    {/* Action */}
                                    <div className="sm:col-span-2 text-right hidden sm:block">
                                        <button className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-white/40 group-hover:text-neon-blue group-hover:border-neon-blue/30 transition-all">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </motion.div>
            </motion.div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedSub && (
                    <ReviewModal
                        submission={selectedSub.sub}
                        assignment={selectedSub.assignment}
                        student={selectedSub.student}
                        onClose={() => setSelectedSub(null)}
                        onGrade={handleGrade}
                        onRetake={handleRetake}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ReviewModal({ submission, assignment, student, onClose, onGrade, onRetake }) {
    // Build per-question scores: auto-graded get calculated, manual start at 0
    const initScores = () => {
        const scores = {};
        assignment?.questions?.forEach((q, idx) => {
            const studentAnswer = submission.answers?.[idx];
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                const correctOption = q.options?.[q.correctAnswer];
                scores[idx] = studentAnswer === correctOption ? (q.points || 0) : 0;
            } else if (q.type === 'fill-in-blank' || q.type === 'word-scramble' || q.type === 'error-correction' || q.type === 'translation') {
                const sa = (studentAnswer || '').trim().toLowerCase();
                const ca = (q.correctText || '').trim().toLowerCase();
                scores[idx] = (sa && ca && sa === ca) ? (q.points || 0) : 0;
            } else if (q.type === 'sentence-builder') {
                const sa = (studentAnswer || '').trim().toLowerCase();
                const ca = (q.correctSentence || '').trim().toLowerCase();
                scores[idx] = (sa && ca && sa === ca) ? (q.points || 0) : 0;
            } else if (q.type === 'ordering') {
                const correct = q.items || [];
                const isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(correct);
                scores[idx] = isCorrect ? (q.points || 0) : 0;
            } else {
                // essay, short-answer — manual
                scores[idx] = submission.questionScores?.[idx] ?? '';
            }
        });
        return scores;
    };
    const [questionScores, setQuestionScores] = useState(initScores);
    const totalScore = Object.values(questionScores).reduce((sum, v) => sum + (Number(v) || 0), 0);

    const QUESTION_LABELS = {
        'multiple-choice': 'Multiple Choice',
        'true-false': 'True / False',
        'fill-in-blank': 'Fill in Blank',
        'short-answer': 'Short Answer',
        'essay': 'Essay',
        'ordering': 'Ordering',
        'word-scramble': 'Word Scramble',
        'sentence-builder': 'Sentence Builder',
        'error-correction': 'Error Correction',
        'translation': 'Translation',
        'categorize': 'Categorize',
        'matching': 'Matching',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg sm:text-xl font-display font-bold text-white">Review Submission</h2>
                        <p className="text-xs sm:text-sm text-white/40">{student?.displayName || submission.studentName} • {assignment?.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {assignment?.questions?.map((q, idx) => {
                        const studentAnswer = submission.answers?.[idx];
                        const isAutoGradable = q.type === 'multiple-choice' || q.type === 'true-false';
                        const isFillBlank = q.type === 'fill-in-blank';
                        const isOrdering = q.type === 'ordering';
                        const isTextMatch = q.type === 'word-scramble' || q.type === 'sentence-builder' || q.type === 'error-correction' || q.type === 'translation';
                        const isManual = q.type === 'essay' || q.type === 'short-answer';
                        const isCategorize = q.type === 'categorize';
                        const isMatching = q.type === 'matching';

                        // Auto-grade logic for display
                        let correctAnswer = null;
                        let isCorrect = false;
                        if (isAutoGradable) {
                            correctAnswer = q.options?.[q.correctAnswer];
                            isCorrect = studentAnswer === correctAnswer;
                        } else if (isFillBlank || q.type === 'word-scramble' || q.type === 'error-correction' || q.type === 'translation') {
                            correctAnswer = q.correctText;
                            const sa = (studentAnswer || '').trim().toLowerCase();
                            const ca = (correctAnswer || '').trim().toLowerCase();
                            isCorrect = sa && ca && sa === ca;
                        } else if (q.type === 'sentence-builder') {
                            correctAnswer = q.correctSentence;
                            const sa = (studentAnswer || '').trim().toLowerCase();
                            const ca = (correctAnswer || '').trim().toLowerCase();
                            isCorrect = sa && ca && sa === ca;
                        } else if (isOrdering) {
                            isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(q.items || []);
                        } else if (isCategorize) {
                            const cats = q.categories || [];
                            const allItems = cats.reduce((acc, cat, cIdx) => [...acc, ...cat.items.map(() => cIdx)], []);
                            isCorrect = studentAnswer && typeof studentAnswer === 'object' &&
                                allItems.every((correctCatIdx, itemIdx) => studentAnswer[itemIdx] === correctCatIdx);
                        } else if (isMatching) {
                            isCorrect = (q.pairs || []).every((pair, i) => studentAnswer?.[i] === pair.right);
                        }

                        const qScore = questionScores[idx];
                        const isAutoType = isAutoGradable || isFillBlank || isOrdering || isTextMatch || isCategorize || isMatching;
                        const borderColor = isManual
                            ? 'bg-white/[0.02] border-white/[0.04]'
                            : isCorrect
                                ? 'bg-neon-green/5 border-neon-green/20'
                                : 'bg-red-500/5 border-red-500/20';

                        // Safe display string for student answer
                        const displayAnswer = (() => {
                            if (studentAnswer == null) return '— No answer —';
                            if (typeof studentAnswer === 'string') return studentAnswer || '— No answer —';
                            if (Array.isArray(studentAnswer)) return studentAnswer.join(', ') || '— No answer —';
                            if (typeof studentAnswer === 'object') return JSON.stringify(studentAnswer);
                            return String(studentAnswer);
                        })();

                        return (
                            <div key={idx} className={`p-4 rounded-xl border ${borderColor}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-white/40">Q{idx + 1} — {QUESTION_LABELS[q.type] || q.type}</p>
                                    <div className="flex items-center gap-2">
                                        {isAutoType && (
                                            <span className={`text-xs font-bold ${isCorrect ? 'text-neon-green' : 'text-red-400'}`}>
                                                {isCorrect ? `✓ +${q.points}` : '✗ 0'}
                                            </span>
                                        )}
                                        {isManual && (
                                            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/10">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={q.points}
                                                    value={qScore}
                                                    onChange={(e) => setQuestionScores({ ...questionScores, [idx]: e.target.value })}
                                                    className="bg-transparent border-none text-sm text-neon-blue w-10 text-center focus:ring-0 p-0 font-bold"
                                                    placeholder="0"
                                                />
                                                <span className="text-[10px] text-white/30">/ {q.points}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-white mb-3 font-medium text-sm">{q.text}</p>

                                {/* Student answer */}
                                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                                    <p className="text-xs text-neon-blue mb-1 uppercase tracking-wider font-bold">Student Answer:</p>
                                    {isOrdering ? (
                                        <div className="space-y-1">
                                            {(Array.isArray(studentAnswer) ? studentAnswer : []).map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                                                    <span className="text-[10px] text-white/30 w-4">{i + 1}.</span>{item}
                                                </div>
                                            ))}
                                            {(!studentAnswer || !Array.isArray(studentAnswer) || studentAnswer.length === 0) && (
                                                <p className="text-white/30 text-sm">— No answer —</p>
                                            )}
                                        </div>
                                    ) : isMatching ? (
                                        <div className="space-y-1">
                                            {(q.pairs || []).map((pair, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <span className="text-white/60">{pair.left}</span>
                                                    <span className="text-white/20">→</span>
                                                    <span className={studentAnswer?.[i] === pair.right ? 'text-neon-green' : 'text-red-400'}>
                                                        {studentAnswer?.[i] || '—'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : isCategorize ? (
                                        <div className="space-y-4 mt-2">
                                            {(q.categories || []).map((cat, cIdx) => {
                                                const allItems = (q.categories || []).reduce((acc, c) => [...acc, ...(c.items || [])], []);
                                                const studentItemsInCat = Object.entries(studentAnswer || {})
                                                    .filter(([_, catId]) => Number(catId) === cIdx)
                                                    .map(([itemId]) => allItems[itemId])
                                                    .filter(Boolean);

                                                return (
                                                    <div key={cIdx} className="bg-white/[0.03] p-2 rounded-lg mb-2">
                                                        <p className="text-xs text-white/50 mb-2 uppercase font-bold">{cat.name}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {studentItemsInCat.length > 0 ? studentItemsInCat.map((item, i) => (
                                                                <span key={i} className="px-2 py-1 bg-neon-blue/10 border border-neon-blue/20 rounded text-xs text-white">
                                                                    {item}
                                                                </span>
                                                            )) : <span className="text-xs text-white/20 italic">No items placed</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-white/80 text-sm whitespace-pre-wrap">{displayAnswer}</p>
                                    )}
                                </div>

                                {/* Show correct answer for wrong auto-graded */}
                                {(isAutoGradable || isFillBlank || isTextMatch) && !isCorrect && correctAnswer && (
                                    <div className="mt-2 p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                        <p className="text-xs text-neon-green">✓ Correct: {correctAnswer}</p>
                                    </div>
                                )}
                                {isOrdering && !isCorrect && (
                                    <div className="mt-2 p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                        <p className="text-xs text-neon-green mb-1">✓ Correct order:</p>
                                        {(q.items || []).map((item, i) => (
                                            <p key={i} className="text-xs text-neon-green/70 ml-2">{i + 1}. {item}</p>
                                        ))}
                                    </div>
                                )}
                                {isMatching && !isCorrect && (
                                    <div className="mt-2 p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                        <p className="text-xs text-neon-green mb-1">✓ Correct matches:</p>
                                        {(q.pairs || []).map((pair, i) => (
                                            <p key={i} className="text-xs text-neon-green/70 ml-2">{pair.left} → {pair.right}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 sm:p-6 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-white/40 uppercase block mb-1">Total Score</label>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-display font-black text-neon-blue">{totalScore}</span>
                            <span className="text-white/30 text-sm">/ {assignment?.totalPoints || 100}</span>
                            <span className="text-xs text-white/20 ml-2">
                                ({Math.round((totalScore / (assignment?.totalPoints || 100)) * 100)}%)
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => onGrade(submission.id, totalScore, questionScores)}
                        className="btn-neon h-12 px-6 sm:px-8 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        <CheckCircle2 size={18} /> {submission.grade != null ? 'Update' : 'Save'} Grade
                    </button>
                    <button
                        onClick={() => onRetake(submission.id)}
                        className="h-12 px-5 rounded-xl bg-neon-orange/10 border border-neon-orange/20 text-neon-orange text-sm font-medium flex items-center justify-center gap-2 hover:bg-neon-orange/20 transition-all"
                    >
                        <RotateCcw size={16} /> Allow Retake
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
