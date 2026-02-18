import { useParams, useNavigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import {
    BookOpen, Clock, Award, ChevronLeft, CheckCircle2, XCircle,
    Send, AlertTriangle, Trophy, Timer, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// Stable shuffle using seed
function seededShuffle(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function AssignmentView() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { assignments, classes, submissions, submitAssignment } = useClasses();
    const toast = useToast();

    const assignment = assignments.find(a => a.id === assignmentId);
    const cls = classes.find(c => c.id === assignment?.classId);

    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if already submitted
    const existingSubmission = useMemo(() =>
        submissions.find(s => s.assignmentId === assignmentId && s.studentId === userProfile?.uid),
        [submissions, assignmentId, userProfile?.uid]
    );

    const isSubmitted = !!existingSubmission;

    // ─── TIMER LOGIC ────────────────────────────────────
    const hasTimeLimit = assignment?.timeLimit > 0;
    const timerKey = `timer_${assignmentId}_${userProfile?.uid}`;

    const [timeLeft, setTimeLeft] = useState(() => {
        if (!hasTimeLimit || isSubmitted) return 0;
        // Check sessionStorage for persistence across refresh
        const saved = sessionStorage.getItem(timerKey);
        if (saved) {
            const remaining = Math.max(0, Math.floor((Number(saved) - Date.now()) / 1000));
            return remaining > 0 ? remaining : 0;
        }
        return (assignment?.timeLimit || 0) * 60;
    });
    const [timerStarted, setTimerStarted] = useState(false);
    const timerRef = useRef(null);
    const autoSubmitRef = useRef(false);

    // Start timer on first answer (or auto-start for exams)
    const startTimer = useCallback(() => {
        if (!hasTimeLimit || isSubmitted || timerStarted) return;
        setTimerStarted(true);
        const endTime = Date.now() + timeLeft * 1000;
        sessionStorage.setItem(timerKey, String(endTime));
    }, [hasTimeLimit, isSubmitted, timerStarted, timeLeft, timerKey]);

    // Auto-start if timer was already running (page refresh)
    useEffect(() => {
        if (hasTimeLimit && !isSubmitted && sessionStorage.getItem(timerKey)) {
            setTimerStarted(true);
        }
    }, [hasTimeLimit, isSubmitted, timerKey]);

    // Countdown effect
    useEffect(() => {
        if (!timerStarted || isSubmitted || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timerStarted, isSubmitted]);

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeLeft === 0 && timerStarted && !isSubmitted && !autoSubmitRef.current) {
            autoSubmitRef.current = true;
            handleTimerSubmit();
        }
    }, [timeLeft, timerStarted, isSubmitted]);

    // Navigation warning during timed exam
    useEffect(() => {
        if (hasTimeLimit && timerStarted && !isSubmitted) {
            const handler = (e) => {
                e.preventDefault();
                e.returnValue = 'You have a timed exam in progress. Are you sure you want to leave?';
            };
            window.addEventListener('beforeunload', handler);
            return () => window.removeEventListener('beforeunload', handler);
        }
    }, [hasTimeLimit, timerStarted, isSubmitted]);

    // Cleanup timer from sessionStorage on submit
    const cleanupTimer = () => {
        sessionStorage.removeItem(timerKey);
        clearInterval(timerRef.current);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const timerPct = hasTimeLimit ? (timeLeft / ((assignment?.timeLimit || 1) * 60)) * 100 : 100;

    const handleSubmit = async () => {
        if (isSubmitting || isSubmitted) return;

        const questionCount = assignment.questions?.length || 0;
        const answeredCount = Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length;
        if (answeredCount < questionCount) {
            toast.warning('Please answer all questions before submitting.');
            return;
        }

        setIsSubmitting(true);

        try {
            let grade = 0;
            let status = 'graded';
            let needsManualGrading = false;

            assignment.questions.forEach((q, idx) => {
                const studentAnswer = answers[idx];

                if (q.type === 'multiple-choice' || q.type === 'true-false') {
                    const correctOption = q.options[q.correctAnswer];
                    if (studentAnswer === correctOption) {
                        grade += (q.points || 0);
                    }
                } else if (q.type === 'fill-in-blank') {
                    const sa = (studentAnswer || '').trim().toLowerCase();
                    const ca = (q.correctText || '').trim().toLowerCase();
                    if (sa && ca && sa === ca) {
                        grade += (q.points || 0);
                    }
                } else if (q.type === 'ordering') {
                    if (JSON.stringify(studentAnswer) === JSON.stringify(q.items || [])) {
                        grade += (q.points || 0);
                    }
                } else if (q.type === 'matching') {
                    const allCorrect = (q.pairs || []).every((pair, i) => studentAnswer?.[i] === pair.right);
                    if (allCorrect) grade += (q.points || 0);
                } else if (q.type === 'word-scramble') {
                    const sa = (studentAnswer || '').trim().toLowerCase();
                    const ca = (q.correctText || '').trim().toLowerCase();
                    if (sa && ca && sa === ca) grade += (q.points || 0);
                } else if (q.type === 'sentence-builder') {
                    const sa = (studentAnswer || '').trim().toLowerCase();
                    const ca = (q.correctSentence || '').trim().toLowerCase();
                    if (sa && ca && sa === ca) grade += (q.points || 0);
                } else if (q.type === 'categorize') {
                    // Check if every item is in correct category
                    // studentAnswer is object: { itemId: categoryIndex }
                    // Flatten items to know their correct cat index
                    let allCorrect = true;
                    let itemGlobalIdx = 0;
                    (q.categories || []).forEach((cat, cIdx) => {
                        (cat.items || []).forEach(() => {
                            if (studentAnswer?.[itemGlobalIdx] !== cIdx) allCorrect = false;
                            itemGlobalIdx++;
                        });
                    });
                    if (allCorrect && itemGlobalIdx > 0) grade += (q.points || 0);
                } else if (q.type === 'error-correction') {
                    if ((studentAnswer || '').trim().toLowerCase() === (q.correctText || '').trim().toLowerCase()) grade += (q.points || 0);
                } else if (q.type === 'translation') {
                    if ((studentAnswer || '').trim().toLowerCase() === (q.correctText || '').trim().toLowerCase()) grade += (q.points || 0);
                } else if (q.type === 'essay' || q.type === 'short-answer') {
                    needsManualGrading = true;
                }
            });

            if (needsManualGrading) {
                status = 'pending';
            }

            const submission = {
                assignmentId,
                classId: assignment.classId,
                studentId: userProfile?.uid,
                studentName: userProfile?.displayName || 'Student',
                answers,
                grade,
                maxPoints: assignment.totalPoints || 100,
                submittedAt: new Date().toISOString(),
                status
            };

            await submitAssignment(submission);
            cleanupTimer();
            toast.success(`Assignment submitted! You scored ${grade}/${assignment.totalPoints || 0} points.`);
        } catch (e) {
            toast.error('Submission failed: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-submit for timer (submits whatever answers are filled)
    const handleTimerSubmit = async () => {
        if (isSubmitting || isSubmitted) return;
        setIsSubmitting(true);
        try {
            let grade = 0;
            let status = 'graded';
            let needsManualGrading = false;

            assignment.questions.forEach((q, idx) => {
                const studentAnswer = answers[idx];
                if (!studentAnswer && studentAnswer !== 0) return;

                if (q.type === 'multiple-choice' || q.type === 'true-false') {
                    const correctOption = q.options[q.correctAnswer];
                    if (studentAnswer === correctOption) grade += (q.points || 0);
                } else if (q.type === 'fill-in-blank') {
                    if ((studentAnswer || '').trim().toLowerCase() === (q.correctText || '').trim().toLowerCase()) grade += (q.points || 0);
                } else if (q.type === 'ordering') {
                    if (JSON.stringify(studentAnswer) === JSON.stringify(q.items || [])) grade += (q.points || 0);
                } else if (q.type === 'essay' || q.type === 'short-answer') {
                    needsManualGrading = true;
                }
            });

            if (needsManualGrading) status = 'pending';

            await submitAssignment({
                assignmentId,
                classId: assignment.classId,
                studentId: userProfile?.uid,
                studentName: userProfile?.displayName || 'Student',
                answers,
                grade,
                maxPoints: assignment.totalPoints || 100,
                submittedAt: new Date().toISOString(),
                status,
                autoSubmitted: true,
            });
            cleanupTimer();
            toast.warning('⏱️ Time is up! Your answers were auto-submitted.');
        } catch (e) {
            toast.error('Auto-submit failed: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!assignment) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] animate-pulse mb-4" />
                <p className="text-white/40 text-sm">Loading assignment...</p>
            </div>
        </div>
    );

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    // Grade info
    const pct = isSubmitted && existingSubmission.grade != null
        ? Math.round((existingSubmission.grade / (assignment.totalPoints || 100)) * 100)
        : 0;
    const gradeColor = pct >= 90 ? 'text-neon-green' : pct >= 70 ? 'text-neon-blue' : pct >= 50 ? 'text-neon-orange' : 'text-red-400';

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title={assignment.title}
                subtitle={`${cls?.name || 'Class'} • Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                actions={
                    <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
                        <ChevronLeft size={16} /> Back
                    </button>
                }
            />

            {/* ─── TIMER BAR (Timed Exams) ─── */}
            {hasTimeLimit && !isSubmitted && (
                <div className={`sticky top-0 z-30 px-4 py-3 ${timerStarted ? 'bg-surface-950/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-neon-blue/5 border-b border-neon-blue/20'}`}>
                    <div className="max-w-4xl mx-auto">
                        {!timerStarted ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                                        <Timer size={20} className="text-neon-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Timed Exam — {assignment.timeLimit} minutes</p>
                                        <p className="text-[10px] text-white/40">Timer starts when you click 'Start Exam'. You cannot pause once started.</p>
                                    </div>
                                </div>
                                <button onClick={startTimer} className="btn-neon text-sm px-5 py-2.5 flex items-center gap-2 animate-pulse">
                                    <Timer size={16} /> Start Exam
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Timer size={16} className={`${timeLeft <= 60 ? 'text-red-400 animate-pulse' : timeLeft <= 300 ? 'text-neon-orange' : 'text-neon-green'}`} />
                                        <span className={`text-2xl font-mono font-black tracking-wider ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : timeLeft <= 300 ? 'text-neon-orange' : 'text-neon-green'}`}>
                                            {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-white/30">
                                        {timeLeft <= 60 ? '⚠️ Less than 1 minute!' : timeLeft <= 300 ? '⏳ Hurry up!' : `${Math.ceil(timeLeft / 60)} min remaining`}
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full transition-colors duration-1000 ${timeLeft <= 60 ? 'bg-red-500' : timeLeft <= 300 ? 'bg-neon-orange' : 'bg-neon-green'}`}
                                        animate={{ width: `${timerPct}%` }}
                                        transition={{ duration: 0.5, ease: 'linear' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto p-4 sm:p-6">
                {isSubmitted ? (
                    <>
                        {/* Results Header */}
                        <motion.div variants={item} className="glass-card p-6 sm:p-8 text-center space-y-4 mb-6">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-2 ${pct >= 70 ? 'bg-neon-green/10 border border-neon-green/20' : 'bg-neon-orange/10 border border-neon-orange/20'}`}>
                                {pct >= 70 ? <Trophy size={36} className="text-neon-green" /> : <AlertTriangle size={36} className="text-neon-orange" />}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                                {existingSubmission.status === 'graded' ? 'Results' : 'Submitted — Awaiting Review'}
                            </h2>
                            {existingSubmission.status === 'graded' && (
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <div className="text-center">
                                        <p className={`text-4xl sm:text-5xl font-display font-black ${gradeColor}`}>{existingSubmission.grade}</p>
                                        <p className="text-xs text-white/40 mt-1">Points Earned</p>
                                    </div>
                                    <div className="w-px h-12 bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-4xl sm:text-5xl font-display font-black text-white/30">{assignment.totalPoints || 0}</p>
                                        <p className="text-xs text-white/40 mt-1">Total Points</p>
                                    </div>
                                    <div className="w-px h-12 bg-white/10" />
                                    <div className="text-center">
                                        <p className={`text-4xl sm:text-5xl font-display font-black ${gradeColor}`}>{pct}%</p>
                                        <p className="text-xs text-white/40 mt-1">Score</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-center gap-3 mt-4">
                                <button onClick={() => navigate('/dashboard')} className="btn-neon text-sm px-4 py-2">Dashboard</button>
                                <button onClick={() => navigate('/grades')} className="btn-ghost text-sm px-4 py-2">My Grades</button>
                            </div>
                        </motion.div>

                        {/* Show answers with correct/incorrect feedback */}
                        <div className="space-y-4">
                            {assignment.questions?.map((q, idx) => {
                                const studentAnswer = existingSubmission.answers?.[idx];
                                const isAutoGraded = q.type === 'multiple-choice' || q.type === 'true-false';
                                const isFillBlank = q.type === 'fill-in-blank';
                                const isOrdering = q.type === 'ordering';
                                const isManual = q.type === 'essay' || q.type === 'short-answer';
                                const isWordScramble = q.type === 'word-scramble';
                                const isSentenceBuilder = q.type === 'sentence-builder';
                                const isTextMatch = isWordScramble || isSentenceBuilder || q.type === 'error-correction' || q.type === 'translation';

                                let correctOption = null;
                                let isCorrect = false;
                                if (isAutoGraded) {
                                    correctOption = q.options[q.correctAnswer];
                                    isCorrect = studentAnswer === correctOption;
                                } else if (isFillBlank) {
                                    correctOption = q.correctText;
                                    const sa = (studentAnswer || '').trim().toLowerCase();
                                    const ca = (correctOption || '').trim().toLowerCase();
                                    isCorrect = sa && ca && sa === ca;
                                } else if (isOrdering) {
                                    isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(q.items || []);
                                } else if (isWordScramble || q.type === 'error-correction' || q.type === 'translation') {
                                    correctOption = q.correctText;
                                    const sa = (studentAnswer || '').trim().toLowerCase();
                                    const ca = (correctOption || '').trim().toLowerCase();
                                    isCorrect = sa && ca && sa === ca;
                                } else if (isSentenceBuilder) {
                                    correctOption = q.correctSentence;
                                    const sa = (studentAnswer || '').trim().toLowerCase();
                                    const ca = (correctOption || '').trim().toLowerCase();
                                    isCorrect = sa && ca && sa === ca;
                                } else if (q.type === 'categorize') {
                                    let allRight = true;
                                    let gi = 0;
                                    (q.categories || []).forEach((cat, cIdx) => {
                                        (cat.items || []).forEach(() => {
                                            if (studentAnswer?.[gi] !== cIdx) allRight = false;
                                            gi++;
                                        });
                                    });
                                    isCorrect = allRight && gi > 0;
                                } else if (q.type === 'matching') {
                                    isCorrect = (q.pairs || []).every((pair, i) => studentAnswer?.[i] === pair.right);
                                }

                                const borderClass = isManual ? 'border-l-neon-blue' : isCorrect ? 'border-l-neon-green' : 'border-l-red-500';
                                const iconBg = isManual ? 'bg-neon-blue/10 border-neon-blue/20' : isCorrect ? 'bg-neon-green/10 border-neon-green/20' : 'bg-red-500/10 border-red-500/20';
                                const scoreClass = isManual ? 'bg-white/[0.03] text-white/30 border-white/5' : isCorrect ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

                                return (
                                    <motion.div key={idx} variants={item}
                                        className={`glass-card p-4 sm:p-6 border-l-4 ${borderClass}`}
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconBg}`}>
                                                {!isManual ? (
                                                    isCorrect ? <CheckCircle2 size={16} className="text-neon-green" /> : <XCircle size={16} className="text-red-400" />
                                                ) : (
                                                    <span className="text-neon-blue font-bold text-sm">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <h4 className="text-white font-semibold text-sm sm:text-base leading-tight">{q.text}</h4>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${scoreClass}`}>
                                                        {isManual ? `${q.points} pts` : (isCorrect ? `+${q.points}` : '0')}
                                                    </span>
                                                </div>

                                                {/* MC / TF review */}
                                                {isAutoGraded && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {q.options?.map((opt, oIdx) => {
                                                            const isStudentPick = studentAnswer === opt;
                                                            const isCorrectOpt = opt === correctOption;
                                                            let optClass = 'bg-white/[0.01] border-white/5 text-white/40';
                                                            if (isCorrectOpt) optClass = 'bg-neon-green/10 border-neon-green/40 text-neon-green';
                                                            else if (isStudentPick && !isCorrectOpt) optClass = 'bg-red-500/10 border-red-500/40 text-red-400';
                                                            return (
                                                                <div key={oIdx} className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${optClass}`}>
                                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isCorrectOpt ? 'border-neon-green bg-neon-green' : isStudentPick ? 'border-red-400 bg-red-400' : 'border-white/10'}`}>
                                                                        {(isCorrectOpt || isStudentPick) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                    </div>
                                                                    <span className="font-medium">{opt}</span>
                                                                    {isCorrectOpt && <CheckCircle2 size={14} className="ml-auto text-neon-green shrink-0" />}
                                                                    {isStudentPick && !isCorrectOpt && <XCircle size={14} className="ml-auto text-red-400 shrink-0" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Fill-in-blank review */}
                                                {isFillBlank && (
                                                    <div className="space-y-2">
                                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                                            <p className="text-sm text-white/60">{studentAnswer || 'No answer provided'}</p>
                                                        </div>
                                                        {!isCorrect && correctOption && (
                                                            <div className="p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                                                <p className="text-xs text-neon-green">✓ Correct: {correctOption}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Ordering review */}
                                                {isOrdering && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-white/30 uppercase mb-1">Your order:</p>
                                                        {(Array.isArray(studentAnswer) ? studentAnswer : []).map((item, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/60">
                                                                <span className="text-[10px] text-white/30 w-4">{i + 1}.</span>{item}
                                                            </div>
                                                        ))}
                                                        {!isCorrect && (
                                                            <div className="mt-2 p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                                                <p className="text-xs text-neon-green mb-1">✓ Correct order:</p>
                                                                {(q.items || []).map((item, i) => (
                                                                    <p key={i} className="text-xs text-neon-green/70 ml-2">{i + 1}. {item}</p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Text-match review (word-scramble, sentence-builder, error-correction, translation) */}
                                                {isTextMatch && (
                                                    <div className="space-y-2">
                                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                                            <p className="text-xs text-white/30 uppercase mb-1">Your answer:</p>
                                                            <p className="text-sm text-white/60">{studentAnswer || 'No answer provided'}</p>
                                                        </div>
                                                        {!isCorrect && correctOption && (
                                                            <div className="p-2 rounded-lg bg-neon-green/5 border border-neon-green/10">
                                                                <p className="text-xs text-neon-green">✓ Correct: {correctOption}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Categorize review */}
                                                {q.type === 'categorize' && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-white/30 uppercase mb-1">Your categorization:</p>
                                                        <p className="text-sm text-white/60">{isCorrect ? 'All items correctly categorized' : 'Some items were incorrectly categorized'}</p>
                                                    </div>
                                                )}

                                                {/* Matching review */}
                                                {q.type === 'matching' && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-white/30 uppercase mb-1">Your matches:</p>
                                                        <p className="text-sm text-white/60">{isCorrect ? 'All pairs matched correctly' : 'Some pairs were incorrect'}</p>
                                                    </div>
                                                )}

                                                {/* Essay / Short-answer review */}
                                                {isManual && (
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                                        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{studentAnswer || 'No answer provided'}</p>
                                                        {existingSubmission.status === 'pending' && (
                                                            <p className="text-xs text-neon-orange mt-2 flex items-center gap-1">
                                                                <Clock size={12} /> Awaiting teacher review
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* Assignment Info */}
                        <motion.div variants={item} className="glass-card p-4 sm:p-6 border-l-4 border-l-neon-blue">
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <BookOpen size={18} className="text-neon-blue" /> Instructions
                            </h3>
                            <p className="text-white/60 leading-relaxed font-light text-sm sm:text-base">{assignment.description}</p>
                            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                                <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                    <Clock size={14} className="text-neon-blue" />
                                    <span className="text-white/50">Due:</span>
                                    <span className="text-white font-medium text-xs sm:text-sm">{new Date(assignment.dueDate).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                    <Award size={14} className="text-neon-green" />
                                    <span className="text-white/50">Points:</span>
                                    <span className="text-white font-medium">{assignment.totalPoints || 0}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Questions */}
                        <div className="space-y-4 sm:space-y-6">
                            {assignment.questions?.map((q, idx) => {
                                const isSelectType = q.type === 'multiple-choice' || q.type === 'true-false';
                                const isOrdering = q.type === 'ordering';
                                const isFillBlank = q.type === 'fill-in-blank';
                                const isShortAnswer = q.type === 'short-answer';
                                const isEssay = q.type === 'essay';

                                // Initialize ordering answer with shuffled items if not set
                                if (isOrdering && !answers[idx]) {
                                    const shuffled = [...(q.items || [])].sort(() => Math.random() - 0.5);
                                    // set lazily on first render
                                    if (!answers[idx]) {
                                        setTimeout(() => setAnswers(prev => ({ ...prev, [idx]: shuffled })), 0);
                                    }
                                }

                                return (
                                    <motion.div key={idx} variants={item} className="glass-card p-4 sm:p-6 relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue font-bold text-sm shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-4">
                                                    <h4 className="text-white font-semibold text-sm sm:text-lg leading-tight">{q.text}</h4>
                                                    <span className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-wider shrink-0">{q.points} pts</span>
                                                </div>

                                                {/* Multiple Choice / True-False */}
                                                {isSelectType && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {q.options?.map((opt, oIdx) => (
                                                            <button
                                                                key={oIdx}
                                                                onClick={() => setAnswers({ ...answers, [idx]: opt })}
                                                                className={`p-3 sm:p-4 rounded-xl text-left transition-all border group/opt ${answers[idx] === opt
                                                                    ? 'bg-neon-blue/10 border-neon-blue text-white shadow-[0_0_20px_rgba(0,209,255,0.1)]'
                                                                    : 'bg-white/[0.01] border-white/5 text-white/50 hover:border-white/20 hover:bg-white/[0.03]'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${answers[idx] === opt ? 'border-neon-blue bg-neon-blue shadow-[0_0_10px_rgba(0,209,255,0.5)]' : 'border-white/10 group-hover/opt:border-white/30'}`}>
                                                                        {answers[idx] === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                    </div>
                                                                    <span className="text-sm font-medium">{opt}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Fill in Blank */}
                                                {isFillBlank && (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Type your answer..."
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                                            className="input-glass w-full text-sm"
                                                        />
                                                    </div>
                                                )}

                                                {/* Short Answer */}
                                                {isShortAnswer && (
                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="Write a brief answer..."
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                                            className="input-glass w-full min-h-[80px] resize-none p-4 text-sm leading-relaxed"
                                                        />
                                                        <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-medium">
                                                            {(answers[idx] || '').length} chars
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Ordering — Drag & Drop */}
                                                {isOrdering && (
                                                    <DraggableOrderingList
                                                        items={Array.isArray(answers[idx]) ? answers[idx] : []}
                                                        onChange={(newOrder) => {
                                                            startTimer();
                                                            setAnswers({ ...answers, [idx]: newOrder });
                                                        }}
                                                    />
                                                )}

                                                {/* Essay */}
                                                {isEssay && (
                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="Write your detailed response here..."
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                                            className="input-glass w-full min-h-[140px] sm:min-h-[200px] resize-none p-4 text-sm leading-relaxed"
                                                        />
                                                        <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-medium">
                                                            {(answers[idx] || '').length} chars
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Matching */}
                                                {q.type === 'matching' && (
                                                    <div className="space-y-3">
                                                        <p className="text-xs text-white/40 mb-2">Match the items on the left with the correct option on the right.</p>
                                                        {(q.pairs || []).map((pair, pIdx) => (
                                                            <div key={pIdx} className="grid grid-cols-2 gap-4 items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <div className="text-sm font-medium text-white/80">{pair.left}</div>
                                                                <select
                                                                    value={answers[idx]?.[pIdx] || ''}
                                                                    onChange={(e) => {
                                                                        const newAns = [...(answers[idx] || [])];
                                                                        newAns[pIdx] = e.target.value;
                                                                        setAnswers({ ...answers, [idx]: newAns });
                                                                    }}
                                                                    className="bg-black/20 border border-white/10 rounded-lg text-sm text-neon-blue p-2 focus:ring-1 focus:ring-neon-blue outline-none"
                                                                >
                                                                    <option value="">Select match...</option>
                                                                    {[...(q.pairs || [])].sort((a, b) => a.right.localeCompare(b.right)).map((p, i) => (
                                                                        <option key={i} value={p.right}>{p.right}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Word Scramble */}
                                                {q.type === 'word-scramble' && (
                                                    <WordScrambleQuestion
                                                        q={q}
                                                        idx={idx}
                                                        answers={answers}
                                                        setAnswers={setAnswers}
                                                        startTimer={startTimer}
                                                    />
                                                )}

                                                {/* Sentence Builder */}
                                                {q.type === 'sentence-builder' && (
                                                    <SentenceBuilderQuestion
                                                        q={q}
                                                        idx={idx}
                                                        answers={answers}
                                                        setAnswers={setAnswers}
                                                        startTimer={startTimer}
                                                    />
                                                )}

                                                {/* Categorize */}
                                                {q.type === 'categorize' && (
                                                    <div className="space-y-4">
                                                        <p className="text-xs text-white/40">Assign each item to its correct category.</p>
                                                        <div className="space-y-2">
                                                            {(() => {
                                                                let itemGlobalIdx = 0;
                                                                return (q.categories || []).flatMap((cat, cIdx) =>
                                                                    (cat.items || []).map((item, i) => {
                                                                        const currentIdx = itemGlobalIdx++;
                                                                        return (
                                                                            <div key={`${cIdx}-${i}`} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                                                <span className="text-sm text-white/80 font-medium">{item}</span>
                                                                                <select
                                                                                    value={answers[idx]?.[currentIdx] ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const newAns = { ...(answers[idx] || {}) };
                                                                                        newAns[currentIdx] = Number(e.target.value);
                                                                                        setAnswers({ ...answers, [idx]: newAns });
                                                                                    }}
                                                                                    className="bg-black/20 border border-white/10 rounded-lg text-xs text-neon-blue p-2 focus:ring-1 focus:ring-neon-blue outline-none max-w-[150px]"
                                                                                >
                                                                                    <option value="">Select Category...</option>
                                                                                    {(q.categories || []).map((c, ci) => (
                                                                                        <option key={ci} value={ci}>{c.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ).sort(() => Math.random() - 0.5); // Shuffle display order
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Error Correction */}
                                                {q.type === 'error-correction' && (
                                                    <div className="space-y-3">
                                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                                            <p className="text-xs text-red-300 uppercase font-bold mb-1">Incorrect Sentence:</p>
                                                            <p className="text-sm text-white/90">{q.errorSentence}</p>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Type the corrected sentence here..."
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                                            className="input-glass w-full"
                                                        />
                                                    </div>
                                                )}

                                                {/* Translation */}
                                                {q.type === 'translation' && (
                                                    <div className="space-y-3">
                                                        <div className="p-3 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
                                                            <p className="text-xs text-neon-blue uppercase font-bold mb-1">Translate to English:</p>
                                                            <p className="text-sm text-white/90">{q.sourceText}</p>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Type the English translation..."
                                                            value={answers[idx] || ''}
                                                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                                            className="input-glass w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Submit */}
                        <motion.div variants={item} className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn-neon flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} /> Submit Assignment
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ─── WORD SCRAMBLE with real-time letter feedback ─────────────
function WordScrambleQuestion({ q, idx, answers, setAnswers, startTimer }) {
    const correctText = q.correctText || '';
    const shuffledLetters = useMemo(() => {
        const chars = correctText.split('');
        return seededShuffle(chars, correctText.length * 7 + idx * 31 + 42);
    }, [correctText, idx]);

    const typed = answers[idx] || '';
    const correctLower = correctText.toLowerCase();

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                {shuffledLetters.map((char, i) => (
                    <span key={i} className="w-8 h-8 flex items-center justify-center bg-neon-purple/10 border border-neon-purple/30 rounded text-neon-purple font-bold text-sm">
                        {char}
                    </span>
                ))}
            </div>
            {/* Live letter feedback */}
            <div className="flex flex-wrap gap-1.5 justify-center min-h-[40px] p-3 rounded-xl bg-black/20 border border-white/5">
                {typed.length > 0 ? typed.split('').map((ch, i) => {
                    const isCorrectPos = i < correctLower.length && ch.toLowerCase() === correctLower[i];
                    return (
                        <span key={i} className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm border transition-all duration-200 ${isCorrectPos
                            ? 'bg-neon-green/15 border-neon-green/40 text-neon-green'
                            : 'bg-red-500/15 border-red-500/40 text-red-400'
                            }`}>
                            {ch}
                        </span>
                    );
                }) : (
                    <span className="text-xs text-white/20">Type below to see letter feedback...</span>
                )}
            </div>
            <input
                type="text"
                placeholder="Unscramble the word..."
                value={typed}
                onChange={(e) => {
                    startTimer?.();
                    setAnswers(prev => ({ ...prev, [idx]: e.target.value }));
                }}
                className="input-glass w-full text-center tracking-widest font-bold text-lg"
            />
        </div>
    );
}

// ─── SENTENCE BUILDER with tracked word pool ─────────────────
function SentenceBuilderQuestion({ q, idx, answers, setAnswers, startTimer }) {
    const correctSentence = q.correctSentence || '';
    const words = useMemo(() => correctSentence.split(' ').filter(Boolean), [correctSentence]);
    const shuffledWords = useMemo(() => {
        return seededShuffle(words, correctSentence.length * 13 + idx * 37 + 99);
    }, [words, correctSentence.length, idx]);

    const currentAnswer = answers[idx] || '';
    const usedWords = currentAnswer ? currentAnswer.split(' ').filter(Boolean) : [];

    // Track which shuffled word indices have been used
    const availableIndices = useMemo(() => {
        const used = [...usedWords];
        const taken = new Set();
        used.forEach(w => {
            for (let i = 0; i < shuffledWords.length; i++) {
                if (!taken.has(i) && shuffledWords[i] === w) {
                    taken.add(i);
                    break;
                }
            }
        });
        return shuffledWords.map((_, i) => !taken.has(i));
    }, [shuffledWords, usedWords]);

    const handleWordClick = (word) => {
        startTimer?.();
        setAnswers(prev => ({ ...prev, [idx]: (prev[idx] ? prev[idx] + ' ' : '') + word }));
    };

    const handleRemoveLastWord = () => {
        const w = usedWords.slice(0, -1).join(' ');
        setAnswers(prev => ({ ...prev, [idx]: w }));
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-white/40">Tap words to build the sentence:</p>
            {/* Word pool */}
            <div className="flex flex-wrap gap-2 justify-center min-h-[44px] p-3 rounded-xl bg-black/20 border border-white/5">
                {shuffledWords.map((word, i) => (
                    <button
                        key={i}
                        type="button"
                        disabled={!availableIndices[i]}
                        onClick={() => handleWordClick(word)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${availableIndices[i]
                            ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20 hover:bg-neon-blue/20 hover:scale-105 cursor-pointer'
                            : 'bg-white/[0.02] text-white/10 border-white/[0.03] cursor-not-allowed'
                            }`}
                    >
                        {word}
                    </button>
                ))}
            </div>
            {/* Built sentence display */}
            <div className="relative">
                <div className="flex flex-wrap gap-1.5 min-h-[44px] p-3 rounded-xl bg-white/[0.02] border border-white/5 items-center">
                    {usedWords.length > 0 ? usedWords.map((w, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 text-sm font-medium">
                            {w}
                        </span>
                    )) : (
                        <span className="text-xs text-white/20">Click words above to build sentence...</span>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    {usedWords.length > 0 && (
                        <>
                            <button type="button" onClick={handleRemoveLastWord} className="text-xs text-neon-orange hover:text-neon-orange/80 px-2 py-1 rounded-lg bg-neon-orange/5 border border-neon-orange/10">
                                Undo
                            </button>
                            <button type="button" onClick={() => setAnswers(prev => ({ ...prev, [idx]: '' }))} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/5 border border-red-500/10">
                                Clear
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── DRAGGABLE ORDERING LIST ─────────────────────────────────────────────────
function DraggableOrderingList({ items, onChange }) {
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [overIdx, setOverIdx] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e, idx) => {
        setDraggedIdx(idx);
        setIsDragging(true);
        // Set ghost image to be the element itself (default)
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
    };

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (idx !== draggedIdx) setOverIdx(idx);
    };

    const handleDrop = (e, dropIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIdx) {
            setDraggedIdx(null);
            setOverIdx(null);
            setIsDragging(false);
            return;
        }
        const newItems = [...items];
        const [moved] = newItems.splice(draggedIdx, 1);
        newItems.splice(dropIdx, 0, moved);
        onChange(newItems);
        setDraggedIdx(null);
        setOverIdx(null);
        setIsDragging(false);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        setOverIdx(null);
        setIsDragging(false);
    };

    const moveUp = (idx) => {
        if (idx === 0) return;
        const arr = [...items];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        onChange(arr);
    };

    const moveDown = (idx) => {
        if (idx === items.length - 1) return;
        const arr = [...items];
        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        onChange(arr);
    };

    return (
        <div className="space-y-1.5">
            <p className="text-xs text-white/30 mb-3 flex items-center gap-1.5">
                <GripVertical size={12} className="text-neon-blue/60" />
                Drag items to arrange in the correct order:
            </p>
            {items.map((item, ii) => {
                const isBeingDragged = draggedIdx === ii;
                const isDropTarget = overIdx === ii && draggedIdx !== ii;

                return (
                    <div
                        key={`${item}-${ii}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ii)}
                        onDragOver={(e) => handleDragOver(e, ii)}
                        onDrop={(e) => handleDrop(e, ii)}
                        onDragEnd={handleDragEnd}
                        className={`
                            flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 select-none
                            ${isBeingDragged
                                ? 'opacity-30 scale-[0.98] border-neon-blue/40 bg-neon-blue/5'
                                : isDropTarget
                                    ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_16px_rgba(0,209,255,0.15)] scale-[1.01]'
                                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
                            }
                            ${isDragging && !isBeingDragged ? 'cursor-grabbing' : 'cursor-grab'}
                        `}
                    >
                        {/* Grip handle */}
                        <div className={`shrink-0 transition-colors ${isDropTarget ? 'text-neon-blue' : 'text-white/20 hover:text-white/40'}`}>
                            <GripVertical size={18} />
                        </div>

                        {/* Position number */}
                        <span className={`text-xs font-bold w-5 text-center shrink-0 transition-colors ${isDropTarget ? 'text-neon-blue' : 'text-white/30'}`}>
                            {ii + 1}
                        </span>

                        {/* Item text */}
                        <span className={`text-sm flex-1 font-medium transition-colors ${isDropTarget ? 'text-white' : 'text-white/70'}`}>
                            {item}
                        </span>

                        {/* Arrow fallback buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                disabled={ii === 0}
                                onClick={() => moveUp(ii)}
                                className="p-0.5 rounded text-white/20 hover:text-neon-blue disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                title="Move up"
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={ii === items.length - 1}
                                onClick={() => moveDown(ii)}
                                className="p-0.5 rounded text-white/20 hover:text-neon-blue disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                title="Move down"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
