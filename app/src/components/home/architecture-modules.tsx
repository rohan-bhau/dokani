import {
  BadgeCheck,
  Barcode,
  Printer,
  Receipt,
  ShieldCheck,
} from 'lucide-react';

const KEYBOARD_MAP = [
  { key: '[F1] Focus Barcode Search', action: 'Instant jump to SKU / scan input' },
  { key: '[F2] Link Customer Phone', action: 'Khata lookup & credit limit check' },
  { key: '[F4] Line Discount', action: 'Apply flat or % item discount' },
  { key: '[F8] Park / Hold Active Cart', action: 'Pause bill while customer browses' },
  { key: '[F9] Tender & Print Slip', action: 'Complete sale & open print layout', highlight: true },
] as const;

const ROLE_MATRIX = [
  {
    scope: 'View Net Profit & Purchase Cost',
    owner: 'GRANTED',
    manager: 'DENIED',
    cashier: 'DENIED',
    viewer: 'READ ONLY',
  },
  {
    scope: 'Apply Discounts & Custom Price',
    owner: 'GRANTED',
    manager: 'GRANTED',
    cashier: 'LIMITED',
    viewer: 'DENIED',
  },
  {
    scope: 'Process Sales Returns & Voids',
    owner: 'GRANTED',
    manager: 'GRANTED',
    cashier: 'DENIED',
    viewer: 'DENIED',
  },
  {
    scope: 'Manage Store Settings & Staff Roles',
    owner: 'GRANTED',
    manager: 'DENIED',
    cashier: 'DENIED',
    viewer: 'DENIED',
  },
  {
    scope: 'Supplier Purchase Bill Entry',
    owner: 'GRANTED',
    manager: 'GRANTED',
    cashier: 'DENIED',
    viewer: 'READ ONLY',
  },
] as const;

function renderAccessCell(value: string) {
  if (value === 'GRANTED') {
    return (
      <span className="inline-block bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-200 font-bold text-xs">
        {value}
      </span>
    );
  }
  if (value === 'DENIED') {
    return (
      <span className="inline-block bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded border border-rose-200 font-bold text-xs">
        {value}
      </span>
    );
  }
  if (value === 'LIMITED') {
    return (
      <span className="inline-block bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200 font-bold text-xs">
        {value}
      </span>
    );
  }
  return (
    <span className="inline-block bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded border border-sky-200 font-bold text-xs">
      {value}
    </span>
  );
}

export function ArchitectureModules() {
  return (
    <div className="space-y-8">
      {/* MODULE A: COUNTER VELOCITY */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-6 lg:p-8 shadow-md relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-600 to-blue-500"
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
              MODULE A • COUNTER VELOCITY
            </span>
            <h3 className="text-2xl sm:text-[28px] font-bold text-[#0F2444] leading-tight">
              Mouse-Free Keyboard Checkout for Busy Counters
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Retail cashiers during rush hour should never waste seconds hunting with a mouse. Dokani maps core counter actions to function keys so fingers stay on the keyboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-emerald-700 font-mono text-xs font-bold mb-1">
                  [F1] - [F9] Keystrokes
                </div>
                <div className="text-slate-600 text-xs">
                  Full counter control without trackpad lag.
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-emerald-700 font-mono text-xs font-bold mb-1">
                  Cart Holding
                </div>
                <div className="text-slate-600 text-xs">
                  Park and resume multiple active customer carts.
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-emerald-700 font-mono text-xs font-bold mb-1">
                  1D &amp; 2D Barcode Scan
                </div>
                <div className="text-slate-600 text-xs">
                  Works with standard USB &amp; Bluetooth HID scanners.
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-emerald-700 font-mono text-xs font-bold mb-1">
                  Split Multi-Tender
                </div>
                <div className="text-slate-600 text-xs">
                  Cash + bKash + Customer Baki in one invoice.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3 shadow-inner">
            <div className="text-xs font-mono text-slate-600 flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="font-bold">KEYBOARD ACCELERATOR MAPPING</span>
              <span className="text-emerald-700 font-bold">COUNTER SHORTCUTS</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              {KEYBOARD_MAP.map((row) => (
                <div
                  key={row.key}
                  className="flex flex-wrap justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 items-center"
                >
                  <span
                    className={`font-bold ${
                      'highlight' in row && row.highlight ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {row.key}
                  </span>
                  <span className="text-slate-600">{row.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE B: DIGITAL BAKI KHATA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3 shadow-inner">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                  Customer Khata Profile
                </span>
                <div className="text-lg text-[#0F2444] font-bold">Rafiqul Islam</div>
                <div className="font-mono text-xs text-slate-600">
                  Dhanmondi, Dhaka • 01712-849921
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-amber-700 uppercase font-bold">
                  Outstanding Baki
                </span>
                <div className="text-lg text-amber-700 font-mono font-bold tabular-nums">
                  ৳ 4,850.00
                </div>
                <span className="text-[11px] text-slate-500">Credit Cap: ৳ 10,000</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-600 uppercase font-semibold">
              Recent Repayments &amp; Credits
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-800">Credit Sale (Invoice #KS-9021)</span>
                <span className="text-rose-600 font-bold tabular-nums">+ ৳ 450.00</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-800">bKash Payment Link Settled</span>
                <span className="text-emerald-700 font-bold tabular-nums">- ৳ 2,000.00</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-800">Cash Counter Collection</span>
                <span className="text-emerald-700 font-bold tabular-nums">- ৳ 1,500.00</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
              MODULE B • CREDIT CONTROL
            </span>
            <h3 className="text-2xl sm:text-[28px] font-bold text-[#0F2444] leading-tight">
              Digital Baki Khata with Online Payment Links
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Regular neighborhood customers rely on baki, but handwritten notebooks cause disputes and forgotten balances. Dokani keeps every credit invoice and repayment verifiable.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>Shareable Payment Links:</strong> Generate a token link for remote bKash or SSLCommerz settlement with instant ledger updates.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>Per-Customer Credit Ceilings:</strong> Enforce maximum due limits during counter checkout to prevent risky overruns.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>Timestamped Audit Trail:</strong> Every partial repayment records the exact amount, method, and staff member.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODULE C: WEIGHTED AVERAGE COSTING */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono font-bold">
              MODULE C • PROFIT ACCURACY
            </span>
            <h3 className="text-2xl sm:text-[28px] font-bold text-[#0F2444] leading-tight">
              Weighted Average Costing for Changing Wholesale Prices
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              When supplier prices shift between deliveries, flat cost assumptions distort your profit reports. Dokani blends existing stock cost with new supplier purchase bills automatically.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-xs shadow-inner">
              <div className="text-sky-700 font-bold">BLENDED COST EXAMPLE:</div>
              <div className="text-slate-600">Existing Stock: 50 pcs @ ৳ 180 = ৳ 9,000</div>
              <div className="text-slate-600">New Purchase: 100 pcs @ ৳ 195 = ৳ 19,500</div>
              <div className="text-emerald-700 font-bold text-sm pt-1.5 border-t border-slate-200">
                New Unit Cost: ৳ 28,500 / 150 pcs = ৳ 190.00
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3 shadow-inner">
            <div className="text-xs font-mono text-slate-600 flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="font-bold">REORDER &amp; STOCK ALERTS</span>
              <span className="text-emerald-700 font-bold">LIVE LEDGER</span>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Teer Soybean Oil 5L
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    Reorder threshold: 12 units
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-bold shrink-0">
                  8 LEFT
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Napa Extra 500mg (Box)
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    Weighted cost tracked per purchase
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold shrink-0">
                  42 BOXES
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Pran Mango Juice 1L
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    CSV bulk import supported
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold shrink-0">
                  15 LEFT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE D: THERMAL & HARDWARE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2.5 font-mono text-xs shadow-inner">
            <div className="text-slate-600 flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="font-bold">SUPPORTED OUTPUT &amp; INPUTS</span>
              <span className="text-emerald-700 font-bold">BROWSER PRINT READY</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
              <span className="text-slate-900 font-bold">80mm Thermal Receipt</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Standard Counter
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
              <span className="text-slate-900 font-bold">58mm Compact Thermal</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Portable / Mini
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
              <span className="text-slate-900 font-bold">A4 Formal Invoice</span>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                PDF / Office Print
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex justify-between items-center">
              <span className="text-slate-900 font-bold">USB / Bluetooth Barcode</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                HID Plug &amp; Play
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
              MODULE D • PRINT &amp; PERIPHERALS
            </span>
            <h3 className="text-2xl sm:text-[28px] font-bold text-[#0F2444] leading-tight">
              58mm, 80mm Thermal &amp; A4 Invoice Layouts
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Use the barcode scanner and thermal printer already on your counter. Switch receipt width from Store Settings without reformatting invoices manually.
            </p>
            <div className="space-y-2.5 text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  <strong>58mm &amp; 80mm Slips:</strong> Crisp shop header, item breakdown, and paid/due summary.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  <strong>A4 Customer Invoices:</strong> Clean formal bills for electronics and wholesale orders.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Barcode className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  <strong>HID Barcode Scanners:</strong> Instant SKU match directly from the F1 search bar.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE E: ROLE ISOLATION MATRIX */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="max-w-3xl mb-6">
          <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
            MODULE E • ACCESS CONTROL
          </span>
          <h3 className="text-2xl sm:text-[28px] font-bold text-[#0F2444] mt-2 mb-1">
            Staff Role Isolation Matrix
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            Enforced on both the UI and backend API so cashiers can run the counter without accessing wholesale costs or store settings.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-100 text-[#0F2444] border-b border-slate-200 font-semibold">
                <th className="p-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand" aria-hidden="true" />
                    Permission Scope
                  </span>
                </th>
                <th className="p-3.5 text-center">Owner</th>
                <th className="p-3.5 text-center">Manager</th>
                <th className="p-3.5 text-center">Cashier</th>
                <th className="p-3.5 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {ROLE_MATRIX.map((row, idx) => (
                <tr
                  key={row.scope}
                  className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                >
                  <td className="p-3.5 text-slate-900 font-sans font-medium text-sm">
                    {row.scope}
                  </td>
                  <td className="p-3.5 text-center">{renderAccessCell(row.owner)}</td>
                  <td className="p-3.5 text-center">{renderAccessCell(row.manager)}</td>
                  <td className="p-3.5 text-center">{renderAccessCell(row.cashier)}</td>
                  <td className="p-3.5 text-center">{renderAccessCell(row.viewer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
