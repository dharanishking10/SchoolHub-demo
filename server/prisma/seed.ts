import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Headmaster
  const hashedHM = await bcrypt.hash('CHELLAMPALAYAM', 12)
  await prisma.user.upsert({
    where: { username: 'GOVT_MODEL_HM' },
    update: {},
    create: { username: 'GOVT_MODEL_HM', password: hashedHM, role: 'HEADMASTER', name: 'S. Ramalingam', email: 'headmaster@edugov.edu' },
  })

  // School Profile
  const profile = await prisma.schoolProfile.findFirst()
  if (!profile) {
    await prisma.schoolProfile.create({
      data: { schoolName: 'Government Model Higher Secondary School', schoolCode: 'TN-CB-0042', district: 'Coimbatore', block: 'Chellampalayam', academicYear: '2025-2026', headmasterName: 'S. Ramalingam' },
    })
  }

  // Classes
  const classes = [
    { name: 'VI', section: 'A' }, { name: 'VI', section: 'B' }, { name: 'VII', section: 'A' }, { name: 'VII', section: 'B' },
    { name: 'VIII', section: 'A' }, { name: 'VIII', section: 'B' }, { name: 'IX', section: 'A' }, { name: 'IX', section: 'B' },
    { name: 'X', section: 'A' }, { name: 'X', section: 'B' }, { name: 'XI', section: 'A' }, { name: 'XI', section: 'B' },
    { name: 'XII', section: 'A' }, { name: 'XII', section: 'B' },
  ]
  for (const cls of classes) {
    await prisma.schoolClass.upsert({ where: { name_section: cls }, update: {}, create: cls })
  }

  // Teachers
  const teachers = [
    { fullName: 'A. Muruganantham', employeeId: 'EMP001', mobile: '9876543210', email: 'murugan@school.edu', subject: 'Mathematics', username: 'teacher_murugan', status: 'ACTIVE' },
    { fullName: 'P. Kavitha', employeeId: 'EMP002', mobile: '9876543211', email: 'kavitha@school.edu', subject: 'Science', username: 'teacher_kavitha', status: 'ACTIVE' },
    { fullName: 'R. Selvakumar', employeeId: 'EMP003', mobile: '9876543212', email: 'selva@school.edu', subject: 'Tamil', username: 'teacher_selva', status: 'ACTIVE' },
    { fullName: 'S. Priya', employeeId: 'EMP004', mobile: '9876543213', email: 'priya@school.edu', subject: 'English', username: 'teacher_priya', status: 'ACTIVE' },
    { fullName: 'K. Rajendran', employeeId: 'EMP005', mobile: '9876543214', email: 'rajendran@school.edu', subject: 'Social Science', username: 'teacher_rajendran', status: 'INACTIVE' },
    { fullName: 'M. Lakshmi', employeeId: 'EMP006', mobile: '9876543215', email: 'lakshmi@school.edu', subject: 'Computer Science', username: 'teacher_lakshmi', status: 'ACTIVE' },
    { fullName: 'T. Balamurugan', employeeId: 'EMP007', mobile: '9876543216', email: 'bala@school.edu', subject: 'Physics', username: 'teacher_bala', status: 'ACTIVE' },
  ]
  const teacherPass = await bcrypt.hash('School@2026', 10)
  for (const t of teachers) {
    await prisma.teacher.upsert({ where: { employeeId: t.employeeId }, update: {}, create: { ...t, password: teacherPass } })
  }

  // Students
  const studentRecords = [
    { rollNumber: 'S001', fullName: 'Arjun Kumar', gender: 'MALE', dateOfBirth: '2011-05-12', fatherName: 'Kumar Raj', motherName: 'Priya Kumar', mobile: '9876500001', className: 'X', section: 'A', address: '12, Main Street, Coimbatore' },
    { rollNumber: 'S002', fullName: 'Meena Devi', gender: 'FEMALE', dateOfBirth: '2011-08-20', fatherName: 'Devi Raj', motherName: 'Selvi Devi', mobile: '9876500002', className: 'X', section: 'A', address: '45, Park Road, Coimbatore' },
    { rollNumber: 'S003', fullName: 'Karthik Raja', gender: 'MALE', dateOfBirth: '2011-03-15', fatherName: 'Raja Murugan', motherName: 'Valli Raja', mobile: '9876500003', className: 'X', section: 'B', address: '78, Gandhi Nagar, Coimbatore' },
    { rollNumber: 'S004', fullName: 'Anitha S', gender: 'FEMALE', dateOfBirth: '2012-07-09', fatherName: 'Suresh A', motherName: 'Kamala S', mobile: '9876500004', className: 'IX', section: 'A', address: '23, Anna Nagar, Coimbatore' },
    { rollNumber: 'S005', fullName: 'Vijay P', gender: 'MALE', dateOfBirth: '2012-11-30', fatherName: 'Prakash V', motherName: 'Usha V', mobile: '9876500005', className: 'IX', section: 'B', address: '56, RS Puram, Coimbatore' },
    { rollNumber: 'S006', fullName: 'Deepa M', gender: 'FEMALE', dateOfBirth: '2013-02-14', fatherName: 'Mohan D', motherName: 'Saranya M', mobile: '9876500006', className: 'VIII', section: 'A', address: '89, Saibaba Colony, Coimbatore' },
    { rollNumber: 'S007', fullName: 'Ravi K', gender: 'MALE', dateOfBirth: '2013-06-22', fatherName: 'Kannan R', motherName: 'Mala K', mobile: '9876500007', className: 'VIII', section: 'A', address: '34, Tatabad, Coimbatore' },
    { rollNumber: 'S008', fullName: 'Sowmya R', gender: 'FEMALE', dateOfBirth: '2014-09-05', fatherName: 'Rajesh S', motherName: 'Nirmala R', mobile: '9876500008', className: 'VII', section: 'B', address: '67, Singanallur, Coimbatore' },
    { rollNumber: 'S009', fullName: 'Suresh B', gender: 'MALE', dateOfBirth: '2015-01-18', fatherName: 'Balasubramaniam S', motherName: 'Kavitha B', mobile: '9876500009', className: 'VI', section: 'A', address: '90, Ganapathy, Coimbatore' },
    { rollNumber: 'S010', fullName: 'Latha N', gender: 'FEMALE', dateOfBirth: '2009-12-01', fatherName: 'Natarajan L', motherName: 'Geetha N', mobile: '9876500010', className: 'XII', section: 'A', address: '12, Peelamedu, Coimbatore' },
    { rollNumber: 'S011', fullName: 'Prakash T', gender: 'MALE', dateOfBirth: '2010-04-25', fatherName: 'Thangavel P', motherName: 'Sasikala T', mobile: '9876500011', className: 'XI', section: 'B', address: '45, Hopes College Road, Coimbatore' },
    { rollNumber: 'S012', fullName: 'Nithya G', gender: 'FEMALE', dateOfBirth: '2010-10-10', fatherName: 'Ganesan N', motherName: 'Parvathi G', mobile: '9876500012', className: 'XI', section: 'A', address: '78, Avinashi Road, Coimbatore' },
    { rollNumber: 'S013', fullName: 'Manoj S', gender: 'MALE', dateOfBirth: '2011-07-07', fatherName: 'Shanmugam M', motherName: 'Pushpa S', mobile: '9876500013', className: 'X', section: 'B', address: '23, Ukkadam, Coimbatore' },
    { rollNumber: 'S014', fullName: 'Preethi R', gender: 'FEMALE', dateOfBirth: '2012-03-28', fatherName: 'Ramesh P', motherName: 'Sumathi R', mobile: '9876500014', className: 'IX', section: 'A', address: '56, Vadavalli, Coimbatore' },
    { rollNumber: 'S015', fullName: 'Dinesh K', gender: 'MALE', dateOfBirth: '2013-08-15', fatherName: 'Krishnamurthy D', motherName: 'Rajalakshmi K', mobile: '9876500015', className: 'VIII', section: 'B', address: '89, Podanur, Coimbatore' },
  ]
  const studentPass = await bcrypt.hash('School@2026', 10)
  let admCount = 0
  const studentMap: Record<string, number> = {}
  for (const s of studentRecords) {
    admCount++
    const admissionNumber = `ADM2026${String(admCount).padStart(4, '0')}`
    const firstName = s.fullName.split(' ')[0].toLowerCase()
    const username = `${firstName}_${s.rollNumber.toLowerCase()}`
    const stu = await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: { admissionNumber, username, password: studentPass, dateOfBirth: s.dateOfBirth, fatherName: s.fatherName, motherName: s.motherName, address: s.address, mobile: s.mobile },
      create: { ...s, admissionNumber, username, password: studentPass },
    })
    studentMap[s.rollNumber] = stu.id
  }

  // Timetable (Mathematics teacher - EMP001)
  const mathTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP001' } })
  const sciTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP002' } })
  const tamilTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP003' } })
  const engTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP004' } })
  const compTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP006' } })
  const physTeacher = await prisma.teacher.findUnique({ where: { employeeId: 'EMP007' } })

  if (mathTeacher) {
    const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
    const classSchedules = [
      { className: 'X', section: 'A', periods: [1,3] },
      { className: 'X', section: 'B', periods: [2,4] },
      { className: 'IX', section: 'A', periods: [5] },
    ]
    const times = ['', '8:00','8:45','9:45','10:30','11:30','12:15']
    const ends  = ['', '8:45','9:30','10:30','11:15','12:15','1:00']
    for (const day of days) {
      for (const cs of classSchedules) {
        for (const period of cs.periods) {
          await prisma.timetable.upsert({
            where: { className_section_day_period: { className: cs.className, section: cs.section, day, period } },
            update: {},
            create: { teacherId: mathTeacher.id, className: cs.className, section: cs.section, day, period, subject: 'Mathematics', startTime: times[period], endTime: ends[period] },
          })
        }
      }
    }
  }

  if (sciTeacher) {
    const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
    const times = ['', '8:00','8:45','9:45','10:30','11:30','12:15']
    const ends  = ['', '8:45','9:30','10:30','11:15','12:15','1:00']
    await prisma.timetable.upsert({ where: { className_section_day_period: { className: 'VIII', section: 'A', day: 'MONDAY', period: 2 } }, update: {}, create: { teacherId: sciTeacher.id, className: 'VIII', section: 'A', day: 'MONDAY', period: 2, subject: 'Science', startTime: times[2], endTime: ends[2] } })
    await prisma.timetable.upsert({ where: { className_section_day_period: { className: 'VIII', section: 'A', day: 'WEDNESDAY', period: 4 } }, update: {}, create: { teacherId: sciTeacher.id, className: 'VIII', section: 'A', day: 'WEDNESDAY', period: 4, subject: 'Science', startTime: times[4], endTime: ends[4] } })
    await prisma.timetable.upsert({ where: { className_section_day_period: { className: 'IX', section: 'A', day: 'TUESDAY', period: 1 } }, update: {}, create: { teacherId: sciTeacher.id, className: 'IX', section: 'A', day: 'TUESDAY', period: 1, subject: 'Science', startTime: times[1], endTime: ends[1] } })
  }

  // Attendance data (past 30 days for X-A students)
  const xaStudents = studentRecords.filter(s => s.className === 'X' && s.section === 'A')
  const attStatuses: ('PRESENT'|'ABSENT'|'LATE')[] = ['PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','ABSENT','PRESENT','LATE']
  const today = new Date()
  for (let d = 29; d >= 0; d--) {
    const dt = new Date(today)
    dt.setDate(today.getDate() - d)
    const dow = dt.getDay()
    if (dow === 0 || dow === 6) continue
    const dateStr = dt.toISOString().split('T')[0]
    for (const s of xaStudents) {
      const sid = studentMap[s.rollNumber]
      if (!sid) continue
      const randStatus = attStatuses[Math.floor(Math.random() * attStatuses.length)]
      try {
        await prisma.attendance.upsert({
          where: { studentId_date: { studentId: sid, date: dateStr } },
          update: {},
          create: { studentId: sid, date: dateStr, status: randStatus, className: 'X', section: 'A' },
        })
      } catch {}
    }
  }

  // Marks (Unit Test 1 for X-A students)
  const mathMarks = [
    { roll: 'S001', obtained: 87 },
    { roll: 'S002', obtained: 92 },
    { roll: 'S003', obtained: 78 },
    { roll: 'S013', obtained: 65 },
  ]
  const sciMarks = [
    { roll: 'S001', obtained: 80 },
    { roll: 'S002', obtained: 88 },
    { roll: 'S013', obtained: 72 },
  ]
  function grade(obtained: number, total: number): string {
    const p = (obtained / total) * 100
    if (p >= 91) return 'A+'; if (p >= 81) return 'A'; if (p >= 71) return 'B+'; if (p >= 61) return 'B'; if (p >= 51) return 'C'; return 'D'
  }
  for (const m of mathMarks) {
    const sid = studentMap[m.roll]; if (!sid) continue
    await prisma.marks.upsert({ where: { studentId_subject_examName: { studentId: sid, subject: 'Mathematics', examName: 'Unit Test 1' } }, update: {}, create: { studentId: sid, subject: 'Mathematics', examName: 'Unit Test 1', marksObtained: m.obtained, totalMarks: 100, grade: grade(m.obtained, 100) } })
  }
  for (const m of sciMarks) {
    const sid = studentMap[m.roll]; if (!sid) continue
    await prisma.marks.upsert({ where: { studentId_subject_examName: { studentId: sid, subject: 'Science', examName: 'Unit Test 1' } }, update: {}, create: { studentId: sid, subject: 'Science', examName: 'Unit Test 1', marksObtained: m.obtained, totalMarks: 100, grade: grade(m.obtained, 100) } })
  }
  // Half Yearly
  const halfYearlyMarks = [
    { roll: 'S001', math: 82, sci: 78, eng: 85, tamil: 79 },
    { roll: 'S002', math: 90, sci: 88, eng: 91, tamil: 88 },
  ]
  for (const m of halfYearlyMarks) {
    const sid = studentMap[m.roll]; if (!sid) continue
    const subjects = [['Mathematics', m.math], ['Science', m.sci], ['English', m.eng], ['Tamil', m.tamil]] as [string, number][]
    for (const [sub, obt] of subjects) {
      await prisma.marks.upsert({ where: { studentId_subject_examName: { studentId: sid, subject: sub, examName: 'Half Yearly' } }, update: {}, create: { studentId: sid, subject: sub, examName: 'Half Yearly', marksObtained: obt, totalMarks: 100, grade: grade(obt, 100) } })
    }
  }

  // Homework
  if (mathTeacher) {
    const hwEntries = [
      { className: 'X', section: 'A', subject: 'Mathematics', title: 'Algebra Practice Set', description: 'Complete exercises 3.1 to 3.5 from Chapter 3 – Polynomial Equations.', dueDate: '2026-07-08', status: 'ACTIVE' },
      { className: 'X', section: 'B', subject: 'Mathematics', title: 'Geometry – Triangles', description: 'Prove the Pythagoras theorem and solve 5 related problems.', dueDate: '2026-07-06', status: 'ACTIVE' },
      { className: 'X', section: 'A', subject: 'Mathematics', title: 'Trigonometry Basics', description: 'Learn sin, cos, tan values and complete worksheet 4.', dueDate: '2026-06-30', status: 'CLOSED' },
    ]
    for (const hw of hwEntries) {
      const existing = await prisma.homework.findFirst({ where: { teacherId: mathTeacher.id, title: hw.title } })
      if (!existing) await prisma.homework.create({ data: { teacherId: mathTeacher.id, ...hw } })
    }
  }

  if (sciTeacher) {
    const existing = await prisma.homework.findFirst({ where: { teacherId: sciTeacher.id, title: 'Living and Non-Living Things' } })
    if (!existing) {
      await prisma.homework.create({ data: { teacherId: sciTeacher.id, className: 'VIII', section: 'A', subject: 'Science', title: 'Living and Non-Living Things', description: 'Make a chart listing 10 living and 10 non-living things with their characteristics.', dueDate: '2026-07-09', status: 'ACTIVE' } })
    }
  }

  // Leave Requests (from Arjun Kumar, S001)
  const arjunId = studentMap['S001']
  if (arjunId) {
    const existingLeave = await prisma.leaveRequest.findFirst({ where: { studentId: arjunId } })
    if (!existingLeave) {
      await prisma.leaveRequest.create({ data: { studentId: arjunId, fromDate: '2026-07-05', toDate: '2026-07-05', reason: 'Family function – attending uncle\'s wedding.', status: 'PENDING' } })
      await prisma.leaveRequest.create({ data: { studentId: arjunId, fromDate: '2026-06-20', toDate: '2026-06-21', reason: 'Fever and doctor visit.', status: 'APPROVED', teacherComment: 'Approved. Please collect notes from classmates.' } })
    }
  }

  // Activities
  const activityCount = await prisma.activity.count()
  if (activityCount === 0) {
    await prisma.activity.createMany({
      data: [
        { type: 'student', message: '15 students enrolled for academic year 2025-26' },
        { type: 'teacher', message: 'New teacher A. Muruganantham was added' },
        { type: 'class', message: '14 classes configured for the school' },
        { type: 'profile', message: 'School profile updated by Headmaster' },
      ],
    })
  }

  console.log('✅ Database seeded successfully (Stage 5 & 6)')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
