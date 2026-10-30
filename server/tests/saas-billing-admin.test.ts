import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { signAccessToken } from '../src/modules/auth/auth.jwt.js';

describe('SaaS Billing, Quota Guards & Platform Admin Tests (Phase 8)', () => {
  const app = createApp();
  let tenantId: string;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Cascade table cleanup
    await prisma.subscription.deleteMany();
    await prisma.plan.updateMany({
      where: { code: 'FREE' },
      data: { maxProducts: 50 },
    });
    await prisma.webhookEvent.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customerLedger.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.tenantCounter.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.stockLevel.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // 1. Create a Store Owner
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'SaaS Super Shop',
      name: 'Tanvir Owner',
      phone: '01700000001',
      email: 'tanvir@dokani.test',
      password: 'Password123!',
    });

    tenantId = signupRes.body.data.user.tenant.id;
    ownerToken = signupRes.body.data.tokens.accessToken;

    // 2. Create a Platform Admin token with platform:manage permission
    adminToken = signAccessToken({
      userId: '00000000-0000-0000-0000-000000000001',
      tenantId,
      permissions: ['platform:manage'],
    });
  });

  afterAll(async () => {
    await prisma.plan.updateMany({
      where: { code: 'FREE' },
      data: { maxProducts: 50 },
    });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('should list all standard SaaS plans publicly', async () => {
    const res = await request(app).get('/api/v1/billing/plans');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const codes = res.body.data.map((p: { code: string }) => p.code);
    expect(codes).toContain('FREE');
    expect(codes).toContain('STARTER');
    expect(codes).toContain('PRO');
    expect(codes).toContain('ENTERPRISE');
  });

  it('should auto-assign FREE plan to tenant and return active subscription', async () => {
    const res = await request(app)
      .get('/api/v1/billing/subscription')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan.code).toBe('FREE');
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('should enforce product creation quota limit when plan limit is reached', async () => {
    // Temporarily set FREE plan maxProducts = 1 for testing limit enforcement
    await prisma.plan.update({
      where: { code: 'FREE' },
      data: { maxProducts: 1 },
    });

    // 1. First product should succeed
    const firstProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Allowed Item 1',
        sku: 'ALLOWED-01',
        costPrice: 50,
        sellPrice: 75,
      });

    expect(firstProd.status).toBe(201);

    // 2. Second product should be blocked with 403 Forbidden by featureGuard
    const secondProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Blocked Item 2',
        sku: 'BLOCKED-02',
        costPrice: 100,
        sellPrice: 150,
      });

    expect(secondProd.status).toBe(403);
    expect(secondProd.body.code).toBe('FORBIDDEN');
    expect(secondProd.body.message).toContain('limit of 1 products');
  });

  it('should allow merchant to upgrade plan and bypass earlier limit', async () => {
    // Upgrade to PRO plan
    const upgradeRes = await request(app)
      .post('/api/v1/billing/subscribe')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ planCode: 'PRO' });

    expect(upgradeRes.status).toBe(200);
    expect(upgradeRes.body.success).toBe(true);
    expect(upgradeRes.body.data.plan.code).toBe('PRO');

    // Now adding the second product should succeed!
    const secondProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Now Allowed Item 2',
        sku: 'ALLOWED-02',
        costPrice: 100,
        sellPrice: 150,
      });

    expect(secondProd.status).toBe(201);

    // Restore standard FREE plan quota limit so subsequent tests are unaffected
    await prisma.plan.update({
      where: { code: 'FREE' },
      data: { maxProducts: 50 },
    });
  });

  it('should reject non-admin access to platform admin endpoints with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tenants')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should allow platform admin to list tenants, view details, and suspend/reactivate', async () => {
    // 1. List all tenants
    const listRes = await request(app)
      .get('/api/v1/admin/tenants')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.tenants.length).toBeGreaterThanOrEqual(1);

    const targetTenant = listRes.body.data.tenants.find((t: { id: string }) => t.id === tenantId);
    expect(targetTenant).toBeDefined();
    expect(targetTenant.name).toBe('SaaS Super Shop');

    // 2. View tenant detailed profile
    const detailsRes = await request(app)
      .get(`/api/v1/admin/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.data.id).toBe(tenantId);
    expect(detailsRes.body.data.subscriptions.length).toBeGreaterThanOrEqual(1);

    // 3. Suspend tenant
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/tenants/${tenantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('SUSPENDED');

    // 4. Reactivate tenant
    const activateRes = await request(app)
      .patch(`/api/v1/admin/tenants/${tenantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe('ACTIVE');
  });
});
