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
router.put('/', auth_1.verifyToken, (0, auth_1.requireRole)('HEADMASTER'), async (req, res) => {
    try {
        const { schoolName, schoolCode, emisCode, udiseCode, address, district, block, panchayat, pinCode, contactNumber, email, headmasterName, logoUrl, academicYear, } = req.body;
        if (!schoolName || !schoolCode || !district || !block || !academicYear || !headmasterName) {
            res.status(400).json({ success: false, message: 'Required fields missing' });
            return;
        }
        const data = {
            schoolName, schoolCode,
            emisCode: emisCode || '',
            udiseCode: udiseCode || '',
            address: address || '',
            district, block,
            panchayat: panchayat || '',
            pinCode: pinCode || '',
            contactNumber: contactNumber || '',
            email: email || '',
            headmasterName,
            logoUrl: logoUrl || '',
            academicYear,
        };
        const existing = await prisma.schoolProfile.findFirst();
        const profile = existing
            ? await prisma.schoolProfile.update({ where: { id: existing.id }, data })
            : await prisma.schoolProfile.create({ data });
        await prisma.activity.create({ data: { type: 'profile', message: 'School profile updated' } });
        await prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                userName: req.user.name || req.user.username,
                userRole: req.user.role,
                action: 'UPDATE_SCHOOL_PROFILE',
                details: `Updated school profile for "${schoolName}"`,
            },
        });
        res.json({ success: true, data: { profile } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=school.js.map