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
const adminRefreshToken_1 = require("../../services/adminRefreshToken");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
const ADMIN_REFRESH_COOKIE = 'admin_refresh_token';
function refreshCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/admin/auth',
        maxAge: (0, adminRefreshToken_1.getRefreshTokenMaxAgeMs)(),
    };
}
function clearRefreshCookie(res) {
    res.clearCookie(ADMIN_REFRESH_COOKIE, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/admin/auth',
    });
}
function adminUserResponse(user) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
}
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
        const refreshToken = await (0, adminRefreshToken_1.createAdminRefreshToken)(user.id);
        res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, refreshCookieOptions());
        await (0, adminLog_1.logAdminAction)({
            adminId: user.id,
            action: 'ADMIN_LOGIN',
            targetType: 'user',
            targetId: user.id,
            req,
        });
        res.json({
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            user: adminUserResponse(user),
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/refresh', async (req, res, next) => {
    try {
        const rawToken = typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
            ? req.cookies[ADMIN_REFRESH_COOKIE]
            : '';
        if (!rawToken) {
            throw new errors_1.AppError(401, 'REFRESH_TOKEN_MISSING', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        const rotated = await (0, adminRefreshToken_1.rotateAdminRefreshToken)(rawToken);
        res.cookie(ADMIN_REFRESH_COOKIE, rotated.rawToken, refreshCookieOptions());
        res.json({
            token: (0, auth_1.generateToken)(rotated.user.id, rotated.user.role),
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            user: adminUserResponse(rotated.user),
        });
    }
    catch (error) {
        clearRefreshCookie(res);
        next(error);
    }
});
router.post('/logout', async (req, res, next) => {
    try {
        const rawToken = typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
            ? req.cookies[ADMIN_REFRESH_COOKIE]
            : '';
        if (rawToken) {
            await (0, adminRefreshToken_1.revokeAdminRefreshToken)(rawToken);
        }
        clearRefreshCookie(res);
        res.json({ ok: true });
    }
    catch (error) {
        clearRefreshCookie(res);
        next(error);
    }
});
exports.default = router;
