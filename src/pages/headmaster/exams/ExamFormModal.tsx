import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export interface ExamFormValues { examName: string; examType: string; academicYear: string; startDate: string; endDate: string }

const EXAM_TYPES = ['Unit Test 1', 'Unit Test 2', 'Quarterly', 'Half Yearly', 'Revision Test', 'Annual Examination']

export default function ExamFormModal({ initial, onClose, onSave, saving, error }: {
  initial?: Partial<ExamFormValues>
  onClose: () => void
  onSave: (values: ExamFormValues) => void
  saving: boolean
  error: string | null
}) {
  const [values, setValues] = useState<ExamFormValues>({
    examName: initial?.examName || EXAM_TYPES[0],
    examType: initial?.examType || EXAM_TYPES[0],
    academicYear: initial?.academicYear || '2025-2026',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
  })

  const set = (field: keyof ExamFormValues, val: string) => setValues(v => ({ ...v, [field]: val }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0B2447]">{initial ? 'Edit Exam' : 'Create Exam'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && <div className="mb-4 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Type</label>
            <select value={values.examType} onChange={e => { set('examType', e.target.value); set('examName', e.target.value) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Name</label>
            <input value={values.examName} onChange={e => set('examName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year</label>
            <input value={values.academicYear} onChange={e => set('academicYear', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input type="date" value={values.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input type="date" value={values.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => onSave(values)} disabled={saving || !values.examName || !values.academicYear || !values.startDate || !values.endDate}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
