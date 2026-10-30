import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { processLowStockCheck } from '../src/jobs/low-stock.worker.js';

describe('Reports, Auditing & Background Worker Tests (Phase 7)', () => {
  const app = createApp();
  let tenantId: string;
  let ownerToken: string;
  let testProductId: string;

  beforeAll(async () => {
    // Clean up dependent child tables first
    await prisma.subscription.deleteMany();
    await prisma.expense.deleteMany();
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

    // 1. Create Tenant and Owner
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      tenantName: 'Analytics Mart',
      name: 'Report Owner',
      phone: '01799999999',
      email: 'report@dokani.test',
      password: 'Password123!',
    });

    tenantId = signupRes.body.data.user.tenant.id;
    ownerToken = signupRes.body.data.tokens.accessToken;

    // 2. Create Category and Products
    const cat = await prisma.category.create({
      data: { tenantId, name: 'Groceries' },
    });

    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Miniket Rice 25kg',
        sku: 'RICE-25KG-TEST',
        categoryId: cat.id,
        costPrice: 150000, // 1500 BDT
        sellPrice: 180000, // 1800 BDT
        unit: 'BAG',
        initialStock: 10,
        reorderLevel: 5,
      });

    testProductId = prodRes.body.data.id;

    // 3. Create a Customer with Due
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Habib Baki Customer',
        phone: '01899999999',
        address: 'Mirpur, Dhaka',
        openingDue: 50000, // 500 BDT
      });

    // 4. Create an Invoice to populate sales analytics
    const checkoutRes = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        items: [{ productId: testProductId, quantity: 2, discount: 0 }],
        payments: [{ method: 'CASH', amount: 360000 }],
        discount: 0,
        notes: 'Analytics Test Checkout',
      });
    expect(checkoutRes.status).toBe(201);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it('should fetch executive summary with sales, COGS, gross profit, and receivables', async () => {
    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const summary = res.body.data;
    expect(summary.sales.totalInvoices).toBeGreaterThanOrEqual(1);
    expect(summary.sales.totalRevenue).toBe(360000); // 2 x 180000
    expect(summary.sales.cogs).toBe(300000); // 2 x 150000
    expect(summary.sales.grossProfit).toBe(60000); // 360000 - 300000
    expect(summary.sales.tenderBreakdown.CASH).toBe(360000);

    expect(summary.inventory.totalProducts).toBeGreaterThanOrEqual(1);
    expect(summary.receivables.totalOutstandingDue).toBe(50000);
    expect(summary.receivables.totalCustomersWithDue).toBe(1);
  });

  it('should rank top selling products correctly', async () => {
    const res = await request(app)
      .get('/api/v1/reports/top-products?limit=5')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const topItem = res.body.data[0];
    expect(topItem.productId).toBe(testProductId);
    expect(topItem.totalQuantity).toBe(2);
    expect(topItem.totalRevenue).toBe(360000);
  });

  it('should categorize dues aging buckets accurately', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dues-aging')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const aging = res.body.data;
    expect(aging.days_0_30.count).toBe(1);
    expect(aging.days_0_30.totalDue).toBe(50000);
    expect(aging.days_0_30.customers[0].name).toBe('Habib Baki Customer');
  });

  it('should record audit logs upon stock adjustment and retrieve them', async () => {
    // 1. Adjust stock
    const adjustRes = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        productId: testProductId,
        type: 'ADJUSTMENT_DAMAGE',
        quantity: -1,
        reason: 'Water damage in warehouse packaging',
      });

    expect(adjustRes.status).toBe(200);

    // 2. Query audit logs
    const auditRes = await request(app)
      .get('/api/v1/audit/logs?entityType=Product')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.data.logs.length).toBeGreaterThanOrEqual(1);

    const logEntry = auditRes.body.data.logs[0];
    expect(logEntry.action).toBe('STOCK_ADJUSTMENT');
    expect(logEntry.entityId).toBe(testProductId);
    expect(logEntry.details.reason).toBe('Water damage in warehouse packaging');
  });

  it('should run background low-stock check processor without exceptions', async () => {
    const result = await processLowStockCheck(tenantId);
    expect(result).toHaveProperty('alertedProductsCount');
    expect(typeof result.alertedProductsCount).toBe('number');
  });
});
