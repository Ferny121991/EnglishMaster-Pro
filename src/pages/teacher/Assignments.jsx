import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Plus, X, Calendar, CheckCircle2, Search, Filter,
    Clock, BookOpen, Award, FileText, Users, ChevronDown, Eye,
    BarChart3, AlertCircle, Zap, Target, TrendingUp, Layers,
    Edit3, Trash2, HelpCircle, Type, MoreVertical, Trash,
    PenTool, FolderOpen, GraduationCap, ListOrdered, TextCursorInput
} from 'lucide-react';

const TYPE_CONFIG = {
    quiz: { icon: CheckCircle2, label: 'Quiz', gradient: 'from-neon-blue to-cyan-400', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', text: 'text-neon-blue', dot: 'bg-neon-blue' },
    exam: { icon: GraduationCap, label: 'Exam', gradient: 'from-red-500 to-orange-500', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    essay: { icon: FileText, label: 'Essay', gradient: 'from-neon-purple to-fuchsia-400', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20', text: 'text-neon-purple', dot: 'bg-neon-purple' },
    homework: { icon: PenTool, label: 'Homework', gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    project: { icon: FolderOpen, label: 'Project', gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', dot: 'bg-pink-500' },
    assignment: { icon: ClipboardList, label: 'Task', gradient: 'from-neon-green to-emerald-400', bg: 'bg-neon-green/10', border: 'border-neon-green/20', text: 'text-neon-green', dot: 'bg-neon-green' },
};

const CLASS_COLORS = {
    blue: 'from-neon-blue/20 to-neon-blue/5',
    purple: 'from-neon-purple/20 to-neon-purple/5',
    green: 'from-neon-green/20 to-neon-green/5',
    orange: 'from-orange-500/20 to-orange-500/5',
    pink: 'from-neon-pink/20 to-neon-pink/5',
    cyan: 'from-cyan-400/20 to-cyan-400/5',
};

export default function Assignments() {
    const { assignments, classes, submissions, allStudents, addAssignment, updateAssignment, deleteAssignment, getAssignmentSubmissions } = useClasses();
    const { isTeacher, userProfile } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const filtered = useMemo(() => {
        return assignments
            .filter(a => filterType === 'all' || a.type === filterType)
            .filter(a => filterClass === 'all' || a.classId === filterClass)
            .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [assignments, filterType, filterClass, searchQuery]);

    const stats = useMemo(() => {
        const total = assignments.length;
        const active = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
        const overdue = total - active;
        const totalSubs = submissions.length;
        const pending = submissions.filter(s => s.grade === null || s.grade === undefined).length;
        return { total, active, overdue, totalSubs, pending };
    }, [assignments, submissions]);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="Assignments"
                subtitle={`${assignments.length} total across ${classes.length} classes`}
                actions={
                    isTeacher && (
                        <button onClick={() => setShowCreate(true)} className="btn-neon flex items-center gap-2 text-sm px-4 py-2">
                            <Plus size={16} /> <span className="hidden sm:inline">New</span> Assignment
                        </button>
                    )
                }
            />

            {/* Stats Row */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { label: 'Total', value: stats.total, icon: Layers, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
                        { label: 'Active', value: stats.active, icon: Zap, color: 'text-neon-green', bg: 'bg-neon-green/10' },
                        { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
                        { label: 'Submissions', value: stats.totalSubs, icon: Target, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-neon-orange', bg: 'bg-orange-500/10' },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-4 flex items-center gap-3"
                        >
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                <s.icon size={18} className={s.color} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{s.value}</p>
                                <p className="text-[11px] text-white/40 uppercase tracking-wider">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 sm:px-6 pt-5 pb-2 max-w-7xl mx-auto">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search assignments..."
                            className="input-glass pl-10 text-sm h-10"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'quiz', label: 'Quizzes', icon: CheckCircle2 },
                            { key: 'essay', label: 'Essays', icon: FileText },
                            { key: 'assignment', label: 'Tasks', icon: ClipboardList },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterType(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                    ${filterType === f.key
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/60'}`}
                            >
                                {f.icon && <f.icon size={13} />}
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Class Filter */}
                    <div className="relative">
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="input-glass text-sm h-10 pr-8 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Assignment Cards */}
            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
                {filtered.map((a) => {
                    const cls = classes.find(c => c.id === a.classId);
                    const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.assignment;
                    const Icon = config.icon;
                    const isOverdue = new Date(a.dueDate) < new Date();
                    const subs = getAssignmentSubmissions(a.id);
                    const realStudents = (cls?.students || []).filter(sid => allStudents.some(s => s.id === sid && s.status === 'active'));
                    const totalStudents = realStudents.length || 0;
                    const submissionRate = totalStudents > 0 ? Math.round((subs.length / totalStudents) * 100) : 0;
                    const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isExpanded = expandedId === a.id;
                    const avgGrade = subs.filter(s => s.grade != null).length > 0
                        ? Math.round(subs.filter(s => s.grade != null).reduce((sum, s) => sum + (s.grade / a.totalPoints * 100), 0) / subs.filter(s => s.grade != null).length)
                        : null;

                    return (
                        <motion.div key={a.id} variants={item} layout>
                            <div
                                className={`glass-card overflow-hidden transition-all duration-300 hover:border-white/[0.12] cursor-pointer group
                                    ${isExpanded ? 'ring-1 ring-white/10' : ''}`}
                                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                            >
                                {/* Top gradient bar */}
                                <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                                            <Icon size={22} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-semibold text-white text-[15px] leading-tight group-hover:text-white/90 transition-colors">
                                                        {a.title}
                                                    </h3>
                                                    <p className="text-sm text-white/35 mt-1 line-clamp-2">{a.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isTeacher && (
                                                        <div className="flex items-center gap-1 mr-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingAssignment(a); }}
                                                                className="p-1.5 rounded-lg text-white/20 hover:text-neon-blue hover:bg-neon-blue/10 transition-all"
                                                                title="Edit Assignment"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                            {confirmDeleteId === a.id ? (
                                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="text-[10px] text-white/40 px-1.5 py-1 rounded">No</button>
                                                                    <button onClick={async (e) => { e.stopPropagation(); await deleteAssignment(a.id); toast.success('Assignment deleted'); setConfirmDeleteId(null); }} className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-1 rounded font-bold">Yes</button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(a.id); }}
                                                                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                                    title="Delete Assignment"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                                                        ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neon-green/10 text-neon-green border border-neon-green/20'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-neon-green animate-pulse'}`} />
                                                        {isOverdue ? 'Overdue' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Row */}
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-white/40">
                                        {cls && (
                                            <span className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${CLASS_COLORS[cls.color] || CLASS_COLORS.blue}`} />
                                                {cls.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Award size={12} className={config.text} /> {a.totalPoints} pts
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {isOverdue ? 'Was due' : 'Due'}: {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        {!isOverdue && (
                                            <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-orange-400' : ''}`}>
                                                <Clock size={12} /> {daysLeft}d left
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Users size={12} /> {subs.length}/{totalStudents} submitted
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Submission Progress</span>
                                            <span className="text-xs text-white/50 font-medium">{submissionRate}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${submissionRate}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                                                    {/* Stats mini-grid */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                                            <p className="text-lg font-bold text-white">{a.questions?.length || 0}</p>
                                                            <p className="text-[10px] text-white/30 uppercase">Questions</p>
                                                        </div>
                                                        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                                            <p className="text-lg font-bold text-white">{subs.filter(s => s.grade != null).length}</p>
                                                            <p className="text-[10px] text-white/30 uppercase">Graded</p>
                                                        </div>
                                                        <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                                            <p className={`text-lg font-bold ${avgGrade !== null ? (avgGrade >= 80 ? 'text-neon-green' : avgGrade >= 60 ? 'text-neon-orange' : 'text-red-400') : 'text-white/30'}`}>
                                                                {avgGrade !== null ? `${avgGrade}%` : '—'}
                                                            </p>
                                                            <p className="text-[10px] text-white/30 uppercase">Avg Grade</p>
                                                        </div>
                                                    </div>

                                                    {/* Type badge */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
                                                                <Icon size={13} /> {config.label}
                                                            </span>
                                                            <span className="text-xs text-white/30">
                                                                Created {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>

                                                        {!isTeacher && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/assignments/${a.id}`);
                                                                }}
                                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg
                                                                    ${submissions.find(s => s.assignmentId === a.id && s.studentId === userProfile?.uid)
                                                                        ? 'bg-white/10 text-white/60 hover:bg-white/20'
                                                                        : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 active:scale-95`
                                                                    }`}
                                                            >
                                                                {submissions.find(s => s.assignmentId === a.id && s.studentId === userProfile?.uid)
                                                                    ? 'View Submission'
                                                                    : 'Take Assignment'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {filtered.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <ClipboardList size={28} className="text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm">No assignments found</p>
                    <p className="text-white/20 text-xs mt-1">Try adjusting filters or create a new assignment</p>
                </div>
            )}

            <AnimatePresence>
                {(showCreate || editingAssignment) && (
                    <AssignmentModal
                        classes={classes}
                        assignment={editingAssignment}
                        onClose={() => { setShowCreate(false); setEditingAssignment(null); }}
                        onSave={editingAssignment ? (data) => updateAssignment(editingAssignment.id, data) : addAssignment}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AssignmentModal({ classes, assignment, onClose, onSave }) {
    const toast = useToast();
    const isEditing = !!assignment;
    const [title, setTitle] = useState(assignment?.title || '');
    const [description, setDescription] = useState(assignment?.description || '');
    const [classId, setClassId] = useState(assignment?.classId || classes[0]?.id || '');
    const [type, setType] = useState(assignment?.type || 'quiz');
    const [dueDate, setDueDate] = useState(assignment?.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '');
    const [totalPoints, setTotalPoints] = useState(assignment?.totalPoints || 100);
    const [questions, setQuestions] = useState(assignment?.questions || [
        { id: 'q1', text: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: 0, points: 10 },
    ]);
    const [timeLimit, setTimeLimit] = useState(assignment?.timeLimit || 0);

    const addQuestion = (qType = 'multiple-choice') => {
        const base = { id: `q${Date.now()}`, text: '', type: qType, points: 10 };
        if (qType === 'multiple-choice') {
            base.options = ['', '', '', '']; base.correctAnswer = 0;
        } else if (qType === 'true-false') {
            base.options = ['True', 'False']; base.correctAnswer = 0;
        } else if (qType === 'fill-in-blank') {
            base.correctText = '';
        } else if (qType === 'ordering') {
            base.items = ['', '', ''];
        } else if (qType === 'matching') {
            base.pairs = [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }];
        } else if (qType === 'word-scramble') {
            base.correctText = '';
        } else if (qType === 'sentence-builder') {
            base.correctSentence = '';
        } else if (qType === 'categorize') {
            base.categories = [{ name: '', items: [''] }, { name: '', items: [''] }];
        } else if (qType === 'error-correction') {
            base.errorSentence = ''; base.correctText = '';
        } else if (qType === 'translation') {
            base.sourceText = ''; base.correctText = '';
        } else {
            base.options = [];
        }
        setQuestions([...questions, base]);
    };

    const removeQuestion = (idx) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx, field, value) => {
        const updated = [...questions];
        updated[idx] = { ...updated[idx], [field]: value };
        if (field === 'type') {
            const q = updated[idx];
            q.options = []; q.items = []; q.pairs = undefined; q.categories = undefined;
            q.correctText = undefined; q.correctSentence = undefined; q.errorSentence = undefined; q.sourceText = undefined;
            if (value === 'multiple-choice') { q.options = ['', '', '', '']; q.correctAnswer = 0; }
            else if (value === 'true-false') { q.options = ['True', 'False']; q.correctAnswer = 0; }
            else if (value === 'fill-in-blank') { q.correctText = ''; }
            else if (value === 'ordering') { q.items = ['', '', '']; }
            else if (value === 'matching') { q.pairs = [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }]; }
            else if (value === 'word-scramble') { q.correctText = ''; }
            else if (value === 'sentence-builder') { q.correctSentence = ''; }
            else if (value === 'categorize') { q.categories = [{ name: '', items: [''] }, { name: '', items: [''] }]; }
            else if (value === 'error-correction') { q.errorSentence = ''; q.correctText = ''; }
            else if (value === 'translation') { q.sourceText = ''; q.correctText = ''; }
        }
        setQuestions(updated);
    };

    const updateOption = (qIdx, oIdx, value) => {
        const updated = [...questions];
        updated[qIdx].options[oIdx] = value;
        setQuestions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSave({
                title,
                description,
                classId,
                type,
                dueDate: new Date(dueDate).toISOString(),
                totalPoints: questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0),
                questions,
                timeLimit: Number(timeLimit) || 0,
            });
            toast.success(isEditing ? 'Assignment updated!' : 'Assignment created!');
            onClose();
        } catch (err) {
            toast.error('Failed to save assignment');
        }
    };

    const config = TYPE_CONFIG[type] || TYPE_CONFIG.assignment;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-3xl my-8"
            >
                <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-3xl opacity-20 blur-xl`} />
                <div className="relative glass-card rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                <config.icon size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-display font-bold text-white">{isEditing ? 'Edit' : 'Create'} Assignment</h2>
                                <p className="text-xs text-white/40">{isEditing ? 'Modify your assignment details' : `Add a new ${type} for your students`}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">Assignment Title</label>
                                    <div className="relative group">
                                        <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." className="input-glass pl-10" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">Target Class</label>
                                    <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-glass">
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">Due Date</label>
                                    <div className="relative group">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-blue transition-colors" />
                                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-glass pl-10" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">⏱️ Time Limit (minutes)</label>
                                    <div className="relative group">
                                        <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="0 = no limit" className="input-glass" min="0" />
                                        <p className="text-[10px] text-white/20 mt-1">{timeLimit > 0 ? `Students have ${timeLimit} minutes to complete` : 'No time limit'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">Global Mode</label>
                                    <div className="flex gap-2">
                                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setType(key)}
                                                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] transition-all
                                                    ${type === key
                                                        ? `${cfg.bg} ${cfg.border} ${cfg.text} font-bold shadow-lg`
                                                        : 'border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60'}`}
                                            >
                                                <cfg.icon size={14} />
                                                {cfg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider font-bold">Instructions & Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-glass h-24 resize-none p-3" placeholder="Provide clear instructions for your students..." />
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-2 gap-2">
                                <label className="text-xs text-white/50 uppercase tracking-wider font-bold">
                                    Coursework Questions ({questions.length})
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {['multiple-choice', 'true-false', 'fill-in-blank', 'short-answer', 'essay', 'ordering', 'matching', 'word-scramble', 'sentence-builder', 'categorize', 'error-correction', 'translation'].map(t => (
                                        <button key={t} type="button" onClick={() => addQuestion(t)} className="btn-ghost flex items-center gap-1 text-[10px] py-1 px-2 h-auto">
                                            <Plus size={12} /> {t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {questions.map((q, qi) => (
                                    <motion.div
                                        key={q.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="relative group/q"
                                    >
                                        <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/20 group-hover/q:text-neon-blue group-hover/q:border-neon-blue/30 transition-all">
                                            {qi + 1}
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={q.type}
                                                            onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
                                                            className="bg-transparent border-none text-xs text-neon-blue font-bold cursor-pointer focus:ring-0 p-0"
                                                        >
                                                            <option value="multiple-choice">Multiple Choice</option>
                                                            <option value="true-false">True/False</option>
                                                            <option value="fill-in-blank">Fill in Blank</option>
                                                            <option value="short-answer">Short Answer</option>
                                                            <option value="essay">Essay</option>
                                                            <option value="ordering">Ordering</option>
                                                            <option value="matching">Matching</option>
                                                            <option value="word-scramble">Word Scramble</option>
                                                            <option value="sentence-builder">Sentence Builder</option>
                                                            <option value="categorize">Categorize</option>
                                                            <option value="error-correction">Error Correction</option>
                                                            <option value="translation">Translation</option>
                                                        </select>
                                                        <div className="h-3 w-px bg-white/10" />
                                                        <input
                                                            value={q.text}
                                                            onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                                                            placeholder="Enter question text..."
                                                            className="bg-transparent border-none text-sm text-white placeholder:text-white/20 w-full focus:ring-0 p-0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg border border-white/5">
                                                        <input
                                                            type="number"
                                                            value={q.points}
                                                            onChange={(e) => updateQuestion(qi, 'points', Number(e.target.value))}
                                                            className="bg-transparent border-none text-xs text-white w-8 text-center focus:ring-0 p-0"
                                                            min={1}
                                                        />
                                                        <span className="text-[10px] text-white/30 font-bold uppercase">pts</span>
                                                    </div>
                                                    {questions.length > 1 && (
                                                        <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Multiple choice / True-false options */}
                                            {(q.type === 'multiple-choice' || q.type === 'true-false') && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                    {q.options.map((opt, oi) => (
                                                        <div key={oi} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${q.correctAnswer === oi ? 'bg-neon-green/5 border-neon-green/30' : 'bg-white/[0.01] border-white/5'}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuestion(qi, 'correctAnswer', oi)}
                                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                                                    ${q.correctAnswer === oi
                                                                        ? 'border-neon-green bg-neon-green/20'
                                                                        : 'border-white/10 hover:border-white/30'}`}
                                                            >
                                                                {q.correctAnswer === oi && <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_5px_rgba(52,211,153,0.5)]" />}
                                                            </button>
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => updateOption(qi, oi, e.target.value)}
                                                                placeholder={q.type === 'true-false' ? (oi === 0 ? 'True' : 'False') : `Option ${oi + 1}`}
                                                                readOnly={q.type === 'true-false'}
                                                                className="bg-transparent border-none text-xs text-white/80 placeholder:text-white/10 w-full focus:ring-0 p-0"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Fill in blank */}
                                            {q.type === 'fill-in-blank' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter the correct answer. Students must type this exactly.</p>
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                                                        <TextCursorInput size={14} className="text-neon-green shrink-0" />
                                                        <input
                                                            value={q.correctText || ''}
                                                            onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)}
                                                            placeholder="Correct answer..."
                                                            className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ordering */}
                                            {q.type === 'ordering' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter items in the CORRECT order. Students will see them shuffled.</p>
                                                    {(q.items || []).map((item, ii) => (
                                                        <div key={ii} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                                            <span className="text-[10px] text-neon-blue font-bold w-5 text-center shrink-0">{ii + 1}</span>
                                                            <input
                                                                value={item}
                                                                onChange={(e) => {
                                                                    const items = [...(q.items || [])];
                                                                    items[ii] = e.target.value;
                                                                    updateQuestion(qi, 'items', items);
                                                                }}
                                                                placeholder={`Item ${ii + 1}...`}
                                                                className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0"
                                                            />
                                                            {(q.items || []).length > 2 && (
                                                                <button type="button" onClick={() => {
                                                                    const items = (q.items || []).filter((_, i) => i !== ii);
                                                                    updateQuestion(qi, 'items', items);
                                                                }} className="text-white/10 hover:text-red-400 p-1"><X size={12} /></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => updateQuestion(qi, 'items', [...(q.items || []), ''])} className="text-[10px] text-neon-blue hover:text-neon-blue/80 flex items-center gap-1">
                                                        <Plus size={12} /> Add item
                                                    </button>
                                                </div>
                                            )}

                                            {/* Short answer */}
                                            {q.type === 'short-answer' && (
                                                <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-[10px] text-white/30 italic">
                                                    📝 Students will type a short text response. Teacher grades manually.
                                                </div>
                                            )}

                                            {/* Essay */}
                                            {q.type === 'essay' && (
                                                <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-[10px] text-white/30 italic">
                                                    📄 Students will write a long-form response. Teacher grades manually.
                                                </div>
                                            )}

                                            {/* Matching */}
                                            {q.type === 'matching' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter matching pairs. Students will see Right column shuffled.</p>
                                                    {(q.pairs || []).map((pair, pi) => (
                                                        <div key={pi} className="flex items-center gap-2">
                                                            <input value={pair.left} onChange={(e) => { const p = [...(q.pairs || [])]; p[pi] = { ...p[pi], left: e.target.value }; updateQuestion(qi, 'pairs', p); }} placeholder={`Left ${pi + 1}`} className="flex-1 input-glass text-xs py-2" />
                                                            <span className="text-white/20 text-xs">↔</span>
                                                            <input value={pair.right} onChange={(e) => { const p = [...(q.pairs || [])]; p[pi] = { ...p[pi], right: e.target.value }; updateQuestion(qi, 'pairs', p); }} placeholder={`Right ${pi + 1}`} className="flex-1 input-glass text-xs py-2" />
                                                            {(q.pairs || []).length > 2 && <button type="button" onClick={() => updateQuestion(qi, 'pairs', (q.pairs || []).filter((_, i) => i !== pi))} className="text-white/10 hover:text-red-400 p-1"><X size={12} /></button>}
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => updateQuestion(qi, 'pairs', [...(q.pairs || []), { left: '', right: '' }])} className="text-[10px] text-neon-blue flex items-center gap-1"><Plus size={12} /> Add pair</button>
                                                </div>
                                            )}

                                            {/* Word Scramble */}
                                            {q.type === 'word-scramble' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter the correct word. Letters will be scrambled for students.</p>
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                                                        <TextCursorInput size={14} className="text-neon-green shrink-0" />
                                                        <input value={q.correctText || ''} onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)} placeholder="Correct word..." className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sentence Builder */}
                                            {q.type === 'sentence-builder' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter the correct sentence. Words will be shuffled for students to reorder.</p>
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/20">
                                                        <ListOrdered size={14} className="text-neon-purple shrink-0" />
                                                        <input value={q.correctSentence || ''} onChange={(e) => updateQuestion(qi, 'correctSentence', e.target.value)} placeholder="The cat sat on the mat" className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Categorize */}
                                            {q.type === 'categorize' && (
                                                <div className="space-y-3 pt-2">
                                                    <p className="text-[10px] text-white/30">Define categories and their items. Students will sort items into the correct category.</p>
                                                    {(q.categories || []).map((cat, ci) => (
                                                        <div key={ci} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input value={cat.name} onChange={(e) => { const cats = [...(q.categories || [])]; cats[ci] = { ...cats[ci], name: e.target.value }; updateQuestion(qi, 'categories', cats); }} placeholder={`Category ${ci + 1} name`} className="bg-transparent border-none text-xs text-neon-blue font-bold w-full focus:ring-0 p-0" />
                                                                {(q.categories || []).length > 2 && <button type="button" onClick={() => updateQuestion(qi, 'categories', (q.categories || []).filter((_, i) => i !== ci))} className="text-white/10 hover:text-red-400 p-1"><X size={12} /></button>}
                                                            </div>
                                                            {(cat.items || []).map((itm, ii) => (
                                                                <div key={ii} className="flex items-center gap-2 ml-4">
                                                                    <span className="text-[10px] text-white/20">•</span>
                                                                    <input value={itm} onChange={(e) => { const cats = [...(q.categories || [])]; const items = [...cats[ci].items]; items[ii] = e.target.value; cats[ci] = { ...cats[ci], items }; updateQuestion(qi, 'categories', cats); }} placeholder={`Item...`} className="bg-transparent border-none text-xs text-white/60 w-full focus:ring-0 p-0" />
                                                                    {(cat.items || []).length > 1 && <button type="button" onClick={() => { const cats = [...(q.categories || [])]; cats[ci] = { ...cats[ci], items: cats[ci].items.filter((_, i) => i !== ii) }; updateQuestion(qi, 'categories', cats); }} className="text-white/10 hover:text-red-400 p-0.5"><X size={10} /></button>}
                                                                </div>
                                                            ))}
                                                            <button type="button" onClick={() => { const cats = [...(q.categories || [])]; cats[ci] = { ...cats[ci], items: [...cats[ci].items, ''] }; updateQuestion(qi, 'categories', cats); }} className="text-[10px] text-neon-blue ml-4 flex items-center gap-1"><Plus size={10} /> item</button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => updateQuestion(qi, 'categories', [...(q.categories || []), { name: '', items: [''] }])} className="text-[10px] text-neon-blue flex items-center gap-1"><Plus size={12} /> Add category</button>
                                                </div>
                                            )}

                                            {/* Error Correction */}
                                            {q.type === 'error-correction' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Enter a sentence WITH errors, then the corrected version.</p>
                                                    <input value={q.errorSentence || ''} onChange={(e) => updateQuestion(qi, 'errorSentence', e.target.value)} placeholder="Sentence with error: He go to school yesterday" className="input-glass text-xs" />
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                                                        <CheckCircle2 size={14} className="text-neon-green shrink-0" />
                                                        <input value={q.correctText || ''} onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)} placeholder="Correct: He went to school yesterday" className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Translation */}
                                            {q.type === 'translation' && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[10px] text-white/30">Source text to translate, and the correct translation.</p>
                                                    <input value={q.sourceText || ''} onChange={(e) => updateQuestion(qi, 'sourceText', e.target.value)} placeholder="Source: Hola, ¿cómo estás?" className="input-glass text-xs" />
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/5 border border-neon-green/20">
                                                        <TextCursorInput size={14} className="text-neon-green shrink-0" />
                                                        <input value={q.correctText || ''} onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)} placeholder="Translation: Hello, how are you?" className="bg-transparent border-none text-xs text-white w-full focus:ring-0 p-0" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </form>

                    <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                        <button type="submit" onClick={handleSubmit} className={`w-full py-4 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.99] flex items-center justify-center gap-2`}>
                            {isEditing ? <Zap size={18} /> : <Plus size={18} />}
                            {isEditing ? 'Save Changes' : `Launch ${config.label}`}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
