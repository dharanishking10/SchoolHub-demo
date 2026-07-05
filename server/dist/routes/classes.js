"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const activityLog_1 = require("../utils/activityLog");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// ── helpers ─────────────────────────────────────────────────────────────────
function requireHeadmaster(req, res) {
    if (req.user?.role !== 'HEADMASTER') {
        res.status(403).json({ success: false, message: 'Headmaster access only' });
        return false;
    }
    return true;
}
const classInclude = {
    classTeacher: { select: { id: true, fullName: true, subject: true, employeeId: true } },
};
async function withStudentCount(cls) {
    const count = await prisma.student.count({
        where: { className: cls.name, section: cls.section, status: 'ACTIVE' },
    });
    return { ...cls, currentStudentCount: count };
}
// ── GET /api/classes ─────────────────────────────────────────────────────────
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        // Students have no access
        if (req.user?.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        const { search = '', academicYear = '', status = '', page = '1', limit = '10', } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { section: { contains: search, mode: 'insensitive' } },
                { academicYear: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (academicYear)
            where.academicYear = academicYear;
        if (status)
            where.status = status;
        const [total, classes] = await Promise.all([
            prisma.schoolClass.count({ where }),
            prisma.schoolClass.findMany({
                where,
                include: classInclude,
                orderBy: [{ academicYear: 'desc' }, { name: 'asc' }, { section: 'asc' }],
                skip,
                take: parseInt(limit),
            }),
        ]);
        // Attach current student count for each class
        const classesWithCount = await Promise.all(classes.map(withStudentCount));
        // Distinct academic years for filter dropdown
        const years = await prisma.schoolClass.findMany({
            select: { academicYear: true },
            distinct: ['academicYear'],
            orderBy: { academicYear: 'desc' },
        });
        res.json({
            success: true,
            data: {
                classes: classesWithCount,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                academicYears: years.map(y => y.academicYear),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ── GET /api/classes/:id ─────────────────────────────────────────────────────
router.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user?.role === 'STUDENT') {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        const cls = await prisma.schoolClass.findUnique({
            where: { id: parseInt(req.params.id) },
            include: classInclude,
        });
        if (!cls) {
            res.status(404).json({ success: false, message: 'Class not found' });
            return;
        }
        const withCount = await withStudentCount(cls);
        res.json({ success: true, data: withCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ── POST /api/classes ────────────────────────────────────────────────────────
router.post('/', auth_1.verifyToken, async (req, res) => {
    if (!requireHeadmaster(req, res))
        return;
    try {
        const { name, section, academicYear, classTeacherId, roomNumber, maxStrength, status } = req.body;
        if (!name || !section || !academicYear) {
            res.status(400).json({ success: false, message: 'Class name, section, and academic year are required' });
            return;
        }
        // Duplicate check
        const existing = await prisma.schoolClass.findUnique({
            where: { name_section_academicYear: { name, section, academicYear } },
        });
        if (existing) {
            res.status(409).json({ success: false, message: `Class ${name}-${section} already exists for ${academicYear}` });
            return;
        }
        const cls = await prisma.schoolClass.create({
            data: {
                name,
                section,
                academicYear,
                classTeacherId: classTeacherId ? parseInt(String(classTeacherId)) : null,
                roomNumber: roomNumber || '',
                maxStrength: maxStrength ? parseInt(String(maxStrength)) : 40,
                status: status || 'ACTIVE',
            },
            include: classInclude,
        });
        await (0, activityLog_1.audit)(req.user.userId, req.user.username, req.user.role, 'CLASS_CREATED', `Created class ${name}-${section} (${academicYear})`);
        const withCount = await withStudentCount(cls);
        res.status(201).json({ success: true, data: withCount, message: 'Class created successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ── PUT /api/classes/:id ─────────────────────────────────────────────────────
router.put('/:id', auth_1.verifyToken, async (req, res) => {
    if (!requireHeadmaster(req, res))
        return;
    try {
        const id = parseInt(req.params.id);
        const { name, section, academicYear, classTeacherId, roomNumber, maxStrength, status } = req.body;
        if (!name || !section || !academicYear) {
            res.status(400).json({ success: false, message: 'Class name, section, and academic year are required' });
            return;
        }
        const existing = await prisma.schoolClass.findFirst({
            where: { name, section, academicYear, NOT: { id } },
        });
        if (existing) {
            res.status(409).json({ success: false, message: `Class ${name}-${section} already exists for ${academicYear}` });
            return;
        }
        const cls = await prisma.schoolClass.update({
            where: { id },
            data: {
                name,
                section,
                academicYear,
                classTeacherId: classTeacherId ? parseInt(String(classTeacherId)) : null,
                roomNumber: roomNumber || '',
                maxStrength: maxStrength ? parseInt(String(maxStrength)) : 40,
                status: status || 'ACTIVE',
            },
            include: classInclude,
        });
        await (0, activityLog_1.audit)(req.user.userId, req.user.username, req.user.role, 'CLASS_UPDATED', `Updated class ${name}-${section} (${academicYear})`);
        const withCount = await withStudentCount(cls);
        res.json({ success: true, data: withCount, message: 'Class updated successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ── DELETE /api/classes/:id ──────────────────────────────────────────────────
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    if (!requireHeadmaster(req, res))
        return;
    try {
        const id = parseInt(req.params.id);
        const cls = await prisma.schoolClass.findUnique({ where: { id } });
        if (!cls) {
            res.status(404).json({ success: false, message: 'Class not found' });
            return;
        }
        await prisma.schoolClass.delete({ where: { id } });
        await (0, activityLog_1.audit)(req.user.userId, req.user.username, req.user.role, 'CLASS_DELETED', `Deleted class ${cls.name}-${cls.section} (${cls.academicYear})`);
        res.json({ success: true, message: 'Class deleted successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=classes.js.map