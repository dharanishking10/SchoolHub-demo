"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const activityLog_1 = require("../utils/activityLog");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
function calcGrade(obtained, total) {
    const pct = (obtained / total) * 100;
    if (pct >= 91)
        return 'A+';
    if (pct >= 81)
        return 'A';
    if (pct >= 71)
        return 'B+';
    if (pct >= 61)
        return 'B';
    if (pct >= 51)
        return 'C';
    if (pct >= 35)
        return 'D';
    return 'F';
}
async function teacherOwnsStudent(teacherId, studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { createdByTeacherId: true } });
    return student?.createdByTeacherId === teacherId;
}
// GET /api/marks
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { studentId, examName, subject } = req.query;
        const where = {};
        if (req.user.role === 'STUDENT') {
            where.studentId = req.user.userId;
        }
        else if (req.user.role === 'TEACHER') {
            // Teacher can only query marks for their own students
            if (studentId) {
                const owns = await teacherOwnsStudent(req.user.userId, parseInt(studentId));
                if (!owns) {
                    res.status(403).json({ success: false, message: 'You can only view marks for your own students' });
                    return;
                }
                where.studentId = parseInt(studentId);
            }
            else {
                // Return marks for all their students
                where.student = { createdByTeacherId: req.user.userId };
            }
        }
        else if (studentId) {
            where.studentId = parseInt(studentId);
        }
        if (examName)
            where.examName = examName;
        if (subject)
            where.subject = subject;
        const marks = await prisma.marks.findMany({
            where,
            include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
            orderBy: [{ examName: 'asc' }, { subject: 'asc' }],
        });
        res.json({ success: true, data: marks });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/marks/summary
router.get('/summary', auth_1.verifyToken, async (req, res) => {
    try {
        const sid = req.user.role === 'STUDENT' ? req.user.userId : parseInt(req.query.studentId || '0');
        if (!sid) {
            res.status(400).json({ success: false, message: 'studentId required' });
            return;
        }
        // Teacher ownership check
        if (req.user.role === 'TEACHER') {
            const owns = await teacherOwnsStudent(req.user.userId, sid);
            if (!owns) {
                res.status(403).json({ success: false, message: 'You can only view marks for your own students' });
                return;
            }
        }
        const marks = await prisma.marks.findMany({ where: { studentId: sid }, orderBy: { examName: 'asc' } });
        const exams = [...new Set(marks.map(m => m.examName))];
        const byExam = exams.map(exam => {
            const items = marks.filter(m => m.examName === exam);
            const obtained = items.reduce((s, m) => s + m.marksObtained, 0);
            const total = items.reduce((s, m) => s + m.totalMarks, 0);
            return { examName: exam, subjects: items, totalObtained: obtained, grandTotal: total, percentage: total > 0 ? Math.round((obtained / total) * 100) : 0 };
        });
        res.json({ success: true, data: { marks, byExam } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/marks
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const { studentId, subject, examName, marksObtained, totalMarks } = req.body;
        if (!studentId || !subject || !examName || marksObtained === undefined || !totalMarks) {
            res.status(400).json({ success: false, message: 'All fields required' });
            return;
        }
        // Teacher can only add marks for their own students
        if (req.user.role === 'TEACHER') {
            const owns = await teacherOwnsStudent(req.user.userId, studentId);
            if (!owns) {
                res.status(403).json({ success: false, message: 'You can only enter marks for your own students' });
                return;
            }
        }
        const grade = calcGrade(marksObtained, totalMarks);
        const mark = await prisma.marks.upsert({
            where: { studentId_subject_examName: { studentId, subject, examName } },
            update: { marksObtained, totalMarks, grade, markedBy: req.user.userId },
            create: { studentId, subject, examName, marksObtained, totalMarks, grade, markedBy: req.user.userId },
        });
        await (0, activityLog_1.notify)(studentId, 'STUDENT', 'marks', 'Marks Published', `Your ${subject} marks for ${examName} have been published (${marksObtained}/${totalMarks}, Grade ${grade})`);
        await (0, activityLog_1.audit)(req.user.userId, req.user.name || 'User', req.user.role, 'Marks Updated', `${subject} - ${examName} for student #${studentId}`);
        res.json({ success: true, data: mark });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/marks/:id
router.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const id = parseInt(req.params.id);
        if (req.user.role === 'TEACHER') {
            const existing = await prisma.marks.findUnique({ where: { id }, select: { studentId: true } });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            const owns = await teacherOwnsStudent(req.user.userId, existing.studentId);
            if (!owns) {
                res.status(403).json({ success: false, message: 'You can only edit marks for your own students' });
                return;
            }
        }
        const { marksObtained, totalMarks } = req.body;
        const grade = calcGrade(marksObtained, totalMarks);
        const mark = await prisma.marks.update({ where: { id }, data: { marksObtained, totalMarks, grade } });
        res.json({ success: true, data: mark });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/marks/:id
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const id = parseInt(req.params.id);
        if (req.user.role === 'TEACHER') {
            const existing = await prisma.marks.findUnique({ where: { id }, select: { studentId: true } });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            const owns = await teacherOwnsStudent(req.user.userId, existing.studentId);
            if (!owns) {
                res.status(403).json({ success: false, message: 'You can only delete marks for your own students' });
                return;
            }
        }
        await prisma.marks.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=marks.js.map