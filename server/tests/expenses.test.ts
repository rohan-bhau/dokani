import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Expenses Management & P&L Integration Tests', () => {
  const app = createApp();

  let token: string;
  let tenantId: string;
  let expenseId: string;

  beforeAll(async () => {
    // Cascade table cleanup
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
    await prisma.expense.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // 1. Sign up merchant owner
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Expense Mart',
      name: 'Shop Owner',
      phone: '01855667788',
      email: 'owner@expense.test',
      password: 'Password123!',
    });

    expect(signupRes.status).toBe(201);
    token = signupRes.body.data.tokens.accessToken;
    tenantId = signupRes.body.data.user.tenant.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should record an operating expense successfully', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'RENT',
        amount: 2500000, // 25,000 BDT in poisha
        note: 'Monthly shop floor rent for October',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('RENT');
    expect(res.body.data.amount).toBe(2500000);
    expect(res.body.data.tenantId).toBe(tenantId);
    expect(res.body.data.note).toBe('Monthly shop floor rent for October');

    expenseId = res.body.data.id;
  });

  it('should list recorded expenses with total aggregate amount', async () => {
    // Add second expense
    await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'ELECTRICITY',
        amount: 450000, // 4,500 BDT in poisha
        note: 'DESCO electricity bill',
      });

    const res = await request(app)
      .get('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.totalAmount).toBe(2950000); // 2500000 + 450000
    expect(res.body.data.items.length).toBe(2);
  });

  it('should filter expenses by category', async () => {
    const res = await request(app)
      .get('/api/v1/expenses?category=RENT')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].category).toBe('RENT');
  });

  it('should retrieve a single expense by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(expenseId);
    expect(res.body.data.category).toBe('RENT');
  });

  it('should deduct expenses from profit & loss executive summary', async () => {
    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data;
    expect(summary.sales.totalExpenses).toBe(2950000);
    expect(summary.sales.netProfit).toBe(summary.sales.grossProfit - 2950000);
  });

  it('should delete an expense record successfully', async () => {
    const delRes = await request(app)
      .delete(`/api/v1/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify 404 after deletion
    const getRes = await request(app)
      .get(`/api/v1/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/expenses');
    expect(res.status).toBe(401);
  });
});
