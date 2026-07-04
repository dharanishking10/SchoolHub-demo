import { useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Bell, User } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Gov Banner */}
      <div className="bg-gray-100 border-b border-gray-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-xs text-gray-700 font-medium">
            🏛️ An Official Government Education Portal — United States Department of Education
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#003087] py-3 px-6 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#003087] font-extrabold text-sm">EC</span>
            </div>
            <span className="text-white font-bold text-lg">EduGov Connect</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-blue-200 hover:text-white">
              <Bell size={18} />
            </button>
            <button className="text-blue-200 hover:text-white">
              <User size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Here's your EduGov Connect dashboard overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Enrolled Courses', value: '4', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
            { label: 'Certifications', value: '2', icon: User, color: 'bg-green-100 text-green-700' },
            { label: 'Notifications', value: '7', icon: Bell, color: 'bg-yellow-100 text-yellow-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
