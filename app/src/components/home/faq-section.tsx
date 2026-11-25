'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What printers and barcode scanners work with Dokani?',
    answer:
      'Any standard USB or Bluetooth HID barcode scanner works out of the box—just focus the counter search bar (F1) and scan. For receipts, Dokani formats 80mm and 58mm thermal slips as well as full A4 PDF invoices through your browser print dialog.',
  },
  {
    question: 'How does Customer Baki (credit) tracking work?',
    answer:
      'During checkout you can mark the full bill or any remaining balance as Baki under a customer profile. Dokani updates the customer due ledger automatically, records partial cash or bKash collections later, and prints the updated balance.',
  },
  {
    question: 'Can my cashiers see purchase cost or delete past sales?',
    answer:
      'No unless you allow it. Role permissions separate Owner, Manager, Cashier, and Viewer access on both the interface and the backend API, so cashiers can run the counter without changing stock costs, store settings, or staff roles.',
  },
  {
    question: 'Does Dokani support bKash and online payment links?',
    answer:
      'Yes. You can record bKash counter payments directly or generate SSLCommerz / bKash payment links for remote invoice settlement, with real-time confirmation pushed back to your console.',
  },
  {
    question: 'How is my shop data kept separate from other stores?',
    answer:
      'Every product, sale, customer, expense, and supplier record is strictly scoped to your store ID on the server. Users only access records belonging to their authenticated workspace.',
  },
  {
    question: 'Can I handle product returns and supplier purchases?',
    answer:
      'Yes. You can process partial or full sales returns from any invoice—restoring stock and adjusting ledgers—and record supplier purchase bills to restock items and track supplier payables.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;

        return (
          <div key={item.question}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
            >
              <span className="text-base font-semibold text-slate-900">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-brand' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-6 pb-5 pt-0 text-sm sm:text-base text-slate-600 leading-relaxed"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
