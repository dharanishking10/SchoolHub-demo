"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = notify;
exports.notifyAllOfRole = notifyAllOfRole;
exports.notifyClass = notifyClass;
exports.audit = audit;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function notify(recipientId, recipientRole, type, title, message, link) {
    try {
        await prisma.notification.create({ data: { recipientId, recipientRole, type, title, message, link: link || null } });
    }
    catch (e) {
        console.error('notify error', e);
    }
}
async function notifyAllOfRole(recipientRole, type, title, message, link) {
    try {
        if (recipientRole === 'HEADMASTER') {
            const users = await prisma.user.findMany({ where: { role: 'HEADMASTER' }, select: { id: true } });
            await prisma.notification.createMany({ data: users.map(u => ({ recipientId: u.id, recipientRole, type, title, message, link: link || null })) });
        }
        else if (recipientRole === 'TEACHER') {
            const teachers = await prisma.teacher.findMany({ select: { id: true } });
            await prisma.notification.createMany({ data: teachers.map(t => ({ recipientId: t.id, recipientRole, type, title, message, link: link || null })) });
        }
        else {
            const students = await prisma.student.findMany({ select: { id: true } });
            await prisma.notification.createMany({ data: students.map(s => ({ recipientId: s.id, recipientRole, type, title, message, link: link || null })) });
        }
    }
    catch (e) {
        console.error('notifyAllOfRole error', e);
    }
}
async function notifyClass(className, section, type, title, message, link) {
    try {
        const students = await prisma.student.findMany({ where: { className, section }, select: { id: true } });
        await prisma.notification.createMany({ data: students.map(s => ({ recipientId: s.id, recipientRole: 'STUDENT', type, title, message, link: link || null })) });
    }
    catch (e) {
        console.error('notifyClass error', e);
    }
}
async function audit(userId, userName, userRole, action, details) {
    try {
        await prisma.auditLog.create({ data: { userId, userName, userRole, action, details: details || null } });
    }
    catch (e) {
        console.error('audit error', e);
    }
}
//# sourceMappingURL=activityLog.js.map