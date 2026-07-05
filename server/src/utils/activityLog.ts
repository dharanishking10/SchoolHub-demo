import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type Role = 'HEADMASTER' | 'TEACHER' | 'STUDENT'

export async function notify(recipientId: number, recipientRole: Role, type: string, title: string, message: string, link?: string) {
  try {
    await prisma.notification.create({ data: { recipientId, recipientRole, type, title, message, link: link || null } })
  } catch (e) { console.error('notify error', e) }
}

export async function notifyAllOfRole(recipientRole: Role, type: string, title: string, message: string, link?: string) {
  try {
    if (recipientRole === 'HEADMASTER') {
      const users = await prisma.user.findMany({ where: { role: 'HEADMASTER' }, select: { id: true } })
      await prisma.notification.createMany({ data: users.map(u => ({ recipientId: u.id, recipientRole, type, title, message, link: link || null })) })
    } else if (recipientRole === 'TEACHER') {
      const teachers = await prisma.teacher.findMany({ select: { id: true } })
      await prisma.notification.createMany({ data: teachers.map(t => ({ recipientId: t.id, recipientRole, type, title, message, link: link || null })) })
    } else {
      const students = await prisma.student.findMany({ select: { id: true } })
      await prisma.notification.createMany({ data: students.map(s => ({ recipientId: s.id, recipientRole, type, title, message, link: link || null })) })
    }
  } catch (e) { console.error('notifyAllOfRole error', e) }
}

export async function notifyClass(className: string, section: string, type: string, title: string, message: string, link?: string) {
  try {
    const students = await prisma.student.findMany({ where: { className, section }, select: { id: true } })
    await prisma.notification.createMany({ data: students.map(s => ({ recipientId: s.id, recipientRole: 'STUDENT', type, title, message, link: link || null })) })
  } catch (e) { console.error('notifyClass error', e) }
}

export async function audit(userId: number, userName: string, userRole: string, action: string, details?: string) {
  try {
    await prisma.auditLog.create({ data: { userId, userName, userRole, action, details: details || null } })
  } catch (e) { console.error('audit error', e) }
}
