"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.adminAuthMiddleware = adminAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new errors_1.AppError(500, 'JWT_SECRET_MISSING', 'JWT secret is not configured.');
    }
    return secret;
}
function generateToken(userId, role) {
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
    };
    return jsonwebtoken_1.default.sign({ userId, role }, getJwtSecret(), options);
}
function verifyToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
    if (typeof decoded !== 'object' || !('userId' in decoded) || !('role' in decoded)) {
        throw new errors_1.AppError(401, 'INVALID_TOKEN', 'Token không hợp lệ.');
    }
    return decoded;
}
async function adminAuthMiddleware(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
        }
        const token = authHeader.slice('Bearer '.length).trim();
        if (!token) {
            throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập admin.');
        }
        let payload;
        try {
            payload = verifyToken(token);
        }
        catch {
            throw new errors_1.AppError(401, 'INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn.');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true, role: true },
        });
        if (!user || user.role !== 'admin') {
            throw new errors_1.AppError(403, 'FORBIDDEN', 'Bạn không có quyền admin.');
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
