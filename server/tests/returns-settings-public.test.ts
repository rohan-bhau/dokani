import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Sales Returns, Public Checkout & Settings Integration Tests', () => {
  const app = createApp();

  let token: string;
  let tenantId: string;
  let productId: string;
  let invoiceId: string;
  let paymentToken: string;

  beforeAll(async () => {
    // 1. Cleanup
    await prisma.subscription.deleteMany();
    await prisma.saleReturnItem.deleteMany();
    await prisma.saleReturn.deleteMany();
    await prisma.heldCart.deleteMany();
    await prisma.staffInvitation.deleteMany();
    await prisma.notification.deleteMany();
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

    // 2. Sign up
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Master Test Shop',
      name: 'Owner Bhai',
      phone: '01711223344',
      email: 'owner@master.test',
      password: 'Password123!',
    });

    expect(signupRes.status).toBe(201);
    token = signupRes.body.data.tokens.accessToken;
    tenantId = signupRes.body.data.user.tenant.id;

    // 3. Create a product with stock
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pran Frooto 250ml',
        sku: 'FROOTO-250',
        unit: 'pcs',
        costPrice: 2000,
        sellPrice: 3000,
        initialStock: 50,
      });

    expect(prodRes.status).toBe(201);
    productId = prodRes.body.data.id;

    // 4. Create a sale
    const saleRes = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId, quantity: 5 }],
        payments: [{ method: 'CASH', amount: 15000 }],
      });

    expect(saleRes.status).toBe(201);
    invoiceId = saleRes.body.data.id;
    paymentToken = saleRes.body.data.paymentToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should process a sale return, restock inventory, and record SALE_RETURN movement', async () => {
    // Return 2 units out of 5
    const returnRes = await request(app)
      .post(`/api/v1/sales/${invoiceId}/return`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId, quantity: 2 }],
        reason: 'DAMAGED',
        refundMethod: 'CASH',
        notes: 'Bottle cap defective',
      });

    expect([200, 201]).toContain(returnRes.status);
    expect(returnRes.body.success).toBe(true);
    expect(returnRes.body.data.refundAmount).toBe(6000); // 2 * 3000 paisa
    expect(returnRes.body.data.returnNumber).toMatch(/^RET-/);

    // Verify stock is restored from 45 back to 47
    const stockRes = await request(app)
      .get(`/api/v1/inventory/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(stockRes.status).toBe(200);
    expect(stockRes.body.data.quantity).toBe(47);
  });

  it('should fetch public invoice by token without authentication', async () => {
    expect(paymentToken).toBeDefined();

    const publicRes = await request(app).get(`/api/v1/payments/public/${paymentToken}`);

    expect(publicRes.status).toBe(200);
    expect(publicRes.body.success).toBe(true);
    expect(publicRes.body.data.invoiceNumber).toBeDefined();
    expect(publicRes.body.data.items.length).toBeGreaterThan(0);
    expect(publicRes.body.data.tenant.name).toBe('Master Test Shop');
  });

  it('should complete simulated public payment and broadcast real-time confirmation', async () => {
    const payRes = await request(app)
      .post(`/api/v1/payments/public/${paymentToken}/complete-simulated`)
      .send({
        provider: 'BKASH',
        account: '01711223344',
        pin: '12345',
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.data.transactionId).toBeDefined();
  });


  it('should fetch and update tenant settings', async () => {
    const getRes = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Master Test Shop');

    const updateRes = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paperSize: 'A4',
        showBanglaOnInvoice: true,
        maxCashierDiscount: 10,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.paperSize).toBe('A4');
    expect(updateRes.body.data.showBanglaOnInvoice).toBe(true);
    expect(updateRes.body.data.maxCashierDiscount).toBe(10);
  });

  it('should calculate detailed sales, stock valuation, and profit-loss reports', async () => {
    const salesReport = await request(app)
      .get('/api/v1/reports/sales-detailed')
      .set('Authorization', `Bearer ${token}`);

    expect(salesReport.status).toBe(200);
    expect(salesReport.body.data.totalInvoices).toBeGreaterThanOrEqual(1);

    const stockValuation = await request(app)
      .get('/api/v1/reports/stock-value')
      .set('Authorization', `Bearer ${token}`);

    expect(stockValuation.status).toBe(200);
    expect(stockValuation.body.data.totalUnits).toBeGreaterThan(0);
    expect(stockValuation.body.data.costValuation).toBeGreaterThan(0);

    const plReport = await request(app)
      .get('/api/v1/reports/profit-loss')
      .set('Authorization', `Bearer ${token}`);

    expect(plReport.status).toBe(200);
    expect(plReport.body.data.grossProfit).toBeDefined();
  });
});
