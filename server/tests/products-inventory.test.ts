import request from 'supertest';
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { redis } from '../src/config/redis.js';


describe("Product Catalog & Inventory Tests", ()=> {
    const app = createApp();
    
    let tokenA: string;
    let tokenB: string;
    let productIdA: string;

    beforeAll(async()=> {
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

        const signupA = await request(app).post('/api/v1/auth/signup').send({
            tenantName: 'Dhaka Grocery',
            name: 'Tanvir Hossain',
            phone: '01700000001',
            password: 'Password123!',
        })
        tokenA = signupA.body.data.tokens.accessToken;

        const signupB = await request(app).post('/api/v1/auth/signup').send({
            tenantName: 'Chittagong Mart',
            name: 'Faruk Ahmed',
            phone: '01800000002',
            password: 'Password123!',
        })

        tokenB = signupB.body.data.tokens.accessToken;
    })

    afterAll(async()=> {
        await prisma.$disconnect();
        redis.disconnect()
    })

    it('should create product with initial stock and stock movement', async()=> {
        const res = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${tokenA}`).send({
            name: 'Miniket Rice 25kg',
            nameBn: 'মিনিকেট চাল ২৫ কেজি',
            sku: 'RICE-MINI-25',
            unit: 'bag',
            costPrice: 150000,
            sellPrice: 175000,
            vatRate: 0,
            reorderLevel: 5,
            initialStock: 20,
        })

        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.sku).toBe('RICE-MINI-25');
        expect(res.body.data.stock).toBe(20)

        productIdA = res.body.data.id
    })

    it('should prevent duplicate SKU for the same tenant', async()=> {
        const res = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${tokenA}`).send({
            name: 'Another Miniket',
            sku: 'RICE-MINI-25',
            unit: 'bag',
            costPrice: 150000,
            sellPrice: 175000,
        })

        expect(res.status).toBe(409);
        expect(res.body.code).toBe('CONFLICT')
    })

    it('should allow same SKU for a different tenant (multi-tenant isolation)', async()=> {
        const res = await request(app)
        .post('/api/v1/products').set("Authorization", `Bearer ${tokenB}`).send({
            name: 'Miniket Rice Tenant B',
            sku: 'RICE-MINI-25',
            unit: 'bag',
            costPrice: 155000,
            sellPrice: 180000,
        })

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true)
    })

    it('should prevent Tenant B from accessing Tenant A product', async()=> {
        const res = await request(app).get(`/api/v1/products/${productIdA}`).set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404)
        expect(res.body.code).toBe("NOT_FOUND")
    })

    it('should search products by name pr bangla name', async()=> {
        const res = await request(app).get('/api/v1/products?q=মিনিকেট').set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200)
        expect(res.body.data.products.length).toBe(1)

        expect(res.body.data.products[0].sku).toBe('RICE-MINI-25');
    })

    it('should adjust stock down with mandatory', async()=> {
        const res = await request(app).post('/api/v1/inventory/adjust').set('Authorization', `Bearer ${tokenA}`).send({
            productId: productIdA,
            type: 'ADJUSTMENT_DAMAGE',
            quantity: -2,
            reason:'Water damage in warehouse rain leak'
        })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.stockLevel.quantity).toBe(18)

        expect(res.body.data.movement.type).toBe('ADJUSTMENT_DAMAGE');
        expect(res.body.data.movement.quantity).toBe(-2);
    })

    it('should reject adjustment that results in negative stock', async () => {
        const res = await request(app)
            .post('/api/v1/inventory/adjust')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                productId: productIdA,
                type: 'ADJUSTMENT_DAMAGE',
                quantity: -50,
                reason: 'Invalid excessive deduction',
            });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('should trigger low-stock alert when stock is below or equal to reorder level', async () => {
        // Reduce remaining stock from 18 down to 4 (reorderLevel is 5)
        await request(app)
            .post('/api/v1/inventory/adjust')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                productId: productIdA,
                type: 'ADJUSTMENT_CORRECTION',
                quantity: -14,
                reason: 'Physical count audit correction',
            });
        const res = await request(app)
            .get('/api/v1/inventory/alerts/low-stock')
            .set('Authorization', `Bearer ${tokenA}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].id).toBe(productIdA);
        expect(res.body.data[0].currentStock).toBe(4);
    });

    it('should import products via CSV bulk upload', async () => {
        const csvData = [
            'name,nameBn,sku,barcode,unit,costPrice,sellPrice,vatRate,reorderLevel,initialStock',
            'Teer Soybean Oil 5L,তীর সয়াবিন তেল ৫ লিটার,OIL-TEER-5L,8941100001,bottle,75000,82000,0,10,50',
            'Aci Pure Salt 1kg,এসিআই লবণ ১ কেজি,SALT-ACI-1K,,packet,3500,4200,0,20,100',
        ].join('\n');
        const res = await request(app)
            .post('/api/v1/products/import-csv')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ csvData });
        expect(res.status).toBe(200);
        expect(res.body.data.importedCount).toBe(2);
        expect(res.body.data.errors.length).toBe(0);
    });    
})