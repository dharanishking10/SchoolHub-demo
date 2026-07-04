import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Headmaster
  const hashedHM = await bcrypt.hash('CHELLAMPALAYAM', 12)
  await prisma.user.upsert({
    where: { username: 'GOVT_MODEL_HM' },
    update: {},
    create: {
      username: 'GOVT_MODEL_HM',
      password: hashedHM,
      role: 'HEADMASTER',
      name: 'S. Ramalingam',
      email: 'headmaster@edugov.edu',
    },
  })

  // School Profile
  const profile = await prisma.schoolProfile.findFirst()
  if (!profile) {
    await prisma.schoolProfile.create({
      data: {
        schoolName: 'Government Model Higher Secondary School',
        schoolCode: 'TN-CB-0042',
        district: 'Coimbatore',
        block: 'Chellampalayam',
        academicYear: '2025-2026',
        headmasterName: 'S. Ramalingam',
      },
    })
  }

  // Classes
  const classes = [
    { name: 'VI', section: 'A' }, { name: 'VI', section: 'B' },
    { name: 'VII', section: 'A' }, { name: 'VII', section: 'B' },
    { name: 'VIII', section: 'A' }, { name: 'VIII', section: 'B' },
    { name: 'IX', section: 'A' }, { name: 'IX', section: 'B' },
    { name: 'X', section: 'A' }, { name: 'X', section: 'B' },
    { name: 'XI', section: 'A' }, { name: 'XI', section: 'B' },
    { name: 'XII', section: 'A' }, { name: 'XII', section: 'B' },
  ]
  for (const cls of classes) {
    await prisma.schoolClass.upsert({
      where: { name_section: cls },
      update: {},
      create: cls,
    })
  }

  // Teachers
  const teachers = [
    { fullName: 'A. Muruganantham', employeeId: 'EMP001', mobile: '9876543210', email: 'murugan@school.edu', subject: 'Mathematics', username: 'teacher_murugan', status: 'ACTIVE' },
    { fullName: 'P. Kavitha', employeeId: 'EMP002', mobile: '9876543211', email: 'kavitha@school.edu', subject: 'Science', username: 'teacher_kavitha', status: 'ACTIVE' },
    { fullName: 'R. Selvakumar', employeeId: 'EMP003', mobile: '9876543212', email: 'selva@school.edu', subject: 'Tamil', username: 'teacher_selva', status: 'ACTIVE' },
    { fullName: 'S. Priya', employeeId: 'EMP004', mobile: '9876543213', email: 'priya@school.edu', subject: 'English', username: 'teacher_priya', status: 'ACTIVE' },
    { fullName: 'K. Rajendran', employeeId: 'EMP005', mobile: '9876543214', email: 'rajendran@school.edu', subject: 'Social Science', username: 'teacher_rajendran', status: 'INACTIVE' },
  ]
  const teacherPass = await bcrypt.hash('School@2026', 10)
  for (const t of teachers) {
    await prisma.teacher.upsert({
      where: { employeeId: t.employeeId },
      update: {},
      create: { ...t, password: teacherPass },
    })
  }

  // Students
  const studentData = [
    { fullName: 'Arjun Kumar', rollNumber: 'S001', className: 'X', section: 'A', gender: 'MALE' },
    { fullName: 'Meena Devi', rollNumber: 'S002', className: 'X', section: 'A', gender: 'FEMALE' },
    { fullName: 'Karthik Raja', rollNumber: 'S003', className: 'X', section: 'B', gender: 'MALE' },
    { fullName: 'Anitha S', rollNumber: 'S004', className: 'IX', section: 'A', gender: 'FEMALE' },
    { fullName: 'Vijay P', rollNumber: 'S005', className: 'IX', section: 'B', gender: 'MALE' },
    { fullName: 'Deepa M', rollNumber: 'S006', className: 'VIII', section: 'A', gender: 'FEMALE' },
    { fullName: 'Ravi K', rollNumber: 'S007', className: 'VIII', section: 'A', gender: 'MALE' },
    { fullName: 'Sowmya R', rollNumber: 'S008', className: 'VII', section: 'B', gender: 'FEMALE' },
    { fullName: 'Suresh B', rollNumber: 'S009', className: 'VI', section: 'A', gender: 'MALE' },
    { fullName: 'Latha N', rollNumber: 'S010', className: 'XII', section: 'A', gender: 'FEMALE' },
    { fullName: 'Prakash T', rollNumber: 'S011', className: 'XI', section: 'B', gender: 'MALE' },
    { fullName: 'Nithya G', rollNumber: 'S012', className: 'XI', section: 'A', gender: 'FEMALE' },
  ]
  for (const s of studentData) {
    await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: {},
      create: s,
    })
  }

  // Activities
  const activityCount = await prisma.activity.count()
  if (activityCount === 0) {
    await prisma.activity.createMany({
      data: [
        { type: 'teacher', message: 'New teacher A. Muruganantham was added' },
        { type: 'student', message: '12 students enrolled for academic year 2025-26' },
        { type: 'class', message: '14 classes configured for the school' },
        { type: 'profile', message: 'School profile updated by Headmaster' },
      ],
    })
  }

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
