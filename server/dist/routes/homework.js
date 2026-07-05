"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const activityLog_1 = require("../utils/activityLog");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/homework
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { className, section, status } = req.query;
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
        if (className && req.user.role !== 'STUDENT')
            where.className = className;
        if (section && req.user.role !== 'STUDENT')
            where.section = section;
        if (status)
            where.status = status;
        const hw = await prisma.homework.findMany({
            where,
            include: { teacher: { select: { fullName: true, subject: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: hw });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/homework — HEADMASTER or TEACHER
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const { className, section, subject, title, description, dueDate } = req.body;
        if (!className || !section || !subject || !title || !dueDate) {
            res.status(400).json({ success: false, message: 'Required fields missing' });
            return;
        }
        const teacherId = req.user.role === 'TEACHER' ? req.user.userId : 1;
        const hw = await prisma.homework.create({ data: { teacherId, className, section, subject, title, description: description || null, dueDate, status: 'ACTIVE' } });
        await (0, activityLog_1.notifyClass)(className, section, 'homework', 'New Homework', `${subject}: ${title} (Due ${dueDate})`);
        await (0, activityLog_1.audit)(req.user.userId, req.user.name || 'User', req.user.role, 'Homework Created', `${subject} - ${title} for ${className}-${section}`);
        res.json({ success: true, data: hw });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/homework/:id — HEADMASTER can edit all; TEACHER can only edit own
router.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const id = parseInt(req.params.id);
        if (req.user.role === 'TEACHER') {
            const existing = await prisma.homework.findUnique({ where: { id }, select: { teacherId: true } });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            if (existing.teacherId !== req.user.userId) {
                res.status(403).json({ success: false, message: 'You can only edit homework you created' });
                return;
            }
        }
        const { title, description, dueDate, status } = req.body;
        const hw = await prisma.homework.update({ where: { id }, data: { title, description: description || null, dueDate, status } });
        res.json({ success: true, data: hw });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/homework/:id — HEADMASTER can delete all; TEACHER can only delete own
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const id = parseInt(req.params.id);
        if (req.user.role === 'TEACHER') {
            const existing = await prisma.homework.findUnique({ where: { id }, select: { teacherId: true } });
            if (!existing) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            if (existing.teacherId !== req.user.userId) {
                res.status(403).json({ success: false, message: 'You can only delete homework you created' });
                return;
            }
        }
        await prisma.homework.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=homework.js.map