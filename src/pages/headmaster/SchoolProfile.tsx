import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { School, Save, CheckCircle, Upload, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Profile {
  id?: number
  schoolName: string
  schoolCode: string
  emisCode: string
  udiseCode: string
  address: string
  district: string
  block: string
  panchayat: string
  pinCode: string
  contactNumber: string
  email: string
  headmasterName: string
  logoUrl: string
  academicYear: string
}

const EMPTY: Profile = {
  schoolName: '', schoolCode: '', emisCode: '', udiseCode: '',
  address: '', district: '', block: '', panchayat: '', pinCode: '',
  contactNumber: '', email: '', headmasterName: '', logoUrl: '', academicYear: '',
}

const DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri',
  'Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur',
  'Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris',
  'Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga',
  'Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
  'Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore',
  'Villupuram','Virudhunagar',
]

const inputCls = 'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] disabled:bg-gray-50 disabled:text-gray-400 transition-all'

export default function SchoolProfile() {
  const { token } = useAuth()
  const [form, setForm] = useState<Profile>({ ...EMPTY })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/school', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success && d.data.profile) setForm({ ...EMPTY, ...d.data.profile }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { setError('Logo must be under 500 KB.'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, logoUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const set = (name: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [name]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.schoolName.trim() || !form.schoolCode.trim() || !form.district || !form.block.trim() || !form.academicYear.trim() || !form.headmasterName.trim()) {
      setError('School Name, School Code, District, Block, Headmaster Name, and Academic Year are required.')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (form.pinCode && !/^\d{6}$/.test(form.pinCode)) {
      setError('PIN Code must be exactly 6 digits.')
      return
    }
    if (form.contactNumber && !/^\d{10}$/.test(form.contactNumber)) {
      setError('Contact Number must be exactly 10 digits.')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else setError(json.message || 'Failed to save')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({
    label, name, placeholder = '', type = 'text', required = false,
  }: { label: string; name: keyof Profile; placeholder?: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[name] as string}
        onChange={set(name)}
        placeholder={placeholder}
        disabled={loading}
        className={inputCls}
      />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">School Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your school's official information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gov-border shadow-sm overflow-hidden max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 bg-[#0B2447]">
          <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
            <School size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">School Information</h2>
            <p className="text-white/60 text-xs">Tamil Nadu Government School</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">School Logo</label>
                <div className="flex items-center gap-4">
                  {form.logoUrl ? (
                    <div className="relative w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                      <img src={form.logoUrl} alt="School Logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <School size={28} className="text-gray-300" />
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Upload size={14} /> Upload Logo
                    </button>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG · Max 500 KB</p>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">School Identity</p>
                <Field label="School Name" name="schoolName" placeholder="Government Model Higher Secondary School" required />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="School Code" name="schoolCode" placeholder="TN-CB-0042" required />
                  <Field label="EMIS Code" name="emisCode" placeholder="33XXXXXX" />
                  <Field label="UDISE+ Code" name="udiseCode" placeholder="33XXXXXXXXXX" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
                <Field label="Address" name="address" placeholder="No. 1, Main Road, Town" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      District<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      value={form.district}
                      onChange={set('district')}
                      className={inputCls}
                    >
                      <option value="">Select District</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <Field label="Block" name="block" placeholder="e.g. Chellampalayam" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Panchayat" name="panchayat" placeholder="e.g. Karumathampatty" />
                  <Field label="PIN Code" name="pinCode" placeholder="641010" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Contact Number" name="contactNumber" placeholder="9876543210" type="tel" />
                  <Field label="Email" name="email" placeholder="school@tn.gov.in" type="email" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Administration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Headmaster Name" name="headmasterName" placeholder="e.g. S. Ramalingam" required />
                  <Field label="Academic Year" name="academicYear" placeholder="2025-2026" required />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors disabled:opacity-60 shadow-sm"
                >
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

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-6 max-w-3xl p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
      >
        <span className="text-xl">🏛️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Tamil Nadu Government School</p>
          <p className="text-xs text-amber-600 mt-0.5">
            This information is used in official reports and communications. Ensure all details are accurate and up-to-date.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
