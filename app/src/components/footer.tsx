'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/pay/') || pathname?.startsWith('/pos')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-600">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-brand text-xs font-bold text-white">
                DP
              </span>
              <span className="text-base tracking-tight">Dokani</span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modern POS, automated customer credit ledger, and real-time inventory management built specifically for Bangladeshi retail merchants and departmental stores.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Platform</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/pos" className="hover:text-brand">POS Counter Terminal</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-brand">Product & Stock Ledger</Link>
              </li>
              <li>
                <Link href="/customers" className="hover:text-brand">Customer Credit (Baki) Ledger</Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-brand">All Features</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand">Pricing & Plans</Link>
              </li>
            </ul>

          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Integrations</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <span className="text-slate-700">bKash Merchant Sandbox</span>
              </li>
              <li>
                <span className="text-slate-700">SSLCommerz Multi-card Payment</span>
              </li>
              <li>
                <span className="text-slate-700">80mm Thermal Receipt Print</span>
              </li>
              <li>
                <span className="text-slate-700">USB / Laser Barcode Scanners</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Get Started</h3>
            <p className="mt-3 text-xs text-slate-500">
              Register your retail store today. No complex setup or specialized hardware required.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-hover"
              >
                Register Store
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Dokani Retail Management Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed for fast counters, offline-tolerant retail, and accurate bookkeeping.</p>
        </div>
      </div>
    </footer>
  );
}
