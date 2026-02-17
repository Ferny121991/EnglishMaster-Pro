import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import TopBar from '../../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw, ChevronLeft, ChevronRight, Shuffle, BookOpen,
    CheckCircle2, XCircle, Zap, Flame, Target, Trophy,
    ArrowRight, Sparkles, Brain, GripVertical, Link2,
    Type, Layers, Languages, AlertTriangle, PenTool
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';

// ─── Helper: shuffle array ────────────────────────
function shuffleArr(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function scrambleWord(word) { let s = shuffleArr(word.split('')).join(''); while (s === word && word.length > 1) s = shuffleArr(word.split('')).join(''); return s; }

// ─── Flashcard ─────────────────────────────────────
function Flashcard({ front, back, flipped, onFlip }) {
    return (
        <div className="perspective-1000 w-full max-w-lg mx-auto cursor-pointer" onClick={onFlip} style={{ perspective: '1000px' }}>
            <motion.div className="relative w-full aspect-[3/2] sm:aspect-[16/9]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }} style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 glass-card p-6 sm:p-8 flex flex-col items-center justify-center text-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    <div className="absolute top-3 right-3 text-[10px] text-white/20 uppercase tracking-widest">Question</div>
                    <p className="text-lg sm:text-xl font-display font-bold text-white leading-relaxed">{front}</p>
                    <p className="text-[10px] text-white/20 mt-4">Tap to reveal answer</p>
                </div>
                <div className="absolute inset-0 glass-card p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-neon-green/[0.03] to-neon-blue/[0.03] border-neon-green/20" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className="absolute top-3 right-3 text-[10px] text-neon-green/40 uppercase tracking-widest">Answer</div>
                    <p className="text-lg sm:text-xl font-display font-bold text-neon-green leading-relaxed">{back}</p>
                    <p className="text-[10px] text-white/20 mt-4">Tap to flip back</p>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Drag & Reorder ────────────────────────────────
function DragExercise({ items, correctOrder, onComplete }) {
    const [current, setCurrent] = useState(() => shuffleArr(items));
    const [dragIdx, setDragIdx] = useState(null);
    const [checked, setChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const handleDragStart = (idx) => setDragIdx(idx);
    const handleDragOver = (e, idx) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx) return; const a = [...current]; const [m] = a.splice(dragIdx, 1); a.splice(idx, 0, m); setCurrent(a); setDragIdx(idx); };
    const handleDragEnd = () => setDragIdx(null);
    const handleCheck = () => { const c = JSON.stringify(current) === JSON.stringify(correctOrder); setIsCorrect(c); setChecked(true); onComplete?.(c); };
    const reset = () => { setCurrent(shuffleArr(items)); setChecked(false); setIsCorrect(false); };
    return (
        <div className="space-y-3">
            <p className="text-xs text-white/40 mb-2">Drag items into the correct order:</p>
            <div className="space-y-2">{current.map((item, idx) => (
                <motion.div key={`${item}-${idx}`} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd} layout
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${checked && isCorrect ? 'bg-neon-green/5 border-neon-green/20' : checked && !isCorrect ? 'bg-red-500/5 border-red-500/20' : dragIdx === idx ? 'bg-neon-blue/10 border-neon-blue/30 scale-[1.02]' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'}`}>
                    <GripVertical size={14} className="text-white/20 shrink-0" />
                    <span className="text-xs font-bold text-neon-blue w-5">{idx + 1}</span>
                    <span className="text-sm text-white/80 flex-1">{item}</span>
                </motion.div>
            ))}</div>
            <div className="flex gap-2">
                {!checked ? <button onClick={handleCheck} className="btn-neon text-sm px-4 py-2 flex items-center gap-2"><CheckCircle2 size={14} /> Check</button> : (<>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${isCorrect ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-400'}`}>{isCorrect ? <><CheckCircle2 size={14} /> Correct!</> : <><XCircle size={14} /> Incorrect</>}</div>
                    <button onClick={reset} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>
                </>)}
            </div>
        </div>
    );
}

// ─── Fill Blank ────────────────────────────────────
function FillBlankExercise({ sentence, answer, onComplete }) {
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const isCorrect = input.trim().toLowerCase() === answer.trim().toLowerCase();
    const handleCheck = () => { setChecked(true); onComplete?.(isCorrect); };
    return (
        <div className="space-y-3">
            <p className="text-sm text-white/80 leading-relaxed">{sentence.split('___').map((part, i, arr) => (
                <span key={i}>{part}{i < arr.length - 1 && (<span className="inline-block mx-1 px-3 py-0.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 min-w-[80px] text-center">
                    {checked ? <span className={isCorrect ? 'text-neon-green font-bold' : 'text-red-400 font-bold'}>{input || '...'}</span> : <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className="bg-transparent border-none text-sm text-neon-blue text-center w-full focus:ring-0 p-0" placeholder="type here" />}
                </span>)}</span>
            ))}</p>
            {checked && !isCorrect && <p className="text-xs text-neon-green/60">Correct: <span className="font-bold text-neon-green">{answer}</span></p>}
            <div className="flex gap-2">
                {!checked ? <button onClick={handleCheck} className="btn-neon text-sm px-4 py-2" disabled={!input.trim()}>Check</button>
                    : <button onClick={() => { setInput(''); setChecked(false); }} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Again</button>}
            </div>
        </div>
    );
}

// ─── Word Scramble ─────────────────────────────────
function WordScrambleExercise({ word, hint, onComplete }) {
    const [scrambled] = useState(() => scrambleWord(word.toUpperCase()));
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const isCorrect = input.trim().toLowerCase() === word.trim().toLowerCase();
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">{scrambled.split('').map((l, i) => (
                <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: i * 0.05 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-fuchsia-500/20 border border-neon-purple/30 flex items-center justify-center text-lg font-bold text-white shadow-lg">{l}</motion.div>
            ))}</div>
            {hint && <p className="text-xs text-white/30 text-center italic">Hint: {hint}</p>}
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !checked && setChecked(true)} placeholder="Unscramble the word..." className="input-glass text-center text-sm" />
            {checked && <div className={`text-center text-sm font-bold ${isCorrect ? 'text-neon-green' : 'text-red-400'}`}>{isCorrect ? '✅ Correct!' : `❌ The answer is: ${word}`}</div>}
            <div className="flex justify-center gap-2">
                {!checked ? <button onClick={() => setChecked(true)} className="btn-neon text-sm px-4 py-2" disabled={!input.trim()}>Check</button>
                    : <button onClick={() => { setInput(''); setChecked(false); }} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── Sentence Builder ──────────────────────────────
function SentenceBuilderExercise({ correctSentence, onComplete }) {
    const words = correctSentence.split(' ');
    const [available, setAvailable] = useState(() => shuffleArr(words));
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState(false);
    const isCorrect = selected.join(' ').toLowerCase() === correctSentence.toLowerCase();
    const addWord = (w, i) => { setSelected([...selected, w]); setAvailable(available.filter((_, idx) => idx !== i)); };
    const removeWord = (w, i) => { setAvailable([...available, w]); setSelected(selected.filter((_, idx) => idx !== i)); };
    const reset = () => { setAvailable(shuffleArr(words)); setSelected([]); setChecked(false); };
    return (
        <div className="space-y-4">
            <div className="min-h-[48px] p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.01] flex flex-wrap gap-2">
                {selected.length === 0 && <span className="text-xs text-white/20 italic">Tap words below to build the sentence...</span>}
                {selected.map((w, i) => (
                    <motion.button key={`s-${i}`} layout initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => !checked && removeWord(w, i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${checked ? isCorrect ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 cursor-pointer'}`}>{w}</motion.button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">{available.map((w, i) => (
                <motion.button key={`a-${i}`} layout onClick={() => !checked && addWord(w, i)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all cursor-pointer">{w}</motion.button>
            ))}</div>
            {checked && !isCorrect && <p className="text-xs text-neon-green/60 text-center">Correct: <span className="font-bold text-neon-green">{correctSentence}</span></p>}
            <div className="flex justify-center gap-2">
                {!checked ? <button onClick={() => { setChecked(true); onComplete?.(isCorrect); }} className="btn-neon text-sm px-4 py-2" disabled={available.length > 0}><CheckCircle2 size={14} className="mr-1" /> Check</button>
                    : <button onClick={reset} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── Matching Exercise ─────────────────────────────
function MatchingExercise({ pairs, onComplete }) {
    const lefts = pairs.map(p => p.left);
    const [shuffledRights] = useState(() => shuffleArr(pairs.map(p => p.right)));
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matches, setMatches] = useState({});
    const [checked, setChecked] = useState(false);
    const handleRight = (r) => { if (selectedLeft === null || checked) return; setMatches(prev => ({ ...prev, [selectedLeft]: r })); setSelectedLeft(null); };
    const allMatched = Object.keys(matches).length === lefts.length;
    const checkAnswers = () => { setChecked(true); const correct = lefts.every((l, i) => matches[i] === pairs[i].right); onComplete?.(correct); };
    const reset = () => { setMatches({}); setChecked(false); setSelectedLeft(null); };
    const matchedRights = Object.values(matches);
    return (
        <div className="space-y-4">
            <p className="text-xs text-white/40">Tap a left item, then tap its match on the right.</p>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">{lefts.map((l, i) => {
                    const matched = matches[i]; const isRight = checked && matched === pairs[i].right; const isWrong = checked && matched && matched !== pairs[i].right;
                    return <button key={i} onClick={() => !checked && setSelectedLeft(i)} className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${selectedLeft === i ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : isRight ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : isWrong ? 'bg-red-500/10 border-red-500/20 text-red-400' : matched ? 'bg-white/[0.04] border-white/10 text-white/60' : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/15'}`}>
                        <span className="font-bold mr-1">{i + 1}.</span> {l} {matched && <span className="text-[10px] float-right opacity-60">→ {matched}</span>}
                    </button>;
                })}</div>
                <div className="space-y-2">{shuffledRights.map((r, i) => (
                    <button key={i} onClick={() => handleRight(r)} disabled={matchedRights.includes(r) || checked}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${matchedRights.includes(r) ? 'bg-white/[0.02] border-white/5 text-white/20 opacity-40' : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-neon-purple/30 hover:text-neon-purple cursor-pointer'}`}>{r}</button>
                ))}</div>
            </div>
            <div className="flex gap-2">
                {!checked ? <button onClick={checkAnswers} className="btn-neon text-sm px-4 py-2" disabled={!allMatched}>Check Matches</button>
                    : <button onClick={reset} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── Categorize Exercise ───────────────────────────
function CategorizeExercise({ categories, onComplete }) {
    const allItems = useMemo(() => shuffleArr(categories.flatMap((c, ci) => c.items.map(item => ({ item, catIdx: ci })))), []);
    const [pool, setPool] = useState(allItems);
    const [buckets, setBuckets] = useState(() => categories.map(() => []));
    const [checked, setChecked] = useState(false);
    const addToBucket = (ci, itemObj) => { setPool(p => p.filter(i => i !== itemObj)); setBuckets(b => b.map((bk, i) => i === ci ? [...bk, itemObj] : bk)); };
    const removeFromBucket = (ci, idx) => { const item = buckets[ci][idx]; setBuckets(b => b.map((bk, i) => i === ci ? bk.filter((_, j) => j !== idx) : bk)); setPool(p => [...p, item]); };
    const allPlaced = pool.length === 0;
    const checkResult = () => { setChecked(true); const correct = buckets.every((bk, ci) => bk.every(obj => obj.catIdx === ci)); onComplete?.(correct); };
    const reset = () => { setPool(shuffleArr(allItems)); setBuckets(categories.map(() => [])); setChecked(false); };
    return (
        <div className="space-y-4">
            {pool.length > 0 && (<div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.01] border border-dashed border-white/10 min-h-[40px]">
                {pool.map((obj, i) => <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium bg-neon-blue/10 text-neon-blue border border-neon-blue/20 cursor-pointer hover:bg-neon-blue/20 transition-all">{obj.item}</span>)}
            </div>)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{categories.map((cat, ci) => (
                <div key={ci} className={`p-3 rounded-xl border min-h-[80px] transition-all ${checked ? buckets[ci].every(o => o.catIdx === ci) ? 'border-neon-green/20 bg-neon-green/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                    <p className="text-xs font-bold text-neon-purple mb-2">{cat.name}</p>
                    <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                        {buckets[ci].map((obj, i) => <button key={i} onClick={() => !checked && removeFromBucket(ci, i)} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/60 hover:text-red-400 transition-all">{obj.item}</button>)}
                    </div>
                    {!checked && pool.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{pool.map((obj, i) => (
                        <button key={i} onClick={() => addToBucket(ci, obj)} className="text-[10px] px-2 py-0.5 rounded bg-neon-purple/10 text-neon-purple border border-neon-purple/20 hover:bg-neon-purple/20 transition-all">+ {obj.item}</button>
                    ))}</div>}
                </div>
            ))}</div>
            <div className="flex gap-2">
                {!checked ? <button onClick={checkResult} className="btn-neon text-sm px-4 py-2" disabled={!allPlaced}>Check</button>
                    : <button onClick={reset} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── Error Correction ──────────────────────────────
function ErrorCorrectionExercise({ errorSentence, correctText, onComplete }) {
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const isCorrect = input.trim().toLowerCase() === correctText.trim().toLowerCase();
    return (
        <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-xs text-red-400/60 uppercase tracking-wider font-bold mb-1">❌ Sentence with error:</p>
                <p className="text-sm text-white/80 font-medium">{errorSentence}</p>
            </div>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !checked && setChecked(true)} placeholder="Type the corrected sentence..." className="input-glass text-sm" />
            {checked && <div className={`p-3 rounded-xl text-sm font-bold ${isCorrect ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isCorrect ? '✅ Perfect!' : <><span>❌ Correct answer: </span><span className="text-neon-green">{correctText}</span></>}
            </div>}
            <div className="flex gap-2">
                {!checked ? <button onClick={() => { setChecked(true); onComplete?.(isCorrect); }} className="btn-neon text-sm px-4 py-2" disabled={!input.trim()}>Check</button>
                    : <button onClick={() => { setInput(''); setChecked(false); }} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── Translation ───────────────────────────────────
function TranslationExercise({ sourceText, correctText, onComplete }) {
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const isCorrect = input.trim().toLowerCase() === correctText.trim().toLowerCase();
    return (
        <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
                <p className="text-xs text-neon-blue/60 uppercase tracking-wider font-bold mb-1">🌐 Translate:</p>
                <p className="text-sm text-white/80 font-medium">{sourceText}</p>
            </div>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !checked && setChecked(true)} placeholder="Your translation..." className="input-glass text-sm" />
            {checked && <div className={`p-3 rounded-xl text-sm font-bold ${isCorrect ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isCorrect ? '✅ Perfect translation!' : <><span>Correct: </span><span className="text-neon-green">{correctText}</span></>}
            </div>}
            <div className="flex gap-2">
                {!checked ? <button onClick={() => { setChecked(true); onComplete?.(isCorrect); }} className="btn-neon text-sm px-4 py-2" disabled={!input.trim()}>Check</button>
                    : <button onClick={() => { setInput(''); setChecked(false); }} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2"><RotateCcw size={14} /> Retry</button>}
            </div>
        </div>
    );
}

// ─── TYPE CONFIG for exercise badges ───────────────
const EX_TYPES = {
    drag: { label: 'Reorder', color: 'neon-purple', icon: GripVertical },
    fill: { label: 'Fill Blank', color: 'neon-blue', icon: Type },
    scramble: { label: 'Word Scramble', color: 'neon-orange', icon: Shuffle },
    sentence: { label: 'Sentence Builder', color: 'neon-pink', icon: Layers },
    matching: { label: 'Matching', color: 'neon-green', icon: Link2 },
    categorize: { label: 'Categorize', color: 'cyan-400', icon: Target },
    'error-correction': { label: 'Error Fix', color: 'red-400', icon: AlertTriangle },
    translation: { label: 'Translation', color: 'amber-400', icon: Languages },
};

// ─── Main Practice Page ─────────────────────────────
export default function Practice() {
    const { userProfile } = useAuth();
    const { classes, assignments } = useClasses();
    const uid = userProfile?.uid;

    const [mode, setMode] = useState(null);
    const [selectedClass, setSelectedClass] = useState('all');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [exKey, setExKey] = useState(0); // force re-mount for randomization

    const myClasses = classes.filter(c => c.students?.includes(uid));
    const myClassIds = myClasses.map(c => c.id);

    const allQuestions = useMemo(() => {
        const filtered = selectedClass === 'all' ? assignments.filter(a => myClassIds.includes(a.classId)) : assignments.filter(a => a.classId === selectedClass);
        const qs = [];
        filtered.forEach(a => { (a.questions || []).forEach(q => { qs.push({ ...q, assignmentTitle: a.title, classId: a.classId }); }); });
        return qs;
    }, [assignments, selectedClass, myClassIds]);

    const flashcards = useMemo(() =>
        allQuestions.filter(q => ['multiple-choice', 'true-false', 'fill-in-blank', 'word-scramble', 'translation'].includes(q.type)).map(q => ({
            front: q.type === 'translation' ? (q.sourceText || q.text) : q.text,
            back: q.type === 'fill-in-blank' || q.type === 'word-scramble' || q.type === 'translation' ? q.correctText : q.options?.[q.correctAnswer] || 'N/A',
            id: q.id,
        })), [allQuestions]);

    const quizQuestions = useMemo(() => {
        const pool = allQuestions.filter(q => q.type === 'multiple-choice' || q.type === 'true-false');
        return shuffleArr(pool).slice(0, 10);
    }, [allQuestions, mode]);

    // ALL exercises from all question types
    const exercises = useMemo(() => {
        const exs = [];
        allQuestions.forEach(q => {
            if (q.type === 'ordering' && q.items?.length >= 2) exs.push({ type: 'drag', question: q.text, items: q.items, correctOrder: q.items, id: q.id });
            if (q.type === 'fill-in-blank' && q.correctText) { const s = q.text.includes('___') ? q.text : q.text + ' ___'; exs.push({ type: 'fill', question: q.text, sentence: s, answer: q.correctText, id: q.id }); }
            if (q.type === 'word-scramble' && q.correctText) exs.push({ type: 'scramble', question: q.text, word: q.correctText, id: q.id });
            if (q.type === 'sentence-builder' && q.correctSentence) exs.push({ type: 'sentence', question: q.text, correctSentence: q.correctSentence, id: q.id });
            if (q.type === 'matching' && q.pairs?.length >= 2) exs.push({ type: 'matching', question: q.text, pairs: q.pairs, id: q.id });
            if (q.type === 'categorize' && q.categories?.length >= 2) exs.push({ type: 'categorize', question: q.text, categories: q.categories, id: q.id });
            if (q.type === 'error-correction' && q.errorSentence && q.correctText) exs.push({ type: 'error-correction', question: q.text, errorSentence: q.errorSentence, correctText: q.correctText, id: q.id });
            if (q.type === 'translation' && q.sourceText && q.correctText) exs.push({ type: 'translation', question: q.text, sourceText: q.sourceText, correctText: q.correctText, id: q.id });
        });
        return shuffleArr(exs);
    }, [allQuestions, mode]);

    const handleQuizAnswer = (qIdx, answer) => { if (quizSubmitted) return; setQuizAnswers(prev => ({ ...prev, [qIdx]: answer })); };
    const submitQuiz = () => { let c = 0; quizQuestions.forEach((q, i) => { if (quizAnswers[i] === q.options?.[q.correctAnswer]) c++; }); setScore({ correct: c, total: quizQuestions.length }); setQuizSubmitted(true); };
    const resetQuiz = () => { setQuizAnswers({}); setQuizSubmitted(false); setScore({ correct: 0, total: 0 }); };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    // ─── MODE SELECTOR ─────────────────────────────
    if (!mode) {
        return (
            <div className="min-h-screen pb-20">
                <TopBar title="Practice Mode" subtitle="Study without pressure — no grades!" />
                <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
                    <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-2">
                        <button onClick={() => setSelectedClass('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedClass === 'all' ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20' : 'bg-white/[0.02] text-white/40 border border-white/[0.06]'}`}>All Classes</button>
                        {myClasses.map(cls => (<button key={cls.id} onClick={() => setSelectedClass(cls.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedClass === cls.id ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20' : 'bg-white/[0.02] text-white/40 border border-white/[0.06]'}`}>{cls.name}</button>))}
                    </motion.div>

                    <motion.div variants={item} className="glass-card p-4 flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2"><Brain size={18} className="text-neon-purple" /><span className="text-sm text-white/60"><span className="text-white font-bold">{allQuestions.length}</span> questions</span></div>
                        <div className="flex items-center gap-2"><BookOpen size={16} className="text-neon-blue" /><span className="text-sm text-white/60"><span className="text-white font-bold">{flashcards.length}</span> flashcards</span></div>
                        <div className="flex items-center gap-2"><Target size={16} className="text-neon-green" /><span className="text-sm text-white/60"><span className="text-white font-bold">{exercises.length}</span> exercises</span></div>
                        <div className="flex items-center gap-2"><Zap size={16} className="text-neon-orange" /><span className="text-sm text-white/60"><span className="text-white font-bold">12</span> types</span></div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'flashcards', icon: BookOpen, title: 'Flashcards', desc: 'Flip cards to memorize questions and answers.', color: 'neon-blue', gradient: 'from-neon-blue to-cyan-400', count: flashcards.length, disabled: flashcards.length === 0 },
                            { id: 'quiz', icon: Zap, title: 'Practice Quiz', desc: 'Random quiz — no grades! MC & True/False.', color: 'neon-green', gradient: 'from-neon-green to-emerald-400', count: quizQuestions.length, disabled: quizQuestions.length === 0 },
                            { id: 'exercises', icon: Target, title: 'Exercises', desc: 'Drag, match, scramble, build, translate & more!', color: 'neon-purple', gradient: 'from-neon-purple to-fuchsia-400', count: exercises.length, disabled: exercises.length === 0 },
                        ].map(m => (
                            <motion.button key={m.id} variants={item} onClick={() => !m.disabled && setMode(m.id)} disabled={m.disabled}
                                className={`glass-card p-6 text-left group hover:scale-[1.03] transition-all relative overflow-hidden ${m.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mb-4 shadow-lg`}><m.icon size={24} className="text-white" /></div>
                                    <h3 className="text-lg font-display font-bold text-white mb-1">{m.title}</h3>
                                    <p className="text-xs text-white/40 leading-relaxed mb-3">{m.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${m.color}/10 text-${m.color} border border-${m.color}/20 font-bold`}>{m.count} items</span>
                                        {!m.disabled && <ArrowRight size={16} className={`text-${m.color} opacity-0 group-hover:opacity-100 transition-opacity`} />}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Exercise type breakdown */}
                    {exercises.length > 0 && (
                        <motion.div variants={item} className="glass-card p-4">
                            <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-3">Available Exercise Types</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(EX_TYPES).map(([key, cfg]) => {
                                    const count = exercises.filter(e => e.type === key).length;
                                    if (count === 0) return null;
                                    return <span key={key} className={`text-[10px] px-2.5 py-1 rounded-lg bg-${cfg.color}/10 text-${cfg.color} border border-${cfg.color}/20 font-bold flex items-center gap-1`}><cfg.icon size={10} /> {cfg.label} ({count})</span>;
                                })}
                            </div>
                        </motion.div>
                    )}

                    {allQuestions.length === 0 && (
                        <motion.div variants={item} className="glass-card p-12 text-center">
                            <Brain size={48} className="text-white/10 mx-auto mb-3" />
                            <p className="text-white/30 text-sm">No questions available yet.</p>
                            <p className="text-white/20 text-[10px] mt-1">Questions from your assignments will appear here for practice.</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    // ─── FLASHCARDS MODE ────────────────────────────
    if (mode === 'flashcards') {
        const card = flashcards[currentIdx] || { front: 'No cards', back: '' };
        return (
            <div className="min-h-screen pb-20">
                <TopBar title="Flashcards" subtitle={`${currentIdx + 1} of ${flashcards.length}`} actions={<button onClick={() => { setMode(null); setCurrentIdx(0); setFlipped(false); }} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2"><ChevronLeft size={16} /> Back</button>} />
                <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
                    <motion.div variants={item} className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple" animate={{ width: `${((currentIdx + 1) / flashcards.length) * 100}%` }} transition={{ duration: 0.3 }} /></div>
                        <span className="text-[10px] text-white/30 font-mono">{currentIdx + 1}/{flashcards.length}</span>
                    </motion.div>
                    <motion.div variants={item}><Flashcard front={card.front} back={card.back} flipped={flipped} onFlip={() => setFlipped(!flipped)} /></motion.div>
                    <motion.div variants={item} className="flex items-center justify-center gap-3">
                        <button onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); }} disabled={currentIdx === 0} className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-neon-blue/30 transition-all disabled:opacity-30"><ChevronLeft size={20} /></button>
                        <button onClick={() => setFlipped(!flipped)} className="px-6 py-3 rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-sm font-bold hover:bg-neon-blue/20 transition-all flex items-center gap-2"><RotateCcw size={14} /> Flip</button>
                        <button onClick={() => { setCurrentIdx(0); setFlipped(false); }} className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-sm hover:text-white transition-all flex items-center gap-2"><Shuffle size={14} /></button>
                        <button onClick={() => { setCurrentIdx(Math.min(flashcards.length - 1, currentIdx + 1)); setFlipped(false); }} disabled={currentIdx === flashcards.length - 1} className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-neon-blue/30 transition-all disabled:opacity-30"><ChevronRight size={20} /></button>
                    </motion.div>
                    <p className="text-center text-[10px] text-white/15">Tip: Use arrow keys to navigate, space to flip</p>
                </motion.div>
            </div>
        );
    }

    // ─── QUIZ MODE ──────────────────────────────────
    if (mode === 'quiz') {
        return (
            <div className="min-h-screen pb-20">
                <TopBar title="Practice Quiz" subtitle={quizSubmitted ? `Score: ${score.correct}/${score.total}` : `${Object.keys(quizAnswers).length}/${quizQuestions.length} answered`} actions={<button onClick={() => { setMode(null); resetQuiz(); }} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2"><ChevronLeft size={16} /> Back</button>} />
                <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
                    <motion.div variants={item} className="glass-card p-3 border-l-4 border-l-neon-green bg-neon-green/[0.02] flex items-center gap-3">
                        <Sparkles size={16} className="text-neon-green shrink-0" />
                        <p className="text-xs text-white/50">Practice mode — <span className="text-neon-green font-bold">no grades recorded</span>. Learn freely!</p>
                    </motion.div>
                    {quizSubmitted && (
                        <motion.div variants={item} className="glass-card p-8 text-center space-y-4">
                            <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${score.correct / score.total >= 0.7 ? 'bg-neon-green/10 border border-neon-green/20' : 'bg-neon-orange/10 border border-neon-orange/20'}`}>
                                {score.correct / score.total >= 0.7 ? <Trophy size={36} className="text-neon-green" /> : <Target size={36} className="text-neon-orange" />}
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white">Practice Complete!</h2>
                            <p className="text-4xl font-display font-black text-neon-blue">{score.correct}/{score.total}</p>
                            <p className="text-sm text-white/40">{Math.round((score.correct / score.total) * 100)}% correct</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={resetQuiz} className="btn-neon text-sm px-5 py-2.5 flex items-center gap-2"><RotateCcw size={14} /> Try Again</button>
                                <button onClick={() => { setMode(null); resetQuiz(); }} className="btn-ghost text-sm px-5 py-2.5">Back to Menu</button>
                            </div>
                        </motion.div>
                    )}
                    <div className="space-y-4">{quizQuestions.map((q, idx) => {
                        const userAnswer = quizAnswers[idx]; const correctAnswer = q.options?.[q.correctAnswer]; const isCorrect = userAnswer === correctAnswer;
                        return (
                            <motion.div key={q.id || idx} variants={item} className={`glass-card p-4 sm:p-5 transition-all ${quizSubmitted ? isCorrect ? 'border-neon-green/20 bg-neon-green/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]' : userAnswer ? 'border-neon-blue/10' : ''}`}>
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-xs font-bold text-neon-blue bg-neon-blue/10 border border-neon-blue/20 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">{idx + 1}</span>
                                    <p className="text-sm text-white/80 font-medium flex-1">{q.text}</p>
                                    {quizSubmitted && (isCorrect ? <CheckCircle2 size={18} className="text-neon-green shrink-0" /> : <XCircle size={18} className="text-red-400 shrink-0" />)}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">{(q.options || []).map((opt, oi) => {
                                    const isSelected = userAnswer === opt; const isCorrectOpt = opt === correctAnswer;
                                    let cls = 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/15 hover:bg-white/[0.04]';
                                    if (quizSubmitted) { if (isCorrectOpt) cls = 'bg-neon-green/10 border-neon-green/30 text-neon-green'; else if (isSelected && !isCorrectOpt) cls = 'bg-red-500/10 border-red-500/30 text-red-400'; else cls = 'bg-white/[0.01] border-white/[0.04] text-white/30'; }
                                    else if (isSelected) cls = 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue';
                                    return <button key={oi} onClick={() => handleQuizAnswer(idx, opt)} disabled={quizSubmitted} className={`text-left p-3 rounded-xl border text-sm transition-all ${cls}`}><span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}</button>;
                                })}</div>
                            </motion.div>
                        );
                    })}</div>
                    {!quizSubmitted && quizQuestions.length > 0 && (
                        <motion.div variants={item} className="flex justify-center pt-4">
                            <button onClick={submitQuiz} className="btn-neon text-sm px-8 py-3 flex items-center gap-2" disabled={Object.keys(quizAnswers).length < quizQuestions.length}>
                                <CheckCircle2 size={16} /> Check Answers ({Object.keys(quizAnswers).length}/{quizQuestions.length})
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    // ─── EXERCISES MODE ─────────────────────────────
    if (mode === 'exercises') {
        const exercise = exercises[currentIdx];
        const cfg = exercise ? EX_TYPES[exercise.type] || EX_TYPES.fill : null;
        return (
            <div className="min-h-screen pb-20">
                <TopBar title="Interactive Exercises" subtitle={exercises.length > 0 ? `${currentIdx + 1} of ${exercises.length}` : 'No exercises'}
                    actions={<button onClick={() => { setMode(null); setCurrentIdx(0); }} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2"><ChevronLeft size={16} /> Back</button>} />
                <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
                    {exercises.length > 0 && (
                        <motion.div variants={item} className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-neon-purple to-fuchsia-400" animate={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }} transition={{ duration: 0.3 }} /></div>
                            <span className="text-[10px] text-white/30 font-mono">{currentIdx + 1}/{exercises.length}</span>
                        </motion.div>
                    )}
                    {exercise ? (
                        <motion.div key={`${currentIdx}-${exKey}`} variants={item} className="glass-card p-5 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                {cfg && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-${cfg.color}/10 text-${cfg.color} border border-${cfg.color}/20 flex items-center gap-1`}><cfg.icon size={10} /> {cfg.label}</span>}
                            </div>
                            <h3 className="text-sm font-bold text-white mb-4">{exercise.question}</h3>
                            {exercise.type === 'drag' && <DragExercise items={exercise.items} correctOrder={exercise.correctOrder} />}
                            {exercise.type === 'fill' && <FillBlankExercise sentence={exercise.sentence} answer={exercise.answer} />}
                            {exercise.type === 'scramble' && <WordScrambleExercise word={exercise.word} hint={exercise.question} />}
                            {exercise.type === 'sentence' && <SentenceBuilderExercise correctSentence={exercise.correctSentence} />}
                            {exercise.type === 'matching' && <MatchingExercise pairs={exercise.pairs} />}
                            {exercise.type === 'categorize' && <CategorizeExercise categories={exercise.categories} />}
                            {exercise.type === 'error-correction' && <ErrorCorrectionExercise errorSentence={exercise.errorSentence} correctText={exercise.correctText} />}
                            {exercise.type === 'translation' && <TranslationExercise sourceText={exercise.sourceText} correctText={exercise.correctText} />}
                        </motion.div>
                    ) : (
                        <div className="glass-card p-12 text-center"><Target size={48} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No exercises available yet.</p></div>
                    )}
                    {exercises.length > 0 && (
                        <motion.div variants={item} className="flex items-center justify-center gap-3">
                            <button onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setExKey(k => k + 1); }} disabled={currentIdx === 0} className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30"><ChevronLeft size={18} /></button>
                            <span className="text-sm text-white/40">{currentIdx + 1} / {exercises.length}</span>
                            <button onClick={() => { setCurrentIdx(Math.min(exercises.length - 1, currentIdx + 1)); setExKey(k => k + 1); }} disabled={currentIdx === exercises.length - 1} className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all disabled:opacity-30"><ChevronRight size={18} /></button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    return null;
}
