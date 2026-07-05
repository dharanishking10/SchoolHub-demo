"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.verifyToken, async (_req, res) => {
    try {
        const classes = await prisma.schoolClass.findMany({ orderBy: [{ name: 'asc' }, { section: 'asc' }] });
        res.json({ success: true, data: { classes } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=classes.js.map