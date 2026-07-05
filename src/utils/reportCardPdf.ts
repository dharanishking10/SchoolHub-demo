import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ReportCardData {
  school: { schoolName: string; headmasterName: string }
  student: { fullName: string; admissionNumber?: string | null; className: string; section: string; rollNumber: string }
  exam: { examName: string; examType: string; academicYear: string }
  subjects: { subjectName: string; marksObtained: number; maximumMarks: number; grade?: string | null }[]
  totalObtained: number
  grandTotal: number
  percentage: number
  grade: string
  result: string
}

export function generateReportCardPdf(data: ReportCardData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(11, 36, 71)
  doc.rect(0, 0, pageWidth, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('GOVERNMENT OF TAMIL NADU', pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Department of School Education', pageWidth / 2, 19, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(data.school.schoolName, pageWidth / 2, 27, { align: 'center' })

  doc.setTextColor(212, 175, 55)
  doc.setFontSize(13)
  doc.text('REPORT CARD', pageWidth / 2, 42, { align: 'center' })

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const infoY = 52
  doc.text(`Student Name: ${data.student.fullName}`, 14, infoY)
  doc.text(`Admission No: ${data.student.admissionNumber || '—'}`, pageWidth - 14, infoY, { align: 'right' })
  doc.text(`Class: ${data.student.className}`, 14, infoY + 7)
  doc.text(`Section: ${data.student.section}`, pageWidth - 14, infoY + 7, { align: 'right' })
  doc.text(`Roll Number: ${data.student.rollNumber}`, 14, infoY + 14)
  doc.text(`Academic Year: ${data.exam.academicYear}`, pageWidth - 14, infoY + 14, { align: 'right' })
  doc.text(`Examination: ${data.exam.examName} (${data.exam.examType})`, 14, infoY + 21)

  autoTable(doc, {
    startY: infoY + 28,
    head: [['Subject', 'Marks Obtained', 'Maximum Marks', 'Grade']],
    body: data.subjects.map(s => [s.subjectName, String(s.marksObtained), String(s.maximumMarks), s.grade || '—']),
    foot: [['Total', String(data.totalObtained), String(data.grandTotal), data.grade]],
    headStyles: { fillColor: [11, 36, 71], textColor: 255 },
    footStyles: { fillColor: [212, 175, 55], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    theme: 'grid',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Percentage: ${data.percentage}%`, 14, finalY)
  doc.text(`Result: ${data.result}`, pageWidth - 14, finalY, { align: 'right' })

  const signY = finalY + 30
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.line(14, signY, 70, signY)
  doc.text('Teacher Signature', 14, signY + 5)
  doc.line(pageWidth - 70, signY, pageWidth - 14, signY)
  doc.text('Headmaster Signature', pageWidth - 70, signY + 5)
  if (data.school.headmasterName) {
    doc.setFontSize(8)
    doc.text(data.school.headmasterName, pageWidth - 70, signY - 2)
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('This is a computer-generated report card issued via EduGov Connect.', pageWidth / 2, 285, { align: 'center' })

  doc.save(`ReportCard_${data.student.fullName.replace(/\s+/g, '_')}_${data.exam.examName.replace(/\s+/g, '_')}.pdf`)
}
