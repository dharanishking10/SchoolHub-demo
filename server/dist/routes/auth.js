"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ success: false, message: 'Username and password are required' });
            return;
        }
        // 1. Try User table (Headmaster)
        const user = await prisma.user.findUnique({ where: { username } });
        if (user) {
            const isValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isValid) {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
                return;
            }
            const token = (0, auth_1.signToken)({ userId: user.id, username: user.username, role: user.role, name: user.name || user.username });
            res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role, name: user.name } } });
            return;
        }
        // 2. Try Teacher table
        const teacher = await prisma.teacher.findUnique({ where: { username } });
        if (teacher) {
            const isValid = await bcryptjs_1.default.compare(password, teacher.password);
            if (!isValid) {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
                return;
            }
            const token = (0, auth_1.signToken)({ userId: teacher.id, username: teacher.username, role: 'TEACHER', name: teacher.fullName });
            res.json({ success: true, data: { token, user: { id: teacher.id, username: teacher.username, role: 'TEACHER', name: teacher.fullName } } });
            return;
        }
        // 3. Try Student table
        const student = await prisma.student.findUnique({ where: { username } });
        if (student) {
            const isValid = await bcryptjs_1.default.compare(password, student.password || '');
            if (!isValid) {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
                return;
            }
            const token = (0, auth_1.signToken)({ userId: student.id, username: student.username || '', role: 'STUDENT', name: student.fullName });
            res.json({ success: true, data: { token, user: { id: student.id, username: student.username, role: 'STUDENT', name: student.fullName, admissionNumber: student.admissionNumber, className: student.className, section: student.section } } });
            return;
        }
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/me', auth_1.verifyToken, async (req, res) => {
    try {
        if (req.user.role === 'HEADMASTER') {
            const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, username: true, role: true, name: true, email: true } });
            res.json({ success: true, data: { user } });
        }
        else if (req.user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({ where: { id: req.user.userId }, select: { id: true, username: true, fullName: true, subject: true, employeeId: true, mobile: true, email: true, status: true } });
            res.json({ success: true, data: { user: { ...teacher, role: 'TEACHER', name: teacher?.fullName } } });
        }
        else {
            const student = await prisma.student.findUnique({ where: { id: req.user.userId }, select: { id: true, username: true, fullName: true, admissionNumber: true, className: true, section: true, rollNumber: true, gender: true, fatherName: true, motherName: true, mobile: true, address: true, dateOfBirth: true, status: true } });
            res.json({ success: true, data: { user: { ...student, role: 'STUDENT', name: student?.fullName } } });
        }
    }
    catch {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map