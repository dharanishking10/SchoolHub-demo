"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const activityLog_1 = require("../utils/activityLog");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
async function generateAdmissionNumber() {
    const year = new Date().getFullYear();
    const count = await prisma.student.count();
    return `ADM${year}${String(count + 1).padStart(4, '0')}`;
}
function generateUsername(fullName, rollNumber) {
    const first = fullName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    return `${first}_${rollNumber.toLowerCase()}`;
}
function generatePassword(fullName, dob) {
    const name = fullName.split(' ')[0];
    const year = dob ? dob.split('-')[0] : '2010';
    return `${name}@${year}`;
}
// GET /api/students/stats
router.get('/stats', auth_1.verifyToken, async (_req, res) => {
    try {
        const [total, boys, girls, byClass, recent] = await Promise.all([
            prisma.student.count(),
            prisma.student.count({ where: { gender: 'MALE' } }),
            prisma.student.count({ where: { gender: 'FEMALE' } }),
            prisma.student.groupBy({ by: ['className'], _count: { id: true }, orderBy: { className: 'asc' } }),
            prisma.student.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, admissionNumber: true, fullName: true, className: true, section: true, gender: true, createdAt: true } }),
        ]);
        const attendance = [82, 88, 91, 85, 79, 93, 87, 90, 84, 88, 76, 92];
        const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
        res.json({ success: true, data: { total, boys, girls, classData: byClass.map(c => ({ className: c.className, count: c._count.id })), attendance: months.map((m, i) => ({ month: m, pct: attendance[i] })), recentAdmissions: recent } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students — list with search/filter/pagination
router.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { search = '', className = '', section = '', status = '', page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (className)
            where.className = className;
        if (section)
            where.section = section;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { admissionNumber: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } },
                { fatherName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [students, total] = await Promise.all([
            prisma.student.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, admissionNumber: true, fullName: true, gender: true, dateOfBirth: true, fatherName: true, motherName: true, mobile: true, address: true, className: true, section: true, rollNumber: true, username: true, status: true, createdAt: true } }),
            prisma.student.count({ where }),
        ]);
        res.json({ success: true, data: { students, total, page: parseInt(page), limit: parseInt(limit) } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/students
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        const { fullName, gender, dateOfBirth, fatherName, motherName, mobile, address, className, section, rollNumber, status } = req.body;
        if (!fullName || !gender || !className || !section || !rollNumber) {
            res.status(400).json({ success: false, message: 'Required fields missing' });
            return;
        }
        const admissionNumber = await generateAdmissionNumber();
        const username = generateUsername(fullName, rollNumber);
        const plainPassword = generatePassword(fullName, dateOfBirth || '');
        const hashed = await bcryptjs_1.default.hash(plainPassword, 10);
        const student = await prisma.student.create({
            data: { admissionNumber, fullName, gender, dateOfBirth: dateOfBirth || null, fatherName: fatherName || null, motherName: motherName || null, mobile: mobile || null, address: address || null, className, section, rollNumber, username, password: hashed, status: status || 'ACTIVE' },
            select: { id: true, admissionNumber: true, fullName: true, gender: true, className: true, section: true, rollNumber: true, username: true, status: true, createdAt: true },
        });
        await prisma.activity.create({ data: { type: 'student', message: `New student ${fullName} admitted (${admissionNumber})` } });
        await (0, activityLog_1.notifyAllOfRole)('HEADMASTER', 'student', 'Student Added', `New student ${fullName} admitted (${admissionNumber})`);
        await (0, activityLog_1.audit)(req.user.userId, req.user.name || 'User', req.user.role, 'Student Added', `${fullName} (${admissionNumber})`);
        res.json({ success: true, data: { student, generatedPassword: plainPassword, generatedUsername: username } });
    }
    catch (err) {
        const e = err;
        if (e.code === 'P2002') {
            res.status(409).json({ success: false, message: 'Roll number or username already exists' });
            return;
        }
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/students/:id
router.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { fullName, gender, dateOfBirth, fatherName, motherName, mobile, address, className, section, rollNumber, status } = req.body;
        const student = await prisma.student.update({
            where: { id },
            data: { fullName, gender, dateOfBirth: dateOfBirth || null, fatherName: fatherName || null, motherName: motherName || null, mobile: mobile || null, address: address || null, className, section, rollNumber, status },
            select: { id: true, admissionNumber: true, fullName: true, gender: true, className: true, section: true, rollNumber: true, username: true, status: true },
        });
        await prisma.activity.create({ data: { type: 'student', message: `Student ${fullName} profile updated` } });
        res.json({ success: true, data: { student } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/students/:id
router.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        await prisma.student.delete({ where: { id } });
        await prisma.activity.create({ data: { type: 'student', message: `Student ${student.fullName} removed from records` } });
        await (0, activityLog_1.audit)(req.user.userId, req.user.name || 'User', req.user.role, 'Student Deleted', `${student.fullName} (${student.admissionNumber})`);
        res.json({ success: true, message: 'Student deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=students.js.map