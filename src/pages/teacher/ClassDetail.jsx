import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Users, ClipboardList, ArrowLeft, Copy, Check,
    Plus, Calendar, Award, MessageSquare, Send, Clock, X, Search,
    UserPlus, UserMinus, Pin, Trash2, Download, BarChart3, MessageCircle, KeyRound,
    FolderOpen, Link2, FileText, Video, Music, Image, Globe, ExternalLink, Package
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userProfile, isTeacher, resetStudentCode } = useAuth();
    const {
        classes, getClassStudents, getClassAssignments, getClassAnnouncements,
        addAnnouncement, deleteAnnouncement, pinAnnouncement,
        removeStudentFromClass, allStudents, updateClass,
        submissions, getClassAnalytics, exportClassGrades, getLeaderboard,
        getAssignmentCompletionRate,
        addClassMessage, deleteClassMessage, getClassMessages,
        sendTeacherRequest, getTeacherRequestsForClass,
        addClassMaterial, deleteClassMaterial, getClassMaterials,
    } = useClasses();
    const toast = useToast();

    const cls = classes.find(c => c.id === id);
    const [tab, setTab] = useState(searchParams.get('tab') || (isTeacher ? 'overview' : 'announcements'));
    const [copiedCode, setCopiedCode] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [newAnnTitle, setNewAnnTitle] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [chatMsg, setChatMsg] = useState('');
    const chatEndRef = useRef(null);
    const [resetCodeResult, setResetCodeResult] = useState(null); // { studentName, newCode }
    const [resettingCode, setResettingCode] = useState(null); // student id being reset

    useEffect(() => {
        const t = searchParams.get('tab');
        if (t) setTab(t);
    }, [searchParams]);

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

    const tabs = isTeacher
        ? ['overview', 'students', 'assignments', 'announcements', 'chat', 'materials']
        : ['announcements', 'chat', 'materials'];
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
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={async () => {
                                                    if (!s.email) { toast.error('No email for this student'); return; }
                                                    setResettingCode(s.id);
                                                    try {
                                                        const newCode = await resetStudentCode(s.email);
                                                        setResetCodeResult({ studentName: s.displayName, newCode });
                                                        toast.success('New access code generated!');
                                                    } catch (err) {
                                                        toast.error(err.message);
                                                    } finally {
                                                        setResettingCode(null);
                                                    }
                                                }}
                                                className="p-2 rounded-lg text-white/20 hover:text-neon-orange hover:bg-neon-orange/10 transition-all"
                                                title="Reset access code"
                                                disabled={resettingCode === s.id}
                                            >
                                                <KeyRound size={16} className={resettingCode === s.id ? 'animate-spin' : ''} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmRemove(s.id)}
                                                className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Remove student"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        </div>
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
                        {/* Only teachers can post announcements */}
                        {isTeacher && (
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
                        )}

                        {classAnnouncements.length === 0 && (
                            <div className="glass-card p-8 text-center">
                                <MessageSquare size={40} className="mx-auto text-white/10 mb-3" />
                                <p className="text-white/40 text-sm">No announcements yet.</p>
                            </div>
                        )}

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
                                            {/* Only teachers can pin/delete */}
                                            {isTeacher && (
                                                <>
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
                                                </>
                                            )}
                                            <span className="text-xs text-white/30 ml-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60">{ann.content}</p>
                                    <p className="text-xs text-white/30 mt-2">— {ann.author}</p>
                                </div>
                            ))}
                    </div>
                )}

                {/* CHAT TAB */}
                {tab === 'chat' && (
                    <ChatTab
                        classId={id}
                        isTeacher={isTeacher}
                        userProfile={userProfile}
                        addClassMessage={addClassMessage}
                        deleteClassMessage={deleteClassMessage}
                        getClassMessages={getClassMessages}
                        toast={toast}
                    />
                )}

                {/* MATERIALS TAB */}
                {tab === 'materials' && (
                    <MaterialsTab
                        classId={id}
                        isTeacher={isTeacher}
                        getClassMaterials={getClassMaterials}
                        addClassMaterial={addClassMaterial}
                        deleteClassMaterial={deleteClassMaterial}
                        toast={toast}
                    />
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <AddStudentModal
                        cls={cls}
                        allStudents={allStudents}
                        onClose={() => setIsAddModalOpen(false)}
                        onSendRequest={async (studentId) => {
                            try {
                                await sendTeacherRequest(cls.id, studentId);
                                toast.success('Solicitud enviada al estudiante!');
                            } catch (e) {
                                toast.error(e.message);
                            }
                        }}
                        pendingRequests={getTeacherRequestsForClass(cls.id)}
                    />
                )}
                {resetCodeResult && (
                    <ResetCodeModal
                        result={resetCodeResult}
                        onClose={() => setResetCodeResult(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AddStudentModal({ cls, allStudents, onClose, onSendRequest, pendingRequests = [] }) {
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState(false);

    const filtered = allStudents.filter(s =>
        (s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase())) &&
        !(cls.students || []).includes(s.id)
    );

    const hasPendingRequest = (studentId) => pendingRequests.some(r => r.studentId === studentId && r.status === 'pending');

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
                        ) : filtered.map(s => {
                            const isPending = hasPendingRequest(s.id);
                            return (
                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] group transition-all">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {s.displayName?.[0] || 'S'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white group-hover:text-neon-blue transition-colors truncate">{s.displayName}</p>
                                        <p className="text-xs text-white/40 truncate">{s.email}</p>
                                    </div>
                                    {isPending ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                                    ) : (
                                        <button
                                            onClick={() => { onSendRequest(s.id); }}
                                            className="p-2 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ResetCodeModal({ result, onClose }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(result.newCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass-card w-full max-w-md overflow-hidden flex flex-col items-center text-center p-6 sm:p-8">
                <div className="w-16 h-16 rounded-full bg-neon-orange/10 flex items-center justify-center mb-4">
                    <KeyRound size={32} className="text-neon-orange" />
                </div>

                <h2 className="text-2xl font-display font-bold text-white mb-2">New Access Code</h2>
                <p className="text-white/60 text-sm mb-6">
                    A new code has been generated for <span className="text-white font-semibold">{result.studentName}</span>.
                    <br />Please share this code with them immediately.
                </p>

                <div className="w-full flex items-center gap-2 mb-6">
                    <div className="flex-1 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] font-mono text-3xl text-neon-orange tracking-widest">
                        {result.newCode}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/20 text-neon-orange hover:bg-neon-orange/20 transition-all"
                    >
                        {copied ? <Check size={24} /> : <Copy size={24} />}
                    </button>
                </div>

                <p className="text-xs text-white/30 mb-6">
                    Note: If the student already has an account, a password reset email has also been sent to their email address.
                </p>

                <button
                    onClick={onClose}
                    className="btn-primary w-full"
                >
                    Done
                </button>
            </motion.div>
        </motion.div>
    );
}

function ChatTab({ classId, isTeacher, userProfile, addClassMessage, deleteClassMessage, getClassMessages, toast }) {
    const [msg, setMsg] = useState('');
    const chatEndRef = useRef(null);
    const messages = getClassMessages(classId);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async () => {
        const text = msg.trim();
        if (!text) return;
        try {
            await addClassMessage(classId, text, userProfile?.displayName || 'User', isTeacher ? 'teacher' : 'student');
            setMsg('');
        } catch (e) {
            toast.error('Failed to send message');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleDelete = async (id) => {
        try {
            await deleteClassMessage(id);
            toast.info('Message deleted');
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="glass-card flex flex-col" style={{ height: '70vh' }}>
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
                <MessageCircle size={18} className="text-neon-green" />
                <h3 className="font-semibold text-white">Class Chat</h3>
                <span className="text-[10px] text-white/30 ml-auto uppercase tracking-wider">Messages auto-delete after 7 days</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle size={48} className="text-white/10 mb-3" />
                        <p className="text-white/40 text-sm">No messages yet.</p>
                        <p className="text-white/20 text-xs mt-1">Start the conversation!</p>
                    </div>
                )}
                {messages.map(m => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex gap-3"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.authorRole === 'teacher'
                            ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white'
                            : 'bg-white/10 text-white/60'
                            }`}>
                            {m.authorName?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-white truncate">{m.authorName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${m.authorRole === 'teacher'
                                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                                    : 'bg-white/[0.06] text-white/40 border border-white/[0.06]'
                                    }`}>
                                    {m.authorRole === 'teacher' ? 'Teacher' : 'Student'}
                                </span>
                                <span className="text-[10px] text-white/20">{formatTime(m.createdAt)}</span>
                            </div>
                            <p className="text-sm text-white/70 break-words whitespace-pre-wrap">{m.text}</p>
                        </div>
                        {isTeacher && (
                            <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1.5 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all self-start"
                                title="Delete message"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </motion.div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06]">
                <div className="flex gap-2">
                    <input
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="input-glass flex-1"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!msg.trim()}
                        className="btn-neon px-4 disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MATERIAL TYPE HELPERS ───────────────────────────────────────────────────
const MATERIAL_CATEGORIES = [
    { key: 'document', label: 'Document', icon: FileText, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20', gradient: 'from-neon-blue to-cyan-400' },
    { key: 'video', label: 'Video', icon: Video, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', gradient: 'from-red-500 to-orange-400' },
    { key: 'audio', label: 'Audio', icon: Music, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20', gradient: 'from-neon-purple to-fuchsia-400' },
    { key: 'image', label: 'Image', icon: Image, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20', gradient: 'from-neon-green to-emerald-400' },
    { key: 'link', label: 'Link / Website', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', gradient: 'from-amber-400 to-yellow-500' },
    { key: 'other', label: 'Other', icon: Package, color: 'text-white/50', bg: 'bg-white/[0.04]', border: 'border-white/10', gradient: 'from-white/20 to-white/10' },
];

function getCategoryConfig(key) {
    return MATERIAL_CATEGORIES.find(c => c.key === key) || MATERIAL_CATEGORIES[5];
}

// ─── MATERIALS TAB ────────────────────────────────────────────────────────────
function MaterialsTab({ classId, isTeacher, getClassMaterials, addClassMaterial, deleteClassMaterial, toast }) {
    const materials = getClassMaterials(classId);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('document');
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const resetForm = () => { setTitle(''); setDescription(''); setUrl(''); setCategory('document'); setShowForm(false); };

    const handleAdd = async () => {
        if (!title.trim()) { toast.warning('Please enter a title'); return; }
        if (!url.trim()) { toast.warning('Please enter a download/link URL'); return; }
        // Basic URL validation
        try { new URL(url.trim()); } catch { toast.error('Please enter a valid URL (include https://)'); return; }
        setSaving(true);
        try {
            await addClassMaterial(classId, { title: title.trim(), description: description.trim(), url: url.trim(), category });
            toast.success('Material added!');
            resetForm();
        } catch (e) {
            toast.error('Failed to add material');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteClassMaterial(id);
            toast.success('Material removed');
            setConfirmDelete(null);
        } catch (e) {
            toast.error('Failed to remove material');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-fuchsia-500 flex items-center justify-center shadow-lg">
                        <FolderOpen size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Class Materials</h3>
                        <p className="text-xs text-white/40">{materials.length} resource{materials.length !== 1 ? 's' : ''} available</p>
                    </div>
                </div>
                {isTeacher && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-neon flex items-center gap-2 text-sm px-4 py-2"
                    >
                        <Plus size={16} /> Add Material
                    </button>
                )}
            </div>

            {/* Teacher Add Form */}
            <AnimatePresence>
                {isTeacher && showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-5 space-y-4 border border-neon-purple/20"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                                <Link2 size={16} className="text-neon-purple" /> Add New Material
                            </h4>
                            <button onClick={resetForm} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Category selector */}
                        <div>
                            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider font-bold">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {MATERIAL_CATEGORIES.map(cat => {
                                    const CatIcon = cat.icon;
                                    return (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setCategory(cat.key)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all
                                                ${category === cat.key
                                                    ? `${cat.bg} ${cat.border} ${cat.color} shadow-sm`
                                                    : 'border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60'}`}
                                        >
                                            <CatIcon size={13} /> {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-bold">Title *</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Unit 3 Vocabulary PDF"
                                    className="input-glass"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-bold">Download / Link URL *</label>
                                <div className="relative group">
                                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-purple transition-colors" />
                                    <input
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="input-glass pl-10"
                                    />
                                </div>
                                <p className="text-[10px] text-white/20 mt-1">Paste any link: Google Drive, Dropbox, YouTube, website, etc.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider font-bold">Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief description of this material..."
                                className="input-glass h-16 resize-none"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={resetForm} className="btn-ghost text-sm px-4 py-2">Cancel</button>
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="btn-neon flex items-center gap-2 text-sm px-5 py-2 disabled:opacity-50"
                            >
                                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                                {saving ? 'Adding...' : 'Add Material'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Materials Grid */}
            {materials.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-12 text-center"
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                        <FolderOpen size={28} className="text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm font-medium">No materials yet</p>
                    <p className="text-white/20 text-xs mt-1">
                        {isTeacher ? 'Click "Add Material" to share download links with your students.' : 'Your teacher hasn\'t shared any materials yet.'}
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {materials.map((mat, idx) => {
                        const cfg = getCategoryConfig(mat.category);
                        const CatIcon = cfg.icon;
                        return (
                            <motion.div
                                key={mat.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card overflow-hidden group hover:border-white/[0.12] transition-all"
                            >
                                {/* Top gradient bar */}
                                <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />

                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-11 h-11 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                                            <CatIcon size={20} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-white/90 transition-colors">
                                                {mat.title}
                                            </h4>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 ${cfg.color}`}>
                                                <CatIcon size={10} /> {cfg.label}
                                            </span>
                                        </div>
                                        {isTeacher && (
                                            <div className="shrink-0">
                                                {confirmDelete === mat.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-white/40 px-1.5 py-1 rounded">No</button>
                                                        <button onClick={() => handleDelete(mat.id)} className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-1 rounded font-bold">Yes</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDelete(mat.id)}
                                                        className="p-1.5 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Remove material"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {mat.description && (
                                        <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed">{mat.description}</p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.04]">
                                        <span className="text-[10px] text-white/20">
                                            {new Date(mat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <a
                                            href={mat.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                                                bg-gradient-to-r ${cfg.gradient} text-white hover:opacity-90 active:scale-95 shadow-sm`}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {mat.category === 'link' || mat.category === 'video'
                                                ? <><ExternalLink size={12} /> Open</>
                                                : <><Download size={12} /> Download</>
                                            }
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
