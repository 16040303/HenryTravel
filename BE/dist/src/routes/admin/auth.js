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
router.put('/change-password', auth_1.adminAuthMiddleware, async (req, res, next) => {
    try {
        const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
        const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
        const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
        }
        if (newPassword.length < 8) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
        }
        if (newPassword !== confirmPassword) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Mật khẩu xác nhận không khớp.');
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user?.id || '' } });
        if (!user || user.role !== 'admin' || !user.password) {
            throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.');
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new errors_1.AppError(400, 'INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng.');
        }
        const isSamePassword = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new errors_1.AppError(400, 'VALIDATION_ERROR', 'Mật khẩu mới không được trùng mật khẩu hiện tại.');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: passwordHash },
        });
        const rawToken = typeof req.cookies?.[ADMIN_REFRESH_COOKIE] === 'string'
            ? req.cookies[ADMIN_REFRESH_COOKIE]
            : '';
        if (rawToken) {
            await (0, adminRefreshToken_1.revokeAdminRefreshToken)(rawToken);
        }
        clearRefreshCookie(res);
        await (0, adminLog_1.logAdminAction)({
            adminId: user.id,
            action: 'ADMIN_CHANGE_PASSWORD',
            targetType: 'user',
            targetId: user.id,
            req,
        });
        res.json({ ok: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    }
    catch (error) {
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
