import { prisma } from '../../config/prisma.js';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../common/errors.js';
import type { Plan, Subscription } from '../../generated/client/index.js';

export const STANDARD_PLANS = [
  {
    code: 'FREE',
    name: 'Free Trial',
    description: 'Basic retail tools for small single-counter stores',
    price: 0n,
    maxProducts: 50,
    maxStaff: 1,
    maxInvoicesPerMonth: 100,
    hasAnalytics: true,
    hasAuditLogs: false,
  },
  {
    code: 'STARTER',
    name: 'Starter Retailer',
    description: 'Growing shops with up to 500 products and 3 staff members',
    price: 99000n, // 990 BDT
    maxProducts: 500,
    maxStaff: 3,
    maxInvoicesPerMonth: 1000,
    hasAnalytics: true,
    hasAuditLogs: true,
  },
  {
    code: 'PRO',
    name: 'Professional Store',
    description: 'High-volume supermarkets with multi-counter staff and audit trails',
    price: 249000n, // 2,490 BDT
    maxProducts: 2000,
    maxStaff: 10,
    maxInvoicesPerMonth: 5000,
    hasAnalytics: true,
    hasAuditLogs: true,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise Chain',
    description: 'Unlimited catalog, multi-branch operations, and priority infrastructure',
    price: 499000n, // 4,990 BDT
    maxProducts: -1,
    maxStaff: -1,
    maxInvoicesPerMonth: -1,
    hasAnalytics: true,
    hasAuditLogs: true,
  },
];

export class BillingService {
  async ensureStandardPlans(): Promise<void> {
    const existingCount = await prisma.plan.count();
    if (existingCount >= STANDARD_PLANS.length) {
      return;
    }

    for (const p of STANDARD_PLANS) {
      await prisma.plan.upsert({
        where: { code: p.code },
        update: {},
        create: {
          code: p.code,
          name: p.name,
          description: p.description,
          price: p.price,
          maxProducts: p.maxProducts,
          maxStaff: p.maxStaff,
          maxInvoicesPerMonth: p.maxInvoicesPerMonth,
          hasAnalytics: p.hasAnalytics,
          hasAuditLogs: p.hasAuditLogs,
        },
      });
    }
  }

  async listPlans(): Promise<Array<Omit<Plan, 'price'> & { price: number }>> {
    await this.ensureStandardPlans();
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
  }

  async getTenantSubscription(tenantId: string) {
    await this.ensureStandardPlans();

    let subscription = await prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    // Default to FREE plan if no active subscription exists
    if (!subscription) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, status: true },
      });

      if (!tenant) {
        throw new UnauthorizedError('Tenant workspace not found. Please log in again.');
      }

      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError('Tenant account is suspended. Please contact platform support.');
      }

      const freePlan = await prisma.plan.findUniqueOrThrow({
        where: { code: 'FREE' },
      });

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscription = await prisma.subscription.create({
        data: {
          tenantId,
          planId: freePlan.id,
          status: 'ACTIVE',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });
    }

    return {
      id: subscription.id,
      tenantId: subscription.tenantId,
      status: subscription.status,
      startDate: subscription.startDate,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      plan: {
        ...subscription.plan,
        price: Number(subscription.plan.price),
      },
    };
  }

  async assignPlan(tenantId: string, planCode: string, paymentMethod = 'MANUAL_ADMIN') {
    await this.ensureStandardPlans();

    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new NotFoundError(`Plan '${planCode}' not found.`);
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Expire any existing active subscriptions
    await prisma.subscription.updateMany({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      data: { status: 'CANCELLED' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentMethod,
      },
      include: { plan: true },
    });

    return {
      ...subscription,
      plan: {
        ...subscription.plan,
        price: Number(subscription.plan.price),
      },
    };
  }

  async checkProductLimit(tenantId: string): Promise<void> {
    const sub = await this.getTenantSubscription(tenantId);
    if (sub.plan.maxProducts === -1) {
      return; // Unlimited
    }

    const currentCount = await prisma.product.count({
      where: { tenantId, deletedAt: null },
    });

    if (currentCount >= sub.plan.maxProducts) {
      throw new ForbiddenError(
        `Your store has reached the limit of ${sub.plan.maxProducts} products on the ${sub.plan.name} plan. Please upgrade your subscription to add more products.`
      );
    }
  }

  async checkStaffLimit(tenantId: string): Promise<void> {
    const sub = await this.getTenantSubscription(tenantId);
    if (sub.plan.maxStaff === -1) {
      return; // Unlimited
    }

    const currentCount = await prisma.user.count({
      where: { tenantId, isActive: true },
    });

    if (currentCount >= sub.plan.maxStaff) {
      throw new ForbiddenError(
        `Your store has reached the limit of ${sub.plan.maxStaff} staff member(s) on the ${sub.plan.name} plan. Please upgrade your subscription to invite more users.`
      );
    }
  }
}

export const billingService = new BillingService();
