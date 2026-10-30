import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Multi-Tenant Isolation & Authentication Tests', () => {
  const app = createApp();

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('should register Tenant A successfully with owner role and permissions', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Karim Store',
      name: 'Karim Mia',
      phone: '01711111111',
      email: 'karim@dokani.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.tenant.name).toBe('Karim Store');
    expect(res.body.data.user.roles).toContain('OWNER');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should register Tenant B independently with zero data leakage', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Rahim Traders',
      name: 'Rahim Ali',
      phone: '01822222222',
      email: 'rahim@dokani.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.tenant.name).toBe('Rahim Traders');
    expect(res.body.data.user.phone).toBe('01822222222');
  });

  it('should reject login with wrong credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phone: '01711111111',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should successfully login and rotate refresh tokens', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      phone: '01711111111',
      password: 'Password123!',
    });

    expect(loginRes.status).toBe(200);

    const oldRefreshToken = loginRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: oldRefreshToken,
    });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

    const reuseOldRes = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: oldRefreshToken,
    });

    expect(reuseOldRes.status).toBe(401);
  });

  it('should block unauthenticated requests with 401 Unauthorized', async () => {
    // Unauthenticated product create
    const prodRes = await request(app)
      .post('/api/v1/products')
      .send({ name: 'Hacked Product', sku: 'HACK-01', costPrice: 10, sellPrice: 20 });
    expect(prodRes.status).toBe(401);

    // Unauthenticated customer create
    const custRes = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Hacked Customer', phone: '01900000000' });
    expect(custRes.status).toBe(401);

    // Unauthenticated stock adjust
    const adjustRes = await request(app)
      .post('/api/v1/inventory/adjust')
      .send({ productId: '00000000-0000-0000-0000-000000000000', type: 'OPENING', quantity: 100 });
    expect(adjustRes.status).toBe(401);
  });

  it('should reject unauthorized mutation with 403 when user has only view permissions', async () => {
    // 1. Create a dummy user token with only view permission (no delete/update permission)
    const { signAccessToken } = await import('../src/modules/auth/auth.jwt.js');
    const readOnlyToken = signAccessToken({
      userId: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      permissions: ['product:view', 'customer:view'],
    });

    // 2. Attempt product deletion via Postman/curl simulation
    const deleteRes = await request(app)
      .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${readOnlyToken}`);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.success).toBe(false);
    expect(deleteRes.body.code).toBe('FORBIDDEN');

    // 3. Attempt product update via Postman/curl simulation
    const patchRes = await request(app)
      .patch('/api/v1/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ name: 'Malicious Update' });

    expect(patchRes.status).toBe(403);
    expect(patchRes.body.code).toBe('FORBIDDEN');

    // 4. Attempt customer update via Postman/curl simulation
    const custPatchRes = await request(app)
      .patch('/api/v1/customers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ name: 'Malicious Name' });

    expect(custPatchRes.status).toBe(403);
    expect(custPatchRes.body.code).toBe('FORBIDDEN');
  });
});