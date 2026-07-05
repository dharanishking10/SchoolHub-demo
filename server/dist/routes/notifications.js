"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/notifications
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: req.user.userId, recipientRole: req.user.role },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma.notification.count({ where: { recipientId: req.user.userId, recipientRole: req.user.role, isRead: false } });
        res.json({ success: true, data: { notifications, unreadCount } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/notifications/:id/read
router.put('/:id/read', auth_1.verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.recipientId !== req.user.userId || notif.recipientRole !== req.user.role) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        await prisma.notification.update({ where: { id }, data: { isRead: true } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/notifications/read-all
router.put('/read-all', auth_1.verifyToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({ where: { recipientId: req.user.userId, recipientRole: req.user.role, isRead: false }, data: { isRead: true } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/notifications/:id
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.recipientId !== req.user.userId || notif.recipientRole !== req.user.role) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        await prisma.notification.delete({ where: { id } });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map