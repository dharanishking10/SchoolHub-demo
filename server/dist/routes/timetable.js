"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/timetable?className=&section=
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { className, section } = req.query;
        const where = {};
        if (req.user.role === 'TEACHER') {
            where.teacherId = req.user.userId;
        }
        else if (req.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { id: req.user.userId }, select: { className: true, section: true } });
            if (student) {
                where.className = student.className;
                where.section = student.section;
            }
        }
        else {
            if (className)
                where.className = className;
            if (section)
                where.section = section;
        }
        const entries = await prisma.timetable.findMany({
            where,
            include: { teacher: { select: { fullName: true, subject: true } } },
            orderBy: [{ day: 'asc' }, { period: 'asc' }],
        });
        res.json({ success: true, data: entries });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/timetable (headmaster)
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { teacherId, className, section, day, period, subject, startTime, endTime } = req.body;
        await prisma.timetable.upsert({
            where: { className_section_day_period: { className, section, day, period } },
            update: { teacherId, subject, startTime, endTime },
            create: { teacherId, className, section, day, period, subject, startTime, endTime },
        });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=timetable.js.map