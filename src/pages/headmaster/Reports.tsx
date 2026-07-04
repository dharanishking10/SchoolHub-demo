import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { BarChart2, Users, GraduationCap, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Stats { teachers: number; activeTeachers: number; students: number; boys: number; girls: number; classes: number }
interface StudentData { total: number; boys: number; girls: number; attendance: { month: string; pct: number }[]; classData: { className: string; count: number }[] }

const PIE_COLORS = ['#0B2447', '#D4AF37', '#4f8ef7', '#e55']

export default function Reports() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([d1, d2]) => {
      if (d1.success) setStats(d1.data)
      if (d2.success) setStudentData(d2.data)
    }).finally(() => setLoading(false))
  }, [token])

  const overviewData = stats ? [
    { name: 'Teachers', value: stats.teachers },
    { name: 'Students', value: stats.students },
    { name: 'Classes', value: stats.classes },
  ] : []

  const genderData = studentData ? [
    { name: 'Boys', value: studentData.boys },
    { name: 'Girls', value: studentData.girls },
  ] : []

  const teacherData = stats ? [
    { name: 'Active', value: stats.activeTeachers },
    { name: 'Inactive', value: stats.teachers - stats.activeTeachers },
  ] : []

  const ChartCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} className="text-[#0B2447]" />
        <h2 className="text-base font-semibold text-[#0B2447]">{title}</h2>
      </div>
      {children}
    </div>
  )

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6"><div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mb-2" /><div className="h-4 w-56 bg-gray-100 rounded animate-pulse" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-gov-border animate-pulse" />)}</div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visual overview of your school's key metrics</p>
      </motion.div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Teachers', value: stats.teachers, icon: Users, color: 'bg-blue-50 text-blue-700' },
            { label: 'Students', value: stats.students, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Classes', value: stats.classes, icon: BarChart2, color: 'bg-violet-50 text-violet-700' },
            { label: 'Avg Attendance', value: '87%', icon: TrendingUp, color: 'bg-amber-50 text-amber-700' },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}><c.icon size={18} /></div>
              <div><p className="text-xs text-gray-400">{c.label}</p><p className="text-xl font-bold text-[#0B2447]">{c.value}</p></div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Bar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <ChartCard title="School Overview" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overviewData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="value" fill="#0B2447" radius={[6, 6, 0, 0]}>
                  {overviewData.map((_, i) => <Cell key={i} fill={i === 0 ? '#0B2447' : i === 1 ? '#D4AF37' : '#4f8ef7'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Gender Pie */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <ChartCard title="Student Gender Distribution" icon={GraduationCap}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Attendance Area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <ChartCard title="Monthly Attendance (%)" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={studentData?.attendance || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="pct" stroke="#D4AF37" strokeWidth={2.5} fill="url(#rptGrad)" dot={{ fill: '#0B2447', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Teacher Status Pie */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <ChartCard title="Teacher Status" icon={Users}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={teacherData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {teacherData.map((_, i) => <Cell key={i} fill={i === 0 ? '#0B2447' : '#e5e7eb'} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </div>

      {/* Class-wise Students */}
      {studentData && studentData.classData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <ChartCard title="Students by Class" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studentData.classData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" name="Students" fill="#0B2447" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      )}
    </div>
  )
}
