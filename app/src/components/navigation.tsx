'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Boxes },
  { href: '/inventory', label: 'Inventory', icon: ClipboardList },
  { href: '/pos', label: 'POS Billing', icon: ShoppingCart },
  { href: '/sales', label: 'Sales & Invoices', icon: Receipt },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-sm font-bold text-white">
              DP
            </span>
            <span className="text-lg tracking-tight">DokanPro</span>
          </Link>

          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-medium text-slate-900">Karim Store</span>
            <span className="text-slate-500">Owner</span>
          </div>
          <Link
            href="/pos"
            className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Open POS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
