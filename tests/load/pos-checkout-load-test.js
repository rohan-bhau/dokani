import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Performance metrics
const checkoutDuration = new Trend('pos_checkout_duration_ms');
const checkoutSuccessRate = new Rate('pos_checkout_success_rate');
const totalSalesCompleted = new Counter('pos_sales_completed_total');

export const options = {
  stages: [
    { duration: '10s', target: 25 },  // Warm-up
    { duration: '20s', target: 100 }, // Ramp-up to 100 concurrent cashiers
    { duration: '30s', target: 100 }, // Sustained peak load
    { duration: '10s', target: 0 },   // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 response time must remain under 500ms
    http_req_failed: ['rate<0.05'],   // Less than 5% failure rate under load
    pos_checkout_success_rate: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api/v1';

export function setup() {
  const timestamp = Date.now();
  const email = `cashier_${timestamp}@loadtest.dokani.local`;
  const password = 'StrongPassword123!';

  // Step 1: Register test tenant and cashier account
  const regRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email,
      password,
      name: 'Load Test Cashier',
      storeName: 'High Concurrency Mart',
      phone: '01710000000',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(regRes, { 'setup: registration successful': (r) => r.status === 201 });

  const authData = regRes.json();
  const token = authData.data.tokens.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 2: Seed bulk inventory products for concurrent checkouts
  const productPayload = {
    name: 'Mineral Water 500ml',
    sku: `SKU-LOAD-${timestamp}`,
    barcode: `BAR-${timestamp}`,
    costPrice: 12.0,
    sellingPrice: 20.0,
    stockQuantity: 100000,
    lowStockAlert: 50,
  };

  const prodRes = http.post(`${BASE_URL}/products`, JSON.stringify(productPayload), {
    headers,
  });

  check(prodRes, { 'setup: product created': (r) => r.status === 201 });
  const product = prodRes.json().data;

  return {
    token,
    productId: product.id,
    sellingPrice: product.sellingPrice,
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // 1. Cashier scans / queries products
  const searchRes = http.get(`${BASE_URL}/products?limit=10`, { headers });
  check(searchRes, {
    'product lookup status is 200': (r) => r.status === 200,
  });

  // 2. Cashier completes POS checkout sale
  const salePayload = JSON.stringify({
    items: [
      {
        productId: data.productId,
        quantity: 1,
        unitPrice: data.sellingPrice,
        discount: 0,
      },
    ],
    payments: [
      {
        method: 'CASH',
        amount: data.sellingPrice,
      },
    ],
    notes: 'Load test automated sale',
  });

  const startTime = Date.now();
  const saleRes = http.post(`${BASE_URL}/sales`, salePayload, { headers });
  const latency = Date.now() - startTime;

  checkoutDuration.add(latency);

  const isSuccess = check(saleRes, {
    'sale created status is 201': (r) => r.status === 201,
  });

  checkoutSuccessRate.add(isSuccess);

  if (isSuccess) {
    totalSalesCompleted.add(1);
  }

  // Realistic cashier inter-arrival interval (200ms - 500ms)
  sleep(Math.random() * 0.3 + 0.2);
}
