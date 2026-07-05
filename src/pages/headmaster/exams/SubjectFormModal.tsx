import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export interface SubjectFormValues { subjectName: string; subjectCode: string }

export default function SubjectFormModal({ initial, onClose, onSave, saving, error }: {
  initial?: Partial<SubjectFormValues>
  onClose: () => void
  onSave: (values: SubjectFormValues) => void
  saving: boolean
  error: string | null
}) {
  const [values, setValues] = useState<SubjectFormValues>({
    subjectName: initial?.subjectName || '',
    subjectCode: initial?.subjectCode || '',
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0B2447]">{initial ? 'Edit Subject' : 'Add Subject'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && <div className="mb-4 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name</label>
            <input value={values.subjectName} onChange={e => setValues(v => ({ ...v, subjectName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Code</label>
            <input value={values.subjectCode} onChange={e => setValues(v => ({ ...v, subjectCode: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="e.g. MATH" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => onSave(values)} disabled={saving || !values.subjectName || !values.subjectCode}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
