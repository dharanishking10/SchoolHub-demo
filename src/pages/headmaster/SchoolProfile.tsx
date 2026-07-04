import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { School, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Profile {
  id?: number; schoolName: string; schoolCode: string; district: string
  block: string; academicYear: string; headmasterName: string
}

const EMPTY: Profile = { schoolName: '', schoolCode: '', district: '', block: '', academicYear: '', headmasterName: '' }
const DISTRICTS = ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Villupuram','Virudhunagar']

export default function SchoolProfile() {
  const { token } = useAuth()
  const [form, setForm] = useState<Profile>({ ...EMPTY })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/school', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success && d.data.profile) setForm(d.data.profile) })
      .finally(() => setLoading(false))
  }, [token])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.schoolName || !form.schoolCode || !form.district || !form.block || !form.academicYear || !form.headmasterName) {
      setError('All fields are required.'); return
    }
    setSaving(true); setError('')
    const res = await fetch('/api/school', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else setError(json.message || 'Failed to save')
  }

  const Field = ({ label, name, placeholder = '', type = 'text' }: { label: string; name: keyof Profile; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={form[name] as string} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder} disabled={loading}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] disabled:bg-gray-50 disabled:text-gray-400 transition-all" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">School Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your school's official information</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gov-border shadow-sm overflow-hidden max-w-2xl">
        <div className="flex items-center gap-3 px-6 py-5 bg-[#0B2447] border-b border-white/10">
          <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
            <School size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">School Information</h2>
            <p className="text-white/60 text-xs">Tamil Nadu Government School</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {loading ? (
            <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              <Field label="School Name" name="schoolName" placeholder="Government Model Higher Secondary School" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="School Code" name="schoolCode" placeholder="TN-CB-0042" />
                <Field label="Academic Year" name="academicYear" placeholder="2025-2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">District</label>
                  <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
                    <option value="">Select District</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Field label="Block" name="block" placeholder="e.g. Chellampalayam" />
              </div>
              <Field label="Headmaster Name" name="headmasterName" placeholder="e.g. S. Ramalingam" />

              {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors disabled:opacity-60 shadow-sm">
                  <Save size={15} />
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                {saved && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                    <CheckCircle size={16} /> Saved successfully
                  </motion.div>
                )}
              </div>
            </>
          )}
        </form>
      </motion.div>

      {/* Info Badge */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-6 max-w-2xl p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <span className="text-xl">🏛️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Tamil Nadu Government School</p>
          <p className="text-xs text-amber-600 mt-0.5">This information is used in official reports and communications. Ensure all details are accurate and up-to-date.</p>
        </div>
      </motion.div>
    </div>
  )
}
