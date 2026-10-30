import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Customers, Credit Ledger & Purchases Tests', () => {
    const app = createApp();

    let token: string;
    let customerId: string;
    let supplierId: string;
    let productId: string;

    beforeAll(async () => {
        // Clean up tables before tests
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
        await prisma.refreshToken.deleteMany();
        await prisma.userRole.deleteMany();
        await prisma.rolePermission.deleteMany();
        await prisma.role.deleteMany();
        await prisma.user.deleteMany();
        await prisma.tenant.deleteMany();

        // Signup shop owner
        const signup = await request(app).post('/api/v1/auth/signup').send({
            tenantName: 'Madina Traders',
            name: 'Haji Mohammad Ali',
            phone: '01811223344',
            password: 'Password123!',
        });
        token = signup.body.data.tokens.accessToken;

        // Create product with initial stock 10, cost 100 BDT (10000 poisha)
        const prod = await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Teer Soyabean Oil 1L',
                sku: 'OIL-TEER-1L',
                costPrice: 10000,
                sellPrice: 15000,
                initialStock: 10,
                reorderLevel: 2,
            });
        productId = prod.body.data.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
        redis.disconnect();
    });

    it('should create customer with opening due and record ledger entry', async () => {
        const res = await request(app)
            .post('/api/v1/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Rafiqul Islam',
                phone: '01911223344',
                address: 'Mirpur-10, Dhaka',
                openingDue: 50000, // 500 BDT
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.dueBalance).toBe(50000);
        customerId = res.body.data.id;

        const ledgerRes = await request(app)
            .get(`/api/v1/customers/${customerId}/ledger`)
            .set('Authorization', `Bearer ${token}`);

        expect(ledgerRes.status).toBe(200);
        expect(ledgerRes.body.data.items.length).toBe(1);
        expect(ledgerRes.body.data.items[0].type).toBe('OPENING_BALANCE');
        expect(ledgerRes.body.data.items[0].amount).toBe(50000);
        expect(ledgerRes.body.data.items[0].balanceAfter).toBe(50000);
    });

    it('should automatically increment customer due balance and record ledger entry on credit sale', async () => {
        // Buy 2 items: Total 300 BDT (30000 poisha). Cash payment 100 BDT (10000), Due 200 BDT (20000 poisha)
        const saleRes = await request(app)
            .post('/api/v1/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerId,
                items: [{ productId, quantity: 2 }],
                payments: [{ method: 'CASH', amount: 10000 }],
            });

        expect(saleRes.status).toBe(201);
        expect(saleRes.body.data.total).toBe(30000);
        expect(saleRes.body.data.dueTotal).toBe(20000);

        // Previous due 50000 + sale due 20000 = 70000 poisha
        const custRes = await request(app)
            .get(`/api/v1/customers/${customerId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(custRes.status).toBe(200);
        expect(custRes.body.data.dueBalance).toBe(70000);

        // Check customer ledger
        const ledgerRes = await request(app)
            .get(`/api/v1/customers/${customerId}/ledger`)
            .set('Authorization', `Bearer ${token}`);

        expect(ledgerRes.body.data.items.length).toBe(2);
        expect(ledgerRes.body.data.items[0].type).toBe('SALE_DUE');
        expect(ledgerRes.body.data.items[0].amount).toBe(20000);
        expect(ledgerRes.body.data.items[0].balanceAfter).toBe(70000);
    });

    it('should collect due payment, decrement balance, and record payment ledger row', async () => {
        // Customer pays 250 BDT (25000 poisha) via bKash
        const payRes = await request(app)
            .post(`/api/v1/customers/${customerId}/collect-due`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                amount: 25000,
                method: 'BKASH',
                reference: 'TrxID-BK998877',
                notes: 'Partial payment received',
            });

        expect(payRes.status).toBe(200);
        // Due balance decreases: 70000 - 25000 = 45000 poisha
        expect(payRes.body.data.customer.dueBalance).toBe(45000);
        expect(payRes.body.data.ledger.type).toBe('PAYMENT_RECEIVED');
        expect(payRes.body.data.ledger.amount).toBe(25000);
        expect(payRes.body.data.ledger.balanceAfter).toBe(45000);
    });

    it('should create supplier successfully', async () => {
        const supRes = await request(app)
            .post('/api/v1/purchases/suppliers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'City Group Distribution',
                company: 'City Group Ltd',
                phone: '01711998877',
                address: 'Dhaka, Bangladesh',
            });

        expect(supRes.status).toBe(201);
        expect(supRes.body.data.name).toBe('City Group Distribution');
        supplierId = supRes.body.data.id;
    });

    it('should receive supplier purchase, update stock, and recalculate weighted average cost price', async () => {
        // Initial stock was 10, sold 2 units, remaining stock = 8 units.
        // Current costPrice = 10000 poisha (100 BDT).
        // Purchasing 10 units at 12000 poisha (120 BDT) each.
        // Total new stock = 8 + 10 = 18 units.
        // Weighted average cost formula:
        // ((8 * 10000) + (10 * 12000)) / 18 = 200000 / 18 = 11111 poisha (~111.11 BDT)
        const purchaseRes = await request(app)
            .post('/api/v1/purchases')
            .set('Authorization', `Bearer ${token}`)
            .send({
                supplierId,
                items: [{ productId, quantity: 10, unitCost: 12000 }],
                paidAmount: 120000,
                notes: 'Monthly oil batch refill',
            });

        expect(purchaseRes.status).toBe(201);
        expect(purchaseRes.body.data.purchaseNumber).toMatch(/^PO-\d{4}-\d{6}$/);
        expect(purchaseRes.body.data.total).toBe(120000);

        // Verify stock quantity and updated weighted average cost price
        const stockRes = await request(app)
            .get(`/api/v1/inventory/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(stockRes.status).toBe(200);
        expect(stockRes.body.data.product.costPrice).toBe(11111);
        expect(stockRes.body.data.quantity).toBe(18);
    });
});
