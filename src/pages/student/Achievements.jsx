import { useAuth } from '../../contexts/AuthContext';
import { useClasses } from '../../contexts/ClassContext';
import TopBar from '../../components/layout/TopBar';
import { motion } from 'framer-motion';
import {
    Trophy, Medal, Star, Flame, Target, Zap, BookOpen, Award,
    Crown, Shield, CheckCircle2, TrendingUp, ChevronRight, Sparkles
} from 'lucide-react';
import { useState, useMemo } from 'react';

// ─── Badge definitions ──────────────────────────────────────────
const BADGES = [
    { id: 'first-sub', icon: Star, label: 'First Steps', desc: 'Submit your first assignment', color: 'neon-blue', gradient: 'from-neon-blue to-cyan-400', check: (stats) => stats.totalSubs >= 1 },
    { id: 'five-subs', icon: Target, label: 'Getting Started', desc: 'Submit 5 assignments', color: 'neon-green', gradient: 'from-neon-green to-emerald-400', check: (stats) => stats.totalSubs >= 5 },
    { id: 'ten-subs', icon: Zap, label: 'On Fire', desc: 'Submit 10 assignments', color: 'neon-orange', gradient: 'from-neon-orange to-amber-400', check: (stats) => stats.totalSubs >= 10 },
    { id: 'twenty-subs', icon: Shield, label: 'Unstoppable', desc: 'Submit 20 assignments', color: 'neon-purple', gradient: 'from-neon-purple to-fuchsia-400', check: (stats) => stats.totalSubs >= 20 },
    { id: 'perfect-score', icon: Crown, label: 'Perfectionist', desc: 'Get a perfect score', color: 'amber-400', gradient: 'from-amber-400 to-yellow-300', check: (stats) => stats.perfectScores >= 1 },
    { id: 'five-perfect', icon: Trophy, label: 'Gold Standard', desc: 'Get 5 perfect scores', color: 'amber-400', gradient: 'from-amber-500 to-orange-400', check: (stats) => stats.perfectScores >= 5 },
    { id: 'avg-90', icon: TrendingUp, label: 'Honor Roll', desc: 'Maintain 90%+ average', color: 'neon-green', gradient: 'from-neon-green to-teal-400', check: (stats) => stats.avgGrade >= 90 },
    { id: 'streak-3', icon: Flame, label: 'Streak 3', desc: '3-day activity streak', color: 'neon-orange', gradient: 'from-orange-500 to-red-400', check: (stats) => stats.streak >= 3 },
    { id: 'streak-7', icon: Flame, label: 'Weekly Warrior', desc: '7-day activity streak', color: 'red-400', gradient: 'from-red-500 to-pink-500', check: (stats) => stats.streak >= 7 },
    { id: 'streak-14', icon: Flame, label: 'Legendary', desc: '14-day activity streak', color: 'neon-purple', gradient: 'from-purple-500 to-pink-500', check: (stats) => stats.streak >= 14 },
    { id: 'multi-class', icon: BookOpen, label: 'Scholar', desc: 'Join 3+ classes', color: 'neon-blue', gradient: 'from-blue-500 to-indigo-400', check: (stats) => stats.classCount >= 3 },
    { id: 'early-bird', icon: CheckCircle2, label: 'Early Bird', desc: 'Submit 5 before deadline', color: 'neon-green', gradient: 'from-green-400 to-lime-400', check: (stats) => stats.earlySubmissions >= 5 },
];

// XP & Level calculation
const getXPInfo = (totalXP) => {
    const level = Math.floor(totalXP / 200) + 1;
    const xpInLevel = totalXP % 200;
    const xpForNext = 200;
    return { level, xpInLevel, xpForNext, totalXP };
};

const LEVEL_TITLES = ['Beginner', 'Apprentice', 'Student', 'Scholar', 'Expert', 'Master', 'Grand Master', 'Legend', 'Champion', 'Mythic'];

export default function Achievements() {
    const { userProfile } = useAuth();
    const { classes, assignments, submissions, getStudentStreak, getLeaderboard, allStudents } = useClasses();
    const [activeTab, setActiveTab] = useState('badges');
    const [selectedClass, setSelectedClass] = useState('all');

    const uid = userProfile?.uid;
    const myClasses = classes.filter(c => c.students?.includes(uid));
    const mySubs = submissions.filter(s => s.studentId === uid);
    const streak = getStudentStreak(uid);

    // Compute stats for badge checking
    const stats = useMemo(() => {
        const gradedSubs = mySubs.filter(s => s.grade != null);
        const avgGrade = gradedSubs.length > 0
            ? Math.round(gradedSubs.reduce((sum, s) => {
                const a = assignments.find(a => a.id === s.assignmentId);
                const max = a?.totalPoints || 100;
                return sum + (s.grade / max) * 100;
            }, 0) / gradedSubs.length)
            : 0;

        const perfectScores = gradedSubs.filter(s => {
            const a = assignments.find(a => a.id === s.assignmentId);
            return a && s.grade >= (a.totalPoints || 100);
        }).length;

        const earlySubmissions = mySubs.filter(s => {
            const a = assignments.find(a => a.id === s.assignmentId);
            if (!a || !a.dueDate || !s.submittedAt) return false;
            return new Date(s.submittedAt) < new Date(a.dueDate);
        }).length;

        return {
            totalSubs: mySubs.length,
            gradedCount: gradedSubs.length,
            avgGrade,
            perfectScores,
            earlySubmissions,
            streak,
            classCount: myClasses.length,
        };
    }, [mySubs, assignments, streak, myClasses.length]);

    const earnedBadges = BADGES.filter(b => b.check(stats));
    const lockedBadges = BADGES.filter(b => !b.check(stats));

    // XP calculation: 50 per sub, 100 for perfect, 20 per streak day, 30 per badge
    const totalXP = useMemo(() => {
        let xp = 0;
        xp += mySubs.length * 50;
        const perfects = mySubs.filter(s => {
            const a = assignments.find(a => a.id === s.assignmentId);
            return a && s.grade != null && s.grade >= (a.totalPoints || 100);
        }).length;
        xp += perfects * 100;
        xp += streak * 20;
        xp += earnedBadges.length * 30;
        return xp;
    }, [mySubs, assignments, streak, earnedBadges.length]);

    const xpInfo = getXPInfo(totalXP);
    const levelTitle = LEVEL_TITLES[Math.min(xpInfo.level - 1, LEVEL_TITLES.length - 1)];

    // Leaderboard across all classes or selected
    const leaderboard = useMemo(() => {
        const targetClasses = selectedClass === 'all' ? myClasses : myClasses.filter(c => c.id === selectedClass);
        const studentMap = {};

        targetClasses.forEach(cls => {
            (cls.students || []).forEach(sid => {
                if (!studentMap[sid]) {
                    const st = allStudents.find(s => s.id === sid);
                    studentMap[sid] = {
                        id: sid,
                        name: st?.displayName || 'Student',
                        subs: 0,
                        totalGrade: 0,
                        gradedCount: 0,
                        xp: 0
                    };
                }
            });
        });

        submissions.forEach(sub => {
            if (!studentMap[sub.studentId]) return;
            const a = assignments.find(a => a.id === sub.assignmentId);
            if (!a) return;
            const isInTarget = targetClasses.some(c => c.id === a.classId);
            if (!isInTarget) return;

            studentMap[sub.studentId].subs += 1;
            studentMap[sub.studentId].xp += 50;
            if (sub.grade != null) {
                studentMap[sub.studentId].totalGrade += sub.grade;
                studentMap[sub.studentId].gradedCount += 1;
                if (sub.grade >= (a.totalPoints || 100)) {
                    studentMap[sub.studentId].xp += 100;
                }
            }
        });

        return Object.values(studentMap)
            .map(s => ({
                ...s,
                avgGrade: s.gradedCount > 0 ? Math.round(s.totalGrade / s.gradedCount) : 0,
            }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 20);
    }, [selectedClass, myClasses, submissions, assignments, allStudents]);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen pb-20">
            <TopBar
                title="Achievements"
                subtitle={`Level ${xpInfo.level} • ${levelTitle}`}
            />

            <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

                {/* XP / Level Card */}
                <motion.div variants={item} className="glass-card p-5 sm:p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 via-neon-blue/5 to-neon-green/5" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                        {/* Level Circle */}
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-neon-blue via-neon-purple to-neon-green p-[3px]">
                                <div className="w-full h-full rounded-full bg-surface-950 flex flex-col items-center justify-center">
                                    <span className="text-3xl sm:text-4xl font-display font-black bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                                        {xpInfo.level}
                                    </span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Level</span>
                                </div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/30">
                                <Sparkles size={14} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-1">{levelTitle}</h2>
                            <p className="text-sm text-white/40 mb-4">{totalXP} XP total • {earnedBadges.length}/{BADGES.length} badges earned</p>

                            {/* XP Bar */}
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                                    <span>Level {xpInfo.level}</span>
                                    <span>{xpInfo.xpInLevel}/{xpInfo.xpForNext} XP</span>
                                    <span>Level {xpInfo.level + 1}</span>
                                </div>
                                <div className="h-3 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(xpInfo.xpInLevel / xpInfo.xpForNext) * 100}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { icon: Flame, label: 'Streak', value: `${streak}d`, color: 'neon-orange' },
                                { icon: Trophy, label: 'Badges', value: earnedBadges.length, color: 'amber-400' },
                                { icon: TrendingUp, label: 'Avg', value: `${stats.avgGrade}%`, color: 'neon-green' },
                            ].map((s, i) => (
                                <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <s.icon size={18} className={`text-${s.color} mx-auto mb-1`} />
                                    <p className={`text-lg font-bold text-${s.color}`}>{s.value}</p>
                                    <p className="text-[10px] text-white/30">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div variants={item} className="flex gap-2">
                    {[
                        { id: 'badges', label: 'Badges', icon: Medal },
                        { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_20px_rgba(0,209,255,0.1)]'
                                    : 'bg-white/[0.02] text-white/40 border border-white/[0.06] hover:text-white/60'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* ─── BADGES TAB ─── */}
                {activeTab === 'badges' && (
                    <div className="space-y-6">
                        {/* Earned */}
                        {earnedBadges.length > 0 && (
                            <motion.div variants={item}>
                                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Sparkles size={14} className="text-neon-green" /> Earned ({earnedBadges.length})
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {earnedBadges.map(badge => (
                                        <motion.div
                                            key={badge.id}
                                            variants={item}
                                            className="glass-card p-4 sm:p-5 text-center group hover:scale-[1.03] transition-transform relative overflow-hidden"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                            <div className="relative">
                                                <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center mb-3 shadow-lg`}
                                                    style={{ boxShadow: `0 8px 30px rgba(0,0,0,0.3)` }}>
                                                    <badge.icon size={24} className="text-white" />
                                                </div>
                                                <h4 className="text-sm font-bold text-white mb-1">{badge.label}</h4>
                                                <p className="text-[10px] text-white/40 leading-tight">{badge.desc}</p>
                                                <div className="mt-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20 font-bold">
                                                        ✓ Earned
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Locked */}
                        {lockedBadges.length > 0 && (
                            <motion.div variants={item}>
                                <h3 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-3">Locked ({lockedBadges.length})</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {lockedBadges.map(badge => (
                                        <div key={badge.id} className="glass-card p-4 sm:p-5 text-center opacity-50 grayscale">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3">
                                                <badge.icon size={24} className="text-white/20" />
                                            </div>
                                            <h4 className="text-sm font-bold text-white/40 mb-1">{badge.label}</h4>
                                            <p className="text-[10px] text-white/20 leading-tight">{badge.desc}</p>
                                            <div className="mt-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-white/20 border border-white/5 font-bold">
                                                    🔒 Locked
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* ─── LEADERBOARD TAB ─── */}
                {activeTab === 'leaderboard' && (
                    <motion.div variants={item} className="space-y-4">
                        {/* Class filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedClass('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedClass === 'all'
                                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                                        : 'bg-white/[0.02] text-white/40 border border-white/[0.06] hover:text-white/60'
                                    }`}
                            >All Classes</button>
                            {myClasses.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClass(cls.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedClass === cls.id
                                            ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                                            : 'bg-white/[0.02] text-white/40 border border-white/[0.06] hover:text-white/60'
                                        }`}
                                >{cls.name}</button>
                            ))}
                        </div>

                        {/* Top 3 podium */}
                        {leaderboard.length >= 3 && (
                            <div className="flex items-end justify-center gap-3 py-4">
                                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumIdx) => {
                                    const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                                    const height = rank === 1 ? 'h-32' : rank === 2 ? 'h-24' : 'h-20';
                                    const colors = rank === 1
                                        ? 'from-amber-400 to-yellow-500 border-amber-400/30'
                                        : rank === 2
                                            ? 'from-slate-300 to-slate-400 border-slate-300/30'
                                            : 'from-amber-700 to-orange-800 border-amber-700/30';
                                    const isMe = entry.id === uid;
                                    return (
                                        <div key={entry.id} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center text-white font-bold text-sm mb-2 ${isMe ? 'ring-2 ring-neon-blue ring-offset-2 ring-offset-surface-950' : ''}`}>
                                                {rank === 1 ? <Crown size={20} /> : rank}
                                            </div>
                                            <p className={`text-xs font-bold mb-1 ${isMe ? 'text-neon-blue' : 'text-white'} text-center truncate max-w-[80px]`}>{entry.name}</p>
                                            <p className="text-[10px] text-white/40 mb-2">{entry.xp} XP</p>
                                            <div className={`w-20 sm:w-24 ${height} rounded-t-xl bg-gradient-to-b ${colors} border border-b-0 flex items-center justify-center`}>
                                                <span className="text-white font-black text-2xl">#{rank}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Full table */}
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.06]">
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-semibold w-12">#</th>
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-semibold">Student</th>
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-semibold text-center">XP</th>
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-semibold text-center">Subs</th>
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-white/30 font-semibold text-center hidden sm:table-cell">Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((entry, idx) => {
                                            const isMe = entry.id === uid;
                                            const rankColors = idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-white/30';
                                            return (
                                                <tr
                                                    key={entry.id}
                                                    className={`border-b border-white/[0.03] transition-colors ${isMe ? 'bg-neon-blue/[0.04]' : 'hover:bg-white/[0.02]'}`}
                                                >
                                                    <td className={`px-4 py-3 font-bold text-sm ${rankColors}`}>{idx + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isMe ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'bg-white/[0.04] text-white/40 border border-white/10'}`}>
                                                                {entry.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className={`text-sm font-medium ${isMe ? 'text-neon-blue' : 'text-white/70'}`}>
                                                                {entry.name} {isMe && <span className="text-[10px] text-neon-blue/60">(You)</span>}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-sm font-bold text-neon-purple">{entry.xp}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm text-white/50">{entry.subs}</td>
                                                    <td className="px-4 py-3 text-center text-sm text-white/50 hidden sm:table-cell">{entry.avgGrade}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {leaderboard.length === 0 && (
                                <p className="text-sm text-white/30 text-center py-8">No students to rank yet.</p>
                            )}
                        </div>
                    </motion.div>
                )}

            </motion.div>
        </div>
    );
}
