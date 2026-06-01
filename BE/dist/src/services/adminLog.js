"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminAction = logAdminAction;
const prisma_1 = require("../lib/prisma");
function getClientIp(req) {
    if (!req)
        return undefined;
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
        return forwardedFor[0].split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress;
}
async function logAdminAction(params) {
    try {
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId: params.adminId,
                action: params.action,
                targetType: params.targetType || 'system',
                targetId: params.targetId || params.adminId,
                ipAddress: getClientIp(params.req),
                userAgent: params.req?.headers['user-agent'],
            },
        });
    }
    catch (error) {
        console.error('ADMIN_LOG_FAILED', {
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            metadata: params.metadata,
            error,
        });
    }
}
