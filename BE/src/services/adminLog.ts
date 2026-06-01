import type { Request } from 'express';
import { prisma } from '../lib/prisma';

interface LogAdminActionParams {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
  req?: Request;
}

function getClientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress;
}

export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType || 'system',
        targetId: params.targetId || params.adminId,
        ipAddress: getClientIp(params.req),
        userAgent: params.req?.headers['user-agent'],
      },
    });
  } catch (error) {
    console.error('ADMIN_LOG_FAILED', {
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
      error,
    });
  }
}
