import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { signAccessToken } from '../src/modules/auth/auth.jwt.js';

describe('Unlimited Store Resources & Platform Admin Tests', () => {
  const app = createApp();
  let tenantId: string;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.subscription.deleteMany();
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

    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Dhaka Retail Mart',
      name: 'Tanvir Owner',
      phone: '01700000001',
      email: 'tanvir@dokani.test',
      password: 'Password123!',
    });

    tenantId = signupRes.body.data.user.tenant.id;
    ownerToken = signupRes.body.data.tokens.accessToken;

    adminToken = signAccessToken({
      userId: '00000000-0000-0000-0000-000000000001',
      tenantId,
      permissions: ['platform:manage'],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('should allow newly registered store to add multiple products without plan quota restrictions', async () => {
    const firstProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Miniket Rice 5kg',
        sku: 'RICE-01',
        costPrice: 350,
        sellPrice: 420,
      });

    expect(firstProd.status).toBe(201);

    const secondProd = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Soybean Oil 2L',
        sku: 'OIL-02',
        costPrice: 310,
        sellPrice: 360,
      });

    expect(secondProd.status).toBe(201);
  });

  it('should allow newly registered store to add multiple staff members without plan quota errors', async () => {
    const rolesRes = await request(app)
      .get('/api/v1/staff/roles/permissions')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(rolesRes.status).toBe(200);
    const roles: Array<{ id: string; name: string }> = rolesRes.body.data.roles;
    const cashierRole = roles.find((r) => r.name === 'CASHIER');
    const managerRole = roles.find((r) => r.name === 'MANAGER');

    expect(cashierRole).toBeDefined();
    expect(managerRole).toBeDefined();

    const firstStaff = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Rafiqul Cashier',
        phone: '01711223344',
        email: '',
        password: 'Password123!',
        roleId: cashierRole!.id,
      });

    expect(firstStaff.status).toBe(201);
    expect(firstStaff.body.success).toBe(true);
    expect(firstStaff.body.data.role).toBe('CASHIER');

    const secondStaff = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Nusrat Manager',
        phone: '01811223355',
        email: 'nusrat@dokani.test',
        password: 'Password123!',
        roleId: managerRole!.id,
      });

    expect(secondStaff.status).toBe(201);
    expect(secondStaff.body.success).toBe(true);
    expect(secondStaff.body.data.role).toBe('MANAGER');

    const staffList = await request(app)
      .get('/api/v1/staff')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(staffList.status).toBe(200);
    expect(staffList.body.data.users.length).toBe(3);
  });

  it('should reject non-admin access to platform admin endpoints with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tenants')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should allow platform admin to list tenants, view details, and suspend/reactivate', async () => {
    const listRes = await request(app)
      .get('/api/v1/admin/tenants')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.tenants.length).toBeGreaterThanOrEqual(1);

    const targetTenant = listRes.body.data.tenants.find((t: { id: string }) => t.id === tenantId);
    expect(targetTenant).toBeDefined();
    expect(targetTenant.name).toBe('Dhaka Retail Mart');
    expect(targetTenant.status).toBe('ACTIVE');

    const detailsRes = await request(app)
      .get(`/api/v1/admin/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.data.id).toBe(tenantId);

    const suspendRes = await request(app)
      .patch(`/api/v1/admin/tenants/${tenantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('SUSPENDED');

    const activateRes = await request(app)
      .patch(`/api/v1/admin/tenants/${tenantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe('ACTIVE');
  });
});
