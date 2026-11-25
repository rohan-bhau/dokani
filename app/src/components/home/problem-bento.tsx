import {
  BookOpen,
  Boxes,
  CheckCircle2,
  Hourglass,
  TrendingDown,
} from 'lucide-react';

const BOTTLENECKS = [
  {
    code: 'BOTTLENECK 01',
    icon: BookOpen,
    topBorder: 'border-t-amber-500 hover:border-amber-400',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBoxClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
    title: 'Lost Paper Khata & Uncollected Due',
    pain: 'Handwritten khata pages tear, get misplaced during shop renovations, or get disputed by customers at month-end. Uncollected baki quietly chokes shop cash flow.',
    resolutionTitle: 'DOKANI DIGITAL BAKI KHATA',
    resolution:
      'Customer-linked credit ledgers tied to phone numbers, configurable credit caps, and shareable bKash or SSLCommerz payment collection links.',
  },
  {
    code: 'BOTTLENECK 02',
    icon: Hourglass,
    topBorder: 'border-t-rose-500 hover:border-rose-400',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBoxClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
    title: 'Peak-Hour Counter Jamming',
    pain: 'Slow mouse-heavy web apps force cashiers to click repeatedly per bill. Impatient customers abandon queues during evening grocery and pharmacy rushes.',
    resolutionTitle: 'KEYBOARD-FIRST SPEED CHECKOUT',
    resolution:
      'Press F1 to scan or search, adjust quantities from the keyboard, hold carts with F8, and print 80mm or 58mm thermal slips with F9.',
  },
  {
    code: 'BOTTLENECK 03',
    icon: Boxes,
    topBorder: 'border-t-orange-500 hover:border-orange-400',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    iconBoxClass: 'bg-orange-50 text-orange-600 border-orange-200/80',
    title: 'Silent Stockouts & Unknown Shrinkage',
    pain: 'Owners discover fast-selling items are out of stock only when a customer asks. Broken stock, returns, or unlogged restocks drift away from reality.',
    resolutionTitle: 'ATOMIC ROW-LOCKED INVENTORY',
    resolution:
      'Stock decrements atomically on every sale, restores cleanly on item returns, and triggers low-stock alerts before shelves run empty.',
  },
  {
    code: 'BOTTLENECK 04',
    icon: TrendingDown,
    topBorder: 'border-t-indigo-600 hover:border-indigo-400',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBoxClass: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    title: 'Blind Margins & Cash Mismatch',
    pain: 'Wholesale distributor prices change every week, but shops sell with outdated purchase costs. At closing time, drawer cash rarely matches paper totals.',
    resolutionTitle: 'WEIGHTED AVERAGE COSTING & ROLE GUARDS',
    resolution:
      'Incoming supplier purchases blend unit cost automatically while separate Cash, bKash, Expense, and Cashier permissions protect margins.',
  },
] as const;

export function DailyBottlenecks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {BOTTLENECKS.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.code}
            className={`bg-white border-t-4 border-x border-b border-slate-200 p-6 sm:p-7 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-lg transition-all ${item.topBorder}`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold ${item.badgeClass}`}
                >
                  {item.code}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center ${item.iconBoxClass}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1B3D] mb-2.5">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {item.pain}
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 p-4 rounded-lg">
              <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 mb-1 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{item.resolutionTitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {item.resolution}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
