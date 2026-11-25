'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Barcode,
  Minus,
  Plus,
  Printer,
  Wifi,
  Zap,
} from 'lucide-react';

type TenderMode = 'SPLIT' | 'CASH' | 'BKASH' | 'BAKI';

interface DemoItem {
  id: string;
  name: string;
  meta: string;
  tag: string;
  price: number;
  qty: number;
}

const INITIAL_ITEMS: DemoItem[] = [
  {
    id: '1',
    name: 'Square Seclo 20mg Capsule (Box of 100)',
    meta: 'SKU #SQ-8941 • Pharma',
    tag: 'Pharma',
    price: 800,
    qty: 1,
  },
  {
    id: '2',
    name: 'Aarong Dairy Pure Ghee 900g',
    meta: 'SKU #AR-4401 • Dairy',
    tag: 'Dairy',
    price: 1450,
    qty: 1,
  },
  {
    id: '3',
    name: 'Radhuni Pure Mustard Oil 1L',
    meta: 'SKU #RD-0199 • Grocery',
    tag: 'Grocery',
    price: 320,
    qty: 1,
  },
  {
    id: '4',
    name: 'Anker Dual USB-C Fast Charger 33W',
    meta: 'SKU #AK-8820 • Electronics',
    tag: 'Electronics',
    price: 880,
    qty: 1,
  },
];

export function HeroPosStage() {
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [tenderMode, setTenderMode] = useState<TenderMode>('SPLIT');
  const [printed, setPrinted] = useState(false);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, Math.min(9, item.qty + delta)) }
          : item
      )
    );
    setPrinted(false);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);

  const cashPart = tenderMode === 'SPLIT' ? Math.min(2000, subtotal) : tenderMode === 'CASH' ? subtotal : 0;
  const bkashPart = tenderMode === 'SPLIT' ? Math.min(1000, Math.max(0, subtotal - cashPart)) : tenderMode === 'BKASH' ? subtotal : 0;
  const bakiPart = Math.max(0, subtotal - cashPart - bkashPart);

  return (
    <div
      id="demo-terminal"
      className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-b from-indigo-500/15 via-slate-200/70 to-slate-200/40 p-1.5 shadow-xl shadow-slate-900/10"
    >
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden p-2 sm:p-3">
        <div className="rounded-lg bg-gradient-to-b from-[#F8FAFD] to-slate-50/90 border border-indigo-100/80 p-3 sm:p-5 flex flex-col gap-4">
          {/* Terminal Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-indigo-100 px-4 py-2.5 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="font-mono text-xs sm:text-sm text-[#0B1B3D] font-extrabold tracking-wide">
                  REGISTER #01
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  (Main Counter)
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
                LIVE PREVIEW
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-800 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/80">
                <BadgeCheck className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                <span>
                  Cashier: <strong className="text-[#0B1B3D]">Tanvir Ahmed</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/80 font-mono font-semibold">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>CONNECTED</span>
              </div>
            </div>
          </div>

          {/* Shortcut Function Badges (Tactile Keycaps) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-medium">
            <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-slate-800 flex items-center justify-center gap-1.5">
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-xs">
                [F1]
              </span>
              <span>Item Lookup</span>
            </div>
            <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-slate-800 flex items-center justify-center gap-1.5">
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-xs">
                [F2]
              </span>
              <span>Customer Phone</span>
            </div>
            <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-slate-800 flex items-center justify-center gap-1.5">
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-xs">
                [F4]
              </span>
              <span>Line Discount</span>
            </div>
            <div className="bg-gradient-to-b from-amber-50/50 to-white border border-amber-200 py-2 px-2 rounded-lg text-slate-800 flex items-center justify-center gap-1.5">
              <span className="font-mono text-amber-800 font-bold bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-xs">
                [F8]
              </span>
              <span>Hold Cart</span>
              <span className="bg-amber-600 text-white px-1.5 rounded-full text-xs font-bold">
                2
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">
                [F9]
              </span>
              <span>Tender &amp; Print</span>
            </div>
          </div>

        {/* Main Terminal Two-Column Work Surface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: Active Item Table */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-lg">
              <Barcode className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="w-full font-mono text-xs sm:text-sm text-slate-800 font-medium truncate">
                894110029381 (Square Seclo 20mg Capsule)
              </span>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono font-semibold shrink-0">
                AUTO-ADD
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 font-semibold">Item Details</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{item.meta}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        ৳ {item.price.toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="inline-flex items-center justify-center gap-1.5 mx-auto">
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.name}`}
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            <Minus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-slate-900 tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.name}`}
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        ৳ {(item.price * item.qty).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-4">
                <span>
                  Lines: <strong className="text-slate-800 font-mono">{items.length}</strong>
                </span>
                <span>
                  Units: <strong className="text-slate-800 font-mono">{totalUnits}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ready for next scan</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Billing Drawer & Split Settlement Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-lg p-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                  Customer (Khata Linked)
                </div>
                <div className="text-sm sm:text-base text-[#0F2444] font-bold flex items-center gap-2 mt-0.5">
                  <span>Rafiqul Islam</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                    BAKI ACTIVE
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  01712-849921 • Due: ৳ 4,850
                </div>
              </div>
              <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold shrink-0">
                [F2]
              </span>
            </div>

            {/* Pricing Calculation Block */}
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-mono text-slate-800 font-semibold tabular-nums">
                  ৳ {subtotal.toLocaleString('en-US')}.00
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-mono text-slate-500 tabular-nums">৳ 0.00</span>
              </div>
              <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200">
                <span className="text-sm font-bold text-[#0F2444]">Net Payable</span>
                <span className="text-2xl text-emerald-600 font-mono font-extrabold tabular-nums">
                  ৳ {subtotal.toLocaleString('en-US')}.00
                </span>
              </div>
            </div>

            {/* Tender Mode Selector */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                  Tender Mode
                </span>
                <div className="flex gap-1">
                  {(['SPLIT', 'CASH', 'BKASH', 'BAKI'] as TenderMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setTenderMode(mode);
                        setPrinted(false);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        tenderMode === mode
                          ? 'bg-[#0F2444] text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-800 bg-white px-2.5 py-1.5 rounded border border-slate-200">
                  <span className="flex items-center gap-1.5 font-sans font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Cash Tendered
                  </span>
                  <span className="font-bold text-emerald-700 tabular-nums">৳ {cashPart.toLocaleString('en-US')}.00</span>
                </div>
                <div className="flex justify-between items-center bg-[#E2136E]/5 px-2.5 py-1.5 rounded border border-[#E2136E]/20">
                  <span className="flex items-center gap-1.5 font-sans font-medium text-[#E2136E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" aria-hidden="true" />
                    bKash Counter
                  </span>
                  <span className="font-bold text-[#E2136E] tabular-nums">৳ {bkashPart.toLocaleString('en-US')}.00</span>
                </div>
                <div className="flex justify-between items-center text-amber-800 bg-amber-500/10 px-2.5 py-1.5 rounded border border-amber-300">
                  <span className="flex items-center gap-1.5 font-sans font-medium text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Baki Khata Assigned
                  </span>
                  <span className="font-bold text-amber-800 tabular-nums">৳ {bakiPart.toLocaleString('en-US')}.00</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPrinted(true)}
              className="w-full bg-gradient-to-r from-[#0B1B3D] via-[#1E3A8A] to-[#2563EB] hover:brightness-110 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-950/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Printer className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>
                {printed
                  ? 'Slip Preview Triggered (80mm Ready)'
                  : '[F9] Print 80mm Slip & Clear'}
              </span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
