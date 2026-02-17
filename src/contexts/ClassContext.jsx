import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    setDoc,
    getDocs,
    getDoc,
    arrayRemove,
    arrayUnion,
    writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ClassContext = createContext(null);

export function useClasses() {
    const ctx = useContext(ClassContext);
    if (!ctx) throw new Error('useClasses must be inside ClassProvider');
    return ctx;
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export function ClassProvider({ children }) {
    const { user, userProfile, isTeacher, isStudent } = useAuth();
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setClasses([]);
            setAssignments([]);
            setSubmissions([]);
            setAnnouncements([]);
            setLoading(false);
            return;
        }

        let classQuery;
        if (isTeacher) {
            classQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        } else {
            classQuery = query(collection(db, 'classes'), where('students', 'array-contains', user.uid));
        }

        const unsubClasses = onSnapshot(classQuery, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(list);
            setLoading(false);
        });

        const unsubStudents = onSnapshot(query(collection(db, 'users'), where('role', '==', 'student')), (snapshot) => {
            const registered = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'active' }));
            onSnapshot(collection(db, 'pre_registered'), (preSnap) => {
                const pending = preSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    displayName: doc.data().name,
                    status: 'pending',
                    joinedAt: doc.data().createdAt
                }));
                setAllStudents([...registered, ...pending]);
            });
        });

        return () => {
            unsubClasses();
            unsubStudents();
        };
    }, [user, isTeacher]);

    useEffect(() => {
        if (classes.length === 0) {
            setAssignments([]);
            setAnnouncements([]);
            return;
        }

        const classIds = classes.map(c => c.id);
        const chunkedIds = [];
        for (let i = 0; i < classIds.length; i += 10) {
            chunkedIds.push(classIds.slice(i, i + 10));
        }

        const unsubs = [];

        chunkedIds.forEach(ids => {
            const aq = query(collection(db, 'assignments'), where('classId', 'in', ids));
            unsubs.push(onSnapshot(aq, (s) => {
                setAssignments(prev => {
                    const others = prev.filter(a => !ids.includes(a.classId));
                    return [...others, ...s.docs.map(d => ({ id: d.id, ...d.data() }))];
                });
            }));

            const annQ = query(collection(db, 'announcements'), where('classId', 'in', ids));
            unsubs.push(onSnapshot(annQ, (s) => {
                setAnnouncements(prev => {
                    const others = prev.filter(a => !ids.includes(a.classId));
                    return [...others, ...s.docs.map(d => ({ id: d.id, ...d.data() }))];
                });
            }));
        });

        return () => unsubs.forEach(u => u());
    }, [classes]);

    useEffect(() => {
        if (!user) return;

        let sq;
        if (isTeacher) {
            sq = collection(db, 'submissions');
        } else {
            sq = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
        }

        const unsub = onSnapshot(sq, (snapshot) => {
            setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return unsub;
    }, [user, isTeacher]);

    // ──────────────────────────────────────────
    // CLASS CRUD
    // ──────────────────────────────────────────
    const addClass = async (cls) => {
        const newClass = {
            ...cls,
            teacherId: user.uid,
            teacherName: userProfile?.displayName || 'Teacher',
            code: generateCode(),
            createdAt: new Date().toISOString(),
            students: [],
            archived: false
        };
        const docRef = await addDoc(collection(db, 'classes'), newClass);
        return { id: docRef.id, ...newClass };
    };

    const updateClass = async (id, updates) => {
        await updateDoc(doc(db, 'classes', id), updates);
    };

    const deleteClass = async (id) => {
        await deleteDoc(doc(db, 'classes', id));
        // Clean up assignments and submissions for this class
        const aq = query(collection(db, 'assignments'), where('classId', '==', id));
        const aSnap = await getDocs(aq);
        for (const aDoc of aSnap.docs) {
            await deleteAssignment(aDoc.id);
        }
        // Clean up announcements
        const annQ = query(collection(db, 'announcements'), where('classId', '==', id));
        const annSnap = await getDocs(annQ);
        for (const annDoc of annSnap.docs) {
            await deleteDoc(doc(db, 'announcements', annDoc.id));
        }
    };

    // 1. Archive class (soft delete)
    const archiveClass = async (id) => {
        await updateDoc(doc(db, 'classes', id), { archived: true, archivedAt: new Date().toISOString() });
    };

    const unarchiveClass = async (id) => {
        await updateDoc(doc(db, 'classes', id), { archived: false, archivedAt: null });
    };

    // ──────────────────────────────────────────
    // STUDENT MANAGEMENT
    // ──────────────────────────────────────────
    const joinClass = async (code, studentId) => {
        if (!studentId) throw new Error('You must be logged in to join a class');
        if (!code) throw new Error('Please enter a class code');

        const q = query(collection(db, 'classes'), where('code', '==', code.trim().toUpperCase()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error('Class not found. Please check the code.');

        const clsDoc = snapshot.docs[0];
        const cls = { id: clsDoc.id, ...clsDoc.data() };
        const students = Array.isArray(cls.students) ? cls.students : [];

        if (students.includes(studentId)) return cls;

        await updateDoc(doc(db, 'classes', clsDoc.id), {
            students: [...students, studentId]
        });

        return { ...cls, students: [...students, studentId] };
    };

    // 2. Remove student from a specific class
    const removeStudentFromClass = async (classId, studentId) => {
        await updateDoc(doc(db, 'classes', classId), {
            students: arrayRemove(studentId)
        });
    };

    // 3. Remove student from ALL classes
    const removeStudentFromAllClasses = async (studentId) => {
        const q = query(collection(db, 'classes'), where('students', 'array-contains', studentId));
        const snap = await getDocs(q);
        const updates = snap.docs.map(d => updateDoc(doc(db, 'classes', d.id), {
            students: arrayRemove(studentId)
        }));
        await Promise.all(updates);
    };

    // 4. Bulk add students to class
    const bulkAddStudentsToClass = async (classId, studentIds) => {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        if (!classDoc.exists()) throw new Error('Class not found');
        const existing = classDoc.data().students || [];
        const merged = [...new Set([...existing, ...studentIds])];
        await updateDoc(classRef, { students: merged });
    };

    // 5. Student leaves a class
    const leaveClass = async (classId, studentId) => {
        await updateDoc(doc(db, 'classes', classId), {
            students: arrayRemove(studentId)
        });
    };

    const deleteStudent = async (student) => {
        if (!student) return;
        try {
            if (student.status === 'pending') {
                await deleteDoc(doc(db, 'pre_registered', student.email.toLowerCase()));
            } else {
                await deleteDoc(doc(db, 'users', student.id));
                await removeStudentFromAllClasses(student.id);
            }
        } catch (e) {
            console.error("Error deleting student:", e);
            throw e;
        }
    };

    const updateStudent = async (id, data, isPending) => {
        try {
            if (isPending) {
                await updateDoc(doc(db, 'pre_registered', id), data);
            } else {
                await updateDoc(doc(db, 'users', id), data);
            }
        } catch (e) {
            console.error("Error updating student:", e);
            throw e;
        }
    };

    // ──────────────────────────────────────────
    // ASSIGNMENT CRUD
    // ──────────────────────────────────────────
    const addAssignment = async (assignment) => {
        const newA = { ...assignment, createdAt: new Date().toISOString(), status: 'active' };
        const docRef = await addDoc(collection(db, 'assignments'), newA);
        return { id: docRef.id, ...newA };
    };

    const updateAssignment = async (id, updates) => {
        await updateDoc(doc(db, 'assignments', id), {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    };

    const deleteAssignment = async (id) => {
        await deleteDoc(doc(db, 'assignments', id));
        const q = query(collection(db, 'submissions'), where('assignmentId', '==', id));
        const snap = await getDocs(q);
        const deletes = snap.docs.map(d => deleteDoc(doc(db, 'submissions', d.id)));
        await Promise.all(deletes);
    };

    // 6. Duplicate assignment
    const duplicateAssignment = async (assignmentId) => {
        const original = assignments.find(a => a.id === assignmentId);
        if (!original) throw new Error('Assignment not found');
        const { id, createdAt, updatedAt, ...rest } = original;
        const newA = {
            ...rest,
            title: `${rest.title} (Copy)`,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        const docRef = await addDoc(collection(db, 'assignments'), newA);
        return { id: docRef.id, ...newA };
    };

    // 7. Reassign due date
    const reassignDueDate = async (assignmentId, newDate) => {
        await updateDoc(doc(db, 'assignments', assignmentId), {
            dueDate: new Date(newDate).toISOString(),
            updatedAt: new Date().toISOString()
        });
    };

    // 8. Get assignment completion rate
    const getAssignmentCompletionRate = (assignmentId) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return { total: 0, submitted: 0, rate: 0 };
        const cls = classes.find(c => c.id === assignment.classId);
        const total = cls?.students?.length || 0;
        const submitted = submissions.filter(s => s.assignmentId === assignmentId).length;
        return { total, submitted, rate: total > 0 ? Math.round((submitted / total) * 100) : 0 };
    };

    // ──────────────────────────────────────────
    // SUBMISSION / GRADING
    // ──────────────────────────────────────────
    const submitAssignment = async (submission) => {
        const newS = { ...submission, submittedAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'submissions'), newS);
        return { id: docRef.id, ...newS };
    };

    const updateSubmission = async (id, updates) => {
        await updateDoc(doc(db, 'submissions', id), {
            ...updates,
            gradedAt: updates.grade !== undefined ? new Date().toISOString() : null
        });
    };

    // 9. Bulk grade submissions
    const bulkGradeSubmissions = async (submissionUpdates) => {
        // submissionUpdates = [{ id, grade, feedback }, ...]
        const promises = submissionUpdates.map(({ id, grade, feedback }) =>
            updateDoc(doc(db, 'submissions', id), {
                grade,
                feedback: feedback || '',
                status: 'graded',
                gradedAt: new Date().toISOString()
            })
        );
        await Promise.all(promises);
    };

    // ──────────────────────────────────────────
    // ANNOUNCEMENTS
    // ──────────────────────────────────────────
    const addAnnouncement = async (ann) => {
        const newAnn = { ...ann, createdAt: new Date().toISOString(), pinned: false, readBy: [] };
        const docRef = await addDoc(collection(db, 'announcements'), newAnn);
        return { id: docRef.id, ...newAnn };
    };

    // 10. Delete announcement
    const deleteAnnouncement = async (id) => {
        await deleteDoc(doc(db, 'announcements', id));
    };

    // 11. Pin/unpin announcement
    const pinAnnouncement = async (id, pinned) => {
        await updateDoc(doc(db, 'announcements', id), { pinned });
    };

    // 12. Mark announcement as read
    const markAnnouncementRead = async (announcementId, studentId) => {
        await updateDoc(doc(db, 'announcements', announcementId), {
            readBy: arrayUnion(studentId)
        });
    };

    // ──────────────────────────────────────────
    // CLASS MATERIALS
    // ──────────────────────────────────────────

    // 13. Add class material
    const addClassMaterial = async (classId, material) => {
        const newMat = {
            ...material,
            classId,
            createdAt: new Date().toISOString(),
            uploadedBy: user.uid
        };
        const docRef = await addDoc(collection(db, 'materials'), newMat);
        return { id: docRef.id, ...newMat };
    };

    // 14. Delete class material
    const deleteClassMaterial = async (materialId) => {
        await deleteDoc(doc(db, 'materials', materialId));
    };

    // ──────────────────────────────────────────
    // ANALYTICS & HELPERS
    // ──────────────────────────────────────────
    const getClassStudents = (classId) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return [];
        return allStudents.filter(s => cls.students?.includes(s.id));
    };

    const getClassAssignments = (classId) => assignments.filter(a => a.classId === classId);
    const getClassAnnouncements = (classId) => announcements.filter(a => a.classId === classId);
    const getStudentSubmissions = (studentId) => submissions.filter(s => s.studentId === studentId);
    const getAssignmentSubmissions = (assignmentId) => submissions.filter(s => s.assignmentId === assignmentId);
    const getStudentClasses = (studentId) => classes.filter(c => c.students?.includes(studentId));

    // 15. Get class submission stats
    const getClassSubmissionStats = (classId) => {
        const classAssignments = assignments.filter(a => a.classId === classId);
        const cls = classes.find(c => c.id === classId);
        const studentCount = cls?.students?.length || 0;
        const totalExpected = classAssignments.length * studentCount;
        const totalSubmitted = submissions.filter(s =>
            classAssignments.some(a => a.id === s.assignmentId)
        ).length;
        const totalGraded = submissions.filter(s =>
            classAssignments.some(a => a.id === s.assignmentId) && s.grade != null
        ).length;
        return { totalExpected, totalSubmitted, totalGraded, studentCount, assignmentCount: classAssignments.length };
    };

    // 16. Get student progress
    const getStudentProgress = (studentId) => {
        const studentSubs = submissions.filter(s => s.studentId === studentId);
        const studentClasses = classes.filter(c => c.students?.includes(studentId));
        const classIds = studentClasses.map(c => c.id);
        const relevantAssignments = assignments.filter(a => classIds.includes(a.classId));
        const completed = studentSubs.length;
        const total = relevantAssignments.length;
        const graded = studentSubs.filter(s => s.grade != null);
        const avgGrade = graded.length > 0
            ? Math.round(graded.reduce((acc, s) => {
                const a = assignments.find(a => a.id === s.assignmentId);
                const max = a?.totalPoints || 100;
                return acc + ((s.grade / max) * 100);
            }, 0) / graded.length)
            : 0;
        return { completed, total, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, avgGrade };
    };

    // 17. Get overdue assignments for student
    const getOverdueAssignments = (studentId) => {
        const now = new Date();
        const studentClasses = classes.filter(c => c.students?.includes(studentId));
        const classIds = studentClasses.map(c => c.id);
        const studentSubs = submissions.filter(s => s.studentId === studentId);
        const submittedIds = studentSubs.map(s => s.assignmentId);

        return assignments.filter(a =>
            classIds.includes(a.classId) &&
            !submittedIds.includes(a.id) &&
            new Date(a.dueDate) < now
        );
    };

    // 18. Get pending (upcoming) assignments for student
    const getPendingAssignments = (studentId) => {
        const now = new Date();
        const studentClasses = classes.filter(c => c.students?.includes(studentId));
        const classIds = studentClasses.map(c => c.id);
        const studentSubs = submissions.filter(s => s.studentId === studentId);
        const submittedIds = studentSubs.map(s => s.assignmentId);

        return assignments.filter(a =>
            classIds.includes(a.classId) &&
            !submittedIds.includes(a.id) &&
            new Date(a.dueDate) >= now
        );
    };

    // 19. Export class grades as CSV data
    const exportClassGrades = (classId) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return '';
        const classAssignments = assignments.filter(a => a.classId === classId);
        const students = allStudents.filter(s => cls.students?.includes(s.id));

        let csv = 'Student,' + classAssignments.map(a => a.title).join(',') + ',Average\n';

        students.forEach(student => {
            const grades = classAssignments.map(a => {
                const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === student.id);
                return sub?.grade != null ? sub.grade : 'N/A';
            });
            const numericGrades = grades.filter(g => g !== 'N/A');
            const avg = numericGrades.length > 0
                ? Math.round(numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length)
                : 'N/A';
            csv += `${student.displayName},${grades.join(',')},${avg}\n`;
        });

        return csv;
    };

    // 20. Get leaderboard for a class
    const getLeaderboard = (classId) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return [];
        const classAssignments = assignments.filter(a => a.classId === classId);
        const students = allStudents.filter(s => cls.students?.includes(s.id));

        return students.map(student => {
            const studentSubs = submissions.filter(s =>
                classAssignments.some(a => a.id === s.assignmentId) && s.studentId === student.id
            );
            const graded = studentSubs.filter(s => s.grade != null);
            const totalPoints = graded.reduce((acc, s) => acc + (s.grade || 0), 0);
            const maxPoints = graded.reduce((acc, s) => {
                const a = classAssignments.find(a => a.id === s.assignmentId);
                return acc + (a?.totalPoints || 100);
            }, 0);
            const avg = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
            return {
                id: student.id,
                name: student.displayName,
                avg,
                totalPoints,
                submitted: studentSubs.length,
                total: classAssignments.length
            };
        }).sort((a, b) => b.avg - a.avg);
    };

    // 21. Get class analytics
    const getClassAnalytics = (classId) => {
        const stats = getClassSubmissionStats(classId);
        const classAssignments = assignments.filter(a => a.classId === classId);
        const classSubs = submissions.filter(s =>
            classAssignments.some(a => a.id === s.assignmentId)
        );
        const gradedSubs = classSubs.filter(s => s.grade != null);

        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        gradedSubs.forEach(s => {
            const a = classAssignments.find(a => a.id === s.assignmentId);
            const max = a?.totalPoints || 100;
            const pct = (s.grade / max) * 100;
            if (pct >= 90) gradeDistribution.A++;
            else if (pct >= 80) gradeDistribution.B++;
            else if (pct >= 70) gradeDistribution.C++;
            else if (pct >= 60) gradeDistribution.D++;
            else gradeDistribution.F++;
        });

        const avgGrade = gradedSubs.length > 0
            ? Math.round(gradedSubs.reduce((acc, s) => {
                const a = classAssignments.find(a => a.id === s.assignmentId);
                const max = a?.totalPoints || 100;
                return acc + ((s.grade / max) * 100);
            }, 0) / gradedSubs.length)
            : 0;

        return { ...stats, gradeDistribution, avgGrade, totalGradedSubmissions: gradedSubs.length };
    };

    // 22. Get student streak (consecutive days with submissions)
    const getStudentStreak = (studentId) => {
        const studentSubs = submissions
            .filter(s => s.studentId === studentId && s.submittedAt)
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        if (studentSubs.length === 0) return 0;

        let streak = 1;
        let lastDate = new Date(studentSubs[0].submittedAt);
        lastDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If the last submission wasn't today or yesterday, streak is 0
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) return 0;

        for (let i = 1; i < studentSubs.length; i++) {
            const currentDate = new Date(studentSubs[i].submittedAt);
            currentDate.setHours(0, 0, 0, 0);
            const diff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                streak++;
                lastDate = currentDate;
            } else if (diff > 1) {
                break;
            }
        }
        return streak;
    };

    const value = {
        classes,
        assignments,
        submissions,
        announcements,
        allStudents,
        loading,
        // Class
        addClass,
        updateClass,
        deleteClass,
        archiveClass,
        unarchiveClass,
        // Students
        joinClass,
        leaveClass,
        removeStudentFromClass,
        removeStudentFromAllClasses,
        bulkAddStudentsToClass,
        deleteStudent,
        updateStudent,
        // Assignments
        addAssignment,
        updateAssignment,
        deleteAssignment,
        duplicateAssignment,
        reassignDueDate,
        getAssignmentCompletionRate,
        // Submissions
        submitAssignment,
        updateSubmission,
        bulkGradeSubmissions,
        // Announcements
        addAnnouncement,
        deleteAnnouncement,
        pinAnnouncement,
        markAnnouncementRead,
        // Materials
        addClassMaterial,
        deleteClassMaterial,
        // Helpers
        getClassStudents,
        getClassAssignments,
        getClassAnnouncements,
        getStudentSubmissions,
        getAssignmentSubmissions,
        getStudentClasses,
        // Analytics
        getClassSubmissionStats,
        getStudentProgress,
        getOverdueAssignments,
        getPendingAssignments,
        exportClassGrades,
        getLeaderboard,
        getClassAnalytics,
        getStudentStreak,
    };

    return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}
