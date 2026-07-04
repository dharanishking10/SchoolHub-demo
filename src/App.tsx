import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Unauthorized from './pages/Unauthorized'

import HeadmasterLayout from './pages/headmaster/HeadmasterLayout'
import HMDashboard from './pages/headmaster/HMDashboard'
import TeacherManagement from './pages/headmaster/TeacherManagement'
import StudentManagement from './pages/headmaster/StudentManagement'
import ClassManagement from './pages/headmaster/ClassManagement'
import Reports from './pages/headmaster/Reports'
import SchoolProfile from './pages/headmaster/SchoolProfile'
import HMSettings from './pages/headmaster/HMSettings'

import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/dashboard/headmaster"
          element={
            <ProtectedRoute allowedRoles={['HEADMASTER']}>
              <HeadmasterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HMDashboard />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="school" element={<SchoolProfile />} />
          <Route path="settings" element={<HMSettings />} />
        </Route>

        <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
