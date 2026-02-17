import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Shell from './components/layout/Shell';
import Landing from './pages/Landing';
import TeacherDashboard from './pages/teacher/Dashboard';
import Classes from './pages/teacher/Classes';
import ClassDetail from './pages/teacher/ClassDetail';
import Students from './pages/teacher/Students';
import Assignments from './pages/teacher/Assignments';
import TeacherGrades from './pages/teacher/Grades';
import StudentDashboard from './pages/student/Dashboard';
import MyClasses from './pages/student/MyClasses';
import StudentGrades from './pages/student/Grades';
import AssignmentView from './pages/student/AssignmentView';
import StudentCalendar from './pages/student/Calendar';
import Achievements from './pages/student/Achievements';
import QuestionBank from './pages/teacher/QuestionBank';
import Reports from './pages/teacher/Reports';
import Practice from './pages/student/Practice';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple animate-pulse mb-4" />
                <p className="text-white/40 text-sm">Loading...</p>
            </div>
        </div>
    );
    if (!user) return <Navigate to="/" replace />;
    return children;
}

function DashboardRouter() {
    const { isTeacher } = useAuth();
    return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
}

function AssignmentsRouter() {
    const { isTeacher } = useAuth();
    return <Assignments />;
}

function GradesRouter() {
    const { isTeacher } = useAuth();
    return isTeacher ? <TeacherGrades /> : <StudentGrades />;
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <ClassProvider>
                        <NotificationProvider>
                            <Routes>
                                <Route path="/" element={<Landing />} />
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Shell />
                                    </ProtectedRoute>
                                }>
                                    <Route path="dashboard" element={<DashboardRouter />} />
                                    <Route path="classes" element={<Classes />} />
                                    <Route path="classes/:id" element={<ClassDetail />} />
                                    <Route path="students" element={<Students />} />
                                    <Route path="assignments" element={<AssignmentsRouter />} />
                                    <Route path="assignments/:assignmentId" element={<AssignmentView />} />
                                    <Route path="grades" element={<GradesRouter />} />
                                    <Route path="my-classes" element={<MyClasses />} />
                                    <Route path="calendar" element={<StudentCalendar />} />
                                    <Route path="achievements" element={<Achievements />} />
                                    <Route path="practice" element={<Practice />} />
                                    <Route path="question-bank" element={<QuestionBank />} />
                                    <Route path="reports" element={<Reports />} />
                                    <Route path="settings" element={<Settings />} />
                                </Route>
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </NotificationProvider>
                    </ClassProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

