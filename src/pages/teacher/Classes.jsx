import { useState, useMemo } from 'react';
import { useClasses } from '../../contexts/ClassContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Users, Copy, Check, X,
    Trash2, ClipboardList, Clock, Search, Archive, ArchiveRestore
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Classes() {
    const { classes, addClass, deleteClass, archiveClass, unarchiveClass, getClassAssignments } = useClasses();
    const { userProfile, isTeacher } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleCopy = (code, e) => {
        e?.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success('Code copied!');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            await deleteClass(id);
            toast.success('Class deleted');
            setConfirmDelete(null);
        } catch (e) {
            toast.error('Failed to delete class');
        }
    };

    const handleArchive = async (id, archived, e) => {
        e?.stopPropagation();
        try {
            if (archived) {
                await unarchiveClass(id);
                toast.info('Class restored');
            } else {
                await archiveClass(id);
                toast.info('Class archived');
            }
        } catch (e) {
            toast.error('Failed to update class');
        }
    };

    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            if (!showArchived && c.archived) return false;
            if (showArchived && !c.archived) return false;
            if (search) {
                const q = search.toLowerCase();
                return c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
            }
            return true;
        });
    }, [classes, search, showArchived]);

    const archivedCount = classes.filter(c => c.archived).length;

    const colors = {
        blue: { bg: 'from-neon-blue to-blue-600' },
        purple: { bg: 'from-neon-purple to-purple-600' },
        green: { bg: 'from-neon-green to-emerald-600' },
        orange: { bg: 'from-neon-orange to-amber-600' },
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="My Classes"
                subtitle={`${classes.filter(c => !c.archived).length} active class${classes.filter(c => !c.archived).length !== 1 ? 'es' : ''}`}
                actions={
                    isTeacher && (
                        <button onClick={() => setShowCreate(true)} className="btn-neon flex items-center gap-2 text-sm px-4 py-2">
                            <Plus size={16} /> Create
                        </button>
                    )
                }
            />

            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Search & Archive filter */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search classes..."
                            className="input-glass pl-10 text-sm"
                        />
                    </div>
                    {archivedCount > 0 && (
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${showArchived ? 'bg-neon-orange/10 border border-neon-orange/20 text-neon-orange' : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60'}`}
                        >
                            <Archive size={14} /> {showArchived ? `Archived (${archivedCount})` : `Show Archived (${archivedCount})`}
                        </button>
                    )}
                </div>

                {/* Class Grid */}
                <motion.div variants={container} initial="hidden" animate="show">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {filteredClasses.map((cls) => {
                            const c = colors[cls.color] || colors.blue;
                            const classAssignments = getClassAssignments(cls.id);
                            return (
                                <motion.div key={cls.id} variants={item}>
                                    <div
                                        className={`glass-card group hover:border-white/10 cursor-pointer transition-all duration-300 overflow-hidden ${cls.archived ? 'opacity-60' : ''}`}
                                        onClick={() => navigate(`/classes/${cls.id}`)}
                                    >
                                        <div className={`h-2 bg-gradient-to-r ${c.bg}`} />

                                        <div className="p-4 sm:p-5">
                                            <div className="flex items-start justify-between mb-3 gap-2">
                                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg shrink-0`}>
                                                    <BookOpen size={18} className="text-white" />
                                                </div>
                                                <button
                                                    onClick={(e) => handleCopy(cls.code, e)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-white hover:border-neon-blue/30 transition-all"
                                                >
                                                    {copiedCode === cls.code ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
                                                    <span className="font-mono">{cls.code}</span>
                                                </button>
                                            </div>

                                            <h3 className="font-semibold text-white mb-1 group-hover:text-neon-blue transition-colors line-clamp-1 text-sm sm:text-base">
                                                {cls.name}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-white/40 line-clamp-2 mb-4">{cls.description}</p>

                                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                                                        <Users size={13} /> {cls.students?.length || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                                                        <ClipboardList size={13} /> {classAssignments.length}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-white/40 hidden sm:flex">
                                                        <Clock size={13} /> {cls.level || 'All'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => handleArchive(cls.id, cls.archived, e)}
                                                        className="p-1.5 rounded-lg text-white/20 hover:text-neon-orange hover:bg-neon-orange/10 transition-all"
                                                        title={cls.archived ? 'Restore' : 'Archive'}
                                                    >
                                                        {cls.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                                                    </button>
                                                    {confirmDelete === cls.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} className="text-[10px] text-white/40 px-1.5 py-1 rounded">No</button>
                                                            <button onClick={(e) => handleDelete(cls.id, e)} className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-1 rounded font-bold">Yes</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(cls.id); }}
                                                            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Create new card */}
                        {isTeacher && !showArchived && (
                            <motion.div variants={item}>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed border-white/10 hover:border-neon-blue/30 flex flex-col items-center justify-center gap-3 text-white/30 hover:text-neon-blue transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] group-hover:bg-neon-blue/10 flex items-center justify-center transition-all">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-sm font-medium">Create New Class</span>
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {filteredClasses.length === 0 && (
                        <div className="text-center py-16 text-white/30">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">{showArchived ? 'No archived classes' : search ? 'No classes match your search' : 'No classes yet'}</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && <CreateClassModal onClose={() => setShowCreate(false)} onCreate={addClass} />}
            </AnimatePresence>
        </div>
    );
}

function CreateClassModal({ onClose, onCreate }) {
    const toast = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [schedule, setSchedule] = useState('');
    const [color, setColor] = useState('blue');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onCreate({ name, description, level, schedule, color });
            toast.success('Class created!');
            onClose();
        } catch (err) {
            setError('Failed to create class. Please try again.');
            toast.error('Failed to create class');
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-3xl opacity-20 blur-xl" />
                <div className="relative glass-card p-5 sm:p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg sm:text-xl font-display font-bold text-white">Create New Class</h2>
                        <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
                    </div>

                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/50 mb-1.5">Class Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. English 201" className="input-glass" required />
                        </div>
                        <div>
                            <label className="block text-sm text-white/50 mb-1.5">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" className="input-glass h-24 resize-none" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Level</label>
                                <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-glass">
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-white/50 mb-1.5">Schedule</label>
                                <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Mon, Wed 9 AM" className="input-glass" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-white/50 mb-1.5">Color Theme</label>
                            <div className="flex gap-3">
                                {['blue', 'purple', 'green', 'orange'].map((c) => (
                                    <button key={c} type="button" onClick={() => setColor(c)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${c === 'blue' ? 'from-neon-blue to-blue-600' : c === 'purple' ? 'from-neon-purple to-purple-600' : c === 'green' ? 'from-neon-green to-emerald-600' : 'from-neon-orange to-amber-600'} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-950' : 'opacity-50 hover:opacity-80'} transition-all`}
                                    />
                                ))}
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-neon w-full mt-4 flex items-center justify-center gap-2">
                            {loading ? (
                                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating...</>
                            ) : 'Create Class'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}
