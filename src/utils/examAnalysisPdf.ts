import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface AnalysisPdfData {
  schoolPassPct: number
  avgMarks: number
  classWise: { className: string; passPercentage: number; total: number }[]
  subjectWise: { subjectName: string; passPercentage: number; average: number; total: number }[]
  topScorers: { name: string; roll: string; percentage: number }[]
  lowestScorers: { name: string; roll: string; percentage: number }[]
  totalMarks: number
}

export function generateAnalysisPdf(data: AnalysisPdfData, examLabel: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(11, 36, 71)
  doc.rect(0, 0, pageWidth, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('GOVERNMENT OF TAMIL NADU', pageWidth / 2, 11, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Department of School Education — Examination Analysis Report', pageWidth / 2, 18, { align: 'center' })
  doc.setTextColor(212, 175, 55)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(examLabel, pageWidth / 2, 25, { align: 'center' })

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Overall Pass Percentage: ${data.schoolPassPct}%`, 14, 40)
  doc.text(`Average Marks: ${data.avgMarks}%`, pageWidth - 14, 40, { align: 'right' })
  doc.text(`Total Mark Entries: ${data.totalMarks}`, 14, 47)

  autoTable(doc, {
    startY: 54,
    head: [['Class', 'Pass %', 'Total Entries']],
    body: data.classWise.map(c => [c.className, `${c.passPercentage}%`, String(c.total)]),
    headStyles: { fillColor: [11, 36, 71], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: y,
    head: [['Subject', 'Average %', 'Pass %', 'Total Entries']],
    body: data.subjectWise.map(s => [s.subjectName, `${s.average}%`, `${s.passPercentage}%`, String(s.total)]),
    headStyles: { fillColor: [11, 36, 71], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: y,
    head: [['Top Scorers', 'Roll No.', 'Percentage']],
    body: data.topScorers.map(s => [s.name, s.roll, `${s.percentage}%`]),
    headStyles: { fillColor: [212, 175, 55], textColor: 20 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: y,
    head: [['Needs Attention', 'Roll No.', 'Percentage']],
    body: data.lowestScorers.map(s => [s.name, s.roll, `${s.percentage}%`]),
    headStyles: { fillColor: [180, 60, 60], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('This is a computer-generated report issued via EduGov Connect.', pageWidth / 2, 290, { align: 'center' })

  doc.save(`Exam_Analysis_${examLabel.replace(/\s+/g, '_')}.pdf`)
}
