"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../lib/prisma");
const auth_1 = require("../../middleware/auth");
const adminLog_1 = require("../../services/adminLog");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
router.post('/login', async (req, res, next) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        if (!email || !password) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Email và mật khẩu là bắt buộc.');
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== 'admin' || !user.password) {
            throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
        }
        const token = (0, auth_1.generateToken)(user.id, user.role);
        await (0, adminLog_1.logAdminAction)({
            adminId: user.id,
            action: 'ADMIN_LOGIN',
            targetType: 'user',
            targetId: user.id,
            req,
        });
        res.json({
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '8h',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
