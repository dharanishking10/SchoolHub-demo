import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Shield, Bell, Monitor, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Toggle = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </div>
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#0B2447]' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
)

export default function HMSettings() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({ email: true, sms: false, app: true })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sections = [
    {
      icon: Shield, title: 'Account Information',
      content: (
        <div className="space-y-3">
          {[['Username', user?.username || '—'], ['Role', 'Headmaster'], ['Access Level', 'Full Access']].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{l}</span>
              <span className="text-sm font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: Bell, title: 'Notifications',
      content: (
        <>
          <Toggle label="Email Notifications" desc="Receive updates via email" checked={notifications.email} onChange={() => setNotifications(n => ({ ...n, email: !n.email }))} />
          <Toggle label="SMS Alerts" desc="Receive SMS for critical updates" checked={notifications.sms} onChange={() => setNotifications(n => ({ ...n, sms: !n.sms }))} />
          <Toggle label="In-app Notifications" desc="Show notifications inside the portal" checked={notifications.app} onChange={() => setNotifications(n => ({ ...n, app: !n.app }))} />
        </>
      )
    },
    {
      icon: Monitor, title: 'System Information',
      content: (
        <div className="space-y-2.5">
          {[['Platform', 'EduGov Connect v1.0'], ['Stage', 'Stage 3 – Headmaster Dashboard'], ['Academic Year', '2025-2026'], ['Government', 'Tamil Nadu, India']].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{l}</span>
              <span className="text-sm font-semibold text-gray-700">{v}</span>
            </div>
          ))}
        </div>
      )
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-[#0B2447]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account and portal preferences</p>
        </div>
      </motion.div>

      <div className="max-w-2xl space-y-5">
        {sections.map(({ icon: Icon, title, content }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon size={18} className="text-[#0B2447]" />
              <h2 className="text-base font-semibold text-[#0B2447]">{title}</h2>
            </div>
            {content}
          </motion.div>
        ))}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm">
            Save Settings
          </button>
          {saved && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircle size={16} /> Saved
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
