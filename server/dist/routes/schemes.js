"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const HEADMASTER_ONLY = [auth_1.verifyToken, (0, auth_1.requireRole)('HEADMASTER')];
// GET /api/schemes — list all with optional filters (HEADMASTER only)
router.get('/', auth_1.verifyToken, (0, auth_1.requireRole)('HEADMASTER'), async (req, res) => {
    try {
        const { schemeName, className, section, academicYear, status, search } = req.query;
        const where = {};
        if (schemeName)
            where.schemeName = schemeName;
        if (className)
            where.className = className;
        if (section)
            where.section = section;
        if (academicYear)
            where.academicYear = academicYear;
        if (status)
            where.status = status;
        if (search) {
            where.student = { fullName: { contains: search, mode: 'insensitive' } };
        }
        const schemes = await prisma.governmentScheme.findMany({
            where,
            include: { student: { select: { fullName: true, rollNumber: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: { schemes } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/schemes — create
router.post('/', ...HEADMASTER_ONLY, async (req, res) => {
    try {
        const { studentId, className, section, academicYear, schemeName, distributionDate, status, remarks } = req.body;
        if (!studentId || !className || !section || !academicYear || !schemeName) {
            res.status(400).json({ success: false, message: 'Required fields missing' });
            return;
        }
        const scheme = await prisma.governmentScheme.create({
            data: {
                studentId: Number(studentId),
                className,
                section,
                academicYear,
                schemeName,
                distributionDate: distributionDate || '',
                status: status || 'PENDING',
                remarks: remarks || '',
            },
            include: { student: { select: { fullName: true, rollNumber: true } } },
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                userName: req.user.name || req.user.username,
                userRole: req.user.role,
                action: 'CREATE_SCHEME',
                details: `Created scheme "${schemeName}" for student ID ${studentId}`,
            },
        });
        res.json({ success: true, data: { scheme } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/schemes/:id — update
router.put('/:id', ...HEADMASTER_ONLY, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { studentId, className, section, academicYear, schemeName, distributionDate, status, remarks } = req.body;
        const scheme = await prisma.governmentScheme.update({
            where: { id },
            data: {
                studentId: studentId ? Number(studentId) : undefined,
                className,
                section,
                academicYear,
                schemeName,
                distributionDate: distributionDate ?? undefined,
                status,
                remarks: remarks ?? undefined,
            },
            include: { student: { select: { fullName: true, rollNumber: true } } },
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                userName: req.user.name || req.user.username,
                userRole: req.user.role,
                action: 'UPDATE_SCHEME',
                details: `Updated scheme ID ${id}`,
            },
        });
        res.json({ success: true, data: { scheme } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/schemes/:id
router.delete('/:id', ...HEADMASTER_ONLY, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.governmentScheme.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                userId: req.user.userId,
                userName: req.user.name || req.user.username,
                userRole: req.user.role,
                action: 'DELETE_SCHEME',
                details: `Deleted scheme ID ${id}`,
            },
        });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/schemes/export — CSV
router.get('/export', ...HEADMASTER_ONLY, async (req, res) => {
    try {
        const schemes = await prisma.governmentScheme.findMany({
            include: { student: { select: { fullName: true, rollNumber: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const rows = schemes.map(s => ({
            Student: s.student.fullName,
            RollNumber: s.student.rollNumber,
            Class: s.className,
            Section: s.section,
            AcademicYear: s.academicYear,
            Scheme: s.schemeName,
            DistributionDate: s.distributionDate,
            Status: s.status,
            Remarks: s.remarks,
        }));
        const headers = Object.keys(rows[0] || {
            Student: '', RollNumber: '', Class: '', Section: '', AcademicYear: '',
            Scheme: '', DistributionDate: '', Status: '', Remarks: '',
        });
        const escape = (v) => {
            const s = v === null || v === undefined ? '' : String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="government-schemes.csv"');
        res.send(csv);
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=schemes.js.map