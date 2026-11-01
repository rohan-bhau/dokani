'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, Zap } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free Starter',
      description: 'Ideal for neighborhood corner stores taking their first steps into digital POS billing.',
      price: 0,
      period: 'forever free',
      highlight: false,
      cta: 'Get Started Free',
      features: [
        'Up to 100 Products',
        '1 Cashier Account',
        '300 Sales Receipts / Month',
        'Offline Thermal Receipt Printing',
        'Customer Due Ledger (Baki)',
        'Basic Daily Sales Reports',
      ],
    },
    {
      name: 'Basic Shop',
      description: 'Built for active retail shops needing barcode scanning and staff accountability.',
      price: isAnnual ? 800 : 999,
      period: isAnnual ? 'per month, billed annually' : 'per month',
      highlight: false,
      cta: 'Start 14-Day Free Trial',
      features: [
        'Up to 1,500 Products',
        '3 Cashier Accounts',
        'Unlimited Invoices & Receipts',
        'bKash & Card Integration',
        'Low-Stock SMS Alerts',
        'Customer Due SMS Reminders',
        'Expense Tracking & Daily Profit',
      ],
    },
    {
      name: 'Pro Merchant',
      description: 'Comprehensive retail operating system for super shops, pharmacies & high-volume retail.',
      price: isAnnual ? 1600 : 1999,
      period: isAnnual ? 'per month, billed annually' : 'per month',
      highlight: true,
      cta: 'Start 14-Day Free Trial',
      features: [
        'Unlimited Catalog Products',
        '10 Staff Accounts with Custom RBAC',
        'Unlimited Invoices & Receipts',
        'Public Payment Links (/pay/[token])',
        'Wholesale Purchase Order Receiving',
        'Weighted Average Costing (WAC)',
        'Advanced P&L, VAT & Stock Valuation',
        'Priority Phone & WhatsApp Support',
      ],
    },
    {
      name: 'Enterprise Multi-Store',
      description: 'Custom setups for retail chains, central warehouses, and franchise networks.',
      price: 4999,
      period: 'per month',
      highlight: false,
      cta: 'Contact Sales',
      features: [
        'Multi-Branch Consolidated Inventory',
        'Central Warehouse Stock Transfers',
        'Dedicated Cloud Database',
        'Custom ERP Integrations',
        '99.9% Uptime SLA',
        'Dedicated Account Manager',
      ],
    },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-12 space-y-12 font-sans">
      {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <Zap className="w-3.5 h-3.5" />
            Simple, Transparent Pricing in BDT
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Plans Designed for Bangladeshi Retailers
          </h1>
          <p className="text-base text-slate-600">
            No hidden setup fees. Upgrade or cancel anytime. Powered by bKash, Nagad, and local card settlement.
          </p>

          {/* Billing Frequency Switch */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-semibold">
            <span className={!isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500'}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-slate-900 rounded-full p-1 transition flex items-center"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500'}>
              Annual Billing{' '}
              <span className="text-emerald-600 font-bold ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                p.highlight
                  ? 'border-2 border-slate-900 ring-4 ring-slate-100 relative'
                  : 'border-slate-200'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{p.description}</p>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {p.price === 0 ? '৳0' : `৳${p.price.toLocaleString()}`}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/month</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{p.period}</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-6">
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center ${
                    p.highlight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
