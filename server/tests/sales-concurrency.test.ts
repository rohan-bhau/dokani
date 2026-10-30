import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Transactional Sales, Invoicing & Concurrency Tests', () => {
    const app = createApp();

    let token: string;
    let testProductId: string;
    let limitedProductId: string;
    let invoiceId: string;

    beforeAll(async () => {
        // Clean up sales and product tables before test
        await prisma.webhookEvent.deleteMany();
        await prisma.purchaseItem.deleteMany();
        await prisma.purchase.deleteMany();
        await prisma.supplier.deleteMany();
        await prisma.customerLedger.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.invoiceItem.deleteMany();
        await prisma.invoice.deleteMany();
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

        // Signup shop owner
        const signup = await request(app).post('/api/v1/auth/signup').send({
            tenantName: 'Bhai Bhai General Store',
            name: 'Abdur Razzak',
            phone: '01712345678',
            password: 'Password123!',
        });
        token = signup.body.data.tokens.accessToken;

        // Create main product with stock = 20
        const prodRes = await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Pran Frooto 250ml',
                sku: 'BEV-PRAN-250',
                unit: 'bottle',
                costPrice: 25,
                sellPrice: 30,
                vatRate: 500, // 5.00% VAT
                reorderLevel: 5,
                initialStock: 20,
            });
        testProductId = prodRes.body.data.id;

        // Create limited product for concurrency test with stock = 5
        const limitRes = await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Limited Edition Mug',
                sku: 'MUG-LTD-01',
                unit: 'pcs',
                costPrice: 100,
                sellPrice: 150,
                vatRate: 0,
                reorderLevel: 1,
                initialStock: 5,
            });
        limitedProductId = limitRes.body.data.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
        redis.disconnect();
    });

    it('should complete a POS checkout and generate gapless invoice number', async () => {
        const res = await request(app)
            .post('/api/v1/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [
                    {
                        productId: testProductId,
                        quantity: 2,
                        discount: 0,
                    },
                ],
                discount: 0,
                payments: [
                    {
                        method: 'CASH',
                        amount: 63, // 2 * 30 = 60 + 5% VAT (3) = 63
                    },
                ],
                notes: 'Walk-in cash counter sale',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{4}-000001$/);
        expect(res.body.data.total).toBe(63);
        expect(res.body.data.paidTotal).toBe(63);
        expect(res.body.data.dueTotal).toBe(0);

        invoiceId = res.body.data.id;

        // Verify stock was deducted: 20 - 2 = 18
        const stockRes = await request(app)
            .get(`/api/v1/inventory/${testProductId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(stockRes.body.data.quantity).toBe(18);
    });

    it('should increment invoice number sequentially for next sale', async () => {
        const res = await request(app)
            .post('/api/v1/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                items: [{ productId: testProductId, quantity: 1 }],
                payments: [{ method: 'CASH', amount: 31 }],
            });

        expect(res.status).toBe(201);
        expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{4}-000002$/);
    });

    it('should prevent duplicate sale via Idempotency-Key header', async () => {
        const idempotencyKey = 'pos-idemp-test-999';

        const salePayload = {
            items: [{ productId: testProductId, quantity: 1 }],
            payments: [{ method: 'CASH', amount: 31 }],
        };

        // First checkout request
        const firstRes = await request(app)
            .post('/api/v1/sales')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', idempotencyKey)
            .send(salePayload);

        expect(firstRes.status).toBe(201);
        const invoiceNum = firstRes.body.data.invoiceNumber;

        // Duplicate checkout request with identical key
        const replayRes = await request(app)
            .post('/api/v1/sales')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', idempotencyKey)
            .send(salePayload);

        expect(replayRes.status).toBe(200);
        expect(replayRes.headers['x-idempotent-replay']).toBe('true');
        expect(replayRes.body.data.invoiceNumber).toBe(invoiceNum);
    });

    it('should handle 10 concurrent checkouts on 5 stock items with zero overselling', async () => {
    
        const concurrentRequests = Array.from({ length: 10 }).map((_, index) =>
            request(app)
                .post('/api/v1/sales')
                .set('Authorization', `Bearer ${token}`)
                .set('Idempotency-Key', `concurrent-key-${index}-${Date.now()}`)
                .send({
                    items: [{ productId: limitedProductId, quantity: 1 }],
                    payments: [{ method: 'CASH', amount: 150 }],
                })
        );

        const responses = await Promise.all(concurrentRequests);

        const successful = responses.filter((r) => r.status === 201);
        const conflicts = responses.filter((r) => r.status === 409);

        expect(successful.length).toBe(5);
        expect(conflicts.length).toBe(5);

        // Verify remaining stock is exactly 0 and never went negative
        const stockRes = await request(app)
            .get(`/api/v1/inventory/${limitedProductId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(stockRes.body.data.quantity).toBe(0);
    });

    it('should void an invoice and restore deducted stock', async () => {
        // Current stock of testProductId is 16 (20 - 2 - 1 - 1)
        const voidRes = await request(app)
            .post(`/api/v1/sales/${invoiceId}/void`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                reason: 'Customer cancelled transaction immediately after payment',
            });

        expect(voidRes.status).toBe(200);
        expect(voidRes.body.success).toBe(true);
        expect(voidRes.body.data.status).toBe('VOIDED');

        // Stock should be restored (+2): 16 + 2 = 18
        const stockRes = await request(app)
            .get(`/api/v1/inventory/${testProductId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(stockRes.body.data.quantity).toBe(18);
    });
});
