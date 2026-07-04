import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShieldOff } from 'lucide-react'

const ROLE_DASHBOARD: Record<string, string> = {
  HEADMASTER: '/dashboard/headmaster',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
}

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={32} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
        <button
          onClick={() => navigate(user ? ROLE_DASHBOARD[user.role] : '/login')}
          className="btn-primary"
        >
          {user ? 'Go to My Dashboard' : 'Back to Login'}
        </button>
      </div>
    </div>
  )
}
