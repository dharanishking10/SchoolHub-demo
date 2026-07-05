import * as XLSX from 'xlsx'

interface MarkRow {
  student: { fullName: string; rollNumber: string; admissionNumber?: string | null; className: string; section: string }
  subject: { subjectName: string }
  exam: { examName: string }
  marksObtained: number
  maximumMarks: number
  grade?: string | null
}

export function exportExamMarksToExcel(marks: MarkRow[], filename = 'exam-marks.xlsx') {
  const rows = marks.map(m => ({
    'Admission No': m.student.admissionNumber || '',
    'Roll No': m.student.rollNumber,
    'Name': m.student.fullName,
    'Class': m.student.className,
    'Section': m.student.section,
    'Exam': m.exam.examName,
    'Subject': m.subject.subjectName,
    'Marks Obtained': m.marksObtained,
    'Maximum Marks': m.maximumMarks,
    'Grade': m.grade || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Exam Marks')
  XLSX.writeFile(wb, filename)
}
