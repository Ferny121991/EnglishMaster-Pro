import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, X, Copy, Check, Edit3, Trash2, BookOpen, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function Students() {
    const { classes, allStudents, deleteStudent, updateStudent, getStudentClasses, getStudentProgress } = useClasses();
    const { preRegisterStudent, isAdmin } = useAuth();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [loading, setLoading] = useState(false);

    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [copied, setCopied] = useState(false);
    const [err, setErr] = useState('');

    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    // Non-admin teachers only see students in THEIR classes
    const myStudentIds = isAdmin
        ? null // admin sees all
        : new Set(classes.flatMap(c => c.students || []));

    const visibleStudents = isAdmin
        ? allStudents
        : allStudents.filter(s => myStudentIds.has(s.id));

    const filtered = visibleStudents.filter(s =>
        (s.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (s) => {
        setEditingStudent(s);
        setEditName(s.displayName);
        setEditEmail(s.email);
        setErr('');
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const isPending = editingStudent.status === 'pending';
            const id = isPending ? editingStudent.email.toLowerCase() : editingStudent.id;
            await updateStudent(id, {
                displayName: editName,
                ...(isPending ? { name: editName } : {})
            }, isPending);
            setEditingStudent(null);
            toast.success('Student updated!');
        } catch (e) {
            setErr(e.message);
            toast.error('Failed to update');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (s) => {
        try {
            await deleteStudent(s);
            toast.success(`${s.displayName} removed`);
            setConfirmDelete(null);
        } catch (e) {
            toast.error('Failed to delete student');
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr('');
        try {
            const code = await preRegisterStudent(newStudentEmail, newStudentName);
            setGeneratedCode(code);
            toast.success('Student registered!');
        } catch (e) {
            setErr(e.message);
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        toast.success('Code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const closeAndReset = () => {
        setShowAddModal(false);
        setGeneratedCode(null);
        setNewStudentName('');
        setNewStudentEmail('');
        setErr('');
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="Students"
                subtitle={`${allStudents.length} total students`}
                actions={
                    <button onClick={() => setShowAddModal(true)} className="btn-neon flex items-center gap-2 text-sm px-4 py-2">
                        <Plus size={16} /> Add Student
                    </button>
                }
            />

            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-card p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl font-display font-bold text-neon-blue">{allStudents.length}</p>
                        <p className="text-[10px] text-white/30 uppercase">Total</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl font-display font-bold text-neon-green">{allStudents.filter(s => s.status !== 'pending').length}</p>
                        <p className="text-[10px] text-white/30 uppercase">Active</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl font-display font-bold text-neon-orange">{allStudents.filter(s => s.status === 'pending').length}</p>
                        <p className="text-[10px] text-white/30 uppercase">Pending</p>
                    </div>
                    <div className="glass-card p-3 sm:p-4 text-center">
                        <p className="text-xl sm:text-2xl font-display font-bold text-neon-purple">{classes.length}</p>
                        <p className="text-[10px] text-white/30 uppercase">Classes</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search students..."
                        className="input-glass pl-11"
                    />
                </div>

                {/* Desktop Table */}
                <motion.div variants={container} initial="hidden" animate="show" className="glass-card overflow-hidden hidden sm:block">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider font-medium">
                        <div className="col-span-3">Student</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-center">Classes</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {filtered.map((s) => {
                        const enrolledClasses = getStudentClasses(s.id);
                        return (
                            <motion.div key={s.id} variants={item}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.02] hover:bg-white/[0.02] transition-all items-center">
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0">
                                        {(s.displayName || 'S')[0]}
                                    </div>
                                    <span className="text-sm font-medium text-white truncate">{s.displayName}</span>
                                </div>
                                <div className="col-span-3 text-sm text-white/50 truncate">{s.email}</div>
                                <div className="col-span-2">
                                    {s.status === 'pending' ? (
                                        <div className="flex items-center gap-2 group/code">
                                            <code className="text-xs font-mono font-bold text-neon-orange bg-neon-orange/10 px-2 py-1 rounded truncate">{s.code}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(s.code); toast.success('Code copied!'); }}
                                                className="opacity-0 group-hover/code:opacity-100 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all">
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-neon-green/60"><Check size={12} /> Registered</div>
                                    )}
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex -space-x-2">
                                        {enrolledClasses.length > 0 ? (
                                            <>
                                                {enrolledClasses.slice(0, 3).map((c, i) => (
                                                    <div key={c.id}
                                                        className={`w-6 h-6 rounded-md bg-gradient-to-br ${i === 0 ? 'from-neon-blue to-blue-600' : i === 1 ? 'from-neon-purple to-purple-600' : 'from-neon-green to-emerald-600'} flex items-center justify-center text-[10px] text-white font-bold border-2 border-surface-950`}
                                                        title={c.name}>
                                                        {c.name[0]}
                                                    </div>
                                                ))}
                                                {enrolledClasses.length > 3 && (
                                                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[8px] text-white/40 border-2 border-surface-950 font-bold">+{enrolledClasses.length - 3}</div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-white/20 italic">None</span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    {isAdmin && (
                                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-white/20 hover:text-neon-blue hover:bg-neon-blue/10 transition-all" title="Edit"><Edit3 size={16} /></button>
                                    )}
                                    {isAdmin && (
                                        confirmDelete === s.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-white/40 px-2 py-1 rounded-lg hover:bg-white/5">Cancel</button>
                                                <button onClick={() => handleDeleteStudent(s)} className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-lg font-bold hover:bg-red-500/20">Delete</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDelete(s.id)} className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete"><Trash2 size={16} /></button>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-white/30">
                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No students found</p>
                        </div>
                    )}
                </motion.div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-white/30 glass-card p-6">
                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No students found</p>
                        </div>
                    ) : filtered.map((s) => {
                        const enrolledClasses = getStudentClasses(s.id);
                        return (
                            <div key={s.id} className="glass-card p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {(s.displayName || 'S')[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{s.displayName}</p>
                                        <p className="text-xs text-white/40 truncate">{s.email}</p>
                                    </div>
                                    {s.status === 'pending' && (
                                        <span className="text-[10px] text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-lg font-bold uppercase">Pending</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-white/30">
                                        <BookOpen size={12} />
                                        <span>{enrolledClasses.length} classes</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {isAdmin && (
                                            <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-white/30 hover:text-neon-blue transition-all"><Edit3 size={14} /></button>
                                        )}
                                        {isAdmin && (
                                            confirmDelete === s.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-white/40 px-2 py-1 rounded-lg">No</button>
                                                    <button onClick={() => handleDeleteStudent(s)} className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-lg font-bold">Yes</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDelete(s.id)} className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Student Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAndReset} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md glass-card p-6 rounded-2xl border border-white/10 shadow-2xl">
                            <button onClick={closeAndReset} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X size={20} /></button>
                            <h2 className="text-xl font-display font-bold text-white mb-1">Add New Student</h2>
                            <p className="text-sm text-white/40 mb-6">Create credentials for a student to log in.</p>

                            {!generatedCode ? (
                                <form onSubmit={handleAddStudent} className="space-y-4">
                                    {err && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{err}</div>}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-white/60 ml-1">Full Name</label>
                                        <input required value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="e.g. Juan Perez" className="input-glass w-full" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-white/60 ml-1">Email Address</label>
                                        <input required type="email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} placeholder="e.g. juan@student.com" className="input-glass w-full" />
                                    </div>
                                    <button type="submit" disabled={loading} className="btn-neon w-full mt-2">{loading ? 'Generating...' : 'Generate Access Code'}</button>
                                </form>
                            ) : (
                                <div className="space-y-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"><Check size={32} className="text-green-500" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Student Registered!</h3>
                                        <p className="text-sm text-white/50 px-4">Share this code with <strong>{newStudentName}</strong>.</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                                        <div className="text-left">
                                            <p className="text-xs text-white/30 uppercase tracking-wider">Access Code</p>
                                            <p className="text-2xl font-mono font-bold text-neon-blue tracking-widest">{generatedCode}</p>
                                        </div>
                                        <button onClick={copyCode} className="p-3 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                                            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                    <button onClick={closeAndReset} className="btn-ghost w-full">Done, add another</button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Student Modal */}
            <AnimatePresence>
                {editingStudent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingStudent(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
                            <button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"><X size={20} /></button>
                            <h2 className="text-xl font-display font-bold text-white mb-1">Edit Student</h2>
                            <p className="text-sm text-white/40 mb-6">Update student information.</p>
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                {err && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{err}</div>}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-white/60 ml-1">Full Name</label>
                                    <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="input-glass w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-white/30 ml-1">Email (Read-only)</label>
                                    <input disabled value={editEmail} className="input-glass w-full opacity-50 cursor-not-allowed" />
                                </div>
                                <button type="submit" disabled={loading} className="btn-neon w-full mt-2">{loading ? 'Saving...' : 'Save Changes'}</button>
                                <button type="button" onClick={() => setEditingStudent(null)} className="btn-ghost w-full">Cancel</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
