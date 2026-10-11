import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentSettingsPage from './pages/StudentSettingsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentOnboardingPage from './pages/StudentOnboardingPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentLearningPage from './pages/StudentLearningPage';
import SubjectModulesPage from './pages/SubjectModulesPage';
import ModuleContentPage from './pages/ModuleContentPage';
import ModuleTestPage from './pages/ModuleTestPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentScholarshipsPage from './pages/StudentScholarshipsPage';
import StudentCareerPage from './pages/StudentCareerPage';
import StudentAccessibilityPage from './pages/StudentAccessibilityPage';
import StudentResourcesPage from './pages/StudentResourcesPage';
import StudentAcademicSummaryPage from './pages/StudentAcademicSummaryPage';
import AdminScholarshipsPage from './pages/AdminScholarshipsPage';
import MentorDashboardPage from './pages/MentorDashboardPage';
import MentorStudentDetailPage from './pages/MentorStudentDetailPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

/**
 * Dynamic Role-Based Dashboard Redirection
 */
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'mentor':
      return <Navigate to="/mentor/dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent/dashboard" replace />;
    case 'administrator':
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <VoiceProvider>
          <MainLayout>
            <Routes>
            {/* Public Home / Architecture Overview */}
            <Route path="/" element={<HomePage />} />

            {/* Common Authentication Login Page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Role-Based Generic Dashboard Redirect */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* ========================================================== */}
            {/* STUDENT PORTAL ROUTES (Protected: Student role only)       */}
            {/* ========================================================== */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/onboarding" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentOnboardingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/learning" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentLearningPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/learning/subject/:subjectId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubjectModulesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/learning/module/:moduleId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ModuleContentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/learning/module/:moduleId/test" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ModuleTestPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/attendance" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAttendancePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/scholarships" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentScholarshipsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/career" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCareerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/resources" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentResourcesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/academic-summary" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAcademicSummaryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/accessibility" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAccessibilityPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/settings" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* ========================================================== */}
            {/* MENTOR PORTAL ROUTES (Protected: Mentor role only)         */}
            {/* ========================================================== */}
            <Route 
              path="/mentor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MentorDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/students" 
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MentorDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/student/:id" 
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MentorStudentDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mentor/profile" 
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MentorDashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* ========================================================== */}
            {/* PARENT PORTAL ROUTES (Protected: Parent role only)         */}
            {/* ========================================================== */}
            <Route 
              path="/parent/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parent/child" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parent/profile" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* ========================================================== */}
            {/* ADMINISTRATOR ROUTES (Protected: Administrator role only)  */}
            {/* ========================================================== */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/scholarships" 
              element={
                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                  <AdminScholarshipsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/scholarships/new" 
              element={
                <ProtectedRoute allowedRoles={['administrator', 'admin']}>
                  <AdminScholarshipsPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </VoiceProvider>
    </BrowserRouter>
  </AuthProvider>
  );
};

export default App;
