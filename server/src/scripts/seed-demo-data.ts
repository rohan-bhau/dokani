import { prisma } from '../config/prisma.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import crypto from 'node:crypto';

async function main() {
  console.log('Seeding demo data for Dokani...');

  const passwordHash = await hashPassword('Password123!');

  // 1. Ensure all system permissions exist
  const permissionsList = [
    'product:create',
    'product:view',
    'product:update',
    'product:delete',
    'stock:view',
    'stock:adjust',
    'supplier:manage',
    'purchase:manage',
    'sale:create',
    'sale:view',
    'sale:void',
    'sale:return',
    'sale:discount:high',
    'customer:view',
    'customer:manage',
    'due:collect',
    'report:view:all',
    'report:view:own',
    'audit_log:view',
    'expense:view',
    'expense:manage',
    'staff:view',
    'staff:manage',
    'settings:view',
    'settings:update',
    'billing:view',
    'billing:manage',
  ];

  for (const code of permissionsList) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });
  }

  const allPerms = await prisma.permission.findMany();

  // Helper to setup a store end-to-end
  async function seedStore(config: {
    tenantName: string;
    slug: string;
    address: string;
    phone: string;
    ownerName: string;
    ownerPhone: string;
    altOwnerPhone?: string;
    cashierName: string;
    cashierPhone: string;
    products: Array<{
      name: string;
      nameBn: string;
      category: string;
      sku: string;
      barcode: string;
      unit: string;
      costPrice: number;
      sellPrice: number;
      stock: number;
    }>;
    customers: Array<{
      name: string;
      phone: string;
      address: string;
      dueBalance: number;
    }>;
    suppliers: Array<{
      name: string;
      company: string;
      phone: string;
      address: string;
    }>;
    expenses: Array<{
      category: string;
      amount: number;
      description: string;
    }>;
  }) {
    console.log(`Setting up store: ${config.tenantName}...`);

    // Find or create tenant
    let tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: config.slug },
          { name: config.tenantName },
        ],
      },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: config.tenantName,
          slug: config.slug,
          phone: config.phone,
          address: config.address,
          businessType: 'Grocery & Retail',
          receiptFooter: 'Thank you for shopping at ' + config.tenantName + '! Please visit again.',
          currency: 'BDT',
          showLogoOnInvoice: true,
          showBinOnInvoice: true,
          binNumber: '192837465-0101',
          paperSize: 'RECEIPT_80MM',
          maxCashierDiscount: 10,
          returnApprovalLimit: 500000,
        },
      });
    } else {
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          name: config.tenantName,
          phone: config.phone,
          address: config.address,
          businessType: 'Grocery & Retail',
          receiptFooter: 'Thank you for shopping at ' + config.tenantName + '! Please visit again.',
        },
      });
    }

    // Assign Pro Plan subscription if not exists
    const proPlan = await prisma.plan.findFirst({ where: { code: 'PRO' } });
    if (proPlan) {
      const existingSub = await prisma.subscription.findFirst({ where: { tenantId: tenant.id } });
      if (!existingSub) {
        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: proPlan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Setup OWNER and CASHIER roles for this tenant
    const ownerRole = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'OWNER',
        isSystem: true,
      },
    });

    const cashierRole = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: 'CASHIER' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'CASHIER',
        isSystem: true,
      },
    });

    // Attach all permissions to OWNER
    for (const p of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: ownerRole.id, permissionId: p.id },
      });
    }

    // Attach cashier permissions
    const cashierPermCodes = [
      'product:view',
      'sale:create',
      'sale:view',
      'customer:view',
      'due:collect',
      'report:view:own',
    ];
    for (const p of allPerms.filter((perm) => cashierPermCodes.includes(perm.code))) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: cashierRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: cashierRole.id, permissionId: p.id },
      });
    }

    // Create or update Owner user
    const ownerPhones = [config.ownerPhone];
    if (config.altOwnerPhone) ownerPhones.push(config.altOwnerPhone);

    let primaryOwnerUser: any = null;

    for (const p of ownerPhones) {
      let u = await prisma.user.findFirst({ where: { phone: p } });
      if (u) {
        u = await prisma.user.update({
          where: { id: u.id },
          data: {
            tenantId: tenant.id,
            passwordHash,
            name: config.ownerName,
            approvalPin: '1234',
            isActive: true,
          },
        });
      } else {
        u = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            phone: p,
            name: config.ownerName,
            passwordHash,
            approvalPin: '1234',
            isActive: true,
          },
        });
      }

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: u.id, roleId: ownerRole.id } },
        update: {},
        create: { userId: u.id, roleId: ownerRole.id },
      });

      if (!primaryOwnerUser) primaryOwnerUser = u;
    }

    // Create Cashier user
    let cashierUser = await prisma.user.findFirst({ where: { phone: config.cashierPhone } });
    if (cashierUser) {
      cashierUser = await prisma.user.update({
        where: { id: cashierUser.id },
        data: {
          tenantId: tenant.id,
          passwordHash,
          name: config.cashierName,
          isActive: true,
        },
      });
    } else {
      cashierUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          phone: config.cashierPhone,
          name: config.cashierName,
          passwordHash,
          isActive: true,
        },
      });
    }

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: cashierUser.id, roleId: cashierRole.id } },
      update: {},
      create: { userId: cashierUser.id, roleId: cashierRole.id },
    });

    // Setup Categories
    const categoryMap = new Map<string, string>();
    const uniqueCatNames = Array.from(new Set(config.products.map((p) => p.category)));

    for (const catName of uniqueCatNames) {
      const cat = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: catName } },
        update: {},
        create: { tenantId: tenant.id, name: catName },
      });
      categoryMap.set(catName, cat.id);
    }

    // Setup Products
    const createdProducts: any[] = [];
    for (const p of config.products) {
      const categoryId = categoryMap.get(p.category) || null;
      let prod = await prisma.product.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            { sku: p.sku },
            { barcode: p.barcode },
          ],
        },
      });

      if (!prod) {
        prod = await prisma.product.create({
          data: {
            tenantId: tenant.id,
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            nameBn: p.nameBn,
            categoryId,
            unit: p.unit,
            costPrice: BigInt(p.costPrice),
            sellPrice: BigInt(p.sellPrice),
            vatRate: 0,
            reorderLevel: 10,
            isActive: true,
          },
        });
      } else {
        prod = await prisma.product.update({
          where: { id: prod.id },
          data: {
            barcode: p.barcode,
            name: p.name,
            nameBn: p.nameBn,
            categoryId,
            costPrice: BigInt(p.costPrice),
            sellPrice: BigInt(p.sellPrice),
            isActive: true,
          },
        });
      }

      // Upsert stock level
      await prisma.stockLevel.upsert({
        where: { tenantId_productId: { tenantId: tenant.id, productId: prod.id } },
        update: { quantity: p.stock },
        create: {
          tenantId: tenant.id,
          productId: prod.id,
          quantity: p.stock,
        },
      });

      // Stock movement if none exists
      const hasMovement = await prisma.stockMovement.findFirst({
        where: { tenantId: tenant.id, productId: prod.id },
      });
      if (!hasMovement) {
        await prisma.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: prod.id,
            type: 'OPENING',
            quantity: p.stock,
            unitCost: BigInt(p.costPrice * 100),
            reason: 'Store opening inventory',
            createdBy: primaryOwnerUser.id,
          },
        });
      }

      createdProducts.push(prod);
    }

    // Setup Customers
    const createdCustomers: any[] = [];
    for (const c of config.customers) {
      let cust = await prisma.customer.findFirst({
        where: { tenantId: tenant.id, phone: c.phone },
      });

      const dueBigInt = BigInt(c.dueBalance * 100);

      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            tenantId: tenant.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            dueBalance: dueBigInt,
            openingDue: dueBigInt,
            creditLimit: BigInt(1500000), // 15,000 BDT
          },
        });
      } else {
        cust = await prisma.customer.update({
          where: { id: cust.id },
          data: {
            dueBalance: dueBigInt,
          },
        });
      }

      if (c.dueBalance > 0) {
        const hasLedger = await prisma.customerLedger.findFirst({
          where: { tenantId: tenant.id, customerId: cust.id },
        });
        if (!hasLedger) {
          await prisma.customerLedger.create({
            data: {
              tenantId: tenant.id,
              customerId: cust.id,
              type: 'OPENING_BALANCE',
              amount: dueBigInt,
              balanceAfter: dueBigInt,
              notes: 'Opening credit ledger balance',
              createdBy: primaryOwnerUser.id,
            },
          });
        }
      }

      createdCustomers.push(cust);
    }

    // Setup Suppliers
    const createdSuppliers: any[] = [];
    for (const s of config.suppliers) {
      let supp = await prisma.supplier.findFirst({
        where: { tenantId: tenant.id, phone: s.phone },
      });
      if (!supp) {
        supp = await prisma.supplier.create({
          data: {
            tenantId: tenant.id,
            name: s.name,
            company: s.company,
            phone: s.phone,
            address: s.address,
            openingPayable: BigInt(0),
          },
        });
      }
      createdSuppliers.push(supp);
    }

    // Setup Wholesale Purchases
    const existingPurchases = await prisma.purchase.count({ where: { tenantId: tenant.id } });
    if (existingPurchases === 0 && createdSuppliers.length > 0 && createdProducts.length >= 4) {
      for (let i = 1; i <= 3; i++) {
        const supplier = createdSuppliers[(i - 1) % createdSuppliers.length];
        const p1 = createdProducts[(i * 2) % createdProducts.length];
        const p2 = createdProducts[(i * 2 + 1) % createdProducts.length];

        const q1 = 20;
        const q2 = 15;
        const total = BigInt(Number(p1.costPrice) * q1 + Number(p2.costPrice) * q2);

        await prisma.purchase.create({
          data: {
            tenantId: tenant.id,
            supplierId: supplier.id,
            purchaseNumber: `PO-${new Date().getFullYear()}-000${i}`,
            status: 'RECEIVED',
            subtotal: total,
            total,
            paidAmount: total,
            dueAmount: BigInt(0),
            notes: 'Wholesale distributor replenishment',
            createdBy: primaryOwnerUser.id,
            items: {
              create: [
                {
                  productId: p1.id,
                  quantity: q1,
                  unitCost: p1.costPrice,
                  lineTotal: BigInt(Number(p1.costPrice) * q1),
                },
                {
                  productId: p2.id,
                  quantity: q2,
                  unitCost: p2.costPrice,
                  lineTotal: BigInt(Number(p2.costPrice) * q2),
                },
              ],
            },
          },
        });
      }
    }

    // Setup Sales Invoices
    const existingInvoices = await prisma.invoice.count({ where: { tenantId: tenant.id } });
    if (existingInvoices === 0 && createdProducts.length >= 4) {
      const paymentMethods: Array<'CASH' | 'BKASH' | 'CARD' | 'CREDIT_BAKI'> = [
        'CASH',
        'BKASH',
        'CASH',
        'CARD',
        'CREDIT_BAKI',
        'BKASH',
      ];

      for (let i = 1; i <= 6; i++) {
        const method = paymentMethods[i - 1];
        const p1 = createdProducts[i % createdProducts.length];
        const p2 = createdProducts[(i + 1) % createdProducts.length];

        const q1 = 1;
        const q2 = 2;
        const subtotal = BigInt(Number(p1.sellPrice) * q1 + Number(p2.sellPrice) * q2);
        const discount = BigInt(i === 3 ? 5000 : 0); // 50 tk discount on 3rd sale
        const total = subtotal - discount;

        const customer = method === 'CREDIT_BAKI' ? createdCustomers[0] : null;
        const paidTotal = method === 'CREDIT_BAKI' ? BigInt(0) : total;
        const dueTotal = method === 'CREDIT_BAKI' ? total : BigInt(0);

        const inv = await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            invoiceNumber: `INV-${1000 + i}`,
            customerId: customer?.id || null,
            status: 'COMPLETED',
            subtotal,
            discount,
            vatTotal: BigInt(0),
            total,
            paidTotal,
            dueTotal,
            paymentToken: `pay_${crypto.randomBytes(8).toString('hex')}`,
            createdBy: cashierUser.id,
            items: {
              create: [
                {
                  productId: p1.id,
                  quantity: q1,
                  unitPrice: p1.sellPrice,
                  unitCost: p1.costPrice,
                  lineTotal: BigInt(Number(p1.sellPrice) * q1),
                },
                {
                  productId: p2.id,
                  quantity: q2,
                  unitPrice: p2.sellPrice,
                  unitCost: p2.costPrice,
                  lineTotal: BigInt(Number(p2.sellPrice) * q2),
                },
              ],
            },
          },
        });

        if (paidTotal > 0) {
          await prisma.payment.create({
            data: {
              tenantId: tenant.id,
              invoiceId: inv.id,
              customerId: customer?.id || null,
              method: (method as any) || 'CASH',
              status: 'SUCCESS',
              amount: paidTotal,
              reference: method === 'BKASH' ? `TRX${Math.floor(10000000 + Math.random() * 90000000)}` : null,
            },
          });
        }
      }
    }

    // Setup Expenses
    const existingExpenses = await prisma.expense.count({ where: { tenantId: tenant.id } });
    if (existingExpenses === 0) {
      for (const exp of config.expenses) {
        await prisma.expense.create({
          data: {
            tenantId: tenant.id,
            category: exp.category as any,
            amount: BigInt(exp.amount * 100),
            note: exp.description,
            spentOn: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)),
            createdBy: primaryOwnerUser.id,
          },
        });
      }
    }

    console.log(`Finished seeding ${config.tenantName}. Products: ${createdProducts.length}`);
  }

  // --- SEED STORE 1: Karim Store ---
  await seedStore({
    tenantName: 'Karim Store',
    slug: 'karim-store',
    phone: '01711111111',
    address: 'House 42, Road 9/A, Dhanmondi, Dhaka-1209',
    ownerName: 'Karim Mia',
    ownerPhone: '01711111111',
    altOwnerPhone: '01334567890',
    cashierName: 'Sazzad Hossain',
    cashierPhone: '01711111112',
    products: [
      {
        name: 'Teer Soybean Oil 5L',
        nameBn: 'তীর সয়াবিন তেল ৫ লিটার',
        category: 'GROCERY',
        sku: 'OIL-TEER-5L',
        barcode: '8941100001',
        unit: 'bottle',
        costPrice: 750,
        sellPrice: 820,
        stock: 45,
      },
      {
        name: 'Rupchanda Fortified Soybean Oil 2L',
        nameBn: 'রূপচাঁদা সয়াবিন তেল ২ লিটার',
        category: 'GROCERY',
        sku: 'OIL-RUP-2L',
        barcode: '8941100002',
        unit: 'bottle',
        costPrice: 320,
        sellPrice: 350,
        stock: 30,
      },
      {
        name: 'ACI Pure Salt 1kg',
        nameBn: 'এসিআই পিওর লবণ ১ কেজি',
        category: 'GROCERY',
        sku: 'SALT-ACI-1K',
        barcode: '8941100003',
        unit: 'packet',
        costPrice: 35,
        sellPrice: 42,
        stock: 120,
      },
      {
        name: 'Pran Mustard Oil 250ml',
        nameBn: 'প্রাণ সরিষার তেল ২৫০ মি.লি.',
        category: 'GROCERY',
        sku: 'OIL-PRAN-250',
        barcode: '8941100004',
        unit: 'bottle',
        costPrice: 80,
        sellPrice: 95,
        stock: 40,
      },
      {
        name: 'Miniket Rice Premium 25kg',
        nameBn: 'মিনিকেট চাল প্রিমিয়াম ২৫ কেজি',
        category: 'GROCERY',
        sku: 'RICE-MINI-25K',
        barcode: '8941100005',
        unit: 'bag',
        costPrice: 1600,
        sellPrice: 1750,
        stock: 25,
      },
      {
        name: 'Nazirshail Rice 50kg',
        nameBn: 'নাজিরশাইল চাল ৫০ কেজি',
        category: 'GROCERY',
        sku: 'RICE-NAZIR-50K',
        barcode: '8941100006',
        unit: 'bag',
        costPrice: 3300,
        sellPrice: 3600,
        stock: 15,
      },
      {
        name: 'Mojo Cola 500ml',
        nameBn: 'মোজো কোলা ৫০০ মি.লি.',
        category: 'BEVERAGE',
        sku: 'BEV-MOJO-500',
        barcode: '8941100007',
        unit: 'bottle',
        costPrice: 30,
        sellPrice: 40,
        stock: 80,
      },
      {
        name: 'Speed Energy Drink 250ml',
        nameBn: 'স্পিড এনার্জি ড্রিংক ২৫০ মি.লি.',
        category: 'BEVERAGE',
        sku: 'BEV-SPEED-250',
        barcode: '8941100008',
        unit: 'can',
        costPrice: 28,
        sellPrice: 35,
        stock: 65,
      },
      {
        name: 'Pran Mango Juice 250ml',
        nameBn: 'প্রাণ ম্যাঙ্গো জুস ২৫০ মি.লি.',
        category: 'BEVERAGE',
        sku: 'BEV-PRAN-MANGO',
        barcode: '8941100009',
        unit: 'box',
        costPrice: 28,
        sellPrice: 35,
        stock: 90,
      },
      {
        name: 'Ispahani Mirzapore Tea 400g',
        nameBn: 'ইস্পাহানি মির্জাপুর চা ৪০০ গ্রাম',
        category: 'BEVERAGE',
        sku: 'BEV-TEA-ISPAHANI-400',
        barcode: '8941100010',
        unit: 'box',
        costPrice: 200,
        sellPrice: 230,
        stock: 50,
      },
      {
        name: 'Bombay Sweets Chanachur 150g',
        nameBn: 'বোম্বে সুইটস চানাচুর ১৫০ গ্রাম',
        category: 'SNACKS',
        sku: 'SNK-CHANACHUR-150',
        barcode: '8941100011',
        unit: 'packet',
        costPrice: 35,
        sellPrice: 45,
        stock: 110,
      },
      {
        name: 'Lays Classic Chips 50g',
        nameBn: 'লেজ ক্লাসিক চিপস ৫০ গ্রাম',
        category: 'SNACKS',
        sku: 'SNK-LAYS-50',
        barcode: '8941100012',
        unit: 'packet',
        costPrice: 48,
        sellPrice: 60,
        stock: 75,
      },
      {
        name: 'Olympic Energy Plus Biscuit',
        nameBn: 'অলিম্পিক এনার্জি প্লাস বিস্কুট',
        category: 'SNACKS',
        sku: 'SNK-ENERGY-PLUS',
        barcode: '8941100013',
        unit: 'packet',
        costPrice: 40,
        sellPrice: 50,
        stock: 85,
      },
      {
        name: 'Dano Daily Pushti Milk Powder 500g',
        nameBn: 'ডানো পুষ্টি গুঁড়ো দুধ ৫০০ গ্রাম',
        category: 'DAIRY',
        sku: 'DRY-DANO-500',
        barcode: '8941100014',
        unit: 'packet',
        costPrice: 370,
        sellPrice: 420,
        stock: 40,
      },
      {
        name: 'Aarong Dairy Liquid Milk 1L',
        nameBn: 'আড়ং তরল দুধ ১ লিটার',
        category: 'DAIRY',
        sku: 'DRY-AARONG-1L',
        barcode: '8941100015',
        unit: 'packet',
        costPrice: 85,
        sellPrice: 95,
        stock: 35,
      },
      {
        name: 'Wheel 2in1 Washing Powder 1kg',
        nameBn: 'হুইল ওয়াশিং পাউডার ১ কেজি',
        category: 'PERSONAL_CARE',
        sku: 'PC-WHEEL-1K',
        barcode: '8941100016',
        unit: 'packet',
        costPrice: 100,
        sellPrice: 120,
        stock: 60,
      },
      {
        name: 'Dettol Original Soap 75g',
        nameBn: 'ডেটোল অরিজিনাল সাবান ৭৫ গ্রাম',
        category: 'PERSONAL_CARE',
        sku: 'PC-DETTOL-75',
        barcode: '8941100017',
        unit: 'pcs',
        costPrice: 50,
        sellPrice: 60,
        stock: 95,
      },
      {
        name: 'Sunsilk Black Shine Shampoo 180ml',
        nameBn: 'সানসিল্ক শ্যাম্পু ১৮০ মি.লি.',
        category: 'PERSONAL_CARE',
        sku: 'PC-SUNSILK-180',
        barcode: '8941100018',
        unit: 'bottle',
        costPrice: 180,
        sellPrice: 210,
        stock: 35,
      },
      {
        name: 'Radhuni Turmeric Powder 200g',
        nameBn: 'রাধুনী হলুদ গুঁড়া ২০০ গ্রাম',
        category: 'GROCERY',
        sku: 'SPICE-RADHUNI-TURM',
        barcode: '8941100019',
        unit: 'packet',
        costPrice: 90,
        sellPrice: 110,
        stock: 70,
      },
      {
        name: 'Radhuni Chilli Powder 200g',
        nameBn: 'রাধুনী মরিচ গুঁড়া ২০০ গ্রাম',
        category: 'GROCERY',
        sku: 'SPICE-RADHUNI-CHIL',
        barcode: '8941100020',
        unit: 'packet',
        costPrice: 105,
        sellPrice: 130,
        stock: 65,
      },
    ],
    customers: [
      {
        name: 'Tanvir Ahmed',
        phone: '01712345678',
        address: 'Flat 4B, Dhanmondi Lake View',
        dueBalance: 1200,
      },
      {
        name: 'Rafiqul Islam',
        phone: '01812345678',
        address: 'Road 8, Dhanmondi',
        dueBalance: 450,
      },
      {
        name: 'Sultana Begum',
        phone: '01912345678',
        address: 'Jigatola Bus Stand Area',
        dueBalance: 0,
      },
      {
        name: 'Nasir Uddin',
        phone: '01612345678',
        address: 'Shukrabad Bazar',
        dueBalance: 2500,
      },
      {
        name: 'Farhana Yeasmin',
        phone: '01512345678',
        address: 'Kalabagan 1st Lane',
        dueBalance: 800,
      },
    ],
    suppliers: [
      {
        name: 'Meghna Consumer Goods',
        company: 'Meghna Group of Industries (Fresh)',
        phone: '01730000001',
        address: 'Meghna Ghat, Sonargaon, Narayanganj',
      },
      {
        name: 'Square Consumer Products Ltd.',
        company: 'Square Group',
        phone: '01730000002',
        address: 'Square Centre, 48 Mohakhali C/A, Dhaka',
      },
      {
        name: 'PRAN-RFL Distribution Ltd.',
        company: 'PRAN Foods Ltd.',
        phone: '01730000003',
        address: 'PRAN-RFL Center, Middle Badda, Dhaka',
      },
    ],
    expenses: [
      { category: 'RENT', amount: 25000, description: 'Monthly Shop Rent (Dhanmondi Branch)' },
      { category: 'ELECTRICITY', amount: 4200, description: 'DESCO Commercial Electricity Bill' },
      { category: 'SALARY', amount: 850, description: 'Daily Staff Tiffin & Refreshments' },
      { category: 'MAINTENANCE', amount: 1500, description: 'Carry bags and barcode sticker rolls' },
      { category: 'OTHER', amount: 1000, description: 'Broadband Fiber Internet Monthly Charge' },
    ],
  });

  // --- SEED STORE 2: Rahim Super Mart ---
  await seedStore({
    tenantName: 'Rahim Super Mart',
    slug: 'rahim-super-mart',
    phone: '01822222222',
    address: 'GEC Circle, Nasirabad, Chittagong-4000',
    ownerName: 'Rahim Ullah',
    ownerPhone: '01822222222',
    altOwnerPhone: '01711223344',
    cashierName: 'Kamal Ahmed',
    cashierPhone: '01822222223',
    products: [
      {
        name: 'Bashundhara Fortified Oil 5L',
        nameBn: 'বসুন্ধরা সয়াবিন তেল ৫ লিটার',
        category: 'GROCERY',
        sku: 'OIL-BASH-5L',
        barcode: '8942200001',
        unit: 'bottle',
        costPrice: 760,
        sellPrice: 830,
        stock: 50,
      },
      {
        name: 'Fresh Refined Sugar 1kg',
        nameBn: 'ফ্রেশ চিনি ১ কেজি',
        category: 'GROCERY',
        sku: 'SUGAR-FRESH-1K',
        barcode: '8942200002',
        unit: 'packet',
        costPrice: 125,
        sellPrice: 140,
        stock: 90,
      },
      {
        name: 'Teer Atta 2kg',
        nameBn: 'তীর আটা ২ কেজি',
        category: 'GROCERY',
        sku: 'ATTA-TEER-2K',
        barcode: '8942200003',
        unit: 'packet',
        costPrice: 110,
        sellPrice: 125,
        stock: 65,
      },
      {
        name: 'Coca Cola 1.25L',
        nameBn: 'কোকা কোলা ১.২৫ লিটার',
        category: 'BEVERAGE',
        sku: 'BEV-COKE-125',
        barcode: '8942200004',
        unit: 'bottle',
        costPrice: 85,
        sellPrice: 100,
        stock: 60,
      },
      {
        name: '7Up 500ml',
        nameBn: 'সেভেন আপ ৫০০ মি.লি.',
        category: 'BEVERAGE',
        sku: 'BEV-7UP-500',
        barcode: '8942200005',
        unit: 'bottle',
        costPrice: 32,
        sellPrice: 40,
        stock: 75,
      },
      {
        name: 'Nescafe Classic Instant Coffee 100g',
        nameBn: 'নেসক্যাফে কফি ১০০ গ্রাম',
        category: 'BEVERAGE',
        sku: 'BEV-NESCAFE-100',
        barcode: '8942200006',
        unit: 'jar',
        costPrice: 420,
        sellPrice: 480,
        stock: 30,
      },
      {
        name: 'Lexus Vegetable Biscuit 250g',
        nameBn: 'লেক্সাস ভেজিটেবল বিস্কুট ২৫০ গ্রাম',
        category: 'SNACKS',
        sku: 'SNK-LEXUS-250',
        barcode: '8942200007',
        unit: 'packet',
        costPrice: 55,
        sellPrice: 70,
        stock: 80,
      },
      {
        name: 'Mr. Twist Potato Chips',
        nameBn: 'মিস্টার টুইস্ট পটেটো চিপস',
        category: 'SNACKS',
        sku: 'SNK-TWIST',
        barcode: '8942200008',
        unit: 'packet',
        costPrice: 18,
        sellPrice: 25,
        stock: 120,
      },
      {
        name: 'Marks Full Cream Milk Powder 500g',
        nameBn: 'মার্কস ফুল ক্রিম মিল্ক পাউডার ৫০০ গ্রাম',
        category: 'DAIRY',
        sku: 'DRY-MARKS-500',
        barcode: '8942200009',
        unit: 'packet',
        costPrice: 360,
        sellPrice: 410,
        stock: 45,
      },
      {
        name: 'Pran UHT Milk 1L',
        nameBn: 'প্রাণ ইউএইচটি দুধ ১ লিটার',
        category: 'DAIRY',
        sku: 'DRY-PRAN-1L',
        barcode: '8942200010',
        unit: 'box',
        costPrice: 88,
        sellPrice: 100,
        stock: 40,
      },
      {
        name: 'Lifebuoy Total Soap 100g',
        nameBn: 'লাইফবয় সাবান ১০০ গ্রাম',
        category: 'PERSONAL_CARE',
        sku: 'PC-LIFEBUOY-100',
        barcode: '8942200011',
        unit: 'pcs',
        costPrice: 48,
        sellPrice: 58,
        stock: 100,
      },
      {
        name: 'Close Up Deep Action Toothpaste 100g',
        nameBn: 'ক্লোজ আপ টুথপেস্ট ১০০ গ্রাম',
        category: 'PERSONAL_CARE',
        sku: 'PC-CLOSEUP-100',
        barcode: '8942200012',
        unit: 'box',
        costPrice: 95,
        sellPrice: 115,
        stock: 55,
      },
      {
        name: 'Chashi Aromatic Chinigura Rice 1kg',
        nameBn: 'চাষী চিনিগুঁড়া পোলাও চাল ১ কেজি',
        category: 'GROCERY',
        sku: 'RICE-CHASHI-1K',
        barcode: '8942200013',
        unit: 'packet',
        costPrice: 140,
        sellPrice: 160,
        stock: 50,
      },
      {
        name: 'Radhuni Roast Masala 35g',
        nameBn: 'রাধুনী রোস্ট মসলা ৩৫ গ্রাম',
        category: 'GROCERY',
        sku: 'SPICE-ROAST-35',
        barcode: '8942200014',
        unit: 'box',
        costPrice: 45,
        sellPrice: 55,
        stock: 90,
      },
    ],
    customers: [
      {
        name: 'Mohammed Jahangir',
        phone: '01844000001',
        address: 'Nasirabad Housing Society',
        dueBalance: 1850,
      },
      {
        name: 'Taslima Akter',
        phone: '01844000002',
        address: 'Khulshi Hills R/A',
        dueBalance: 600,
      },
      {
        name: 'Belal Hossain',
        phone: '01844000003',
        address: 'O.R. Nizam Road',
        dueBalance: 0,
      },
    ],
    suppliers: [
      {
        name: 'Bashundhara Multi Consumer Ltd.',
        company: 'Bashundhara Group',
        phone: '01844000011',
        address: 'Bashundhara R/A, Dhaka',
      },
      {
        name: 'Unilever Bangladesh Ltd.',
        company: 'Unilever',
        phone: '01844000012',
        address: 'Kalurghat Heavy Industrial Area, Chittagong',
      },
    ],
    expenses: [
      { category: 'RENT', amount: 32000, description: 'Store Space Rent (GEC Branch)' },
      { category: 'ELECTRICITY', amount: 6500, description: 'PDB Electricity & Generator Fuel' },
      { category: 'SALARY', amount: 1200, description: 'Staff Meal Allowance' },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
