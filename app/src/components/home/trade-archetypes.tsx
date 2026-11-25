import { Cpu, Network, Pill, Store } from 'lucide-react';

const ARCHETYPES = [
  {
    icon: Pill,
    topBorder: 'border-t-emerald-500',
    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    listBox: 'text-emerald-900 bg-emerald-50/60 border-emerald-200/80',
    title: 'Pharmacy & Health',
    description:
      'Fast barcode or generic-name lookup during evening queues, low-stock threshold alerts, and crisp 80mm thermal receipts.',
    points: [
      'Instant SKU & barcode lookup',
      'Low-stock reorder warnings',
      '80mm & 58mm thermal slips',
    ],
  },
  {
    icon: Store,
    topBorder: 'border-t-amber-500',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    listBox: 'text-amber-900 bg-amber-50/60 border-amber-200/80',
    title: 'Grocery & Mudir Dokan',
    description:
      'Serve walk-in buyers and monthly household accounts side by side with split Cash, bKash, and phone-linked Baki Khata.',
    points: [
      'Split Cash + bKash + Baki',
      'F8 cart hold for busy lanes',
      'Daily shop expense tracking',
    ],
  },
  {
    icon: Cpu,
    topBorder: 'border-t-violet-600',
    iconBg: 'bg-violet-50 border-violet-200 text-violet-600',
    listBox: 'text-violet-900 bg-violet-50/60 border-violet-200/80',
    title: 'Electronics & Mobile',
    description:
      'Print formal A4 customer invoices, track supplier purchase bills, and keep wholesale margins hidden from counter cashiers.',
    points: [
      'Formal A4 PDF invoices',
      'Margin hidden from cashiers',
      'Partial & online link payments',
    ],
  },
  {
    icon: Network,
    topBorder: 'border-t-blue-600',
    iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
    listBox: 'text-blue-900 bg-blue-50/60 border-blue-200/80',
    title: 'Multi-Staff Counters',
    description:
      'Create dedicated staff accounts with Owner, Manager, Cashier, or Viewer permissions and revoke access immediately when needed.',
    points: [
      '4 role-based access levels',
      'Instant session revocation',
      'Server-scoped store isolation',
    ],
  },
] as const;

export function TradeArchetypes() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {ARCHETYPES.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.title}
            className={`bg-white border-t-4 border-x border-b border-slate-200 p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-lg transition-all ${item.topBorder}`}
          >
            <div>
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${item.iconBg}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D] mb-1.5">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                {item.description}
              </p>
            </div>
            <ul
              className={`space-y-1 text-xs font-mono border p-3 rounded-lg ${item.listBox}`}
            >
              {item.points.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
