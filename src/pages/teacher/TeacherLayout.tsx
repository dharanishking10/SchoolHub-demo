import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, ClipboardCheck, BookOpen, FileText, Calendar, Mail, User, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/dashboard/teacher/home', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/teacher/students', icon: Users, label: 'My Students' },
  { to: '/dashboard/teacher/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/dashboard/teacher/marks', icon: BookOpen, label: 'Marks' },
  { to: '/dashboard/teacher/homework', icon: FileText, label: 'Homework' },
  { to: '/dashboard/teacher/timetable', icon: Calendar, label: 'Timetable' },
  { to: '/dashboard/teacher/leave', icon: Mail, label: 'Leave Requests' },
  { to: '/dashboard/teacher/profile', icon: User, label: 'My Profile' },
]

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary font-extrabold text-sm">EC</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">EduGov Connect</p>
            <p className="text-secondary text-xs font-medium mt-0.5">Teacher Portal</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center">
            <span className="text-secondary font-bold text-sm">{(user?.name || 'T')[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name || user?.username}</p>
            <p className="text-white/50 text-xs">Teacher</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive ? 'bg-secondary text-primary shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-primary' : 'text-white/60 group-hover:text-white'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="text-primary/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gov-bg overflow-hidden">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0B2447] shadow-xl">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed left-0 top-0 h-full w-60 bg-[#0B2447] shadow-2xl z-50 flex flex-col lg:hidden">
              <div className="absolute right-3 top-3">
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"><X size={18} /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gov-border px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0 shadow-sm">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Menu size={20} /></button>
          <div className="flex-1">
            <p className="text-xs text-gray-400 hidden sm:block">🏛️ Tamil Nadu Government — Teacher Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-gray-600 font-medium">{user?.name || user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-[#0B2447] flex items-center justify-center">
              <span className="text-secondary font-bold text-xs">{(user?.name || 'T')[0]}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}
