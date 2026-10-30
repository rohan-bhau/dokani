import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors.js';
import { billingService } from '../billing/billing.service.js';
import type { TenantStatus } from '../../generated/client/index.js';

export interface QueryTenantsInput {
  page?: number | undefined;
  limit?: number | undefined;
  q?: string | undefined;
  status?: TenantStatus | undefined;
}

export class AdminService {
  async listTenants(query: QueryTenantsInput) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: {
      status?: TenantStatus;
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; slug?: { contains: string; mode: 'insensitive' }; phone?: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { slug: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIALING'] } },
            include: { plan: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              users: true,
              products: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    const formatted = tenants.map((t) => {
      const activeSub = t.subscriptions[0];
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        phone: t.phone,
        status: t.status,
        createdAt: t.createdAt,
        counts: {
          users: t._count.users,
          products: t._count.products,
          invoices: t._count.invoices,
        },
        subscription: activeSub
          ? {
              status: activeSub.status,
              planName: activeSub.plan.name,
              planCode: activeSub.plan.code,
              currentPeriodEnd: activeSub.currentPeriodEnd,
            }
          : {
              status: 'ACTIVE',
              planName: 'Free Trial',
              planCode: 'FREE',
              currentPeriodEnd: null,
            },
      };
    });

    return {
      tenants: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenantDetails(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            invoices: true,
            customers: true,
            suppliers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found.');
    }

    return {
      ...tenant,
      subscriptions: tenant.subscriptions.map((s) => ({
        ...s,
        plan: {
          ...s.plan,
          price: Number(s.plan.price),
        },
      })),
    };
  }

  async updateTenantStatus(id: string, status: TenantStatus) {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Tenant not found.');
    }

    return prisma.tenant.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async assignSubscription(tenantId: string, planCode: string) {
    return billingService.assignPlan(tenantId, planCode, 'PLATFORM_ADMIN_OVERRIDE');
  }
}

export const adminService = new AdminService();
