import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Notif { id: number; type: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string | null }

export default function NotificationBell() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) { setNotifs(json.data.notifications); setUnread(json.data.unreadCount) }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [token])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const remove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0B2447] transition-colors">
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] bg-white rounded-2xl shadow-xl border border-gov-border overflow-hidden z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gov-border bg-[#0B2447]">
              <p className="text-white font-semibold text-sm">Notifications</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-white/70 hover:text-secondary text-xs flex items-center gap-1">
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white lg:hidden"><X size={15} /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {notifs.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">No notifications yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifs.map(n => (
                    <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                      className={`px-4 py-3 flex gap-2 cursor-pointer transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50/60 hover:bg-blue-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={e => remove(n.id, e)} className="text-gray-300 hover:text-red-500 shrink-0 h-fit">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
