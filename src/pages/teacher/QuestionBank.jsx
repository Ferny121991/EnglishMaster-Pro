import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import { useToast } from '../../contexts/ToastContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Plus, Search, Tag, Filter, Trash2, Copy, X,
    CheckCircle2, FileText, ListOrdered, TextCursorInput, PenTool,
    Shuffle, ChevronDown, Edit3
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { db } from '../../utils/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const QUESTION_TYPES = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: CheckCircle2 },
    { value: 'true-false', label: 'True/False', icon: CheckCircle2 },
    { value: 'fill-in-blank', label: 'Fill in Blank', icon: TextCursorInput },
    { value: 'short-answer', label: 'Short Answer', icon: PenTool },
    { value: 'essay', label: 'Essay', icon: FileText },
    { value: 'ordering', label: 'Ordering', icon: ListOrdered },
];

const CATEGORIES = ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking', 'Pronunciation', 'Culture', 'Custom'];

export default function QuestionBank() {
    const { user } = useAuth();
    const { assignments, addAssignment, classes } = useClasses();
    const toast = useToast();

    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem(`qbank_${user?.uid}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [editingQ, setEditingQ] = useState(null);
    const [showGenerator, setShowGenerator] = useState(false);
    const [selectedQs, setSelectedQs] = useState([]);

    // Save to localStorage
    const saveQuestions = (qs) => {
        setQuestions(qs);
        localStorage.setItem(`qbank_${user?.uid}`, JSON.stringify(qs));
    };

    const filtered = useMemo(() => {
        return questions.filter(q => {
            if (filterType !== 'all' && q.type !== filterType) return false;
            if (filterCategory !== 'all' && q.category !== filterCategory) return false;
            if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !(q.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
            return true;
        });
    }, [questions, search, filterType, filterCategory]);

    const handleSaveQuestion = (qData) => {
        if (editingQ) {
            const updated = questions.map(q => q.id === editingQ.id ? { ...qData, id: editingQ.id, updatedAt: new Date().toISOString() } : q);
            saveQuestions(updated);
            toast.success('Question updated!');
        } else {
            const newQ = { ...qData, id: `qb_${Date.now()}`, createdAt: new Date().toISOString() };
            saveQuestions([newQ, ...questions]);
            toast.success('Question saved to bank!');
        }
        setShowCreate(false);
        setEditingQ(null);
    };

    const handleDelete = (id) => {
        saveQuestions(questions.filter(q => q.id !== id));
        setSelectedQs(selectedQs.filter(qid => qid !== id));
        toast.success('Question deleted');
    };

    const toggleSelect = (id) => {
        setSelectedQs(prev => prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]);
    };

    const handleGenerateQuiz = async (config) => {
        try {
            let pool = questions;
            if (config.category !== 'all') pool = pool.filter(q => q.category === config.category);
            if (config.type !== 'all') pool = pool.filter(q => q.type === config.type);

            // Shuffle & pick
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, config.count);

            if (selected.length === 0) {
                toast.error('No questions match your filters!');
                return;
            }

            const quizQuestions = selected.map((q, i) => {
                const base = { id: `q${Date.now()}_${i}`, text: q.text, type: q.type, points: q.points || 10 };
                if (q.type === 'multiple-choice') {
                    base.options = [...q.options];
                    base.correctAnswer = q.correctAnswer;
                } else if (q.type === 'true-false') {
                    base.options = ['True', 'False'];
                    base.correctAnswer = q.correctAnswer;
                } else if (q.type === 'fill-in-blank') {
                    base.correctText = q.correctText;
                } else if (q.type === 'ordering') {
                    base.items = [...(q.items || [])];
                } else {
                    base.options = [];
                }
                return base;
            });

            await addAssignment({
                title: config.title || `Auto Quiz - ${new Date().toLocaleDateString()}`,
                description: `Auto-generated quiz with ${selected.length} questions from the question bank.`,
                classId: config.classId,
                type: 'quiz',
                dueDate: new Date(config.dueDate).toISOString(),
                totalPoints: quizQuestions.reduce((sum, q) => sum + (q.points || 10), 0),
                questions: quizQuestions,
                timeLimit: config.timeLimit || 0,
            });

            toast.success(`Quiz created with ${selected.length} questions!`);
            setShowGenerator(false);
        } catch (err) {
            toast.error('Failed to create quiz');
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="Question Bank"
                subtitle={`${questions.length} questions saved`}
                actions={
                    <div className="flex gap-2">
                        <button onClick={() => setShowGenerator(true)} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2">
                            <Shuffle size={14} /> Generate Quiz
                        </button>
                        <button onClick={() => { setEditingQ(null); setShowCreate(true); }} className="btn-neon text-sm px-4 py-2 flex items-center gap-2">
                            <Plus size={16} /> Add Question
                        </button>
                    </div>
                }
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
                {/* Filters */}
                <motion.div variants={item} className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            placeholder="Search questions or tags..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-glass w-full pl-9 text-sm"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="input-glass text-sm min-w-[140px]"
                    >
                        <option value="all">All Types</option>
                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="input-glass text-sm min-w-[140px]"
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </motion.div>

                {/* Stats */}
                <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: questions.length, color: 'neon-blue' },
                        { label: 'MC/TF', value: questions.filter(q => q.type === 'multiple-choice' || q.type === 'true-false').length, color: 'neon-green' },
                        { label: 'Manual', value: questions.filter(q => q.type === 'essay' || q.type === 'short-answer').length, color: 'neon-purple' },
                        { label: 'Categories', value: [...new Set(questions.map(q => q.category).filter(Boolean))].length, color: 'neon-orange' },
                    ].map((s, i) => (
                        <div key={i} className="glass-card p-3 text-center">
                            <p className={`text-xl font-bold text-${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-white/30">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Question List */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <motion.div variants={item} className="glass-card p-12 text-center">
                            <Database size={40} className="text-white/10 mx-auto mb-3" />
                            <p className="text-white/30 text-sm">No questions found.</p>
                            <button onClick={() => setShowCreate(true)} className="mt-3 text-neon-blue text-sm hover:text-neon-blue/80">
                                Create your first question →
                            </button>
                        </motion.div>
                    ) : (
                        filtered.map(q => {
                            const typeInfo = QUESTION_TYPES.find(t => t.value === q.type) || QUESTION_TYPES[0];
                            const isSelected = selectedQs.includes(q.id);
                            return (
                                <motion.div key={q.id} variants={item}
                                    className={`glass-card p-4 hover:border-white/10 transition-all ${isSelected ? 'border-neon-blue/30 bg-neon-blue/[0.03]' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button onClick={() => toggleSelect(q.id)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'border-neon-blue bg-neon-blue' : 'border-white/10 hover:border-white/30'}`}
                                        >
                                            {isSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20 font-bold uppercase`}>
                                                    {typeInfo.label}
                                                </span>
                                                {q.category && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                                                        {q.category}
                                                    </span>
                                                )}
                                                {(q.tags || []).map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-white/30 border border-white/5">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                <span className="text-[10px] text-white/20 ml-auto">{q.points || 10} pts</span>
                                            </div>
                                            <p className="text-sm text-white/80 font-medium">{q.text}</p>
                                            {q.type === 'multiple-choice' && q.options && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {q.options.map((opt, i) => (
                                                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${i === q.correctAnswer ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-white/[0.02] text-white/30 border border-white/5'}`}>
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => { setEditingQ(q); setShowCreate(true); }} className="p-1.5 rounded-lg text-white/20 hover:text-neon-blue hover:bg-neon-blue/10 transition-all">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreate && (
                    <QuestionModal
                        question={editingQ}
                        onSave={handleSaveQuestion}
                        onClose={() => { setShowCreate(false); setEditingQ(null); }}
                    />
                )}
                {showGenerator && (
                    <GeneratorModal
                        classes={classes}
                        categories={[...new Set(questions.map(q => q.category).filter(Boolean))]}
                        onGenerate={handleGenerateQuiz}
                        onClose={() => setShowGenerator(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function QuestionModal({ question, onSave, onClose }) {
    const [text, setText] = useState(question?.text || '');
    const [type, setType] = useState(question?.type || 'multiple-choice');
    const [category, setCategory] = useState(question?.category || '');
    const [tags, setTags] = useState((question?.tags || []).join(', '));
    const [points, setPoints] = useState(question?.points || 10);
    const [options, setOptions] = useState(question?.options || ['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || 0);
    const [correctText, setCorrectText] = useState(question?.correctText || '');
    const [items, setItems] = useState(question?.items || ['', '', '']);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        const qData = {
            text, type, category, points: Number(points),
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        };
        if (type === 'multiple-choice') { qData.options = options; qData.correctAnswer = correctAnswer; }
        else if (type === 'true-false') { qData.options = ['True', 'False']; qData.correctAnswer = correctAnswer; }
        else if (type === 'fill-in-blank') { qData.correctText = correctText; }
        else if (type === 'ordering') { qData.items = items; }
        onSave(qData);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{question ? 'Edit Question' : 'Add Question'}</h3>
                    <button onClick={onClose} className="p-1 text-white/30 hover:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Question text..."
                        className="input-glass w-full min-h-[80px] resize-none text-sm" required />
                    <div className="grid grid-cols-2 gap-3">
                        <select value={type} onChange={e => setType(e.target.value)} className="input-glass text-sm">
                            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="input-glass text-sm">
                            <option value="">Category...</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Points" className="input-glass text-sm" />
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" className="input-glass text-sm" />
                    </div>

                    {type === 'multiple-choice' && (
                        <div className="space-y-2">
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <button type="button" onClick={() => setCorrectAnswer(i)}
                                        className={`w-5 h-5 rounded-full border-2 shrink-0 ${i === correctAnswer ? 'border-neon-green bg-neon-green' : 'border-white/10'}`} />
                                    <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                                        placeholder={`Option ${i + 1}`} className="input-glass flex-1 text-sm" />
                                </div>
                            ))}
                        </div>
                    )}
                    {type === 'true-false' && (
                        <div className="flex gap-3">
                            {['True', 'False'].map((opt, i) => (
                                <button key={opt} type="button" onClick={() => setCorrectAnswer(i)}
                                    className={`flex-1 p-3 rounded-xl border text-sm ${i === correctAnswer ? 'bg-neon-green/10 border-neon-green text-neon-green' : 'bg-white/[0.02] border-white/5 text-white/40'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                    {type === 'fill-in-blank' && (
                        <input value={correctText} onChange={e => setCorrectText(e.target.value)} placeholder="Correct answer..." className="input-glass w-full text-sm" />
                    )}
                    {type === 'ordering' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-white/30">Items in correct order:</p>
                            {items.map((it, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-neon-blue font-bold w-4">{i + 1}</span>
                                    <input value={it} onChange={e => { const its = [...items]; its[i] = e.target.value; setItems(its); }}
                                        placeholder={`Item ${i + 1}`} className="input-glass flex-1 text-sm" />
                                    {items.length > 2 && (
                                        <button type="button" onClick={() => setItems(items.filter((_, ii) => ii !== i))} className="text-white/10 hover:text-red-400"><X size={14} /></button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setItems([...items, ''])} className="text-xs text-neon-blue"><Plus size={12} className="inline" /> Add item</button>
                        </div>
                    )}

                    <button type="submit" className="btn-neon w-full py-2.5 text-sm">
                        {question ? 'Update Question' : 'Save to Bank'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function GeneratorModal({ classes, categories, onGenerate, onClose }) {
    const [title, setTitle] = useState('');
    const [classId, setClassId] = useState(classes[0]?.id || '');
    const [count, setCount] = useState(10);
    const [category, setCategory] = useState('all');
    const [type, setType] = useState('all');
    const [dueDate, setDueDate] = useState('');
    const [timeLimit, setTimeLimit] = useState(0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Shuffle size={18} className="text-neon-blue" /> Generate Quiz</h3>
                    <button onClick={onClose} className="p-1 text-white/30 hover:text-white"><X size={18} /></button>
                </div>
                <div className="space-y-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title (optional)" className="input-glass w-full text-sm" />
                    <select value={classId} onChange={e => setClassId(e.target.value)} className="input-glass w-full text-sm">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block"># Questions</label>
                            <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={50} className="input-glass w-full text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">Time Limit (min)</label>
                            <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min={0} className="input-glass w-full text-sm" placeholder="0 = none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="input-glass text-sm">
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={type} onChange={e => setType(e.target.value)} className="input-glass text-sm">
                            <option value="all">All Types</option>
                            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-glass w-full text-sm" />
                    <button
                        onClick={() => onGenerate({ title, classId, count, category, type, dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(), timeLimit })}
                        className="btn-neon w-full py-2.5 text-sm"
                        disabled={!classId}
                    >
                        🎲 Generate Random Quiz
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
