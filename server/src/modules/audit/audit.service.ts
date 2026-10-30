import type { Prisma } from '../../generated/client/index.js';
import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';

export interface CreateAuditLogInput {
  tenantId: string;
  userId?: string | null | undefined;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

export class AuditService {
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          details: input.details ?? {},
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (err) {
      logger.error({ err, input }, 'Failed to record audit log entry');
    }
  }

  async getLogs(params: {
    tenantId: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      tenantId: params.tenantId,
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }
}

export const auditService = new AuditService();
