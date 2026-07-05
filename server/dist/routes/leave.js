"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const activityLog_1 = require("../utils/activityLog");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/leave?status=
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (req.user.role === 'STUDENT')
            where.studentId = req.user.userId;
        if (status)
            where.status = status;
        const requests = await prisma.leaveRequest.findMany({
            where,
            include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: requests });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/leave (student applies)
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            res.status(403).json({ success: false, message: 'Only students can apply' });
            return;
        }
        const { fromDate, toDate, reason } = req.body;
        if (!fromDate || !toDate || !reason) {
            res.status(400).json({ success: false, message: 'All fields required' });
            return;
        }
        const request = await prisma.leaveRequest.create({ data: { studentId: req.user.userId, fromDate, toDate, reason } });
        await (0, activityLog_1.notifyAllOfRole)('HEADMASTER', 'leave', 'New Leave Request', `${req.user.name || 'A student'} applied for leave (${fromDate} to ${toDate})`);
        res.json({ success: true, data: request });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/leave/:id (teacher approves/rejects)
router.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        const { status, teacherComment } = req.body;
        const updated = await prisma.leaveRequest.update({
            where: { id: parseInt(req.params.id) },
            data: { status, teacherComment: teacherComment || null, reviewedBy: req.user.userId },
        });
        await (0, activityLog_1.notify)(updated.studentId, 'STUDENT', 'leave', `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`, `Your leave request (${updated.fromDate} to ${updated.toDate}) was ${status?.toLowerCase()}.`);
        await (0, activityLog_1.audit)(req.user.userId, req.user.name || 'User', req.user.role, 'Leave Reviewed', `Leave #${updated.id} marked ${status}`);
        res.json({ success: true, data: updated });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/leave/:id (student cancels pending)
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const req_ = await prisma.leaveRequest.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!req_) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        if (req.user.role === 'STUDENT' && req_.studentId !== req.user.userId) {
            res.status(403).json({ success: false, message: 'Not allowed' });
            return;
        }
        if (req_.status !== 'PENDING') {
            res.status(400).json({ success: false, message: 'Cannot cancel processed request' });
            return;
        }
        await prisma.leaveRequest.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Leave request cancelled' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=leave.js.map