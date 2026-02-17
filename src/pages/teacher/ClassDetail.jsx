import { useParams, useNavigate } from 'react-router-dom';
import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Users, ClipboardList, ArrowLeft, Copy, Check,
    Plus, Calendar, Award, MessageSquare, Send, Clock, X, Search,
    UserPlus, UserMinus, Pin, Trash2, Download, BarChart3
} from 'lucide-react';
import { useState } from 'react';

export default function ClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const {
        classes, getClassStudents, getClassAssignments, getClassAnnouncements,
        addAnnouncement, deleteAnnouncement, pinAnnouncement,
        removeStudentFromClass, allStudents, updateClass,
        submissions, getClassAnalytics, exportClassGrades, getLeaderboard,
        getAssignmentCompletionRate
    } = useClasses();
    const toast = useToast();

    const cls = classes.find(c => c.id === id);
    const [tab, setTab] = useState('overview');
    const [copiedCode, setCopiedCode] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [newAnnTitle, setNewAnnTitle] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(null);

    if (!cls) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-white/40">Class not found</p>
        </div>
    );

    const students = getClassStudents(id);
    const classAssignments = getClassAssignments(id);
    const classAnnouncements = getClassAnnouncements(id);
    const analytics = getClassAnalytics(id);
    const leaderboard = getLeaderboard(id);

    const handleCopy = () => {
        navigator.clipboard.writeText(cls.code);
        setCopiedCode(true);
        toast.success('Class code copied!');
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handlePostAnnouncement = () => {
        if (!newAnnTitle.trim()) { toast.warning('Please enter a title'); return; }
        addAnnouncement({
            classId: id,
            title: newAnnTitle,
            content: newAnnouncement,
            author: userProfile?.displayName || 'Teacher'
        });
        setNewAnnTitle('');
        setNewAnnouncement('');
        toast.success('Announcement posted!');
    };

    const handleRemoveStudent = async (studentId) => {
        try {
            await removeStudentFromClass(id, studentId);
            toast.success('Student removed from class');
            setConfirmRemove(null);
        } catch (e) {
            toast.error('Failed to remove student');
        }
    };

    const handleDeleteAnnouncement = async (annId) => {
        try {
            await deleteAnnouncement(annId);
            toast.success('Announcement deleted');
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const handlePinAnnouncement = async (annId, currentPinned) => {
        await pinAnnouncement(annId, !currentPinned);
        toast.info(currentPinned ? 'Unpinned' : 'Pinned');
    };

    const handleExportGrades = () => {
        const csv = exportClassGrades(id);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cls.name}_grades.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Grades exported!');
    };

    const tabs = ['overview', 'students', 'assignments', 'announcements'];
    const colorMap = { blue: 'from-neon-blue to-blue-600', purple: 'from-neon-purple to-purple-600', green: 'from-neon-green to-emerald-600', orange: 'from-neon-orange to-amber-600' };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title={cls.name}
                subtitle={`${cls.level || ''} • ${cls.schedule || 'No schedule'}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportGrades} className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2" title="Export Grades">
                            <Download size={14} /> CSV
                        </button>
                        <button onClick={() => navigate('/classes')} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
                            <ArrowLeft size={16} /> Back
                        </button>
                    </div>
                }
            />

            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                    <div className={`h-24 sm:h-32 bg-gradient-to-r ${colorMap[cls.color] || colorMap.blue} relative`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <BookOpen size={24} className="text-white sm:hidden" />
                                <BookOpen size={32} className="text-white hidden sm:block" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">{cls.name}</h2>
                                <p className="text-xs sm:text-sm text-white/70 line-clamp-1">{cls.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-neon-blue" />
                            <span className="text-xs sm:text-sm text-white/60">{students.length} Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClipboardList size={14} className="text-neon-purple" />
                            <span className="text-xs sm:text-sm text-white/60">{classAssignments.length} Assignments</span>
                        </div>
                        <div className="flex-1" />
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-xs sm:text-sm text-neon-blue hover:bg-neon-blue/20 transition-all"
                        >
                            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                            <span className="hidden sm:inline">Code:</span> {cls.code}
                        </button>
                    </div>

                    <div className="flex gap-1 px-4 sm:px-6 py-2 overflow-x-auto">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all whitespace-nowrap
                                    ${tab === t ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* OVERVIEW TAB */}
                {tab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-display font-black text-neon-blue">{analytics.avgGrade}%</p>
                                <p className="text-[10px] text-white/30 uppercase">Class Avg</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-display font-black text-neon-green">{analytics.totalSubmitted}</p>
                                <p className="text-[10px] text-white/30 uppercase">Submitted</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-display font-black text-neon-purple">{analytics.totalGraded}</p>
                                <p className="text-[10px] text-white/30 uppercase">Graded</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-display font-black text-neon-orange">{analytics.totalExpected - analytics.totalSubmitted}</p>
                                <p className="text-[10px] text-white/30 uppercase">Missing</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Details */}
                            <div className="glass-card p-5">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Calendar size={16} className="text-neon-blue" /> Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-white/40">Level</span><span className="text-white">{cls.level || 'Beginner'}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Schedule</span><span className="text-white">{cls.schedule || 'TBD'}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Created</span><span className="text-white">{new Date(cls.createdAt).toLocaleDateString()}</span></div>
                                    <div className="flex justify-between"><span className="text-white/40">Teacher</span><span className="text-white">{cls.teacherName}</span></div>
                                </div>
                            </div>

                            {/* Leaderboard */}
                            <div className="glass-card p-5">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Award size={16} className="text-neon-purple" /> Leaderboard</h3>
                                {leaderboard.length === 0 ? (
                                    <p className="text-sm text-white/30 text-center py-6">No grades yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {leaderboard.slice(0, 5).map((s, idx) => (
                                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                                                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : idx === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/30'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="flex-1 text-sm text-white truncate">{s.name}</span>
                                                <span className={`text-sm font-bold ${s.avg >= 90 ? 'text-neon-green' : s.avg >= 70 ? 'text-neon-blue' : 'text-neon-orange'}`}>{s.avg}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grade Distribution */}
                        <div className="glass-card p-5">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-neon-green" /> Grade Distribution</h3>
                            <div className="flex items-end gap-3 h-24">
                                {Object.entries(analytics.gradeDistribution || {}).map(([letter, count]) => {
                                    const maxVal = Math.max(...Object.values(analytics.gradeDistribution || {}), 1);
                                    const height = `${(count / maxVal) * 100}%`;
                                    const colors = { A: 'neon-green', B: 'neon-blue', C: 'neon-purple', D: 'neon-orange', F: 'red-400' };
                                    return (
                                        <div key={letter} className="flex-1 flex flex-col items-center gap-1 h-full">
                                            <span className="text-[10px] text-white/30">{count}</span>
                                            <div className="w-full flex-1 flex items-end">
                                                <div className={`w-full rounded-t-md bg-${colors[letter]}/20 border-t border-${colors[letter]}/30`} style={{ height: count > 0 ? height : '2px' }} />
                                            </div>
                                            <span className={`text-xs font-bold text-${colors[letter]}`}>{letter}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* STUDENTS TAB */}
                {tab === 'students' && (
                    <div className="glass-card p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white">Enrolled Students ({students.length})</h3>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-3 py-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-xs text-neon-blue hover:bg-neon-blue/20 transition-all flex items-center gap-2"
                            >
                                <UserPlus size={14} /> Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {students.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={48} className="mx-auto text-white/10 mb-4" />
                                    <p className="text-white/40 text-sm">No students enrolled yet.</p>
                                    <p className="text-xs text-white/20 mt-1">Share code <span className="text-neon-blue font-mono">{cls.code}</span></p>
                                </div>
                            ) : students.map((s) => (
                                <div key={s.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-all group">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                                        {s.displayName?.[0] || 'S'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{s.displayName}</p>
                                        <p className="text-xs text-white/40 truncate">{s.email}</p>
                                    </div>
                                    {confirmRemove === s.id ? (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setConfirmRemove(null)} className="text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg transition-colors">Cancel</button>
                                            <button onClick={() => handleRemoveStudent(s.id)} className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">Remove</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmRemove(s.id)}
                                            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove student"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {tab === 'assignments' && (
                    <div className="glass-card p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white">Assignments ({classAssignments.length})</h3>
                            <button onClick={() => navigate('/assignments')} className="btn-neon text-sm flex items-center gap-2"><Plus size={14} /> New</button>
                        </div>
                        <div className="space-y-3">
                            {classAssignments.length === 0 ? (
                                <p className="text-white/40 text-sm text-center py-8">No assignments yet.</p>
                            ) : classAssignments.map((a) => {
                                const rate = getAssignmentCompletionRate(a.id);
                                return (
                                    <div key={a.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
                                            <ClipboardList size={18} className="text-neon-purple" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white text-sm truncate">{a.title}</p>
                                            <p className="text-xs text-white/40">{a.type} • {a.totalPoints} pts • {rate.rate}% done</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-white/40">Due</p>
                                            <p className="text-sm text-neon-orange">{new Date(a.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ANNOUNCEMENTS TAB */}
                {tab === 'announcements' && (
                    <div className="space-y-4">
                        <div className="glass-card p-4 sm:p-5">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <MessageSquare size={16} className="text-neon-blue" /> Post Announcement
                            </h3>
                            <input
                                value={newAnnTitle}
                                onChange={(e) => setNewAnnTitle(e.target.value)}
                                placeholder="Announcement title..."
                                className="input-glass mb-3"
                            />
                            <div className="flex gap-3">
                                <textarea
                                    value={newAnnouncement}
                                    onChange={(e) => setNewAnnouncement(e.target.value)}
                                    placeholder="Write your announcement..."
                                    className="input-glass flex-1 h-20 resize-none"
                                />
                                <button onClick={handlePostAnnouncement} className="btn-neon self-end px-4">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>

                        {classAnnouncements
                            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt))
                            .map((ann) => (
                                <div key={ann.id} className={`glass-card p-4 sm:p-5 ${ann.pinned ? 'border-l-4 border-l-neon-orange' : ''}`}>
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {ann.pinned && <Pin size={12} className="text-neon-orange shrink-0" />}
                                            <h4 className="font-semibold text-white truncate">{ann.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handlePinAnnouncement(ann.id, ann.pinned)}
                                                className={`p-1.5 rounded-lg transition-all ${ann.pinned ? 'text-neon-orange' : 'text-white/20 hover:text-neon-orange'} hover:bg-white/5`}
                                                title={ann.pinned ? 'Unpin' : 'Pin'}
                                            >
                                                <Pin size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <span className="text-xs text-white/30 ml-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60">{ann.content}</p>
                                    <p className="text-xs text-white/30 mt-2">— {ann.author}</p>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <AddStudentModal
                        cls={cls}
                        allStudents={allStudents}
                        onClose={() => setIsAddModalOpen(false)}
                        onAdd={(studentId) => {
                            updateClass(cls.id, {
                                students: [...(cls.students || []), studentId]
                            });
                            toast.success('Student added!');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AddStudentModal({ cls, allStudents, onClose, onAdd }) {
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState(false);

    const filtered = allStudents.filter(s =>
        (s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase())) &&
        !(cls.students || []).includes(s.id)
    );

    const handleCopy = () => {
        navigator.clipboard.writeText(cls.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white">Add Student</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    <div>
                        <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">Share Class Code</p>
                        <div className="flex gap-2">
                            <div className="flex-1 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center font-mono text-xl sm:text-2xl text-neon-blue tracking-widest">
                                {cls.code}
                            </div>
                            <button onClick={handleCopy} className="p-3 sm:p-4 rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue hover:bg-neon-blue/20 transition-all flex items-center justify-center">
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by email or name..."
                            className="input-glass pl-10"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {filtered.length === 0 ? (
                            <p className="text-center py-8 text-white/40 text-sm">No students found.</p>
                        ) : filtered.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] group transition-all">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {s.displayName?.[0] || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white group-hover:text-neon-blue transition-colors truncate">{s.displayName}</p>
                                    <p className="text-xs text-white/40 truncate">{s.email}</p>
                                </div>
                                <button
                                    onClick={() => { onAdd(s.id); onClose(); }}
                                    className="p-2 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
