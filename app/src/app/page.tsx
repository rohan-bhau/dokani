'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  Boxes,
  ShoppingCart,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Receipt,
  QrCode,
  CheckCircle2,
  Clock,
  Laptop,
  Printer,
  ChevronRight,
  Sparkles,
  BarChart3,
  Lock,
} from 'lucide-react';
import type { RootState } from '@/store';

export default function HomePage() {
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  return (
    <div className="flex flex-col">
      {/* 1. TOP LOGGED-IN STORE STATUS BAR (If signed in) */}
      {isInitialized && user && (
        <section className="border-b border-emerald-200 bg-emerald-50/70 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Store Console Active
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {user.tenant?.name || 'My Retail Store'}{' '}
                    <span className="font-normal text-xs text-slate-600">
                      (Logged in as {user.name} • {user.roles?.[0] || 'Owner'})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Launch POS Counter</span>
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  <span>Stock Catalog</span>
                </Link>
                <Link
                  href="/customers"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Baki Khata</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. HERO VALUE PROPOSITION SECTION */}
      <section className="border-b border-slate-200 bg-white py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Plain Value Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
                <Zap className="h-3.5 w-3.5 text-emerald-700" />
                <span>Engineered for Bangladeshi Retail Merchants</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12]">
                POS Billing, Stock Tracking & Baki Khata in One Platform.
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl">
                Dokani is a practical retail management system built for high-rush grocery, electronics, and departmental stores. Fast barcode counter sales, tamper-proof customer credit limits, and automated bKash/Card payment confirmations without manual calculators or lost paper notebooks.
              </p>

              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                {user ? (
                  <Link
                    href="/pos"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Open POS Terminal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      <span>Register Store Free</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
                    >
                      <span>Sign in to Account</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/features"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <span>View All Features</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {/* Hardware Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard USB Barcode Scanners</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>80mm Thermal Receipt Ready</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>bKash & SSLCommerz Sandbox</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Counter Visual Blueprint */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-mono font-bold text-slate-600">
                      Counter POS Simulation
                    </span>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Live Session
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aarong Pure Ghee 500g</p>
                      <p className="text-[10px] text-slate-400 font-mono">BARCODE: 8941100223 • 1x</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">৳650.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Pran Mango Juice 1L</p>
                      <p className="text-[10px] text-slate-400 font-mono">BARCODE: 8941100554 • 2x</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">৳180.00</span>
                  </div>

                  <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-900">
                      <span>Subtotal (3 items)</span>
                      <span className="font-semibold tabular-nums">৳830.00</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-emerald-900">
                      <span>Retail VAT (5%)</span>
                      <span className="font-semibold tabular-nums">৳41.50</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-extrabold text-emerald-950 border-t border-emerald-200 pt-1.5">
                      <span>Grand Total</span>
                      <span className="tabular-nums">৳872.00</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="rounded-md bg-white border border-slate-200 p-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Payment Tender</p>
                      <p className="text-xs font-bold text-brand mt-0.5">bKash QR / Gateway</p>
                    </div>
                    <div className="rounded-md bg-white border border-slate-200 p-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Socket.io Event</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">Real-time Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW DOKANI HELPS YOUR RETAIL BUSINESS (THE 4 CORE PAIN POINTS) */}
      <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand">
              Business Impact
            </h2>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              How Dokani Directly Helps Your Daily Operations
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Designed after analyzing the real operational bottlenecks of Bangladeshi retail counters and grocery shops.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-brand">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Eliminate Rush-Hour Lines</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Cashiers can scan items in milliseconds using laser scanners or keyboard search. If a customer steps away for cash, put the cart on hold with one keypress and continue serving the line.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Boxes className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Stop Stock Discrepancies</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Every purchase from suppliers, counter sale, or return logs an immutable stock movement. Low-stock badges alert you when items hit reorder thresholds so shelves never run empty.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Prevent Bad Baki Debts</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Paper credit notebooks get misplaced or disputed. Dokani maintains an auditable digital ledger with hard credit limits, preventing cashiers from extending unauthorized credit.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Protect Against Fake SMS</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Instead of trusting SMS screenshots on customer phones, generate gateway checkouts. Backend webhooks verify transactions directly through bKash and SSLCommerz servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW WALKTHROUGH */}
      <section className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand">Simple Workflow</h2>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Get Started in Three Straightforward Steps
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-2xs">
                1
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Register Store</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Enter your shop name, owner phone number, and password. A dedicated, tenant-isolated database partition is created for your store in seconds.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-2xs">
                2
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Setup Products & Pricing</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Add products with barcodes, cost prices, and retail rates. Bulk import existing inventories with our standard CSV upload template.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-2xs">
                3
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Open Counter & Sell</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Launch the POS screen on any desktop, laptop, or tablet. Scan barcodes, collect cash or bKash payments, and print 80mm receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER CALL TO ACTION */}
      <section className="bg-slate-900 py-14 sm:py-18 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 md:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upgrade Your Retail Store to Dokani Today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-xs sm:text-sm text-slate-400">
            Professional counter billing, accurate stock accounting, and secure customer credit management tailored for Bangladeshi retail.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/pos"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-500"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Go to POS Billing Counter</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-500"
                >
                  <span>Create Free Store Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex w-full sm:w-auto items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  <span>Sign in with Phone</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
