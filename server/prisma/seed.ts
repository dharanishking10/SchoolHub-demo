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

  const studentPass = await bcrypt.hash('Student@2026', 10)
  let admCount = 0
  for (const s of studentRecords) {
    admCount++
    const admissionNumber = `ADM2026${String(admCount).padStart(4, '0')}`
    const firstName = s.fullName.split(' ')[0].toLowerCase()
    const username = `${firstName}_${s.rollNumber.toLowerCase()}`
    await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: { admissionNumber, username, password: studentPass, dateOfBirth: s.dateOfBirth, fatherName: s.fatherName, motherName: s.motherName, address: s.address, mobile: s.mobile },
      create: { ...s, admissionNumber, username, password: studentPass },
    })
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

  console.log('✅ Database seeded successfully')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
