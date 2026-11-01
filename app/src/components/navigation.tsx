'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Menu,
  X,
  Store,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  Truck,
  CreditCard,
  UserCheck,
  Building2,
} from 'lucide-react';
import type { RootState, AppDispatch } from '@/store';
import { logout as logoutAction } from '@/store/authSlice';
import { useLogoutMutation } from '@/store/authApi';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser, isInitialized } = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'operations' | 'ledger' | 'user' | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer and dropdowns on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const handleLogout = async () => {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('dokani_refresh_token') || undefined
        : undefined;
    try {
      await logoutMutation({ refreshToken }).unwrap();
    } catch {
      // Continue local logout
    }
    dispatch(logoutAction());
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    router.push('/login');
    router.refresh();
  };

  if (pathname?.startsWith('/pay/')) {
    return null;
  }

  const isPosPage = pathname === '/pos';

  const isOperationsActive =
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/purchases') ||
    pathname.startsWith('/expenses') ||
    pathname.startsWith('/suppliers');

  const isLedgerActive =
    pathname.startsWith('/customers') ||
    pathname.startsWith('/staff');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-2xs" ref={navRef}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6 xl:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-xs">
              DP
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-slate-900">Dokani</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Retail OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {currentUser ? (
            <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 text-xs">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/pos"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                  isPosPage
                    ? 'bg-emerald-50 text-brand font-bold ring-1 ring-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5 text-brand" />
                <span>POS Billing</span>
              </Link>

              <Link
                href="/products"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                  pathname.startsWith('/products')
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Products</span>
              </Link>

              <Link
                href="/sales"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                  pathname.startsWith('/sales')
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Sales</span>
              </Link>

              {/* Operations Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'operations' ? null : 'operations')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                    isOperationsActive
                      ? 'bg-slate-100 text-slate-950 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Operations</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'operations' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'operations' && (
                  <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
                    <Link
                      href="/inventory"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/inventory')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Boxes className="h-3.5 w-3.5 text-slate-500" />
                      <span>Stock Inventory</span>
                    </Link>
                    <Link
                      href="/purchases"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/purchases')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Wholesale Purchases</span>
                    </Link>
                    <Link
                      href="/suppliers"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/suppliers')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Suppliers</span>
                    </Link>
                    <Link
                      href="/expenses"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/expenses')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <TrendingDown className="h-3.5 w-3.5 text-slate-500" />
                      <span>Shop Expenses</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Ledger Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'ledger' ? null : 'ledger')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                    isLedgerActive
                      ? 'bg-slate-100 text-slate-950 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Ledger & Staff</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'ledger' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'ledger' && (
                  <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
                    <Link
                      href="/customers"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/customers')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>Customer Due (Baki)</span>
                    </Link>
                    <Link
                      href="/staff"
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        pathname.startsWith('/staff')
                          ? 'bg-emerald-50 text-brand font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Staff & Roles</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          ) : (
            <nav aria-label="Public Navigation" className="hidden md:flex items-center gap-2 text-xs">
              <Link
                href="/"
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  pathname === '/' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </Link>
              <Link
                href="/features"
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  pathname === '/features' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  pathname === '/pricing' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pricing
              </Link>
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {isInitialized && currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* POS quick button (only if not currently on /pos) */}
              {!isPosPage ? (
                <Link
                  href="/pos"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>POS Counter</span>
                </Link>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  POS Terminal Active
                </span>
              )}

              {/* Store User Profile Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <div className="flex flex-col text-right">
                    <span className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1 max-w-[120px] sm:max-w-[160px]">
                      {currentUser.tenant?.name || currentUser.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {currentUser.roles?.[0] || 'Merchant'}
                    </span>
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${openDropdown === 'user' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'user' && (
                  <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="p-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {currentUser.phone}
                      </p>
                    </div>

                    <Link
                      href="/settings"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-500" />
                      <span>Store Settings</span>
                    </Link>

                    <Link
                      href="/billing"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                      <span>Subscription & Plan</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Account & Security PIN</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3.5 py-1.5 font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
              >
                Register Store
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex lg:hidden items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white px-4 pt-3 pb-6 shadow-xl space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {currentUser && (
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  {currentUser.tenant?.name || currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {currentUser.roles?.[0] || 'Merchant'} • {currentUser.phone}
                </p>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </div>
          )}

          {/* Quick POS button in mobile drawer */}
          {currentUser && !isPosPage && (
            <Link
              href="/pos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white font-semibold text-xs shadow-xs hover:bg-brand-hover transition"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Launch POS Terminal</span>
            </Link>
          )}

          <nav className="flex flex-col space-y-1">
            {currentUser ? (
              <>
                <div className="pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Main Modules
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname === '/dashboard' ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-slate-500" />
                    <span>Dashboard & KPIs</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/pos"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    isPosPage ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="h-4 w-4 text-brand" />
                    <span>POS Counter Billing</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/products') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="h-4 w-4 text-slate-500" />
                    <span>Products & Catalog</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/sales"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/sales') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    <span>Sales & Receipts</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <div className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Operations & Ledger
                </div>

                <Link
                  href="/inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/inventory') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="h-4 w-4 text-slate-500" />
                    <span>Stock Inventory</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/purchases"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/purchases') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-slate-500" />
                    <span>Wholesale Purchases</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/customers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/customers') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>Customer Due (Baki Khata)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/expenses"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/expenses') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingDown className="h-4 w-4 text-slate-500" />
                    <span>Shop Expenses</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <div className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Store Administration
                </div>

                <Link
                  href="/staff"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/staff') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    <span>Staff & Roles</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/settings') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Store Settings & Printing</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/billing"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/billing') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    <span>Subscription Plan</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    pathname.startsWith('/profile') ? 'bg-emerald-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-slate-500" />
                    <span>Security & Approval PIN</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of Dokani</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Home & Overview</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  href="/features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>All Features</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Pricing Plans</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <div className="pt-4 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-brand py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-brand-hover"
                  >
                    Register New Store
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
