"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/audit-log (Headmaster only)
router.get('/', auth_1.verifyToken, (0, auth_1.requireRole)('HEADMASTER'), async (req, res) => {
    try {
        const { action = '', role = '', page = '1', limit = '25' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (role)
            where.userRole = role;
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
            prisma.auditLog.count({ where }),
        ]);
        res.json({ success: true, data: { logs, total, page: parseInt(page), limit: parseInt(limit) } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auditlog.js.map