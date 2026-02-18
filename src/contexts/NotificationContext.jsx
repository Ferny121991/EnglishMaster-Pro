import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useClasses } from './ClassContext';

const NotificationContext = createContext(null);

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
    return ctx;
}

export function NotificationProvider({ children }) {
    const { user, isTeacher, isStudent } = useAuth();
    const { classes, assignments, submissions, announcements, classMessages, classMaterials } = useClasses();
    const [readIds, setReadIds] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load read notification IDs from Firestore
    useEffect(() => {
        if (!user) {
            setReadIds(new Set());
            setNotifications([]);
            setLoading(false);
            return;
        }

        const loadReadIds = async () => {
            try {
                const docRef = doc(db, 'notification_reads', user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setReadIds(new Set(snap.data().readIds || []));
                }
            } catch (e) {
                console.error('Error loading read notifications:', e);
            } finally {
                setLoading(false);
            }
        };

        loadReadIds();
    }, [user]);

    // Generate notifications from existing data
    useEffect(() => {
        if (!user || loading) return;

        const generated = [];
        const now = new Date();

        if (isStudent) {
            // 1. Unread announcements
            announcements.forEach(ann => {
                const isRead = ann.readBy?.includes(user.uid);
                if (!isRead) {
                    const cls = classes.find(c => c.id === ann.classId);
                    generated.push({
                        id: `ann-${ann.id}`,
                        type: 'announcement',
                        title: 'New Announcement',
                        message: `${cls?.name || 'Class'}: ${ann.content?.substring(0, 80) || 'New announcement posted'}${ann.content?.length > 80 ? '...' : ''}`,
                        icon: 'megaphone',
                        color: 'blue',
                        createdAt: ann.createdAt,
                        link: `/classes/${ann.classId}`,
                        pinned: ann.pinned,
                    });
                }
            });

            // 2. Assignments due soon (within 48 hours)
            const studentClassIds = classes.map(c => c.id);
            const submittedIds = submissions.filter(s => s.studentId === user.uid).map(s => s.assignmentId);

            assignments.forEach(a => {
                if (!studentClassIds.includes(a.classId)) return;
                if (submittedIds.includes(a.id)) return;

                const dueDate = new Date(a.dueDate);
                const hoursLeft = (dueDate - now) / (1000 * 60 * 60);

                if (hoursLeft > 0 && hoursLeft <= 48) {
                    const cls = classes.find(c => c.id === a.classId);
                    const hoursRounded = Math.round(hoursLeft);
                    generated.push({
                        id: `due-${a.id}`,
                        type: 'due_soon',
                        title: 'Assignment Due Soon',
                        message: `"${a.title}" in ${cls?.name || 'class'} is due in ${hoursRounded < 24 ? `${hoursRounded}h` : `${Math.round(hoursRounded / 24)}d`}`,
                        icon: 'clock',
                        color: 'orange',
                        createdAt: new Date(dueDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
                        link: `/assignments/${a.id}`,
                    });
                }

                // 3. Overdue assignments
                if (hoursLeft < 0) {
                    const cls = classes.find(c => c.id === a.classId);
                    generated.push({
                        id: `overdue-${a.id}`,
                        type: 'overdue',
                        title: 'Assignment Overdue',
                        message: `"${a.title}" in ${cls?.name || 'class'} was due ${formatTimeAgo(dueDate)}`,
                        icon: 'alert',
                        color: 'red',
                        createdAt: a.dueDate,
                        link: `/assignments/${a.id}`,
                    });
                }
            });

            // 4. Graded submissions
            submissions.forEach(s => {
                if (s.studentId !== user.uid) return;
                if (s.grade == null) return;

                const assignment = assignments.find(a => a.id === s.assignmentId);
                if (!assignment) return;

                const cls = classes.find(c => c.id === assignment.classId);
                const maxPoints = assignment.totalPoints || 100;
                const percentage = Math.round((s.grade / maxPoints) * 100);

                generated.push({
                    id: `grade-${s.id}`,
                    type: 'graded',
                    title: 'Assignment Graded',
                    message: `"${assignment.title}" in ${cls?.name || 'class'}: ${s.grade}/${maxPoints} (${percentage}%)`,
                    icon: 'star',
                    color: percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red',
                    createdAt: s.gradedAt || s.submittedAt,
                    link: `/grades`,
                });
            });

            // 5. New assignments (created in last 7 days)
            assignments.forEach(a => {
                if (!studentClassIds.includes(a.classId)) return;
                const createdAt = new Date(a.createdAt);
                const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
                if (daysSince <= 7 && !submittedIds.includes(a.id)) {
                    const cls = classes.find(c => c.id === a.classId);
                    generated.push({
                        id: `new-${a.id}`,
                        type: 'new_assignment',
                        title: 'New Assignment',
                        message: `"${a.title}" posted in ${cls?.name || 'class'}`,
                        icon: 'book',
                        color: 'purple',
                        createdAt: a.createdAt,
                        link: `/assignments/${a.id}`,
                    });
                }
            });

            // 6. Chat messages from others (last 24h)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            (classMessages || []).forEach(m => {
                if (m.authorId === user.uid) return; // skip own messages
                if (m.createdAt < oneDayAgo) return; // only recent
                const cls = classes.find(c => c.id === m.classId);
                generated.push({
                    id: `chat-${m.id}`,
                    type: 'chat_message',
                    title: 'New Chat Message',
                    message: `${m.authorName || 'Someone'} in ${cls?.name || 'class'}: "${(m.text || '').substring(0, 60)}${(m.text || '').length > 60 ? '...' : ''}"`,
                    icon: 'megaphone',
                    color: m.authorRole === 'teacher' ? 'blue' : 'purple',
                    createdAt: m.createdAt,
                    link: `/classes/${m.classId}`,
                });
            });

            // 7. New materials (posted in last 7 days)
            const studentClassIds2 = classes.map(c => c.id);
            (classMaterials || []).forEach(mat => {
                if (!studentClassIds2.includes(mat.classId)) return;
                const createdAt = new Date(mat.createdAt);
                const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
                if (daysSince > 7) return;
                const cls = classes.find(c => c.id === mat.classId);
                generated.push({
                    id: `material-${mat.id}`,
                    type: 'new_material',
                    title: '📁 New Material Available',
                    message: `${cls?.name || 'Your class'}: "${mat.title}" was added by your teacher`,
                    icon: 'folder',
                    color: 'green',
                    createdAt: mat.createdAt,
                    link: `/classes/${mat.classId}?tab=materials`,
                });
            });

        } else if (isTeacher) {
            // Teacher notifications

            // 1. New submissions to grade
            const ungradedSubs = submissions.filter(s => s.grade == null);
            const teacherClassIds = classes.map(c => c.id);

            ungradedSubs.forEach(s => {
                const assignment = assignments.find(a => a.id === s.assignmentId);
                if (!assignment || !teacherClassIds.includes(assignment.classId)) return;

                const cls = classes.find(c => c.id === assignment.classId);
                generated.push({
                    id: `sub-${s.id}`,
                    type: 'submission',
                    title: 'New Submission',
                    message: `New submission for "${assignment.title}" in ${cls?.name || 'class'}`,
                    icon: 'inbox',
                    color: 'blue',
                    createdAt: s.submittedAt,
                    link: `/assignments`,
                });
            });

            // 2. Assignments with low completion (< 50% and past due)
            assignments.forEach(a => {
                if (!teacherClassIds.includes(a.classId)) return;
                const dueDate = new Date(a.dueDate);
                if (dueDate > now) return; // Not past due yet

                const cls = classes.find(c => c.id === a.classId);
                const totalStudents = cls?.students?.length || 0;
                if (totalStudents === 0) return;

                const subCount = submissions.filter(s => s.assignmentId === a.id).length;
                const rate = (subCount / totalStudents) * 100;

                if (rate < 50) {
                    generated.push({
                        id: `low-${a.id}`,
                        type: 'low_completion',
                        title: 'Low Completion Rate',
                        message: `"${a.title}" in ${cls?.name || 'class'}: only ${subCount}/${totalStudents} students submitted`,
                        icon: 'alert',
                        color: 'orange',
                        createdAt: a.dueDate,
                        link: `/assignments`,
                    });
                }
            });

            // 3. Chat messages from students (last 24h)
            const oneDayAgoT = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            (classMessages || []).forEach(m => {
                if (m.authorId === user.uid) return;
                if (m.createdAt < oneDayAgoT) return;
                const cls = classes.find(c => c.id === m.classId);
                if (!cls) return;
                generated.push({
                    id: `chat-${m.id}`,
                    type: 'chat_message',
                    title: 'New Chat Message',
                    message: `${m.authorName || 'Someone'} in ${cls?.name || 'class'}: "${(m.text || '').substring(0, 60)}${(m.text || '').length > 60 ? '...' : ''}"`,
                    icon: 'megaphone',
                    color: 'blue',
                    createdAt: m.createdAt,
                    link: `/classes/${m.classId}`,
                });
            });
        }

        // Sort by date (newest first) and deduplicate
        const uniqueMap = new Map();
        generated.forEach(n => {
            if (!uniqueMap.has(n.id)) {
                uniqueMap.set(n.id, n);
            }
        });

        const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(sorted);
    }, [user, isTeacher, isStudent, classes, assignments, submissions, announcements, classMessages, classMaterials, loading]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        if (!user) return;

        setReadIds(prev => {
            const next = new Set(prev);
            next.add(notificationId);
            return next;
        });

        try {
            const docRef = doc(db, 'notification_reads', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const currentIds = snap.data().readIds || [];
                if (!currentIds.includes(notificationId)) {
                    await updateDoc(docRef, { readIds: [...currentIds, notificationId] });
                }
            } else {
                await setDoc(docRef, { readIds: [notificationId], updatedAt: new Date().toISOString() });
            }
        } catch (e) {
            console.error('Error marking notification as read:', e);
        }
    }, [user]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!user) return;

        const allIds = notifications.map(n => n.id);
        setReadIds(new Set(allIds));

        try {
            const docRef = doc(db, 'notification_reads', user.uid);
            await setDoc(docRef, { readIds: allIds, updatedAt: new Date().toISOString() });
        } catch (e) {
            console.error('Error marking all notifications as read:', e);
        }
    }, [user, notifications]);

    // Check if a notification is read
    const isRead = useCallback((notificationId) => {
        return readIds.has(notificationId);
    }, [readIds]);

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isRead,
        loading,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

function formatTimeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}
