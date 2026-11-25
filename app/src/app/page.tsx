'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  Monitor,
  Printer,
  Store,
  Terminal,
  Zap,
} from 'lucide-react';
import type { RootState } from '@/store';
import { ShopLogo } from '@/components/dokani-logo';
import { HeroPosStage } from '@/components/home/hero-pos-stage';
import { DailyBottlenecks } from '@/components/home/problem-bento';
import { ArchitectureModules } from '@/components/home/architecture-modules';
import { TradeArchetypes } from '@/components/home/trade-archetypes';
import { FaqSection } from '@/components/home/faq-section';

const BENCHMARK_CARDS = [
  {
    value: '3 Tenders',
    title: 'Cash, bKash & Baki',
    detail: 'Split or single payment settlement on every counter invoice.',
    color: 'text-emerald-600',
  },
  {
    value: '58 / 80 / A4',
    title: 'Receipt Formats',
    detail: 'Thermal counter rolls and formal A4 customer invoices.',
    color: 'text-[#0F2444]',
  },
  {
    value: '4 Roles',
    title: 'Access Isolation',
    detail: 'Owner, Manager, Cashier, and Viewer permission guards.',
    color: 'text-amber-600',
  },
  {
    value: 'F1 -> F9',
    title: 'Keyboard Checkout',
    detail: 'Scan, link customer khata, hold cart, and print without mouse lag.',
    color: 'text-sky-600',
  },
] as const;

export default function HomePage() {
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {isInitialized && user && (
        <div className="bg-emerald-50/90 text-slate-900 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShopLogo name={user.name} size="sm" />
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-[#0F2444]">Store Console Active</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{user.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/pos"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F2444] hover:bg-[#1E3A8A] text-white text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Open POS Counter
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/products"
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Products
              </Link>
              <Link
                href="/customers"
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Customers
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col w-full">
        {/* SECTION 1: HERO & LIVE INTERACTIVE TERMINAL HUD */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 py-14 lg:py-20 overflow-hidden bg-[#F8FAFC]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-emerald-100/70 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/3 -right-20 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl"
          />

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center mb-10 relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] text-[#0B1B3D] tracking-tight max-w-4xl mb-4 font-extrabold leading-[1.14]">
              The Retail Operating System Built for the Speed of{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent underline decoration-emerald-400/80 underline-offset-8">
                Bangladeshi Commerce.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mb-7 leading-relaxed">
              Fast barcode-ready counter checkout, 80mm &amp; 58mm thermal slip printing, audit-proof digital Baki Khata, and weighted inventory costing—engineered for zero queue slowdowns and clear daily books.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-7">
              {user ? (
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0B1B3D] via-[#1E3A8A] to-[#2563EB] text-white text-sm sm:text-base font-semibold shadow-lg shadow-indigo-950/20 hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Store className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                  <span>Open POS Counter</span>
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0B1B3D] via-[#1E3A8A] to-[#2563EB] text-white text-sm sm:text-base font-semibold shadow-lg shadow-indigo-950/20 hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Store className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                  <span>Create Store Workspace</span>
                </Link>
              )}
              <a
                href="#architecture"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm sm:text-base font-semibold hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Terminal className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>Explore Modules</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-slate-700 text-xs font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
                <Printer className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>58mm, 80mm &amp; A4 Print</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>
                  Split Tender: <strong className="text-emerald-700">Cash</strong> +{' '}
                  <strong className="text-[#E2136E]">bKash</strong> +{' '}
                  <strong className="text-amber-700">Baki</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
                <Monitor className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>Desktop, Laptop &amp; Tablet Ready</span>
              </div>
            </div>
          </div>

          <HeroPosStage />
        </section>

        {/* SECTION 2: 4 DAILY RETAIL BOTTLENECKS VS DOKANI */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs text-emerald-700 uppercase tracking-widest block mb-1.5 font-bold font-mono">
                  Reality Audit
                </span>
                <h2 className="text-2xl sm:text-3xl text-[#0B1B3D] font-bold tracking-tight">
                  The 4 Daily Pains in Retail Counters
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-600 max-w-md">
                How manual paper notebooks, shifting wholesale margins, and slow counter workflows create invisible cash leakages every day.
              </p>
            </div>

            <DailyBottlenecks />
          </div>
        </section>

        {/* SECTION 3: DEEP CRAFT MODULES */}
        <section
          id="architecture"
          className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-[#F8FAFC]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs text-emerald-700 uppercase tracking-widest font-bold font-mono">
                Core Platform
              </span>
              <h2 className="text-2xl sm:text-3xl text-[#0B1B3D] font-bold tracking-tight mt-1.5 mb-3">
                Engineered Modules for Demanding Retail
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Inspect how keyboard checkout, customer baki recovery, weighted costing, receipt printing, and staff permissions work together.
              </p>
            </div>

            <ArchitectureModules />
          </div>
        </section>

        {/* SECTION 4: TAILORED STORE ARCHETYPES */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs text-emerald-700 uppercase tracking-widest font-bold font-mono">
                Trade Archetypes
              </span>
              <h2 className="text-2xl sm:text-3xl text-[#0B1B3D] font-bold tracking-tight mt-1.5 mb-3">
                Designed Around the Specifics of Bangladeshi Retail
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                From neighborhood mudir dokans to pharmacies, electronics showrooms, and multi-staff stores.
              </p>
            </div>

            <TradeArchetypes />
          </div>
        </section>

        {/* SECTION 5: VERIFIABLE CAPABILITY BENCHMARKS */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 text-center">
              {BENCHMARK_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`text-2xl sm:text-3xl font-mono font-extrabold mb-1.5 tabular-nums ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-sm sm:text-base text-[#0F2444] font-bold mb-1">
                    {card.title}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: MERCHANT FAQS */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-white border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs text-emerald-700 uppercase tracking-widest font-bold font-mono">
                Merchant Guide
              </span>
              <h2 className="text-2xl sm:text-3xl text-[#0B1B3D] font-bold tracking-tight mt-1.5">
                Frequently Asked Questions
              </h2>
            </div>

            <FaqSection />
          </div>
        </section>

        {/* SECTION 7: FINAL CALL TO ACTION */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-20 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0F2444] via-[#1E3A8A] to-[#0A192F] p-8 sm:p-12 rounded-2xl relative overflow-hidden shadow-2xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl"
            />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <span className="text-xs text-emerald-400 uppercase tracking-widest font-mono font-bold block">
                  Ready at the Counter
                </span>
                <h2 className="text-2xl sm:text-4xl text-white font-bold tracking-tight leading-tight">
                  Upgrade Your Shop from Paper Khata to Digital Retail Control.
                </h2>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  Create your store workspace, import your product catalog via CSV, and run fast counter billing with clear baki tracking.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-slate-300">
                  <span>• CSV catalog import</span>
                  <span>• 80mm / 58mm / A4 print</span>
                  <span>• Role-isolated staff</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                {user ? (
                  <Link
                    href="/pos"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-emerald-500 text-slate-950 text-sm sm:text-base font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                  >
                    <span>Open POS Terminal</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-emerald-500 text-slate-950 text-sm sm:text-base font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                    >
                      <span>Create Store Workspace</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm sm:text-base font-semibold transition-all"
                    >
                      <span>Sign In to Console</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
