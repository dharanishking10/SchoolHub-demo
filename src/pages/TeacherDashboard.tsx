import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Users, BookOpen, Bell, ClipboardList } from 'lucide-react'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const stats = [
    { label: 'My Classes', value: '0', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
    { label: 'Students', value: '0', icon: Users, color: 'bg-green-100 text-green-700' },
    { label: 'Assignments', value: '0', icon: ClipboardList, color: 'bg-purple-100 text-purple-700' },
    { label: 'Notifications', value: '0', icon: Bell, color: 'bg-yellow-100 text-yellow-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gray-100 border-b border-gray-300 py-1.5 px-4">
        <p className="text-xs text-gray-700 font-medium max-w-7xl mx-auto">
          🏛️ An Official Government Education Portal — United States Department of Education
        </p>
      </div>

      <header className="bg-[#003087] py-3 px-6 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#003087] font-extrabold text-sm">EC</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">EduGov Connect</span>
              <span className="ml-3 bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">TEACHER</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200 text-sm hidden sm:block">{user?.username}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm transition-colors">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, <span className="font-semibold text-gray-700">{user?.name || user?.username}</span>.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">My Classes</h2>
          <p className="text-sm text-gray-400 text-center py-8">No classes assigned yet. Check back soon.</p>
        </div>
      </main>

      <footer className="bg-[#002060] py-3 px-6 text-center">
        <p className="text-blue-300 text-xs">© 2026 U.S. Department of Education · EduGov Connect</p>
      </footer>
    </div>
  )
}
