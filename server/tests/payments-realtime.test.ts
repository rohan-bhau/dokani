import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

describe('Local Payments & Realtime Sync Tests', () => {
    const app = createApp();

    let token: string;
    let tenantId: string;
    let bkashPaymentId: string;
    let bkashProviderRef: string;
    let sslPaymentId: string;
    let sslProviderRef: string;

    beforeAll(async () => {
        // Clean up database tables before test execution
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

        // Register tenant
        const signup = await request(app).post('/api/v1/auth/signup').send({
            tenantName: 'Digital Pay Store',
            name: 'Kazi Nazrul',
            phone: '01799887766',
            password: 'Password123!',
        });

        token = signup.body.data.tokens.accessToken;
        tenantId = signup.body.data.user.tenant.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
        redis.disconnect();
    });

    it('should initiate bKash payment session and return redirect url with providerRef', async () => {
        const res = await request(app)
            .post('/api/v1/payments/initiate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                provider: 'BKASH',
                amount: 15000, // 150 BDT in poisha
                customerPhone: '01700000000',
                customerName: 'Rahim Uddin',
                callbackUrl: 'http://localhost:3000/pos/payment/callback',
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.provider).toBe('BKASH');
        expect(res.body.data.amount).toBe(15000);
        expect(res.body.data.redirectUrl).toBeDefined();
        expect(res.body.data.providerRef).toBeDefined();

        bkashPaymentId = res.body.data.paymentId;
        bkashProviderRef = res.body.data.providerRef;

        // Verify payment is saved with PENDING status in DB
        const paymentInDb = await prisma.payment.findUnique({
            where: { id: bkashPaymentId },
        });

        expect(paymentInDb).not.toBeNull();
        expect(paymentInDb?.status).toBe('PENDING');
        expect(paymentInDb?.provider).toBe('BKASH');
        expect(paymentInDb?.providerRef).toBe(bkashProviderRef);
    });

    it('should process bKash payment callback, mark payment SUCCESS, and record webhook event', async () => {
        const callbackRes = await request(app)
            .post('/api/v1/payments/bkash/callback')
            .send({
                paymentID: bkashProviderRef,
                trxID: 'TRX_BKASH_998877',
                status: 'success',
            });

        expect(callbackRes.status).toBe(200);
        expect(callbackRes.body.success).toBe(true);
        expect(callbackRes.body.data.status).toBe('SUCCESS');
        expect(callbackRes.body.data.paymentId).toBe(bkashPaymentId);

        // Verify payment status updated to SUCCESS in DB
        const paymentInDb = await prisma.payment.findUnique({
            where: { id: bkashPaymentId },
        });

        expect(paymentInDb?.status).toBe('SUCCESS');
        expect(paymentInDb?.reference).toBeDefined();

        // Verify webhook event recorded and processed
        const webhookEvents = await prisma.webhookEvent.findMany({
            where: { provider: 'BKASH' },
        });

        expect(webhookEvents.length).toBe(1);
        expect(webhookEvents[0]?.status).toBe('PROCESSED');
    });

    it('should handle duplicate webhook callback idempotently without double processing', async () => {
        const replayRes = await request(app)
            .post('/api/v1/payments/bkash/callback')
            .send({
                paymentID: bkashProviderRef,
                trxID: 'TRX_BKASH_998877',
                status: 'success',
            });

        expect(replayRes.status).toBe(200);
        expect(replayRes.body.success).toBe(true);
        expect(replayRes.body.data.idempotentReplay).toBe(true);

        // Ensure no duplicate webhook entries were created
        const webhookEvents = await prisma.webhookEvent.findMany({
            where: { provider: 'BKASH' },
        });

        expect(webhookEvents.length).toBe(1);
    });

    it('should initiate SSLCommerz payment and process IPN validation callback', async () => {
        const initRes = await request(app)
            .post('/api/v1/payments/initiate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                provider: 'SSLCOMMERZ',
                amount: 25000, // 250 BDT in poisha
                customerName: 'Karim Mollah',
                customerPhone: '01800000000',
                callbackUrl: 'http://localhost:3000/pos/payment/callback',
            });

        expect(initRes.status).toBe(200);
        expect(initRes.body.data.provider).toBe('SSLCOMMERZ');
        expect(initRes.body.data.redirectUrl).toBeDefined();

        sslPaymentId = initRes.body.data.paymentId;
        sslProviderRef = initRes.body.data.providerRef;

        // Process SSLCommerz server-to-server IPN
        const ipnRes = await request(app)
            .post('/api/v1/payments/sslcommerz/ipn')
            .send({
                tran_id: sslProviderRef,
                val_id: 'VAL_SSL_776655',
                status: 'VALID',
            });

        expect(ipnRes.status).toBe(200);
        expect(ipnRes.body.success).toBe(true);
        expect(ipnRes.body.data.status).toBe('SUCCESS');

        const paymentInDb = await prisma.payment.findUnique({
            where: { id: sslPaymentId },
        });

        expect(paymentInDb?.status).toBe('SUCCESS');
        expect(paymentInDb?.provider).toBe('SSLCOMMERZ');
    });

    it('should reject callback with unknown payment reference with 404', async () => {
        const notFoundRes = await request(app)
            .post('/api/v1/payments/bkash/callback')
            .send({
                paymentID: 'NON_EXISTENT_REF',
                status: 'success',
            });

        expect(notFoundRes.status).toBe(404);
        expect(notFoundRes.body.success).toBe(false);
    });
});
