import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Clock, FileCheck, AlertTriangle,
    CalendarDays, CheckCircle2, BookOpen
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_COLORS = {
    quiz: { bg: 'bg-neon-blue/20', text: 'text-neon-blue', dot: 'bg-neon-blue' },
    exam: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    essay: { bg: 'bg-neon-purple/20', text: 'text-neon-purple', dot: 'bg-neon-purple' },
    homework: { bg: 'bg-amber-400/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    project: { bg: 'bg-pink-500/20', text: 'text-pink-400', dot: 'bg-pink-500' },
    assignment: { bg: 'bg-neon-green/20', text: 'text-neon-green', dot: 'bg-neon-green' },
};

export default function Calendar() {
    const { userProfile } = useAuth();
    const { classes, assignments, submissions } = useClasses();
    const navigate = useNavigate();
    const uid = userProfile?.uid;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const myClasses = classes.filter(c => c.students?.includes(uid));
    const myClassIds = myClasses.map(c => c.id);
    const myAssignments = assignments.filter(a => myClassIds.includes(a.classId));

    // Build assignment map by date
    const assignmentsByDate = useMemo(() => {
        const map = {};
        myAssignments.forEach(a => {
            if (!a.dueDate) return;
            const dateKey = new Date(a.dueDate).toDateString();
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(a);
        });
        return map;
    }, [myAssignments]);

    // Calendar grid
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date().toDateString()); };

    const selectedAssignments = selectedDate ? (assignmentsByDate[selectedDate] || []) : [];

    // Upcoming this week
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const thisWeek = myAssignments
        .filter(a => {
            const due = new Date(a.dueDate);
            return due >= today && due <= weekEnd;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar title="Calendar" subtitle={`${MONTHS[month]} ${year}`} />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <motion.div variants={item} className="lg:col-span-2 glass-card p-4 sm:p-6">
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-neon-blue/30 transition-all">
                                <ChevronLeft size={18} />
                            </button>
                            <div className="text-center">
                                <h2 className="text-lg sm:text-xl font-display font-bold text-white">{MONTHS[month]} {year}</h2>
                                <button onClick={goToday} className="text-xs text-neon-blue hover:text-neon-blue/80 transition-colors">Today</button>
                            </div>
                            <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-neon-blue/30 transition-all">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-wider py-2">{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                if (day === null) return <div key={`empty-${idx}`} />;

                                const dateObj = new Date(year, month, day);
                                const dateKey = dateObj.toDateString();
                                const isToday = dateKey === today.toDateString();
                                const isSelected = dateKey === selectedDate;
                                const dayAssignments = assignmentsByDate[dateKey] || [];
                                const hasAssignments = dayAssignments.length > 0;
                                const isPast = dateObj < today;

                                // Check submission status for each assignment
                                const hasOverdue = dayAssignments.some(a => {
                                    const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === uid);
                                    return !sub && isPast;
                                });

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(dateKey)}
                                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm
                                            ${isSelected ? 'bg-neon-blue/15 border-2 border-neon-blue shadow-[0_0_20px_rgba(0,209,255,0.15)]' :
                                                isToday ? 'bg-neon-blue/5 border border-neon-blue/30' :
                                                    hasAssignments ? 'bg-white/[0.02] border border-white/[0.06] hover:border-neon-blue/20' :
                                                        'border border-transparent hover:bg-white/[0.02]'}
                                            ${isPast && !isToday ? 'opacity-50' : ''}`}
                                    >
                                        <span className={`font-semibold text-xs sm:text-sm ${isToday ? 'text-neon-blue' : isSelected ? 'text-white' : 'text-white/60'}`}>{day}</span>
                                        {hasAssignments && (
                                            <div className="flex gap-0.5 mt-1">
                                                {dayAssignments.slice(0, 3).map((a, i) => {
                                                    const tc = TYPE_COLORS[a.type] || TYPE_COLORS.assignment;
                                                    return <div key={i} className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />;
                                                })}
                                            </div>
                                        )}
                                        {hasOverdue && (
                                            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                            {Object.entries(TYPE_COLORS).map(([type, c]) => (
                                <div key={type} className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                    <span className="text-[10px] text-white/30 capitalize">{type}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right panel: Selected day + this week */}
                    <div className="space-y-4">
                        {/* Selected day */}
                        <motion.div variants={item} className="glass-card p-4 sm:p-5">
                            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <CalendarDays size={14} className="text-neon-blue" />
                                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a day'}
                            </h3>
                            {selectedDate ? (
                                selectedAssignments.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedAssignments.map(a => {
                                            const cls = myClasses.find(c => c.id === a.classId);
                                            const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === uid);
                                            const tc = TYPE_COLORS[a.type] || TYPE_COLORS.assignment;
                                            return (
                                                <button
                                                    key={a.id}
                                                    onClick={() => navigate(`/assignments/${a.id}`)}
                                                    className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-neon-blue/20 transition-all group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                                                            <div className={`w-2 h-2 rounded-full ${tc.dot}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{a.title}</p>
                                                            <p className="text-[10px] text-white/30">{cls?.name} • {a.totalPoints || 0} pts</p>
                                                        </div>
                                                        {sub ? (
                                                            <CheckCircle2 size={14} className="text-neon-green shrink-0 mt-1" />
                                                        ) : (
                                                            <Clock size={14} className="text-white/20 shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/20 text-center py-4">No assignments due</p>
                                )
                            ) : (
                                <p className="text-sm text-white/20 text-center py-4">Click a date to see details</p>
                            )}
                        </motion.div>

                        {/* This Week */}
                        <motion.div variants={item} className="glass-card p-4 sm:p-5">
                            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock size={14} className="text-neon-orange" /> This Week ({thisWeek.length})
                            </h3>
                            {thisWeek.length === 0 ? (
                                <p className="text-sm text-white/20 text-center py-4">Nothing due this week! 🎉</p>
                            ) : (
                                <div className="space-y-2">
                                    {thisWeek.map(a => {
                                        const cls = myClasses.find(c => c.id === a.classId);
                                        const due = new Date(a.dueDate);
                                        const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                                        const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === uid);
                                        const tc = TYPE_COLORS[a.type] || TYPE_COLORS.assignment;

                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => navigate(`/assignments/${a.id}`)}
                                                className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-neon-blue/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-full min-h-[32px] rounded-full ${tc.dot}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white/80 font-medium truncate">{a.title}</p>
                                                        <p className="text-[10px] text-white/30">{cls?.name}</p>
                                                    </div>
                                                    {sub ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20 font-bold">Done</span>
                                                    ) : (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${daysLeft <= 1 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                daysLeft <= 3 ? 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20' :
                                                                    'bg-white/[0.03] text-white/30 border border-white/5'
                                                            }`}>{daysLeft}d</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
