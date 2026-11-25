'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { DokaniLogo } from '@/components/dokani-logo';

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/pay/') || pathname?.startsWith('/pos')) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t border-slate-200 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <DokaniLogo size={30} showWordmark />
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Retail POS counter, digital Baki Khata, and weighted inventory management built for pharmacies, grocers, and merchants across Bangladesh.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
              <Terminal className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Keyboard-first counter &amp; ledger</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0F2444] uppercase tracking-wider mb-4">
              Counter &amp; Stock
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/pos" className="hover:text-emerald-700 transition-colors">
                  POS Counter Terminal
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-700 transition-colors">
                  Products &amp; SKUs
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-emerald-700 transition-colors">
                  Stock &amp; Cost Ledger
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-emerald-700 transition-colors">
                  All Modules
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0F2444] uppercase tracking-wider mb-4">
              Ledgers &amp; Ops
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/customers" className="hover:text-emerald-700 transition-colors">
                  Customer Baki Khata
                </Link>
              </li>
              <li>
                <Link href="/purchases" className="hover:text-emerald-700 transition-colors">
                  Supplier Purchases
                </Link>
              </li>
              <li>
                <Link href="/sales" className="hover:text-emerald-700 transition-colors">
                  Sales &amp; Returns
                </Link>
              </li>
              <li>
                <Link href="/expenses" className="hover:text-emerald-700 transition-colors">
                  Daily Expenses
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0F2444] uppercase tracking-wider mb-4">
              Store Access
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/register" className="hover:text-emerald-700 transition-colors">
                  Create Store Workspace
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-700 transition-colors">
                  Sign In to Console
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-emerald-700 transition-colors">
                  Staff &amp; Role Guards
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-emerald-700 transition-colors">
                  Receipt &amp; Store Settings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#0F2444] uppercase tracking-wider mb-4">
              Print &amp; Payments
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>58mm / 80mm / A4 Ready</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thermal counter slips, A4 invoices, bKash &amp; SSLCommerz payment links, and role-isolated API guards.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold pt-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Per-shop isolated ledgers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Dokani Retail Management Platform. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Built for fast counters, thermal slips, and accurate bookkeeping.
          </p>
        </div>
      </div>
    </footer>
  );
}
