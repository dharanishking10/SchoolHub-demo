import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import Unauthorized from './pages/Unauthorized'

import HeadmasterLayout from './pages/headmaster/HeadmasterLayout'
import HMDashboard from './pages/headmaster/HMDashboard'
import TeacherManagement from './pages/headmaster/TeacherManagement'
import StudentManagement from './pages/headmaster/StudentManagement'
import ClassManagement from './pages/headmaster/ClassManagement'
import Reports from './pages/headmaster/Reports'
import SchoolProfile from './pages/headmaster/SchoolProfile'
import GovernmentSchemes from './pages/headmaster/GovernmentSchemes'
import HMSettings from './pages/headmaster/HMSettings'
import AttendanceReports from './pages/headmaster/AttendanceReports'
import HMAnnouncements from './pages/headmaster/Announcements'
import AuditLog from './pages/headmaster/AuditLog'
import ExportCenter from './pages/headmaster/ExportCenter'
import HMTimetable from './pages/headmaster/HMTimetable'
import AcademicPromotion from './pages/headmaster/AcademicPromotion'
import Examinations from './pages/headmaster/Examinations'

import TeacherLayout from './pages/teacher/TeacherLayout'
import TDashboard from './pages/teacher/TDashboard'
import TClasses from './pages/teacher/TClasses'
import TStudents from './pages/teacher/TStudents'
import TAttendance from './pages/teacher/TAttendance'
import TMarks from './pages/teacher/TMarks'
import TExamMarks from './pages/teacher/TExamMarks'
import THomework from './pages/teacher/THomework'
import TTimetable from './pages/teacher/TTimetable'
import TLeave from './pages/teacher/TLeave'
import TProfile from './pages/teacher/TProfile'
import TAnnouncements from './pages/teacher/TAnnouncements'

import StudentLayout from './pages/student/StudentLayout'
import SDashboard from './pages/student/SDashboard'
import SClass from './pages/student/SClass'
import SProfile from './pages/student/SProfile'
import SAttendance from './pages/student/SAttendance'
import SMarks from './pages/student/SMarks'
import SResults from './pages/student/SResults'
import SHomework from './pages/student/SHomework'
import STimetable from './pages/student/STimetable'
import SLeave from './pages/student/SLeave'
import SAnnouncements from './pages/student/SAnnouncements'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Headmaster */}
        <Route path="/dashboard/headmaster" element={<ProtectedRoute allowedRoles={['HEADMASTER']}><HeadmasterLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HMDashboard />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="attendance-reports" element={<AttendanceReports />} />
          <Route path="announcements" element={<HMAnnouncements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="export-center" element={<ExportCenter />} />
          <Route path="timetable" element={<HMTimetable />} />
          <Route path="promotion" element={<AcademicPromotion />} />
          <Route path="examinations" element={<Examinations />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="school" element={<SchoolProfile />} />
          <Route path="schemes" element={<GovernmentSchemes />} />
          <Route path="settings" element={<HMSettings />} />
        </Route>

        {/* Teacher */}
        <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<TDashboard />} />
          <Route path="classes" element={<TClasses />} />
          <Route path="students" element={<TStudents />} />
          <Route path="attendance" element={<TAttendance />} />
          <Route path="marks" element={<TMarks />} />
          <Route path="exam-marks" element={<TExamMarks />} />
          <Route path="homework" element={<THomework />} />
          <Route path="timetable" element={<TTimetable />} />
          <Route path="leave" element={<TLeave />} />
          <Route path="announcements" element={<TAnnouncements />} />
          <Route path="profile" element={<TProfile />} />
        </Route>

        {/* Student */}
        <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<SDashboard />} />
          <Route path="class" element={<SClass />} />
          <Route path="profile" element={<SProfile />} />
          <Route path="attendance" element={<SAttendance />} />
          <Route path="marks" element={<SMarks />} />
          <Route path="results" element={<SResults />} />
          <Route path="homework" element={<SHomework />} />
          <Route path="timetable" element={<STimetable />} />
          <Route path="leave" element={<SLeave />} />
          <Route path="announcements" element={<SAnnouncements />} />
        </Route>

        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
