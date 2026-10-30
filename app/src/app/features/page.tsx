import Link from 'next/link';
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
  AlertTriangle,
  History,
  Lock,
  Sparkles,
} from 'lucide-react';

function FeaturesPage() {
  const coreFeatures = [
    {
      icon: ShoppingCart,
      title: 'High-Speed POS Counter Terminal',
      description:
        'Keyboard-driven checkout tailored for fast retail rush hours. Instant product search by barcode, English name, or বাংলা নাম, with multi-order hold and resume capability.',
      badge: 'Counter Sales',
      points: [
        'Hardware barcode scanner auto-detect',
        '80mm / 58mm thermal receipt printing',
        'Multi-tender splitting (Cash, bKash, Card)',
        'Cart-level and item-level discount controls',
      ],
    },
    {
      icon: QrCode,
      title: 'Real-Time Digital Payment Gateways',
      description:
        'Eliminate manual bKash transaction ID errors. Generate dynamic payment links for customer checkout with instant confirmation feedback on cashier terminals.',
      badge: 'Payments',
      points: [
        'bKash direct payment tokenized sandbox integration',
        'SSLCommerz gateway for Visa, Mastercard, and mobile banking',
        'Real-time WebSocket event synchronization without browser refreshing',
        'Idempotent duplicate webhook guard to protect ledger balances',
      ],
    },
    {
      icon: Boxes,
      title: 'Live Stock & Inventory Ledger',
      description:
        'Complete inventory transparency across all products. Every stock reduction, return, or supplier purchase is recorded in an immutable ledger with audit trails.',
      badge: 'Inventory',
      points: [
        'Low stock threshold alerts to prevent product stockouts',
        'Batch CSV product catalog import & export',
        'Cost price vs selling price margin calculation',
        'Row-locked concurrency controls to prevent negative stock overselling',
      ],
    },
    {
      icon: Users,
      title: 'Customer Credit & Baki Khata',
      description:
        'Replace unreliable paper notebooks with a tamper-proof digital ledger. Set customer credit ceilings and record partial due payments with single-click receipts.',
      badge: 'Baki Management',
      points: [
        'Per-customer credit limit validation before sale finalization',
        'Real-time outstanding balance calculation',
        'Due collection modal with multi-channel payment records',
        'Full customer transaction and payment history',
      ],
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Tenant Shop Data Isolation',
      description:
        'Every shop operates on an independent, isolated workspace. Your sales figures, profit margins, and customer directories are completely segregated.',
      badge: 'Security',
      points: [
        'Strict tenant-scoped query validation in database layer',
        'Role-based permissions (Owner, Cashier, Inventory Staff)',
        'Secure Argon2 password hashing and JWT token rotation',
        'Audit-logged stock adjustments and sales voids',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Daily Business Analytics & Reports',
      description:
        'Actionable retail insights into your best-selling items, cash flow breakdown, daily profit margins, and inventory asset valuation.',
      badge: 'Insights',
      points: [
        'Real-time revenue, gross profit, and tender breakdowns',
        'Top-performing SKU sales volume rankings',
        'Slow-moving inventory analysis to optimize stock purchases',
        'Exportable transaction records for tax and accounting',
      ],
    },
  ];

  return (
    <div className="bg-canvas py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Complete Feature Overview
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything Required to Run a Modern Retail Store
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            From instant counter checkout to automated customer credit limits and digital payment confirmation, Dokani replaces paper records with a unified, high-reliability retail management suite.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      {feat.badge}
                    </span>
                  </div>

                  <h2 className="mt-4 text-base font-bold text-slate-900">{feat.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{feat.description}</p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                      Key Capabilities:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                      {feat.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Ready to upgrade your store operations?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-600 sm:text-sm">
            Sign up in 30 seconds and test all POS billing, inventory alerts, and customer ledger features immediately.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-hover sm:w-auto"
            >
              <span>Register Store Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              <span>Sign in to Existing Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
