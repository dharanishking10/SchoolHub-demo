"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.verifyToken, async (_req, res) => {
    try {
        const profile = await prisma.schoolProfile.findFirst();
        res.json({ success: true, data: { profile } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.put('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { schoolName, schoolCode, district, block, academicYear, headmasterName } = req.body;
        const existing = await prisma.schoolProfile.findFirst();
        const profile = existing
            ? await prisma.schoolProfile.update({ where: { id: existing.id }, data: { schoolName, schoolCode, district, block, academicYear, headmasterName } })
            : await prisma.schoolProfile.create({ data: { schoolName, schoolCode, district, block, academicYear, headmasterName } });
        await prisma.activity.create({ data: { type: 'profile', message: 'School profile updated' } });
        res.json({ success: true, data: { profile } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=school.js.map